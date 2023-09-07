import { getAllTokenBalance, getNativeBalance } from "../functions/Alchemy";
import { fetchAave } from "../functions/aave";
import { fetchBeefyData } from "../functions/beefy";
import { getCoinMarket, getCoinPrices } from "../functions/coingecko";
import { getUserSettings, updateUserSettings } from "../functions/localstorage";
import { getCoinID } from "../functions/utils";

import { appSettings } from "../settings/appSettings";
import {
  aaveBalance,
  appSettingsType,
  beefyBalance,
  fetchCoinMarket,
  fetchCoinPrices,
} from "../types/types";
import { Coin } from "./Coin";
import { Token } from "./Token";

export abstract class Wallet {
  id: string;
  readonly type: "AddressWallet" | "CustomWallet" | "Web3Wallet";

  constructor(
    walletType: "AddressWallet" | "CustomWallet" | "Web3Wallet",
    walletId?: string
  ) {
    if (walletId) {
      this.id = walletId;
      this.type = walletType;
    } else {
      this.id = Math.random().toString(16).slice(2); //Generate a random ID
      this.type = walletType;
    }
  }
  private getLocalstorageData() {
    const ls = localStorage.getItem("Address");
    if (ls) {
      return JSON.parse(ls) as Wallet[];
    }
    return [];
  }
  getWalletFromLocalstorage() {
    const data = this.getLocalstorageData();
    const result = data.find((element) => element.id === this.id);
    return result as object;
  }
  updateWallet() {
    // Save in localStorage
    const data = this.getLocalstorageData();

    const index = data.findIndex((element) => element.id === this.id);

    if (index != -1) {
      data[index] = this;
      localStorage.setItem("Address", JSON.stringify(data));
    }
  }
  addWallet() {
    const data = this.getLocalstorageData();
    data.push(this);
    localStorage.setItem("Address", JSON.stringify(data));
  }
  removeWallet() {
    const ls = localStorage.getItem("Address");
    if (ls) {
      const data = JSON.parse(ls) as Wallet[];
      const newData = data.filter((element) => element.id != this.id);
      localStorage.setItem("Address", JSON.stringify(newData));
    }
  }
  removeWalletInUserSettings(isConnectedUser: boolean) {
    const userSettingsWallets = getUserSettings().wallets.filter(
      (wallet) => wallet.id != this.id
    );
    updateUserSettings("wallets", userSettingsWallets, isConnectedUser);
  }
}

export class AddressWallet extends Wallet {
  address: string;
  ens?: string;
  tokens: Token[];
  lastFetchBalance: number;
  lastFetchPrices: number;
  defi: {
    aaveV2: {
      [chain in appSettingsType["chains"][number]["id"]]: aaveBalance;
    };

    aaveV3: {
      [chain in appSettingsType["chains"][number]["id"]]: aaveBalance;
    };
    beefy: beefyBalance[];
  };
  constructor(address: string, ens?: string, walletId?: string) {
    super("AddressWallet", walletId);

    this.address = address;
    this.ens = ens;

    if (walletId) {
      const lsWallet = this.getWalletFromLocalstorage() as AddressWallet;
      this.ens = lsWallet.ens;
      this.tokens = lsWallet.tokens;
      this.lastFetchBalance = lsWallet.lastFetchBalance;
      this.lastFetchPrices = lsWallet.lastFetchPrices;
      this.defi = lsWallet.defi;
    } else {
      this.tokens = [];
      this.lastFetchBalance = 0;
      this.lastFetchPrices = 0;
      this.defi = {
        aaveV2: {
          ethereum: { netWorthUSD: "0", userReservesData: [] },
          "polygon-pos": { netWorthUSD: "0", userReservesData: [] },
        },
        aaveV3: {
          ethereum: { netWorthUSD: "0", userReservesData: [] },
          "polygon-pos": { netWorthUSD: "0", userReservesData: [] },
        },
        beefy: [],
      };
    }
  }
  /** Fecth Balance Wallet */
  async fetchBalance(forceUpdate = false) {
    if (forceUpdate === true || this.isFetchBalanceNeeded) {
      try {
        console.log(`[${this.displayName}] Fetch Balance`);
        await this.getTokensBalance();
        await this.getAaaveData();
        await this.getBeefyData();
        //Update Last fetch time
        this.lastFetchBalance = Date.now();
        // Save in localStorage
        this.updateWallet();
        console.log(`[${this.displayName}] Fetching balance completed`);
        return true;
      } catch (error) {
        throw new Error((error as Error).message);
      }
    } else {
      console.log(`[${this.displayName}] No need to fetch balance`);
      return false;
    }
  }

  private async getTokensBalance() {
    const updatedTokens: Token[] = [];
    //1. Fetch AlchemyAPI on all supported chain

    console.log(`[${this.displayName}] 1. Fetch token balance`);
    let step = 1;
    for await (const chain of appSettings.chains) {
      //Native Token
      console.log(
        `[${this.displayName}] 1.${step++} Fetch native token on ${chain.name}`
      );
      const nativeBalance = await getNativeBalance(this.address, chain.id);
      const nativeToken = new Token();
      nativeToken.chain = chain.id;
      nativeToken.balance = nativeBalance;
      nativeToken.id = chain.tokenId;
      nativeToken.decimals = chain.tokenDecimals;

      // Add native token
      updatedTokens.push(nativeToken);

      //Tokens (ERC20)
      console.log(
        `[${this.displayName}] 1.${step++} Fetch tokens on ${chain.name}`
      );
      const alchemyTokens = await getAllTokenBalance(this.address, chain.id);
      //Add alchemyTokens (ERC20)
      alchemyTokens.forEach((alchemyToken) => {
        updatedTokens.push(Object.assign(new Token(), alchemyToken));
      });
    }
    //Update object
    this.tokens = updatedTokens;

    //Add CoinId
    this.tokens.forEach((token) => {
      if (!token.id && token.contractAddress) {
        token.id = getCoinID(token.chain, token.contractAddress);
      }
    });
  }
  private async getAaaveData() {
    let step = 1;
    for await (const chain of appSettings.chains) {
      // Aave V2
      console.log(
        `[${this.displayName}] 2.${step++} Fetch Aave V2 balance on ${
          chain.name
        }`
      );
      this.defi.aaveV2[chain.id] = await fetchAave(this.address, "v2", chain);
      //Add CoinID
      this.defi.aaveV2[chain.id]?.userReservesData.forEach(
        (userReserveData) => {
          userReserveData.id = getCoinID(
            chain.id,
            userReserveData.underlyingAsset
          ) as string;
        }
      );
      // Aave V3
      console.log(
        `[${this.displayName}] 2.${step++} Fetch Aave V3 balance on ${
          chain.name
        }`
      );
      this.defi.aaveV3[chain.id] = await fetchAave(this.address, "v3", chain);
      //Add CoinID
      this.defi.aaveV3[chain.id]?.userReservesData.forEach(
        (userReserveData) => {
          userReserveData.id = getCoinID(
            chain.id,
            userReserveData.underlyingAsset
          ) as string;
        }
      );
    }
  }
  private async getBeefyData() {
    console.log(`[${this.displayName}] 3. Fetch Beefy data`);
    // Beefy
    //Reset old data token
    this.defi.beefy = [];
    //Get beefyData
    const beefyData = await fetchBeefyData();
    this.tokens.forEach((token) => {
      const findVault = beefyData.vaultData.find(
        (vault) =>
          vault.earnContractAddress.toLocaleLowerCase() ===
          token.contractAddress
      );
      //console.log(findVault)
      if (findVault) {
        //Add decimal at 18
        const pricePerFullShareWithDecimal = Number(
          [
            findVault.pricePerFullShare.slice(0, -18),
            ".",
            findVault.pricePerFullShare.slice(-18),
          ].join("")
        );

        const beefyTokens = [] as beefyBalance["tokens"];
        let price = 0;
        const vaultChain =
          findVault.chain === "polygon" ? "polygon-pos" : findVault.chain;

        if (findVault.assets?.length === 1) {
          //Single Token Case => no lps DATA!!
          beefyTokens.push({
            id: getCoinID(
              vaultChain,
              findVault.tokenAddress
                ? findVault.tokenAddress.toLocaleLowerCase()
                : ""
            ) as string,
            contract: findVault.tokenAddress
              ? findVault.tokenAddress.toLocaleLowerCase()
              : "",
            image: "",
            prices: {
              usd: 0,
              usd_24h_change: 0,
              eur: 0,
              eur_24h_change: 0,
              btc: 0,
              btc_24h_change: 0,
            },
          });
        } else {
          beefyData.lpsData[findVault.id].tokens.forEach(
            (beefyTokenContract) => {
              beefyTokens.push({
                id: getCoinID(
                  vaultChain,
                  beefyTokenContract.toLocaleLowerCase()
                ) as string,
                contract: beefyTokenContract.toLocaleLowerCase(),
                image: "",
                prices: {
                  usd: 0,
                  usd_24h_change: 0,
                  eur: 0,
                  eur_24h_change: 0,
                  btc: 0,
                  btc_24h_change: 0,
                },
              });
            }
          );
          price = beefyData.lpsData[findVault.id].price;
        }

        this.defi.beefy.push({
          earnContractAddress: findVault.earnContractAddress,
          id: findVault.id,
          name: findVault.name,
          chain: vaultChain,
          tokens: beefyTokens,
          price: price,
          apy: beefyData.apyData[findVault.id],
          pricePerFullShare: findVault.pricePerFullShare,
          currentBalance: token.balance,
          currentBalanceHarvest: (
            pricePerFullShareWithDecimal * Number(token.balance)
          ).toString(),
        });
      }
    });
  }

  getAllCoinID() {
    const allId: string[] = [];
    //Id from tokens
    allId.push("usd-coin"); // Fetch by default USDC for beefy currency conversion
    this.tokens.forEach((token) => (token.id ? allId.push(token.id) : null)); //Id from Tokens

    //Id from Aave
    appSettings.chains.forEach((chain) => {
      this.defi.aaveV2[chain.id]?.userReservesData.forEach((userReserveData) =>
        allId.push(userReserveData.id)
      );
      this.defi.aaveV3[chain.id]?.userReservesData.forEach((userReserveData) =>
        allId.push(userReserveData.id)
      );
    });
    // Id from Beefy
    this.defi.beefy.forEach((vault) =>
      vault.tokens.forEach((token) => allId.push(token.id))
    );
    return [...new Set(allId)]; //Remove duplicate
  }

  async fetchPrice() {
    //Fetch Market data (/coin/market)
    console.log(`[${this.displayName}] Fetch market data`);
    const responseMarket = await getCoinMarket(this.getAllCoinID().join(","));

    //Fetch price data (/simple/price)
    console.log(`[${this.displayName}] Fetch prices`);
    const responsePrices = await getCoinPrices(this.getAllCoinID().join(","));

    this.updatePrices(responseMarket, responsePrices);
  }

  /**
   * Update Objet Prices
   * @param responseMarket Market data from CoinGecko
   * @param responsePrices Prices data from Coingecko
   */
  updatePrices(
    responseMarket: fetchCoinMarket[],
    responsePrices: fetchCoinPrices
  ) {
    //Merge result
    this.tokens.forEach((token) => {
      const index = responseMarket.findIndex(
        (coinMarket) => coinMarket.id === token.id
      );
      Object.assign(token, responseMarket[index]);
    });

    // 5.1 Add market data on Aave balance
    appSettings.chains.forEach((chain) => {
      // Aave V2
      this.defi.aaveV2[chain.id]?.userReservesData.forEach(
        (userReserveData) => {
          const index = responseMarket.findIndex(
            (coinMarket) => coinMarket.id === userReserveData.id
          );
          if (index != -1) {
            userReserveData.image = responseMarket[index].image;
            userReserveData.sparkline_in_7d =
              responseMarket[index].sparkline_in_7d;
          }
        }
      );
      // Aave V3
      this.defi.aaveV3[chain.id]?.userReservesData.forEach(
        (userReserveData) => {
          const index = responseMarket.findIndex(
            (coinMarket) => coinMarket.id === userReserveData.id
          );
          if (index != -1) {
            userReserveData.image = responseMarket[index].image;
            userReserveData.sparkline_in_7d =
              responseMarket[index].sparkline_in_7d;
          }
        }
      );
    });
    // 5.2 Add market data Beefy (only image)
    this.defi.beefy.forEach((vault) => {
      vault.tokens.forEach((token) => {
        const index = responseMarket.findIndex(
          (coinMarket) => coinMarket.id === token.id
        );
        if (index != -1) {
          token.image = responseMarket[index].image;
        }
      });
    });
    //6 Add price data (/simple/price)
    //Merge result
    this.tokens.forEach((token) => {
      if (token.id) token.prices = responsePrices[token.id];
    });
    // 6.1 Add price data on Aavve balance
    appSettings.chains.forEach((chain) => {
      // Aave V2
      this.defi.aaveV2[chain.id]?.userReservesData.forEach(
        (userReserveData) => {
          userReserveData.prices = responsePrices[userReserveData.id];
        }
      );
      // Aave V3
      this.defi.aaveV3[chain.id]?.userReservesData.forEach(
        (userReserveData) => {
          userReserveData.prices = responsePrices[userReserveData.id];
        }
      );
    });
    //6.2 add price data on each token and each vault
    this.defi.beefy.forEach((vault) => {
      vault.tokens.forEach((token) => {
        token.prices = responsePrices[token.id];
      });
      if (vault.tokens.length > 1)
        vault.defaultPrices = responsePrices["usd-coin"]; // Add USDC price as default price on Multi asset LP vault
    });
    //Update Last fetch time
    this.lastFetchPrices = Date.now();
    // Save in localStorage
    this.updateWallet();
  }
  /**
   * Save wallet in userSetting for addressWallet and in server if user is connected
   * @param isConnectedUser
   */
  updateWalletInUserSettings(isConnectedUser: boolean) {
    const userSettingsWallets = getUserSettings().wallets;
    const userSettingsWalletIndex = userSettingsWallets.findIndex(
      (value) => value.id === this.id
    );
    if (userSettingsWalletIndex != -1) {
      //Nothing to do here because a address wallet can be edited
    } else {
      userSettingsWallets.push({
        id: this.id,
        type: this.type,
        address: this.address,
        ens: this.ens,
      });
    }
    updateUserSettings("wallets", userSettingsWallets, isConnectedUser);
  }

  get trimAddress() {
    return this.address.slice(0, 6) + "..." + this.address.slice(-4);
  }
  get displayName() {
    return this.ens ? this.ens : this.trimAddress;
  }
  get isFetchBalanceNeeded() {
    return Date.now() - this.lastFetchBalance > appSettings.fetchDelayBalance;
  }
  get isFetchPriceNeeded() {
    return Date.now() - this.lastFetchPrices > appSettings.fetchDelayPrices;
  }
}

export class CustomWallet extends Wallet {
  name: string;
  coins: Coin[];
  lastFetchPrices: number;
  constructor(name: string, walletId?: string) {
    super("CustomWallet", walletId);
    this.name = name;
    this.coins = [];
    this.lastFetchPrices = 0;
    if (walletId) {
      const lsWallet = this.getWalletFromLocalstorage() as CustomWallet;

      this.lastFetchPrices = lsWallet.lastFetchPrices;
      lsWallet.coins.forEach((coin) => {
        this.coins.push(
          Object.assign(
            new Coin(coin.id, coin.name, coin.symbol, coin.image, coin.balance),
            coin
          )
        );
      });
    }
  }
  /**
   * Fetch prices and store in local storage
   * Used when a custom wallet is edited
   * @param forceUpdate Force update
   * @returns
   */
  async fetchData(forceUpdate = false) {
    if (
      (forceUpdate === true || this.isFetchPriceNeeded) &&
      this.coins.length != 0
    ) {
      try {
        console.log(`[${this.displayName}] Start fetch prices...`);
        console.log(`[${this.displayName}] Fetch market data`);
        const responseMarket = await getCoinMarket(
          this.getAllCoinID().join(",")
        );
        console.log(`[${this.displayName}] Fetch prices data`);
        const responsePrices = await getCoinPrices(
          this.getAllCoinID().join(",")
        );
        this.updatePrices(responseMarket, responsePrices);
        this.lastFetchPrices = Date.now();
        // Save in localStorage
        this.updateWallet();
        console.log(`[${this.displayName}] Fetching prices completed`);
        return true;
      } catch (error) {
        throw new Error((error as Error).message);
      }
    } else {
      console.log(`[${this.displayName}] No need to fetch prices`);
      return false;
    }
  }
  getAllCoinID() {
    const allId: string[] = [];
    //Id from Coins
    this.coins.forEach((coin) => allId.push(coin.id));
    return allId;
  }
  /**
   * Update Objet Prices
   * @param responseMarket Market data from CoinGecko
   * @param responsePrices Prices data from Coingecko
   */
  updatePrices(
    responseMarket: fetchCoinMarket[],
    responsePrices: fetchCoinPrices
  ) {
    //Merge result market
    this.coins.forEach((coin) => {
      const index = responseMarket.findIndex(
        (coinMarket) => coinMarket.id === coin.id
      );
      Object.assign(coin, responseMarket[index]);
    });
    //Merge result price
    this.coins.forEach((coin) => {
      coin.prices = responsePrices[coin.id];
    });
    //Update Last fetch time
    this.lastFetchPrices = Date.now();
    // Save in localStorage
    this.updateWallet();
  }
  /**
   * Save wallet in userSetting for customWallet and in server if user is connected
   *
   * For coin save only id and balance
   * @param isConnectedUser
   */
  updateWalletInUserSettings(isConnectedUser: boolean) {
    const userSettingsWallets = getUserSettings().wallets;
    const userSettingsWalletIndex = userSettingsWallets.findIndex(
      (value) => value.id === this.id
    );
    if (userSettingsWalletIndex != -1) {
      userSettingsWallets[userSettingsWalletIndex].name = this.name;
      userSettingsWallets[userSettingsWalletIndex].coins = this.coins.map(
        (coin) => {
          return { id: coin.id, balance: coin.balance };
        }
      );
    } else {
      userSettingsWallets.push({
        id: this.id,
        type: this.type,
        name: this.name,
        coins: this.coins.map((coin) => {
          return { id: coin.id, balance: coin.balance };
        }),
      });
    }
    updateUserSettings("wallets", userSettingsWallets, isConnectedUser);
  }
  get displayName() {
    return this.name;
  }
  get isFetchPriceNeeded() {
    return Date.now() - this.lastFetchPrices > appSettings.fetchDelayPrices;
  }
}

export class Web3Wallet extends AddressWallet {
  //Todo or not
}

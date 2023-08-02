import { fetchCoinList, userSettings } from "../types/types";
import {
  AddressWallet,
  CustomWallet,
  Wallet,
  Web3Wallet,
} from "../classes/Wallet";
import { appSettings } from "../settings/appSettings";

export function updateUserSettings(
  setting: string,
  value:
    | userSettings["currency"]
    | userSettings["selectedChain"]
    | userSettings["groups"]
    | userSettings["selectedWallet"]
) {
  const data = getUserSettings();
  if (Object.hasOwn(data, setting)) {
    Object.defineProperty(data, setting, {
      value: value,
    });
    localStorage.setItem("userSettings", JSON.stringify(data));
  } else
    throw new Error(
      "Setting: " + setting + " not exist in userSettings localstorage"
    );
}
/**
 * Get userSettings from localstorage, store defaultUserSettings if not exist
 * @returns userSettings from localstorage
 */
export function getUserSettings() {
  const ls = localStorage.getItem("userSettings");
  if (ls) return JSON.parse(ls) as userSettings;
  else {
    localStorage.setItem(
      "userSettings",
      JSON.stringify(appSettings.defaultUserSettings)
    );
    return appSettings.defaultUserSettings;
  }
}

/**
 * Get all Wallet from localstorage
 * @returns Array of wallet
 */
export function getAllWallet() {
  const ls = localStorage.getItem("Address");
  const allWallet: (AddressWallet | CustomWallet | Web3Wallet)[] = [];
  if (ls) {
    const lsAddresses = JSON.parse(ls) as Wallet[];
    lsAddresses.forEach((lsAddress) => {
      switch (lsAddress.type) {
        case "AddressWallet": {
          const temp = lsAddress as AddressWallet;
          allWallet.push(new AddressWallet(temp.address, temp.ens, temp.id));
          break;
        }
        case "CustomWallet": {
          const temp = lsAddress as CustomWallet;
          allWallet.push(new CustomWallet(temp.name, temp.id));
          break;
        }
        case "Web3Wallet": {
          const temp = lsAddress as Web3Wallet;
          allWallet.push(new Web3Wallet(temp.address));
          break;
        }
      }
    });
  }
  return allWallet;
}

/** Get CoinList from localstorage */
export function getCoinList() {
  const ls = localStorage.getItem("coinList");
  if (ls) {
    const data = JSON.parse(ls) as { data: fetchCoinList[]; lastFetch: number };
    return data;
  }
}

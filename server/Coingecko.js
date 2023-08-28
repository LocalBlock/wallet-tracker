import axios from "axios";
import { promises as fs } from "fs";

/**
 * Manage data from coingecko.
 * Make cache data for coinlist and imageURl in JSON files.
 */
class Coingecko {
  #delayFetchNewData;
  constructor(
    coinlistFile,
    coinlistData,
    imageUrlFile,
    imageUrlData,
    delayFetchNewData
  ) {
    this.coinlistFile = coinlistFile;
    this.coinlistData = coinlistData;
    this.imageUrlFile = imageUrlFile;
    this.imageUrlData = imageUrlData;
    this.#delayFetchNewData = delayFetchNewData;
  }
  /**
   * Initialise a new object with async method
   * @param {string} coinlistFile 'data/coingecko/coinlist.json'
   * @param {string} imageUrlFile 'data/coingecko/imageurl.json'
   * @returns an object from class Coingecko
   */
  static async init(coinlistFile, imageUrlFile) {
    const delayFetchNewData = 240 * 60 * 60 * 1000;
    // Create files if not exist
    try {
      await fs.access(coinlistFile);
      await fs.access(imageUrlFile);
    } catch (error) {
      //File not exist create one
      await fs.writeFile(coinlistFile, "{}");
      await fs.writeFile(imageUrlFile, "[]");
    }

    // Read file
    try {
      let coinlistData = JSON.parse(
        await fs.readFile(coinlistFile, {
          encoding: "utf8",
        })
      );
      const imageUrlData = JSON.parse(
        await fs.readFile(imageUrlFile, {
          encoding: "utf8",
        })
      );
      // Check last fetch
      if (
        !coinlistData.lastFetch ||
        Date.now() - coinlistData.lastFetch > delayFetchNewData
      ) {
        //Fetch
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/coins/list?include_platform=true",
          { headers: { accept: "application/json" } }
        );
        //Save
        await fs.writeFile(
          coinlistFile,
          JSON.stringify({
            data: response.data,
            lastFetch: Date.now(),
          })
        );
        coinlistData = { data: response.data, lastFetch: Date.now() };
      }

      return new Coingecko(
        coinlistFile,
        coinlistData,
        imageUrlFile,
        imageUrlData,
        delayFetchNewData
      );
    } catch (error) {
      console.log(error);
    }
  }
  /**
   * Retreive id and image from coingecko
   * @param {string} network
   * @param {string} contractAddress
   * @param {string} asset use for native token
   * @returns 
   */
  async getIdAndImage(network, contractAddress, asset) {
    // If there is no contract, it's (i suppose) native token
    if (!contractAddress) {
      switch (asset) {
        case "MATIC": {
          const id = "matic-network";
          const image = await this.#getImage(id);
          return { id, image };
        }
        case "ETH": {
          const id = "ethereum";
          const image = await this.#getImage(id);
          return { id, image };
        }
        default:
          return { id: undefined, image: undefined };
      }
    }
    const id = this.#getId(network, contractAddress, asset);
    if (!id) return { id: undefined, image: undefined };

    const image = await this.#getImage(id);
    return { id, image };
  }
  /**
   * Get coingecko Id
   * @param {string} network 
   * @param {string} contractAddress 
   * @returns {string}
   */
  #getId(network, contractAddress) {
    // Tranform netwok format, Alchemy->Coingecko ex: 'ETH_MAINET' to 'ethereum'
    let platform
    switch (network) {
      case "ETH_MAINNET":
      case "ETH_GOERLI":
        platform= "ethereum";
        break
      case "MATIC_MAINNET":
      case "MATIC_MUMBAI":
        platform= "polygon-pos";
        break
      default:
        throw new Error(network + "is unknown");
    }
    //Find Id
    let id = undefined;
    const findId = this.coinlistData.data.find(
      (coin) => coin.platforms[platform] === contractAddress
    );
    if (findId) id = findId.id;
    return id;
  }
  /**
   * Get url image from coingecko or Cache data
   * @param {string} id 
   * @returns {Promise<string>}
   */
  async #getImage(id) {
    //Findimage
    const findImage = this.imageUrlData.find((image) => image.id === id);
    if (
      !findImage ||
      Date.now() - findImage.lastFetch > this.#delayFetchNewData
    ) {
      //fetch
      console.log("Fetch image Url: " + id);
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" +
          id +
          "&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en",
        { headers: { accept: "application/json" } }
      );
      //Save
      const fetchImage = response.data[0].image;
      if (!findImage) {
        //Add
        this.imageUrlData = [
          ...this.imageUrlData,
          { id, image: fetchImage, lastFetch: Date.now() },
        ];
      } else {
        //Replace
        const index = this.imageUrlData.findIndex((image) => (image.id = id));
        this.imageUrlData[index] = {
          id,
          image: fetchImage,
          lastFetch: Date.now(),
        };
      }
      //write file
      await fs.writeFile(this.imageUrlFile, JSON.stringify(this.imageUrlData));
      return fetchImage;
    } else {
      return findImage.image;
    }
  }
}

export const coingecko = await Coingecko.init(
  "data/coingecko/coinlist.json",
  "data/coingecko/imageurl.json"
);

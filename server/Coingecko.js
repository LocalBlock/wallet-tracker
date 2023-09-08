import axios from "axios";
import { promises as fs } from "fs";
import path from "path";
import { displayDate } from "./utils.js";
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
      try {
        // Create directory if not exist
        await fs.mkdir(path.dirname(coinlistFile), { recursive: true });
        //Files not exist create one
        await fs.writeFile(coinlistFile, "{}");
        await fs.writeFile(imageUrlFile, "[]");
      } catch (error) {
        console.log(displayDate(), error);
      }
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
      console.log(displayDate(), error);
    }
  }
  /**
   * Retreive ids and images from coingecko
   * fetch is done only after checking missing image
   * @param {string} network
   * @param {Array} activity
   * @returns
   */
  async getIdsAndImages(network, activity) {
    // get all id
    const allid = activity.map((act) => {
      if (!act.rawContract.address) {
        switch (act.asset) {
          case "MATIC": {
            const id = "matic-network";
            //const image = await this.#getImage(id);
            return id;
          }
          case "ETH": {
            const id = "ethereum";
            //const image = await this.#getImage(id);
            return id;
          }
          default:
            return undefined;
        }
      }
      const id = this.#getId(network, act.rawContract.address);

      return id;
    });
    // Get images
    const result = [];
    const allIdToFetch = [];
    allid.forEach((id) => {
      if (!id) {
        result.push({ id: undefined, image: undefined });
        return;
      }
      //Findimage
      const findImage = this.imageUrlData.find((image) => image.id === id);
      if (
        !findImage ||
        Date.now() - findImage.lastFetch > this.#delayFetchNewData
      ) {
        //need to fetch
        result.push({ id, image: "tofetch" });
        allIdToFetch.push(id);
      } else {
        result.push({ id, image: findImage.image });
      }
    });

    //Fetch missing image
    if (allIdToFetch.length != 0) {
      console.log(
        displayDate(),
        "Fetch image Url: " + allIdToFetch.join(",").replace(",,", ",")
      );
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" +
          allIdToFetch.join(",").replace(",,", ",") +
          "&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en",
        { headers: { accept: "application/json" } }
      );
      allIdToFetch.forEach((id, index) => {
        //Save
        const indexResponse = response.data.findIndex((coin) => coin.id === id);
        const ImageUrl = response.data[indexResponse].image;
        const findImageIndex = this.imageUrlData.findIndex(
          (image) => image.id === id
        );
        if (findImageIndex === -1) {
          //Add
          this.imageUrlData = [
            ...this.imageUrlData,
            { id, image: ImageUrl, lastFetch: Date.now() },
          ];
        } else {
          //Replace
          this.imageUrlData[findImageIndex] = {
            id,
            image: ImageUrl,
            lastFetch: Date.now(),
          };
        }
        allIdToFetch[index] = { id, image: ImageUrl };
      });
      //push result
      result.forEach((value, index) => {
        const findResult = allIdToFetch.find(
          (fetchResult) => fetchResult.id === value.id
        );
        if (findResult) result[index] = findResult;
      });
      //write file
      await fs.writeFile(this.imageUrlFile, JSON.stringify(this.imageUrlData));
    }
    return result;
  }
  /**
   * Get coingecko Id
   * @param {string} network
   * @param {string} contractAddress
   * @returns {string}
   */
  #getId(network, contractAddress) {
    // Tranform netwok format, Alchemy->Coingecko ex: 'ETH_MAINET' to 'ethereum'
    let platform;
    switch (network) {
      case "ETH_MAINNET":
      case "ETH_GOERLI":
        platform = "ethereum";
        break;
      case "MATIC_MAINNET":
      case "MATIC_MUMBAI":
        platform = "polygon-pos";
        break;
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
}

export const coingecko = await Coingecko.init(
  "data/coingecko/coinlist.json",
  "data/coingecko/imageurl.json"
);

# Wallet Tracker
A simple wallet tracker web application to display current balance and prices from ethereum addresses or custom wallets.

### Built With

[![Vite-badge]][vite-url]
[![React.js]][React-url]
[![Chakra-badge]][Chakra-url]
[![Chart.js-badge]][Chart.js-url]

<img src="doc/screenshot.png">

## Features

* Supported chains : Ethereum and Polygon.
* Supported DeFi protocols : Aave V2/V3 and Beefy.
* ENS name.
* Custom wallet : Create a cutom wallet and add  coin/token manualy, useful if you want to track off chain assets.
* Groups : Regroup wallet address to display the total balance of grouped wallets.


## Intallation

Choose witch method you prefer :
- Run application in local developpment server
- Build application and use it in your web server
- Use docker with docker-compose

### Pre-requisites
This app fetch : 
- Blockchain data from Alchemy SDK, so you need an **[APIKEY](https://docs.alchemy.com/docs/alchemy-quickstart-guide#1key-create-an-alchemy-key)**.
- Prices from CoinGecko, no need APIKEY

### Local developpement server
1. Download or clone this repo

2. Create `.env.local` file at root application for your APIKEY
```dotenv
VITE_APIKEY_ALCHEMY=YOUR_APIKEY
```
3. Install and run server

```shell
# Install all dependencies
yarn
# Run a local developpement server
yarn dev
```
### Build
1. Download or clone this repo
2. Edit `.env.production` file and replace `VITE_APIKEY_ALCHEMY` value by your **APIKEY**

```dotenv
VITE_APIKEY_ALCHEMY=YOUR_APIKEY
```
3. Install and build application
```shell
# Install all dependencies
yarn
# Build production application
yarn build
```
Bundled application available in `./dist` folder.

### Docker (docker-compose)

Replace `VITE_APIKEY_ALCHEMY` environment variable value by your Alchemy **APIKEY**
```yaml
version: '3'
services:
  wallet-tracker:
    image: ghcr.io/localblock/wallet-tracker:main
    environment:
      - VITE_APIKEY_ALCHEMY=YOUR_APIKEY
    command: sh -c "find /usr/share/nginx/html -name *.js -type f -exec sed -i \"s/VITE_APIKEY_ALCHEMY/$$VITE_APIKEY_ALCHEMY/g\" {} \\; && nginx -g \"daemon off;\""
    restart: always
    ports:
      - 80:80
```
>The command in docker-compose allows to inject your Alchemy APIKEY in js files.
## Demo version

TODO

## License
Distributed under the MIT License. See [LICENSE.md](./LICENCE.md) for more information.

<!-- Links -->
[Vite-badge]:https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]:https://vitejs.dev/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[Chakra-badge]:https://img.shields.io/badge/chakra-%234ED1C5.svg?style=for-the-badge&logo=chakraui&logoColor=white
[Chakra-url]:https://chakra-ui.com/
[Chart.js-badge]:https://img.shields.io/badge/chart.js-F5788D.svg?style=for-the-badge&logo=chart.js&logoColor=white
[Chart.js-url]:https://www.chartjs.org/
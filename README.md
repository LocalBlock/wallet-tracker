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
* Notifications : Receive a notification when there is activity on addresses.
* Synchronization : Save your configuration and wallets between devices. You need to connect your wallet and sign in with Ethereum.

## Demo version

TODO

## Intallation

Choose witch method you prefer :
- Run application in local developpment server.
- Use builded docker image with docker-compose.

### Pre-requisites
You need an **[APIKEY](https://docs.alchemy.com/docs/alchemy-quickstart-guide#1key-create-an-alchemy-key)** from Alchemy for fetching balance from blockchains.

### Optional keys
If you want :
* Notifications : You need a **[Auth Token](https://docs.alchemy.com/reference/notify-api-faq#where-do-i-find-my-alchemy-auth-token)** from Alchemy.
* Wallet Connect : You need a **[ProjectId](https://cloud.walletconnect.com/sign-in)** from WalletConnect cloud.

### Local developement server
1. Download or clone this repo.

2. Create `.env.local` file at root application for your API keys.
```dotenv
VITE_REACT_APP_VERSION=$npm_package_version
VITE_ALCHEMY_APIKEY=YOUR_APIKEY
VITE_ALCHEMY_AUTHTOKEN=YOUR_AUTHTOKEN
VITE_ALCHEMY_WEBHOOKURL=https://my.domain.com/alchemyhook
VITE_WALLETCONNECT_PROJECTID=YOUR_PROJECTID
```
> `VITE_ALCHEMY_WEBHOOKURL` environment variable is only for developement and must point to express server, if you build application, url will be `window.location.origin`/alchemyhook
3. Install and run servers.

```shell
# FRONTEND
# Install all dependencies
yarn
# Run a local developement server
yarn dev
```
```shell
# BACKEND
cd server
# Install all dependencies
npm install
# Run express server
node server.js
```

## Use  Docker (docker-compose)

```yaml
version: "3"
services:
  wallet-tracker:
    image: ghcr.io/localblock/wallet-tracker:main
    environment:
      - VITE_ALCHEMY_APIKEY=YOUR_APIKEY # Add your APIKEY
      - VITE_ALCHEMY_AUTHTOKEN=YOUR_AUTHTOKEN # Optional
      - VITE_WALLETCONNECT_PROJECTID=YOUR_PROJECTID # Optional
      - TZ=Europe/Paris # Optional
      - LANG=fr_FR.UTF-8 # Optional
    volumes:
      - /path/to/host:/srv/data # Persistent data
    restart: always
    ports:
      - 8080:3000 # Change only host port if necessary

```

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
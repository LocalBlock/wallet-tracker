# Wallet Tracker
A simple wallet tracker web application to display current balance and prices from ethereum addresses or custom wallets.

### Built With

[![Next-badge]][Next-url]
[![Postgresql-badge]][Postgresql-url]
[![Wagmi-badge]][Wagmi-url]
[![Alchemy-badge]][Alchemy-url]
[![Chakra-badge]][Chakra-url]
[![Chart.js-badge]][Chart.js-url]

<img src="doc/screenshot.png">

## Features

* Sign-in with Ethereum : log in with your ethereum address. Your keys, your identifier
* Supported chains : Ethereum and Polygon.
* Supported DeFi protocols : Aave V2/V3 and Beefy.
* ENS name.
* Custom wallet : Create a cutom wallet and add  coin/token manualy, useful if you want to track off chain assets.
* Groups : Regroup wallet address to display the total balance of grouped wallets.
* Notifications : Receive a notification when there is activity on addresses.

## Demo version

[Wallet Tracker](https://wallet.localblock.dev)

## Intallation

Choose witch method you prefer :
- Run application in local developpment server.
- Use builded docker image with docker-compose.

### Pre-requisites
You need an **[APIKEY](https://docs.alchemy.com/docs/alchemy-quickstart-guide#1key-create-an-alchemy-key)** from Alchemy for fetching balance from blockchains and also an **[Auth Token](https://docs.alchemy.com/reference/notify-api-faq#where-do-i-find-my-alchemy-auth-token)** for notifications feature.

If you want WalletConnect feature especially for login on mobile phone, create a **[Project ID](https://cloud.walletconnect.com)**

### Local developement server
1. Download or clone this repo.

2. Create `.env` file at root application for your API keys.
```dotenv
DATABASE_URL="postgresql://wallet-tracker:YOUR_DATABASE_PASSWWORD@localhost:5432/wallet-tracker?schema=public"

ALCHEMY_APIKEY=YOUR_APIKEY
ALCHEMY_AUTHTOKEN=YOUR_AUTHTOKEN

# WalletConnect - Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECTID=YOUR_PROJECTID

# Iron Session - Private key used to encrypt the cookie. It has to be at least 32 characters long
SESSION_PASSWORD=YOUR_SESSION_PASSWORD

# Application Version
NEXT_PUBLIC_APP_VERSION=$npm_package_version
```
3. Install an run database

You can use PostgreSQL or MySQL, provide correct database URL in `.env` file

4. Install and run server.

```shell
# Install all dependencies
yarn
# Run a local developement server
yarn dev
```

## Use Docker (docker-compose)

```yaml
version: "3"
services:
  web:
    image: ghcr.io/localblock/wallet-tracker
    environment:
      - DATABASE_URL=YOUR_DATABASE_URL # postgresql://wallet-tracker:YOUR_DATABASE_PASSWWORD@database:5432/wallet-tracker?schema=public
      - SESSION_PASSWORD=YOUR_SESSION_PASSWORD # Iron Session - Private key used to encrypt the cookie. It has to be at least 32 characters long
      - ALCHEMY_APIKEY=YOUR_APIKEY # From Alchemy dashboard
      - ALCHEMY_AUTHTOKEN=YOUR_AUTHTOKEN # From Alchemy dashboard
      - NEXT_PUBLIC_WALLETCONNECT_PROJECTID=YOUR_PROJECTID # Optional, from https://cloud.walletconnect.com/
    restart: always
    ports:
      - 3000:3000

  database:
    image: postgres
    restart: always
    ports:
      - 5432:5432
    environment:
      - POSTGRES_PASSWORD=YOUR_DATABASE_PASSWWORD # Same password than wallet-tracker container
      - POSTGRES_USER=wallet-tracker # Create a database with same username
    volumes:
      - pgdata:/var/lib/postgresql/data

```

## License
Distributed under the MIT License. See [LICENSE.md](./LICENCE.md) for more information.

<!-- Links -->
[Next-badge]:https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]:https://nextjs.org/
[Wagmi-badge]:https://img.shields.io/badge/Wagmi-141414?style=for-the-badge&logoColor=white&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjI5IiBoZWlnaHQ9IjYyOSIgdmlld0JveD0iMCAwIDYyOSA2MjkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF8xMzFfMTQyKSI+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNzEuNzg4IDM2Ni40N0M3MS43ODggMzg2LjI5NCA4Ny44NTgzIDQwMi4zNjQgMTA3LjY4MiA0MDIuMzY0SDE3OS40N0MxOTkuMjk0IDQwMi4zNjQgMjE1LjM2NCAzODYuMjk0IDIxNS4zNjQgMzY2LjQ3TDIxNS4zNjQgMjIyLjg5NEMyMTUuMzY0IDIwMy4wNyAyMzEuNDM0IDE4NyAyNTEuMjU4IDE4N0MyNzEuMDgyIDE4NyAyODcuMTUyIDIwMy4wNyAyODcuMTUyIDIyMi44OTRWMzY2LjQ3QzI4Ny4xNTIgMzg2LjI5NCAzMDMuMjIyIDQwMi4zNjQgMzIzLjA0NiA0MDIuMzY0SDM5NC44MzRDNDE0LjY1OCA0MDIuMzY0IDQzMC43MjggMzg2LjI5NCA0MzAuNzI4IDM2Ni40N1YyMjIuODk0QzQzMC43MjggMjAzLjA3IDQ0Ni43OTggMTg3IDQ2Ni42MjIgMTg3QzQ4Ni40NDYgMTg3IDUwMi41MTYgMjAzLjA3IDUwMi41MTYgMjIyLjg5NFY0MzguMjU4QzUwMi41MTYgNDU4LjA4MiA0ODYuNDQ2IDQ3NC4xNTIgNDY2LjYyMiA0NzQuMTUySDM1Ljg5NEMxNi4wNzAzIDQ3NC4xNTIgMCA0NTguMDgyIDAgNDM4LjI1OEwxLjI2NzgyZS0wNSAyMjIuODk0QzEuNDA3ODZlLTA1IDIwMy4wNyAxNi4wNzAzIDE4NyAzNS44OTQgMTg3QzU1LjcxNzcgMTg3IDcxLjc4OCAyMDMuMDcgNzEuNzg4IDIyMi44OTRMNzEuNzg4IDM2Ni40N1pNNTgxLjE0MiA0ODIuNjk4QzYwNy41NzMgNDgyLjY5OCA2MjkgNDYxLjI3MSA2MjkgNDM0Ljg0QzYyOSA0MDguNDA4IDYwNy41NzMgMzg2Ljk4MSA1ODEuMTQyIDM4Ni45ODFDNTU0LjcxIDM4Ni45ODEgNTMzLjI4MyA0MDguNDA4IDUzMy4yODMgNDM0Ljg0QzUzMy4yODMgNDYxLjI3MSA1NTQuNzEgNDgyLjY5OCA1ODEuMTQyIDQ4Mi42OThaIiBmaWxsPSJ3aGl0ZSIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzEzMV8xNDIiPgo8cmVjdCB3aWR0aD0iNjI5IiBoZWlnaHQ9IjYyOSIgZmlsbD0iY3VycmVudENvbG9yIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==
[Wagmi-url]:https://wagmi.sh/
[Alchemy-badge]:https://img.shields.io/badge/Alchemy-363ff9?style=for-the-badge&logo=alchemy&logoColor=white
[Alchemy-url]:https://alchemy.com/
[Chakra-badge]:https://img.shields.io/badge/chakra-4ED1C5?style=for-the-badge&logo=chakraui&logoColor=white
[Chakra-url]:https://chakra-ui.com/
[Chart.js-badge]:https://img.shields.io/badge/chart.js-F5788D?style=for-the-badge&logo=chart.js&logoColor=white
[Chart.js-url]:https://www.chartjs.org/
[Postgresql-badge]:https://img.shields.io/badge/postgresql-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[Postgresql-url]:https://www.chartjs.org/
import {
  Badge,
  Box,
  Heading,
  Link,
  ListItem,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import React from "react";
import { Link as ReactRouterLink } from "react-router-dom";

export default function About() {
  console.log("[Render] About");
  return (
    <Stack>
      <div>Version : v{import.meta.env.VITE_REACT_APP_VERSION}</div>
      <Heading>About this application</Heading>
      <Text>
        <b>Wallet Tracker</b> is a user-friendly web application designed for
        tracking asset prices within wallets on the Ethereum and EVM-compatible
        blockchains. Its primary purpose is to provide users with essential
        information about their assets and also to view their positions on DEFI
        protocols.
      </Text>

      <Box>
        <UnorderedList>
          <ListItem>
            <b>Supported Chains :</b> Ethereum, Polygon.
          </ListItem>
          <ListItem>
            <b>Supported Defi Protocols :</b> Aave V2/V3, Beefy.
          </ListItem>
        </UnorderedList>
      </Box>
      <Heading>How to use</Heading>
      <Text>
        The basic functionality of Wallet Tracker involves adding a wallet, and
        you have two options to do so:
      </Text>
      <Box>
        <UnorderedList>
          <ListItem>
            <b>Add an address (0x...) :</b> When you add an address, the
            application will automatically retrieve asset details and balances
            from the blockchain.
          </ListItem>
          <ListItem>
            <b>Create a custom wallet :</b> Adding a custom wallet requires you
            to manually input and update each asset and balance. However, this
            option allows you to add any coin or token listed on Coingecko.
          </ListItem>
        </UnorderedList>
      </Box>
      <Text>
        For users with multiple wallets, Wallet Tracker offers the ability to
        create groups for efficient filtering.
      </Text>
      <Heading as={"h3"} size={"lg"}>
        Sign in with Ethereum{" "}
        <Text as={"span"} fontSize={"md"}>
          (EIP-4361)
        </Text>
      </Heading>
      <Text>
        By signing in with an Ethereum address, you unlock two additional
        functionalities:
      </Text>
      <Box>
        <UnorderedList>
          <ListItem>
            <b>Synchronization :</b> Your data is synchronized across multiple
            devices.
          </ListItem>
          <ListItem>
            <b>Notifications : </b> Receive real-time notifications.
          </ListItem>
        </UnorderedList>
      </Box>
      <Heading as={"h3"} size={"lg"}>
        Notifications <Badge colorScheme="yellow">Beta</Badge>
      </Heading>
      <Text>
        This optional feature displays a real-time pop-up notification when
        there is activity within an address.
        <br /> If you are not currently connected, any missed notifications will
        be delivered upon your next connection.
      </Text>
      <Text>
      To activate this feature, sign in with any Ethereum address in the {" "}
        <Link as={ReactRouterLink} to={"/settings"}>
          settings
        </Link>{" "}
        page
      </Text>
    </Stack>
  );
}

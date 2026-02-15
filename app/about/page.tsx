import {
  Badge,
  Box,
  Heading,
  ListItem,
  Text,
  Flex,
  UnorderedList,
  Link,
  Tooltip,
} from "@chakra-ui/react";
import { FaGithub } from "react-icons/fa6";

export default function About() {
  return (
    <Flex maxWidth={"2xl"} margin={"auto"} direction={"column"} gap={6}>
      <Flex alignItems={"center"}>
        Version : {process.env.npm_package_version} &nbsp;
        <Link href="https://github.com/LocalBlock/wallet-tracker" isExternal>
          <Tooltip label="Github repository" placement="right">
            <FaGithub size={23} />
          </Tooltip>
        </Link>
      </Flex>
      <Flex direction={"column"} gap={2}>
        <Heading as={"h3"} size={"lg"}>
          About this application
        </Heading>
        <Text>
          <b>Wallet Tracker</b> is a user-friendly web application designed for
          tracking asset prices within wallets on the Ethereum and
          EVM-compatible blockchains. Its primary purpose is to provide users
          with essential information about their assets and also to view their
          positions on DEFI protocols.
        </Text>
        <Box>
          <UnorderedList>
            <ListItem>
              <b>Supported Chains :</b> Ethereum, Polygon.
            </ListItem>
            <ListItem>
              <b>Supported Defi Protocols :</b> Aave V3.
            </ListItem>
          </UnorderedList>
        </Box>
      </Flex>
      <Flex direction={"column"} gap={2}>
        <Heading as={"h3"} size={"lg"}>
          How to use
        </Heading>
        <Text>
          First, you need to sign in with your wallet, you can use any of your
          addresses, it will be be your username (0x123...).
          <br />
          By signing, your data (assets, settings) will be store, so you can use
          this application with all your devices.
        </Text>
        <Text>
          The basic functionality of Wallet Tracker involves adding a wallet,
          and you have two options to do so:
        </Text>
        <Box>
          <UnorderedList>
            <ListItem>
              <b>Add an address (0x...) :</b> When you add an address, the
              application will automatically retrieve asset details and balances
              from the blockchain.
            </ListItem>
            <ListItem>
              <b>Create a custom wallet :</b> Adding a custom wallet requires
              you to manually input and update each asset and balance. However,
              this option allows you to add any coin or token listed on
              Coingecko.
            </ListItem>
          </UnorderedList>
        </Box>
        <Text>
          For users with multiple wallets, Wallet Tracker offers the ability to
          create groups for efficient filtering.
        </Text>
      </Flex>
      <Flex direction={"column"} gap={2}>
        <Heading as={"h3"} size={"lg"}>
          Notifications <Badge colorScheme="yellow">Beta</Badge>
        </Heading>
        <Text>
          This optional feature displays a real-time pop-up notification when
          there is activity within an address.
          <br /> If you are not currently connected, any missed notifications
          will be delivered upon your next connection.
        </Text>
      </Flex>
    </Flex>
  );
}

import { Box, Heading, Image, Text } from "@chakra-ui/react";
import React from "react";

export default function Logo() {
  return (
    <Box display={"flex"} gap={3} alignItems={"center"}>
      <Image boxSize={"50px"} src="Logo.svg" />
      <Box>
        <Heading size={"lg"}>Wallet Tracker</Heading>
        <Text fontSize={"xs"}>Powered by CoinGecko</Text>
      </Box>
    </Box>
  );
}

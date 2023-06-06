import { Stack, Flex, Box } from "@chakra-ui/react";
import React from "react";
import NavLink from "./NavLink";
import SettingsMenu from "./Menus/SettingsMenu";
import Submenu from "./Menus/MainMenu";
import FetchIndicator from "./FetchIndicator";


interface NavLinksProps {
  isOpen: boolean;
}

export default function NavLinks({ isOpen }: NavLinksProps) {
  //console.log("Render: Navlinks");
  return (
    <Box
      display={{ base: isOpen ? "block" : "none", md: "block" }}
      flexBasis={{ base: "100%", md: "auto" }}
      flexGrow={1}
    >
      <Flex
        direction={["column", "row", "row", "row"]}
        justify={["center", "space-between"]}
        alignItems={"center"}
        px={3}
      >
        <Stack
          align={"center"}
          justify={["center", "space-between", "flex-end", "flex-start"]}
          direction={["column", "row", "row", "row"]}
          py={[4, 0, 0, 0]}
        >
          <NavLink>Home</NavLink>
          <NavLink>Settings</NavLink>
          <NavLink>About</NavLink>
        </Stack>
        <Flex gap={2}>
          <FetchIndicator/>
          <Submenu/>
          <SettingsMenu />
        </Flex>
      </Flex>
    </Box>
  );
}

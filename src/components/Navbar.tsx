import {
  Box,
  Collapse,
  Flex,
  IconButton,
  Link,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useContext } from "react";
import Logo from "./Logo";
import FetchIndicator from "./FetchIndicator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faChevronDown,
  faHome,
  faObjectGroup,
  faQuestionCircle,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { AllWalletContext } from "../contexts/AllWalletContext";
import WalletItem from "./Menus/WalletItem";
import { UserSettingsContext } from "../contexts/UserSettingsContext";
import GroupItem from "./Menus/GroupItem";
import WalletModal from "./Menus/WalletModal";
import GroupModal from "./Menus/GroupModal";
import SettingsMenu from "./Menus/SettingsMenu";
import { Link as ReactRouterLink } from "react-router-dom";

export default function Navbar() {
  const { isOpen, onToggle } = useDisclosure();
  return (
    <Box
      as={"header"}
      position={"sticky"}
      zIndex={10}
      top={0}
      backgroundColor={"chakra-body-bg"}
    >
      <Flex justifyContent={"space-between"} alignItems={"center"} padding={1}>
        <Flex alignItems={"center"} gap={4}>
          <Logo />
          <DesktopNav />
        </Flex>
        <Flex gap={2}>
          <FetchIndicator />
          <SettingsMenu />
          <IconButton
            aria-label="Toogle Menu"
            icon={<FontAwesomeIcon icon={faBars} />}
            display={{ base: "block", md: "none" }}
            onClick={onToggle}
          />
        </Flex>
      </Flex>
      <Collapse in={isOpen} animateOpacity>
        <MobileNav />
      </Collapse>
    </Box>
  );
}

const MobileNav = () => {
  return (
    <Stack display={{ md: "none" }} padding={3}>
      <Flex alignItems={"center"}>
        <FontAwesomeIcon icon={faHome} pull="left" />
        <Link as={ReactRouterLink} to={"/"} padding={0} fontSize={"lg"}>
          Home
        </Link>
      </Flex>
      <MobileNavWallet />
      <MobileNavGroup />
      <Flex alignItems={"center"}>
        <FontAwesomeIcon icon={faQuestionCircle} pull="left" />
        <Link as={ReactRouterLink} to={"/about"} padding={0} fontSize={"lg"}>
          About
        </Link>
      </Flex>
    </Stack>
  );
};

const MobileNavWallet = () => {
  const { isOpen, onToggle } = useDisclosure();
  const { allWallet } = useContext(AllWalletContext);
  return (
    <>
      <Flex
        onClick={onToggle}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Flex alignItems={"center"}>
          <FontAwesomeIcon icon={faWallet} pull="left" />
          <Text fontSize="lg">Wallets</Text>
        </Flex>
        <FontAwesomeIcon icon={faChevronDown} />
      </Flex>
      <Collapse in={isOpen} animateOpacity>
        <Stack
          marginTop={2}
          paddingLeft={4}
          borderLeft={1}
          borderStyle={"solid"}
        >
          {allWallet.length != 0 &&
            allWallet.map((wallet) => (
              <WalletItem key={wallet.id} wallet={wallet} />
            ))}

          <WalletModal allWallet={allWallet}>Add a wallet...</WalletModal>
        </Stack>
      </Collapse>
    </>
  );
};
const MobileNavGroup = () => {
  const { isOpen, onToggle } = useDisclosure();
  const { userSettings } = useContext(UserSettingsContext);
  return (
    <>
      <Flex
        onClick={onToggle}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Flex alignItems={"center"}>
          <FontAwesomeIcon icon={faObjectGroup} pull="left" />
          <Text fontSize="lg">Groups</Text>
        </Flex>
        <FontAwesomeIcon icon={faChevronDown} />
      </Flex>
      <Collapse in={isOpen} animateOpacity>
        <Stack
          marginTop={2}
          paddingLeft={4}
          borderLeft={1}
          borderStyle={"solid"}
        >
          {userSettings.groups.length != 0 &&
            userSettings.groups.map((group) => (
              <GroupItem key={group.name} groupName={group.name} />
            ))}
          <GroupModal
            action="Add"
            //onCloseMenu={onClose}
            groupNameEdit=""
          >
            Add a group
          </GroupModal>
        </Stack>
      </Collapse>
    </>
  );
};

const DesktopNav = () => {
  const { allWallet } = useContext(AllWalletContext);
  const { userSettings } = useContext(UserSettingsContext);

  return (
    <Stack
      direction={"row"}
      display={{ base: "none", md: "initial" }}
      spacing={0}
    >
      <Link as={ReactRouterLink} to="/">
        Home
      </Link>
      <Popover placement="bottom-start" trigger="hover">
        <PopoverTrigger>
          <Link>Wallets</Link>
        </PopoverTrigger>
        <Portal>
          <PopoverContent width={"auto"}>
            <PopoverHeader>
              <Flex alignItems={"center"}>
                <FontAwesomeIcon icon={faWallet} pull="left" />
                Wallets ({allWallet.length}){" "}
              </Flex>
            </PopoverHeader>
            <PopoverBody>
              <Stack>
                {allWallet.length != 0 ? (
                  allWallet.map((wallet) => (
                    <WalletItem key={wallet.id} wallet={wallet} />
                  ))
                ) : (
                  <Text>No wallets 😩</Text>
                )}
              </Stack>
            </PopoverBody>
            <PopoverFooter textAlign={"center"}>
              <WalletModal allWallet={allWallet}>Add a wallet...</WalletModal>
            </PopoverFooter>
          </PopoverContent>
        </Portal>
      </Popover>
      <Popover placement="bottom-start" trigger="hover">
        <PopoverTrigger>
          <Link>Groups</Link>
        </PopoverTrigger>
        <Portal>
          <PopoverContent width={"auto"}>
            <PopoverHeader>
              <Flex alignItems={"center"}>
                <FontAwesomeIcon icon={faObjectGroup} pull="left" />
                Groups ({userSettings.groups.length})
              </Flex>
            </PopoverHeader>
            <PopoverBody>
              <Stack>
                {userSettings.groups.length != 0 ? (
                  userSettings.groups.map((group) => (
                    <GroupItem key={group.name} groupName={group.name} />
                  ))
                ) : (
                  <Text>no group 😩</Text>
                )}
              </Stack>
            </PopoverBody>
            <PopoverFooter textAlign={"center"}>
              <GroupModal action="Add" groupNameEdit="">
                Add a group
              </GroupModal>
            </PopoverFooter>
          </PopoverContent>
        </Portal>
      </Popover>
      <Link as={ReactRouterLink} to={"/about"}>
        About
      </Link>
    </Stack>
  );
};

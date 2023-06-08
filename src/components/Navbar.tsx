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
  faObjectGroup,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { AllWalletContext } from "../contexts/AllWalletContext";
import WalletItem from "./Menus/WalletItem";
import { UserSettingsContext } from "../contexts/UserSettingsContext";
import GroupItem from "./Menus/GroupItem";
import WalletModal from "./Menus/WalletModal";
import GroupModal from "./Menus/GroupModal";
import SettingsMenu from "./Menus/SettingsMenu";

export default function NavbarV2() {
  const { isOpen, onToggle } = useDisclosure();
  return (
    <Box as={"header"} position={"sticky"} zIndex={50} top={0}>
      <Flex
        //w={"100%"}
        justifyContent={"space-between"}

        //height={'100px'}
      >
        <Flex alignItems={"center"}>
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
      <MobileNavWallet />
      <MobileNavGroup />
      <Link as={Box}>About</Link>
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
          <Text fontSize="lg">My wallets</Text>
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
          <Text fontSize="lg">My groups</Text>
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
    <Stack direction={"row"} display={{ base: "none", md: "initial" }}>
      <Popover placement="bottom-start" trigger="hover">
        <PopoverTrigger>
          <Link>My Wallets</Link>
        </PopoverTrigger>
        <Portal>
          <PopoverContent width={"auto"}>
            <PopoverHeader><Flex alignItems={"center"}><FontAwesomeIcon icon={faWallet} pull="left" />Wallets ({allWallet.length}) </Flex></PopoverHeader>
            <PopoverBody>
              <Stack>
                {allWallet.length != 0 ?
                  allWallet.map((wallet) => (
                    <WalletItem key={wallet.id} wallet={wallet} />
                  )):<Text>No wallets 😩</Text>}
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
          <Link>My groups</Link>
        </PopoverTrigger>
        <Portal>
          <PopoverContent width={"auto"}>
            <PopoverHeader><Flex alignItems={"center"}><FontAwesomeIcon icon={faObjectGroup} pull="left" />Groups ({userSettings.groups.length})</Flex></PopoverHeader>
            <PopoverBody>
              <Stack>
                {userSettings.groups.length != 0 ?
                  userSettings.groups.map((group) => (
                    <GroupItem key={group.name} groupName={group.name} />
                  )):<Text>no group 😩</Text>}
              </Stack>
            </PopoverBody>
            <PopoverFooter textAlign={"center"}>
              <GroupModal
                action="Add"
                //onCloseMenu={onClose}
                groupNameEdit=""
              >
                Add a group
              </GroupModal>
            </PopoverFooter>
          </PopoverContent>
        </Portal>
      </Popover>
      <Link>About</Link>
    </Stack>
  );
};

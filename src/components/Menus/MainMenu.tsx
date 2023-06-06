import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  Tab,
  Text,
  TabPanels,
  TabPanel,
  MenuDivider,
} from "@chakra-ui/react";
import React, { useContext } from "react";
import WalletMenuItem from "./WalletMenuItem";

import { AllWalletContext } from "../../contexts/AllWalletContext";
import WalletModal from "./WalletModal";
import GroupModal from "./GroupModal";
import { UserSettingsContext } from "../../contexts/UserSettingsContext";
import GroupMenuItem from "./GroupMenuItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faObjectGroup, faWallet } from "@fortawesome/free-solid-svg-icons";

export default function MainMenu() {
  const { allWallet } = useContext(AllWalletContext);
  const { userSettings } = useContext(UserSettingsContext);
  return (
    <Menu>
      {({ onClose }) => (
        <>
          <MenuButton as={Button} size="md">
            Menu
          </MenuButton>
          <MenuList>
            <Tabs>
              <TabList>
                <Tab>
                  <FontAwesomeIcon icon={faWallet} pull="left" />
                  Wallets
                </Tab>
                <Tab>
                  <FontAwesomeIcon icon={faObjectGroup} pull="left" />
                  Groups
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel padding={0} paddingTop={1}>
                  {allWallet.length != 0 ? (
                    allWallet.map((addressObj, index) => (
                      <WalletMenuItem
                        key={index}
                        wallet={addressObj}
                        onCloseMenu={onClose} //onClose from menu method
                      />
                    ))
                  ) : (
                    <MenuItem
                      as={Text}
                      color={"InfoText"}
                      closeOnSelect={false}
                    >
                      No adresses
                    </MenuItem>
                  )}
                  <MenuDivider />
                  <WalletModal allWallet={allWallet}>
                    Add a wallet...
                  </WalletModal>
                </TabPanel>
                <TabPanel padding={0} paddingTop={1}>
                  {userSettings.groups.length != 0 ? (
                    userSettings.groups.map((group, index) => (
                      <GroupMenuItem
                        key={index}
                        groupName={group.name}
                        onCloseMenu={onClose} //onClose from menu method
                      />
                    ))
                  ) : (
                    <MenuItem as={Text} closeOnSelect={false}>
                      No group
                    </MenuItem>
                  )}
                  <MenuDivider />
                  <GroupModal
                    action="Add"
                    onCloseMenu={onClose}
                    groupNameEdit=""
                  >
                    Add a group
                  </GroupModal>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </MenuList>
        </>
      )}
    </Menu>
  );
}

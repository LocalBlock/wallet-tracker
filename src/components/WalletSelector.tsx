import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuGroup,
  MenuItem,
} from "@chakra-ui/react";
import React, { useContext } from "react";
import { AllWalletContext } from "../contexts/AllWalletContext";
import { UserSettingsContext } from "../contexts/UserSettingsContext";
import { getUserSettings, updateUserSettings } from "../functions/localstorage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";

export default function WalletSelector() {

  const { allWallet } = useContext(AllWalletContext);
  const { userSettings, setUserSettings } = useContext(UserSettingsContext);

  const handleClick = (
    selectedWallet: (typeof userSettings)["selectedWallet"]
  ) => {
    updateUserSettings("selectedWallet", selectedWallet);
    setUserSettings(getUserSettings());
  };

  let label = "";
  switch (userSettings.selectedWallet.type) {
    case "wallet":
      label = allWallet[userSettings.selectedWallet.index].displayName;
      break;

    case "group":
      label = userSettings.groups[userSettings.selectedWallet.index].name;
      break;
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        colorScheme="pink"
        rightIcon={<FontAwesomeIcon icon={faChevronDown} />}
      >
        {label}
      </MenuButton>
      <MenuList>
        <MenuGroup title="Addresses">
          {allWallet.map((wallet, index) => (
            <MenuItem
              icon={
                wallet.displayName === label ? (
                  <FontAwesomeIcon icon={faCheck} />
                ) : undefined
              }
              key={wallet.id}
              onClick={() => handleClick({ type: "wallet", index })}
            >
              {wallet.displayName}
            </MenuItem>
          ))}
        </MenuGroup>

        <MenuGroup title="Groups">
          {userSettings.groups.map((group, index) => (
            <MenuItem
              icon={
                group.name === label ? (
                  <FontAwesomeIcon icon={faCheck} />
                ) : undefined
              }
              key={group.name}
              onClick={() => handleClick({ type: "group", index })}
            >
              {group.name}
            </MenuItem>
          ))}
        </MenuGroup>
      </MenuList>
    </Menu>
  );
}

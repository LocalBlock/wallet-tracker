import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuGroup,
  MenuItem,
} from "@chakra-ui/react";
import React, { useContext, useState } from "react";
import { AllWalletContext } from "../contexts/AllWalletContext";
import { UserSettingsContext } from "../contexts/UserSettingsContext";
import { getUserSettings, updateUserSettings } from "../functions/localstorage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";

export default function WalletSelector() {
  const [selectedWallet, setSelectedWallet] = useState(
    getUserSettings().selectedWallet
  );
  const { allWallet } = useContext(AllWalletContext);
  const { userSettings, setUserSettings } = useContext(UserSettingsContext);

  const handleClick = (
    selectedWallet: (typeof userSettings)["selectedWallet"]
  ) => {
    //const selectedAddress = { label, selectedAddress: items };
    updateUserSettings("selectedWallet", selectedWallet);

    setSelectedWallet(selectedWallet);
    setUserSettings(getUserSettings());
  };

  let label = "";
  switch (selectedWallet.type) {
    case "wallet":
      label = allWallet[selectedWallet.index].displayName;
      break;

    case "group":
      label = userSettings.groups[selectedWallet.index].name;
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

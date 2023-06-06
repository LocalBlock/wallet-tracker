import {
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Switch,
  useColorMode,
} from "@chakra-ui/react";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useContext } from "react";
import { UserSettingsContext } from "../../contexts/UserSettingsContext";
import {
  getUserSettings,
  updateUserSettings,
} from "../../functions/localstorage";
import { appSettings } from "../../settings/appSettings";

export default function SettingsMenu() {

  const { userSettings, setUserSettings } = useContext(UserSettingsContext);
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Menu closeOnSelect={false}>
      <MenuButton as={IconButton} icon={<FontAwesomeIcon icon={faGear} />} />

      <MenuList>
        <MenuItem as={Box} justifyContent={"space-between"}>
          Currency :
          <Select
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              updateUserSettings("currency", e.target.value);
              setUserSettings(getUserSettings());
            }}
            size={"sm"}
            width={"auto"}
            defaultValue={userSettings.currency}
          >
            {appSettings.currencies.map((currency) => (
              <option key={currency.id} value={currency.id}>
                {currency.symbol + " " + currency.name}
              </option>
            ))}
          </Select>
        </MenuItem>
        <MenuItem as={Box} justifyContent={"space-between"}>
          Dark mode :
          <Switch
            onChange={toggleColorMode}
            isChecked={colorMode === "dark" ? true : false}
          />
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

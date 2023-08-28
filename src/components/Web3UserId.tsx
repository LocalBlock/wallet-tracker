import {
  Box,
  FormControl,
  FormLabel,
  Button,
  Tooltip,
  Input,
} from "@chakra-ui/react";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useContext, useState } from "react";

import { UserSettingsContext } from "../contexts/UserSettingsContext";
import { getUserSettings, updateUserSettings } from "../functions/localstorage";

import { emitMessage } from "../App";

export default function Web3UserId() {
  const { userSettings, setUserSettings } = useContext(UserSettingsContext);
  const [web3UserId, setWeb3UserId] = useState(userSettings.web3UserId);

  const handleSubmit = () => {
    //Save in localstorage
    updateUserSettings("web3UserId", web3UserId);
    const newUserSettings = getUserSettings();
    // Update state Context
    setUserSettings(newUserSettings);
    // Save in server
    if (web3UserId){
      emitMessage("saveUserSettings", newUserSettings);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeb3UserId(e.target.value);
  };
  const handleLoad = () => {
    emitMessage("loadUserSettings",web3UserId)
  };

  return (
    <Box padding={5} borderWidth="1px" borderRadius="lg">
      <FormControl display="flex" alignItems="center">
        <FormLabel mb="0">Web3Id:</FormLabel>
        <Input
          placeholder="eth address"
          onChange={handleChange}
          value={web3UserId}
        />
        <Tooltip label="TODO" placement="auto-end">
          <FontAwesomeIcon icon={faQuestionCircle} pull="right" size="xs" />
        </Tooltip>
      </FormControl>
      <Button onClick={handleLoad}>Load</Button>
      <Button onClick={handleSubmit}>Save</Button>
    </Box>
  );
}

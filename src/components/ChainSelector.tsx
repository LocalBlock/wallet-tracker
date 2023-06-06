import React, { useContext, useState } from "react";
import { ButtonGroup, IconButton } from "@chakra-ui/react";

//Icons for button
import { ReactComponent as PolygonIcon } from "../assets/polygon_icon_gradient_on_transparent.svg";
import { ReactComponent as EthereumIcon } from "../assets/eth-diamond-purple.svg";
import { ReactComponent as DefaultIcon } from "../assets/circle-question-regular.svg";


import { UserSettingsContext } from "../contexts/UserSettingsContext";
import { getUserSettings, updateUserSettings } from "../functions/localstorage";
import { appSettingsType, userSettings } from "../types/types";
import { appSettings } from "../settings/appSettings";

export default function ChainSelector() {

  const { userSettings, setUserSettings } = useContext(UserSettingsContext);

  const [selectedChain, setSelectedChain] = useState(
    userSettings.selectedChain
  );

  const handleClick = (chain:appSettingsType['chains'][number]['id']) => {
    if (selectedChain.length != 1 || !selectedChain.includes(chain)) {
      let newSelectedChain: userSettings['selectedChain'];
      if (selectedChain.includes(chain))
        newSelectedChain = selectedChain.filter((element) => element != chain); //Remove Chain
      else newSelectedChain = [...selectedChain, chain]; //Add Chain

      setSelectedChain(newSelectedChain); // Update state
      updateUserSettings("selectedChain", newSelectedChain);
      setUserSettings(getUserSettings());
    }
  };
  //console.log("Render selected Chain");
  return (
    <ButtonGroup>
      {appSettings.chains.map((chain) => {
        let SvgIcon;
        switch (chain.id) {
          case "ethereum":
            SvgIcon = EthereumIcon;
            break;
          case "polygon-pos":
            SvgIcon = PolygonIcon;
            break;
          default:
            SvgIcon = DefaultIcon;
            break;
        }

        return (
          <IconButton
            key={chain.id}
            onClick={() => handleClick(chain.id)}
            variant={
              selectedChain.includes(chain.id)
                ? "IconButtonActived"
                : "IconButtonDesactived"
            }
            //colorScheme="blue"
            //bgColor={'Highlight'}
            aria-label={chain.name}
            icon={<SvgIcon />}
            padding={"revert"}
          />
        );
      })}
    </ButtonGroup>
  );
}

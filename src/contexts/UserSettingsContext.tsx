import { createContext } from "react";

import { userSettings } from "../types/types";

type UserSettingsContextType = {
  userSettings: userSettings;
  setUserSettings: React.Dispatch<React.SetStateAction<userSettings>>;
};

export const UserSettingsContext = createContext<UserSettingsContextType>({
  userSettings: {
    currency: "usd",
    selectedChain: ["ethereum", "polygon-pos"],
    groups: [],
    selectedWallet: { type: "wallet", index: 0 },
  },
  setUserSettings: () => {
    null;
  },
});

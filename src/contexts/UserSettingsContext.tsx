import { createContext } from "react";

import { userSettings } from "../types/types";
import { appSettings } from "../settings/appSettings";

type UserSettingsContextType = {
  userSettings: userSettings;
  setUserSettings: React.Dispatch<React.SetStateAction<userSettings>>;
};

export const UserSettingsContext = createContext<UserSettingsContextType>({
  userSettings: appSettings.defaultUserSettings,
  setUserSettings: () => {
    null;
  },
});

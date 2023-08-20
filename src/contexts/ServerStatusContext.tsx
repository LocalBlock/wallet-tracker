import { createContext } from "react";

type ServerStatusContextType = {
  /** Alchemy Api key environment variable set? */
  isApiKey: boolean;
  /** Alchemy Authtoken environment variable set? */
  isAuthToken: boolean;
  isConnected: boolean;
};

export const ServerStatusContext = createContext<ServerStatusContextType>({
  isApiKey: false,
  isAuthToken: false,
  isConnected: false,
});

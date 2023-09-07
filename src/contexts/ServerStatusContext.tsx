import { createContext } from "react";

type ServerStatusContextType = {
  serverStatus: {
    /** Alchemy Api key environment variable set? */
    isApiKey: boolean;
    /** Alchemy Authtoken environment variable set? */
    isAuthToken: boolean;
    isConnected: boolean;
    connectedUser: string;
  };
  setServerStatus: React.Dispatch<React.SetStateAction<ServerStatusContextType["serverStatus"]>>;
};

export const ServerStatusContext = createContext<ServerStatusContextType>({
  serverStatus: {
    isApiKey: false,
    isAuthToken: false,
    isConnected: false,
    connectedUser: "",
  },
  setServerStatus: () => {
    null;
  },
});

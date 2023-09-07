import React, { useState, useEffect, Suspense, lazy } from "react";
import { socket } from "./socket";
import { AllWalletContext } from "./contexts/AllWalletContext";
import { UserSettingsContext } from "./contexts/UserSettingsContext";
import { ServerStatusContext } from "./contexts/ServerStatusContext";
import { getAllWallet, getUserSettings } from "./functions/localstorage";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { ChakraProvider, ColorModeScript, useToast } from "@chakra-ui/react";
import Layout from "./pages/Layout";
import { checkUserSettings } from "./functions/utils";
import theme from "./theme/theme";
import { WagmiConfig } from "wagmi";
import { setMyWagmiConfig } from "./wagmiConfig";

// ROUTER DEFENITION
//Lazy-loading with dynamic import()
const Home = lazy(() => import("./pages/Home"));
const Settings = lazy(() => import("./pages/Settings"));
const About = lazy(() => import("./pages/About"));
const HomePage = () => (
  <Suspense fallback={<div>Page is Loading...</div>}>
    <Home />
  </Suspense>
);
const SettingsPage = () => (
  <Suspense fallback={<div>Page is Loading...</div>}>
    <Settings />
  </Suspense>
);
const AboutPage = () => (
  <Suspense fallback={<div>Page is Loading...</div>}>
    <About />
  </Suspense>
);
const router = createBrowserRouter([
  {
    path: "/",
    id: "root",
    element: <Layout socket={socket} />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
      { path: "/about", element: <AboutPage /> },
    ],
  },
]);
// END ROUTER DEFENITION

// Get server status
const { isApiKey, isAuthToken, projectId } = await fetch("/status").then(
  (res) =>
    res.json() as Promise<{ isApiKey: boolean; isAuthToken: boolean; projectId: string }>
);

//Set myWagmiConfig
const myWagmiConfig=setMyWagmiConfig(projectId)

// Check currentsettings
checkUserSettings(getUserSettings());

export default function App() {
  //State for App
  const [allWallet, setAllWallet] = useState(getAllWallet());
  const [userSettings, setUserSettings] = useState(getUserSettings());
  const toast = useToast();

  //Websocket server states
  const [serverStatus, setServerStatus] = useState({
    isApiKey,
    isAuthToken,
    isConnected: socket.connected,
    connectedUser: socket.auth
      ? (Object.getOwnPropertyDescriptor(socket.auth, "connectedUser")
          ?.value as string)
      : "",
  });

  // Synchronize with websocket server
  useEffect(() => {
    console.log("useEffect WebSocket");
    function onConnect() {
      console.log("[Server] Connected to websocket server");
      setServerStatus((previousStatus) => {
        return { ...previousStatus, ["isConnected"]: true };
      });
    }

    function onDisconnect() {
      console.log("[Server] Disconnected from websocket server");
      setServerStatus((previousStatus) => {
        return { ...previousStatus, ["isConnected"]: false };
      });
    }

    function onError(value: string) {
      toast({
        title: "Something get's wrong ",
        description: value,
        status: "error",
      });
    }
    // Set websocket listener
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("error", onError);

    // Cleanup listener
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("error", onError);

    };
  }, [toast]);

  console.log("----------->Render App<----------");
  return (
    <div className="App">
      {/** Providers  */}
      <AllWalletContext.Provider value={{ allWallet, setAllWallet }}>
        <UserSettingsContext.Provider value={{ userSettings, setUserSettings }}>
          <ServerStatusContext.Provider
            value={{ serverStatus, setServerStatus }}
          >
            <WagmiConfig config={myWagmiConfig}>
              <ChakraProvider theme={theme}>
                <ColorModeScript
                  initialColorMode={theme.config.initialColorMode}
                />
                <RouterProvider router={router} />
              </ChakraProvider>
            </WagmiConfig>
          </ServerStatusContext.Provider>
        </UserSettingsContext.Provider>
      </AllWalletContext.Provider>
    </div>
  );
}

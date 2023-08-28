import React, { useState, useEffect, Suspense, lazy } from "react";
import { AllWalletContext } from "./contexts/AllWalletContext";
import { UserSettingsContext } from "./contexts/UserSettingsContext";
import { ServerStatusContext } from "./contexts/ServerStatusContext";
import { getAllWallet, getUserSettings } from "./functions/localstorage";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { socket } from "./socket";
import { ChakraProvider, ColorModeScript, useToast } from "@chakra-ui/react";
import { userSettings } from "./types/types";
import Layout from "./pages/Layout";
import { checkUserSettings } from "./functions/utils";
import theme from "./theme/theme";

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
    //loader: loaderSettings, // Cancel feature
    //shouldRevalidate: () => false, // Prevent call of loader, When navigating to the same URL as the current URL
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

// Emit event to server
export function emitMessage(messageName:string,messageData:unknown){
  socket.emit(messageName,messageData)
}

// Check currentsettings
checkUserSettings(getUserSettings());

export default function App() {
  //State for App
  const [allWallet, setAllWallet] = useState(getAllWallet());
  const [userSettings, setUserSettings] = useState(getUserSettings());
  const toast = useToast();

  //Websocket server states
  const [serverStatus, setServerStatus] = useState({
    isApiKey: false,
    isAuthToken: false,
    isConnected:socket.connected
  });

  // Synchronize with websocket server
  useEffect(() => {
    console.log("useEffect WebSocket");
    function onConnect() {
      console.log("[Server] Connected to websocket server");
      setServerStatus((previousStatus)=>{
        return {...previousStatus,["isConnected"]:true}
      })
    }

    function onDisconnect() {
      console.log("[Server] Disconnected from websocket server");
      setServerStatus((previousStatus)=>{
        return {...previousStatus,["isConnected"]:false}
      })
    }
    function onCheckServer(value: string) {
      console.log("[Server] Status received");
      const data=JSON.parse(value) as {isApiKey:boolean,isAuthToken:boolean}
      setServerStatus((previousStatus)=>{
        return {...previousStatus,["isApiKey"]:data.isApiKey,["isAuthToken"]:data.isAuthToken}
      })

    }

    function onError(value: string) {
      toast({
        title: "Something get's wrong ",
        description: value,
        status: "error",
      });
    }

    function onUsersettings(data: userSettings) {
      localStorage.setItem("userSettings", JSON.stringify(data));
      setUserSettings(getUserSettings());
      toast({
        title: "Settings",
        description: "Setting loaded",
        status: "success",
      });
    }



    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("status", onCheckServer);
    socket.on("error", onError);
    socket.on("userSettings", onUsersettings);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("status", onCheckServer);
      socket.off("error", onError);
      socket.off("userSettings", onUsersettings);
    };
  }, [toast]);

  console.log("----------->Render App<----------");
  return (
    <div className="App">
      {/** Providers  */}
      <AllWalletContext.Provider value={{ allWallet, setAllWallet }}>
        <UserSettingsContext.Provider value={{ userSettings, setUserSettings }}>
          <ServerStatusContext.Provider value={serverStatus}>
            <ChakraProvider theme={theme}>
              <ColorModeScript
                initialColorMode={theme.config.initialColorMode}
              />
              <RouterProvider router={router} />
            </ChakraProvider>
          </ServerStatusContext.Provider>
        </UserSettingsContext.Provider>
      </AllWalletContext.Provider>
    </div>
  );
}

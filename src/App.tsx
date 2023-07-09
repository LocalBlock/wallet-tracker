import React, { useState, Suspense, lazy } from "react";
import { AllWalletContext } from "./contexts/AllWalletContext";
import { UserSettingsContext } from "./contexts/UserSettingsContext";
import { getAllWallet, getUserSettings } from "./functions/localstorage";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Layout from "./pages/Layout";
import About from "./pages/About";

//Lazy-loading with dynamic import()
const Home = lazy(() => import("./pages/Home"));
const HomePage = () => (
  <Suspense fallback={<div>Page is Loading...</div>}>
    <Home />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "/about", element: <About /> },
    ],
  },
]);

export default function App() {
  //State for App
  const [allWallet, setAllWallet] = useState(getAllWallet());
  const [userSettings, setUserSettings] = useState(getUserSettings());

  return (
    <div className="App">
      {/** Provider  */}
      <AllWalletContext.Provider value={{ allWallet, setAllWallet }}>
        <UserSettingsContext.Provider value={{ userSettings, setUserSettings }}>
          <RouterProvider router={router} />
        </UserSettingsContext.Provider>
      </AllWalletContext.Provider>
    </div>
  );
}

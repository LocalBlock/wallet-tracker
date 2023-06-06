import { createContext } from "react";


import { AddressWallet, CustomWallet, Web3Wallet } from "../classes/Wallet";

type AllWalletContextType = {allWallet:(AddressWallet|CustomWallet|Web3Wallet)[],setAllWallet:React.Dispatch<React.SetStateAction<(AddressWallet|CustomWallet|Web3Wallet)[]>>} 

export const AllWalletContext = createContext<AllWalletContextType>({
  allWallet: [],
  setAllWallet: ()=>{null},
});

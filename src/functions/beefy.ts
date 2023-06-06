import { beefyVault,beefyApy,beefyLps } from "../types/beefy"

export async function fetchBeefyData(){
    let url=''
    // Vault Data
    url='https://api.beefy.finance/vaults'
    const vaultData=await fetchAPI(url) as beefyVault[]
    

    // Apy Data
    url='https://api.beefy.finance/apy'
    const apyData= await fetchAPI(url) as beefyApy

    // Lps Data
    url= 'https://api.beefy.finance/lps/breakdown'
    const lpsData=await fetchAPI(url) as beefyLps

    return {vaultData:vaultData,apyData:apyData,lpsData:lpsData}

}

async function fetchAPI(url: string) {
    const r = await fetch(url, {
      headers: {
        accept: "application/json",
      },
    });
    if (r.ok) {
      return r.json();
    }
    throw new Error("Beefy response not OK");
  }
  
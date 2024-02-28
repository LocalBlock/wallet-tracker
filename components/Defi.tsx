import AaveCard from "./cards/AaveCard";
import AaveSafetyModuleCard from "./cards/AaveSafetyModuleCard";
import BeefyCard from "./cards/BeefyCard";

import { getDefi } from "@/app/actions/asset";
import { useQuery } from "@tanstack/react-query";

type Props = {
  selectedWalletAddresIds: string[];
  selectedChains: string[];
  currency: string;
};

export default function Defi({selectedWalletAddresIds,selectedChains,currency}:Props) {
  const { data: defi } = useQuery({
    queryKey: ["defi", selectedWalletAddresIds],
    queryFn: () => getDefi(selectedWalletAddresIds),
    enabled:selectedWalletAddresIds.some((walletId)=>walletId.startsWith("0x"))
  });

  if (!defi) return null;

  return (
    <>
      <AaveSafetyModuleCard
        data={defi.aaveSafetymodule}
        currency={currency}
        selectedChains={selectedChains}
      />
      <AaveCard
        version={"V2"}
        currency={currency}
        selectedChains={selectedChains}
        data={defi.aaveV2}
      />
      <AaveCard
        version={"V3"}
        currency={currency}
        selectedChains={selectedChains}
        data={defi.aaveV3}
      />
      <BeefyCard
        currency={currency}
        selectedChains={selectedChains}
        data={defi.beefy}
      />
    </>
  );
}

import { getUserDefi } from "@/lib/assets";
import AaveCard from "./cards/AaveCard";
import AaveSafetyModuleCard from "./cards/AaveSafetyModuleCard";

type Props = {
  userDefi: ReturnType<typeof getUserDefi>;
  selectedChains: string[];
  currency: string;
};

export default function Defi({ userDefi, selectedChains, currency }: Props) {
  return (
    <>
      {userDefi.aaveSafetymodule.length != 0 && (
        <AaveSafetyModuleCard
          data={userDefi.aaveSafetymodule}
          currency={currency}
          selectedChains={selectedChains}
        />
      )}
      {userDefi.aaveV3.length != 0 && (
        <AaveCard
          version={"V3"}
          currency={currency}
          selectedChains={selectedChains}
          data={userDefi.aaveV3}
        />
      )}
    </>
  );
}

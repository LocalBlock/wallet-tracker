import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Heading,
} from "@chakra-ui/react";
import { useConnect } from "wagmi";
import { Image } from "@chakra-ui/react";

export function WalletOptions() {
  const { connectors, connect, isPending, isError, failureReason } = useConnect();

  return (
    <>
      <Heading size={"md"} as={"h4"}>
        Select a wallet type :
      </Heading>
      {/* Alert message */}
      {isError && (
        <Alert
          status={
            failureReason?.name === "UserRejectedRequestError"
              ? "warning"
              : "error"
          }
        >
          <AlertIcon />
          <AlertDescription>{failureReason?.name}</AlertDescription>
        </Alert>
      )}
      {connectors.map((connector) => (
        <Button
          key={connector.uid}
          isLoading={isPending}
          onClick={() => connect({ connector })}
        >
          {connector.icon && (
            <Image src={connector.icon} boxSize={"25px"} alt={connector.name} />
          )}
          {connector.type === "walletConnect" && (
            <Image
              src={"/walletConnect.svg"}
              boxSize={"25px"}
              alt={connector.name}
            />
          )}
          &nbsp;
          {connector.name}
        </Button>
      ))}
    </>
  );
}

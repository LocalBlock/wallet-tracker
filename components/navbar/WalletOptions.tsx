import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Heading,
} from "@chakra-ui/react";
import { useConnect, useConnectors } from "wagmi";
import { Image } from "@chakra-ui/react";

export function WalletOptions() {
  const connect = useConnect();
  const connectors = useConnectors();

  return (
    <>
      <Heading size={"md"} as={"h4"}>
        Select a wallet type :
      </Heading>
      {/* Alert message */}
      {connect.isError && (
        <Alert
          status={
            connect.failureReason?.name === "UserRejectedRequestError"
              ? "warning"
              : "error"
          }
        >
          <AlertIcon />
          <AlertDescription>{connect.failureReason?.name}</AlertDescription>
        </Alert>
      )}
      {connectors.map((connector) => (
        <Button
          key={connector.uid}
          isLoading={connect.isPending}
          onClick={() => connect.mutate({ connector })}
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

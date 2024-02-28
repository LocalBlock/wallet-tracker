import { useAccount, useDisconnect } from "wagmi";
import { WalletOptions } from "@/components/navbar/WalletOptions";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  VStack,
  useDisclosure,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import SignInButton from "@/components/navbar/SignInButton";
import { displayName } from "@/lib/utils";
import { useState } from "react";

export default function ConnectWallet() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isConnected, address, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const [signInError, setSignInError] = useState({
    isError: false,
    title: "",
    description: "",
  });

  return (
    <>
      <Button onClick={onOpen}>{"Sign-in"}</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setSignInError({ isError: false, title: "", description: "" });
        }}
        trapFocus={false}
      >
        <ModalOverlay />
        <ModalContent >
          <ModalBody>
            <VStack>
              {signInError.isError && (
                <Alert status="error">
                  <AlertIcon />
                  <AlertTitle>{signInError.title}</AlertTitle>
                  <AlertDescription>{signInError.description}</AlertDescription>
                </Alert>
              )}
              {!isConnected && <WalletOptions />}
              {isConnected && (
                <>
                  <Text>Connected Wallet : {displayName(address!, null)} </Text>
                  <Button onClick={() => disconnect()} variant={"outline"}>
                    Disconnect wallet
                  </Button>
                  <SignInButton
                    address={address!}
                    chainId={chainId!}
                    onError={setSignInError}
                    onSuccess={onClose}
                  />
                </>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

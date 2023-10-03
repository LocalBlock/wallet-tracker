import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Button,
  Image,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  useDisclosure,
  VStack,
  FormHelperText,
  ButtonGroup,
  Text,
  FormErrorMessage,
} from "@chakra-ui/react";
import {
  useAccount,
  useConnect,
  useSignMessage,
  useNetwork,
  useDisconnect,
} from "wagmi";
import { SiweMessage } from "siwe";
import { ServerStatusContext } from "../contexts/ServerStatusContext";
import { UserSettingsContext } from "../contexts/UserSettingsContext";
import { userSettings } from "../types/types";
import { socket } from "../socket";
import { AddressWallet, CustomWallet, Web3Wallet } from "../classes/Wallet";
import { AllWalletContext } from "../contexts/AllWalletContext";
import { Coin } from "../classes/Coin";
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
faWallet;

export default function ConnectSetting() {
  const { serverStatus, setServerStatus } = useContext(ServerStatusContext);
  const { userSettings, setUserSettings } = useContext(UserSettingsContext);
  const { setAllWallet } = useContext(AllWalletContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [state, setState] = useState<{
    loading?: boolean;
    nonce?: string;
  }>({});
  // Wagmi hooks
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { signMessageAsync } = useSignMessage();

  /**
   * Get nonce from server
   *
   * update nonce in session server, and in state
   */
  const fetchNonce = async () => {
    try {
      const nonceRes = await fetch("/siwe/nonce");
      const nonce = await nonceRes.text();
      setState((x) => ({ ...x, nonce }));
    } catch (error) {
      setState((x) => ({ ...x, error: error as Error }));
    }
  };
  /**
   * Perform sign-in request
   *
   * Update usersettings and wallet from server
   */
  const signIn = async () => {
    try {
      const chainId = chain?.id;
      if (!address || !chainId) return;

      setState((x) => ({ ...x, loading: true }));
      // Create SIWE message with pre-fetched nonce and sign with wallet
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to access all features.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: state.nonce,
      });
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      // Verify signature
      const verifyRes = await fetch("/siwe/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, signature }),
      });

      if (!verifyRes.ok) throw new Error((await verifyRes.json()).message);

      // Signature ok
      // Update manualy socket on server with connected user
      socket.emit("updateSocketAuth", message.address);
      //Overwrite userSettings and allWallet from server if userSettings exist
      const serverUserSettings = (await verifyRes.json())
        .userSettings as userSettings;
      if (serverUserSettings) {
        //Recreate wallet
        const serverWallets = serverUserSettings.wallets;
        const recreateWalletsFromServer: (
          | AddressWallet
          | CustomWallet
          | Web3Wallet
        )[] = [];
        serverWallets.forEach((wallet) => {
          switch (wallet.type) {
            case "AddressWallet":
              {
                const recreateAddressWallet = new AddressWallet(
                  wallet.address as string,
                  wallet.ens
                );
                recreateAddressWallet.id = wallet.id;
                recreateWalletsFromServer.push(recreateAddressWallet);
              }
              break;
            case "CustomWallet":
              {
                const recreateCustomWallet = new CustomWallet(
                  wallet.name as string
                );
                recreateCustomWallet.id = wallet.id;
                if (wallet.coins) {
                  const coins = wallet.coins.map(
                    (coin) => new Coin(coin.id, "", "", "", coin.balance)
                  );
                  recreateCustomWallet.coins = coins;
                }
                recreateWalletsFromServer.push(recreateCustomWallet);
              }
              break;
            case "Web3Wallet":
              break;
          }
        });
        localStorage.setItem(
          "userSettings",
          JSON.stringify(serverUserSettings)
        ); // Overwrite localstorage userSettings from server UserSettings
        localStorage.setItem(
          "Address",
          JSON.stringify(recreateWalletsFromServer)
        ); // Overwrite localstorage address from recreateWallet
        // Update States
        setUserSettings(serverUserSettings);
        setAllWallet(recreateWalletsFromServer);
      } else socket.emit("saveUserSettings", userSettings); // No userSettings on server, save current userSettings

      setState((x) => ({ ...x, loading: false }));
      setServerStatus({
        ...serverStatus,
        ["connectedUser"]: message.address,
      });
    } catch (error) {
      console.error(error);
      setState((x) => ({
        ...x,
        loading: false,
        nonce: undefined,
      }));
      fetchNonce();
    }
  };
  /**
   * Perform logout request
   */
  const logOut = async () => {
    try {
      await fetch("/siwe/logout");
      setServerStatus({ ...serverStatus, ["connectedUser"]: "" });
    } catch (error) {
      console.log(error);
    }
  };

  // Close modal when connection is done
  if (isConnected && isOpen) onClose();

  // Pre-fetch random nonce when button is rendered
  // to ensure deep linking works for WalletConnect
  // users on iOS when signing the SIWE message
  useEffect(() => {
    fetchNonce();
  }, []);

  console.log("[Render] ConnectSetting");
  return (
    <Box padding={4} borderWidth="2px" borderRadius="lg">
      <FormControl isInvalid={serverStatus.connectedUser ? false : true}>
        <FormLabel as={"legend"}>
          Connect a wallet and sign in with Ethereum
        </FormLabel>
        <ButtonGroup>
          {isConnected ? (
            <Button onClick={disconnect as () => void}>Disconnet wallet</Button>
          ) : (
            <Button
              isDisabled={serverStatus.connectedUser ? true : false}
              onClick={onOpen}
            >
              Connect wallet
            </Button>
          )}
          {serverStatus.connectedUser ? (
            <Button onClick={logOut}>Sign-out</Button>
          ) : (
            <Button
              isDisabled={!state.nonce || state.loading || !isConnected}
              onClick={signIn}
            >
              Sign in
            </Button>
          )}
        </ButtonGroup>
        <FormHelperText>
          {serverStatus.connectedUser
            ? "Connected user : " + serverStatus.connectedUser
            : ""}
        </FormHelperText>
        <FormErrorMessage>No user connected</FormErrorMessage>
        <Modal isOpen={isOpen} onClose={onClose} trapFocus={false}>
          <ModalOverlay zIndex={80} />
          <ModalContent containerProps={{ zIndex: 80 }}>
            <ModalHeader>Connect a wallet</ModalHeader>
            <ModalCloseButton />
            <ModalBody zIndex={700}>
              <VStack>
                {connectors.map((connector) => (
                  <Button
                    isDisabled={!connector.ready}
                    key={connector.id}
                    onClick={() => connect({ connector })}
                  >
                    {connector.id != "injected" ? (
                      <Image src={connector.id + ".svg"} boxSize={"30px"} />
                    ) : (
                      <FontAwesomeIcon icon={faWallet} size="xl" />
                    )}
                    &nbsp;&nbsp;{connector.name}
                    {!connector.ready && " (unsupported)"}
                    {isLoading &&
                      connector.id === pendingConnector?.id &&
                      " (connecting)"}
                  </Button>
                ))}
                {error && <Text color={"yellow"}>{error.message}</Text>}
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </FormControl>
    </Box>
  );
}

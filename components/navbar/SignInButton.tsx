import { Button } from "@chakra-ui/react";
import Image from "next/image";
import siweLogo from "@/public/SIWE_Logomark_Gradient.png";
import React, { useEffect, useState } from "react";
import { createSiweMessage, parseSiweMessage } from "viem/siwe";
import { Address } from "viem";
import { useSignMessage } from "wagmi";
import useSession from "@/hooks/useSession";
import { useQuery } from "@tanstack/react-query";
import { getUserData } from "@/app/actions/user";

interface Props {
  address: Address;
  chainId: number;
  onError: React.Dispatch<
    React.SetStateAction<{
      isError: boolean;
      title: string;
      description: string;
    }>
  >;
  onSuccess: () => void;
}

export default function SignInButton({
  address,
  chainId,
  onError,
  onSuccess,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [nonce, setNonce] = useState<string | undefined>(undefined);
  const { login } = useSession();
  const { signMessageAsync } = useSignMessage();
  const { refetch } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });

  /**
   * Get nonce from server
   */
  const fetchNonce = async () => {
    try {
      const nonceRes = await fetch("/api/siwe/nonce");
      setNonce(await nonceRes.text());
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Perform sign-in request
   */
  const signIn = async () => {
    try {
      setIsLoading(true);
      onError({ isError: false, title: "", description: "" });

      //Create SIWE message with pre-fetched nonce
      const message = createSiweMessage({
        address,
        chainId,
        domain: window.location.host,
        nonce: nonce!,
        uri: window.location.origin,
        version: "1",
        statement: "Sign in to access Wallet Tracker.",
      });

      // Sign SIWE message
      const signature = await signMessageAsync({
        message,
      });

      // Verify SIWE message with signature on backend
      const isValid = (await (
        await fetch("/api/siwe/verify", {
          method: "POST",
          body: JSON.stringify({ message, signature }),
        })
      ).json()) as boolean;

      if (isValid) {
        // Signature is valid, Do log-in with Iron session and SWR
        const sessionData = await login({
          userAddress: parseSiweMessage(message).address!,
        });
        if (sessionData.isLoggedIn) {
          // Login success
          console.log("Sign in with ethereum success");

          refetch();
          onSuccess();
        } else {
          onError({
            isError: true,
            title: "Login",
            description: "Login Failed",
          });
        }
      } else {
        onError({
          isError: true,
          title: "SIWE Verify",
          description: "SIWE verify fail",
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setNonce(undefined);
      fetchNonce();
    }
  };

  // Pre-fetch random nonce when button is rendered
  // to ensure deep linking works for WalletConnect
  // users on iOS when signing the SIWE message
  useEffect(() => {
    fetchNonce();
  }, []);

  return (
    <Button onClick={signIn} isLoading={isLoading}>
      <Image src={siweLogo} alt="Siwe" height={20} style={{ width: "auto" }} />
      &nbsp; Sign-in with Ethereum
    </Button>
  );
}

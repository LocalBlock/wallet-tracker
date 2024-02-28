import { Button } from "@chakra-ui/react";
import Image from "next/image";
import siweLogo from "@/public/SIWE_Logomark_Gradient.png";
import React, { useEffect, useState } from "react";
import { SiweError, SiweMessage } from "siwe";
import { Address } from "viem";
import { BaseErrorType, useSignMessage } from "wagmi";
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

      // Create SIWE message with pre-fetched nonce and sign with wallet
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to access all features.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });

      // Sign message
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      // Do log-in
      const result = await login({ message, signature });

      // Signature is valid
      console.log("Sign in with ethereum success");

      setIsLoading(false);
      refetch();
      onSuccess();
    } catch (error: any) {
      if (error instanceof SiweError) {
        onError({
          isError: true,
          title: "Sign-In with Ethereum",
          description: error.type,
        });
      } else {
        const baseError = error as BaseErrorType;
        onError({
          isError: true,
          title: baseError.name,
          description: baseError.message,
        });
      }
      //console.error(error);
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

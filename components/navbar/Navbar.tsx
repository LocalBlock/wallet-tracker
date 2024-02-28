"use client";
import { Box, Flex, Heading, Text, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import ConnectWallet from "@/components/navbar/ConnectWallet";
import ColorModeButton from "@/components/navbar/ColorModeButton";
import Account from "@/components/navbar//Account";
import FetchIndicator from "./FetchIndicator";
import logo from "@/public/logo.svg";
import useSession from "@/hooks/useSession";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { session, isLoading } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    // Attacher l'événement de défilement à la fenêtre
    window.addEventListener("scroll", handleScroll);
    // Détacher l'événement de défilement lorsque le composant est démonté
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <Flex
      position={"sticky"}
      top={0}
      zIndex={"sticky"}
      p={2}
      gap={2}
      as={"header"}
      bgColor={"chakra-body-bg"}
      boxShadow={scrolled ? "0 3px 4px rgba(0, 0, 0, 0.2)" : "none"}
      transition="box-shadow 0.3s"
    >
      <Flex alignItems={"center"} gap={2} flex={1}>
        <Image src={logo} alt="Wallet Tracker" width={50} height={50} />
        <Box>
          <Heading as={"h1"} fontSize={{ base: "sm", md: "3xl" }}>
            Wallet Tracker
          </Heading>
          <Text fontSize={"xs"}>Powered by CoinGecko</Text>
        </Box>
      </Flex>
      {/* Navigation */}
      <Flex
        gap={2}
        alignItems={"center"}
        display={{ base: "none", md: "inherit" }}
      >
        <Link
          as={NextLink}
          href="/"
          color="blue.400"
          _hover={{ color: "blue.500" }}
        >
          Home
        </Link>
        <Link
          as={NextLink}
          href="/wallets"
          color="blue.400"
          _hover={{ color: "blue.500" }}
        >
          Wallets
        </Link>
        <Link
          as={NextLink}
          href="/settings"
          color="blue.400"
          _hover={{ color: "blue.500" }}
        >
          Settings
        </Link>
        <Link
          as={NextLink}
          href="/about"
          color="blue.400"
          _hover={{ color: "blue.500" }}
        >
          About
        </Link>
      </Flex>
      <Flex alignItems={"center"} gap={1} flex={1} justifyContent={"end"}>
        {isLoading ? null : session.isLoggedIn ? (
          <Account />
        ) : (
          <ConnectWallet />
        )}
        <FetchIndicator />
        <Box display={{ base: "none", md: "inherit" }}>
          <ColorModeButton />
        </Box>
        <MobileMenu />
      </Flex>
    </Flex>
  );
}

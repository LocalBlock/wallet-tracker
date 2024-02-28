import {
  IconButton,
  Flex,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  DrawerHeader,
  DrawerFooter,
  Link,
} from "@chakra-ui/react";
import { FaBars } from "react-icons/fa6";
import ColorModeButton from "./ColorModeButton";
import NextLink from "next/link";

export default function MobileMenu() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <IconButton
        icon={<FaBars />}
        aria-label="Menu"
        display={{ base: "inherit", md: "none" }}
        onClick={onOpen}
      />
      <Drawer isOpen={isOpen} placement="top" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>Wallet Tracker</DrawerHeader>
          <DrawerBody>
            <Flex gap={5} direction={"column"}>
              <Link as={NextLink} href="/" scroll={false} onClick={onClose}>
                Home
              </Link>
              <Link
                as={NextLink}
                href="/wallets"
                scroll={false}
                onClick={onClose}
              >
                Wallets
              </Link>
              <Link
                as={NextLink}
                href="/settings"
                scroll={false}
                onClick={onClose}
              >
                Settings
              </Link>
              <Link
                as={NextLink}
                href="/about"
                scroll={false}
                onClick={onClose}
              >
                About
              </Link>
            </Flex>
          </DrawerBody>
          <DrawerFooter>
            <ColorModeButton />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

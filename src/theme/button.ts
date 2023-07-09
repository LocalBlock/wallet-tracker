import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

const IconButtonDesactived = defineStyle({
  background: "gray.500",
  filter: "grayscale(1) opacity(0.5)",
  _dark: {
    background: "gray.400",
  },
  _hover: {
    filter: "none",
  },
});

const IconButtonActived = defineStyle({
  background: "cyan.600",
  _dark: {
    background: "cyan.700",
  },
  _hover: {
    filter: "opacity(0.8)",
  },
});

export const buttonTheme = defineStyleConfig({
  variants: { IconButtonDesactived, IconButtonActived },
});

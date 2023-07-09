import { createMultiStyleConfigHelpers } from "@chakra-ui/react";
import { tagAnatomy } from "@chakra-ui/anatomy";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(tagAnatomy.keys);

const ethereum = definePartsStyle({
  container: {
    bg: "#627eea",
    color: "whiteAlpha.900",
  },
});

const polygon = definePartsStyle({
  container: {
    bg: "#843adc",
    color: "whiteAlpha.900",
  },
});

export const tagTheme = defineMultiStyleConfig({
  variants: {
    ethereum: ethereum,
    "polygon-pos": polygon,
  },
});

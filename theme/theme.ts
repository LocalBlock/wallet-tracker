import {
  extendTheme,
  createMultiStyleConfigHelpers,
  type ThemeConfig,
} from "@chakra-ui/react";

import { tagAnatomy } from "@chakra-ui/anatomy";

// Customize config for color mode
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

//Customize Tag
const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(tagAnatomy.keys);
const tagTheme = defineMultiStyleConfig({
  variants: {
    ethereum: definePartsStyle({
      container: {
        bg: "#627eea",
        color: "whiteAlpha.900",
      },
    }),
    "polygon-pos": definePartsStyle({
      container: {
        bg: "#843adc",
        color: "whiteAlpha.900",
      },
    }),
    custom: definePartsStyle({
      container: {
        bg: "gray.500",
        color: "whiteAlpha.900",
      },
    }),
  },
});

// Extend theme
const theme = extendTheme({
  config,
  components: {
    Tag: tagTheme,
  },
});

export default theme;

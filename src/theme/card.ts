import { cardAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(cardAnatomy.keys);

// define the base component styles
const baseStyle = definePartsStyle({
  // define the part you're going to style
  container: {
    backgroundColor: "secondary.100",
    _dark: {
      backgroundColor: "secondary.800",
    },
  },
});

// export the component theme
export const cardTheme = defineMultiStyleConfig({
  baseStyle,
});

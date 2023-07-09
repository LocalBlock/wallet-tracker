import { menuAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(menuAnatomy.keys);
// define the base component styles
const baseStyle = definePartsStyle({
  // define the part you're going to style
  list: {
    // this will style the MenuList component
    bg: "secondary.200",
    _dark: {
      bg: "secondary.800",
    },
  },
  item: {
    // this will style the MenuItem and MenuItemOption components
    //color: 'gray.200',
    bg: "secondary.200",
    _dark: {
      bg: "secondary.800",
    },
  },
});
// export the base styles in the component theme
export const menuTheme = defineMultiStyleConfig({ baseStyle });

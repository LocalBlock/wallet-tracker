import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

import { tagTheme } from "./tag";
import { buttonTheme } from "./button";
import { cardTheme } from "./card";
import { menuTheme } from "./menu";
import { linkTheme } from "./link";

// Customize config for color mode
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

// Customize colors
const colors = {
  primary: {
    50: "#eff7e7",
    100: "#d7e5cb",
    200: "#bfd3ab",
    300: "#a6c28b",
    400: "#8cb16a",
    500: "#739750",
    600: "#59753e",
    700: "#3f542c",
    800: "#253218",
    900: "#0a1201",
  },
  secondary: {
    50: "#e6f0ff",
    100: "#bdd3f4",
    200: "#94b5ea",
    300: "#6a97e1",
    400: "#427ad9",
    500: "#2b60c0",
    600: "#204b96",
    700: "#16356b",
    800: "#0b2042",
    900: "#010b1a",
  },
};

//Customize semanticTokens
const semanticTokens = {
  colors: {
    "chakra-body-bg": { _light: "secondary.50", _dark: "secondary.700" }, // override Body background color
  },
};

// 3. extend the theme
const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  components: {
    Button: buttonTheme,
    Tag: tagTheme,
    Card: cardTheme,
    Menu: menuTheme,
    Link: linkTheme,
  },
});

export default theme;

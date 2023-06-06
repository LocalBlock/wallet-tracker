// theme.ts

// 1. import `extendTheme` function
import { createMultiStyleConfigHelpers, extendTheme, type ThemeConfig } from "@chakra-ui/react";
import { defineStyle, defineStyleConfig } from "@chakra-ui/react";
import { tagAnatomy } from '@chakra-ui/anatomy'
// 2. Add your color mode config
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};


// Icon button pour le chain selector
// Add a new variant
const IconButtonDesactived = defineStyle({
  background: "gray.500",

  filter: "grayscale(1) opacity(0.5)",

  // let's also provide dark mode alternatives
  _dark: {
    background: "gray.400",
  },
  _hover:{
    filter:"none"
  },
});

const IconButtonActived = defineStyle({
  background: "cyan.600",

  //filter: "grayscale(1) opacity(0.5)",

  // let's also provide dark mode alternatives
  _dark: {
    background: "cyan.700",
  },
  _hover:{
    filter: "opacity(0.8)",
  },

});


const buttonTheme = defineStyleConfig({
  variants: { IconButtonDesactived,IconButtonActived },
});


// Variant pour les tag

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(tagAnatomy.keys)

const ethereum = definePartsStyle({
  container: {
    bg: '#627eea',
    color: 'whiteAlpha.900',
  },
})

const polygon = definePartsStyle({
  container: {
    bg: '#843adc',
    color: 'whiteAlpha.900',
  },
})

export const tagTheme = defineMultiStyleConfig({
  variants: {
    ethereum: ethereum,
    "polygon-pos": polygon,
  },
})

// 3. extend the theme
const theme = extendTheme({ config, components: { Button: buttonTheme, Tag: tagTheme } });

export default theme;



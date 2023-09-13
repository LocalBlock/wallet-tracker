import { defineStyleConfig } from "@chakra-ui/react";

export const linkTheme = defineStyleConfig({
  variants: {
    navLink: {
      px: "8px",
      py: "2px",
      borderRadius: "5px",
      transitionDuration: "0.5s",
      _hover: {
        textDecoration: "none",
        backgroundColor: "secondary.100",
        _dark: {
          backgroundColor: "secondary.500",
        },
      },
    },
  },
});

import { Box } from "@chakra-ui/layout";
import React from "react";

export default function About() {
  console.log("[Render] About");
  return (
    <Box>
      <div>Version : v{import.meta.env.VITE_REACT_APP_VERSION}</div>
    </Box>
  );
}

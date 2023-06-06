import { Link, Text } from "@chakra-ui/react";
import React from "react";

export default function NavLink({ children,}: { children: string }) {
  
  return (
    <Link>
      <Text display={"block"}>{children}</Text>
    </Link>
  );
}

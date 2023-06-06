import React, { useState } from "react";
import { Flex } from "@chakra-ui/react";
import Logo from "./Logo";
import NavLinks from "./NavLinks";
import NavToggle from "./NavToggle";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);
  
  return (
    <Flex
      as={"header"}
      w={"100%"}
      justifyContent={"space-between"}
      wrap={'wrap'}
      position={"sticky"}
      //bg={'pink.300'}
      zIndex={50}
      top={0}
      //height={'100px'}
    >
      <Logo />
      <NavToggle isOpen={isOpen} onToggle={toggle} />
      <NavLinks isOpen={isOpen}/>
      
    </Flex>
  );
}

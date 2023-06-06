import React from 'react'
import { Box } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark,faBurger } from "@fortawesome/free-solid-svg-icons";

interface NavToggleProps{
    isOpen:boolean;
    onToggle:()=>void;
}

export default function NavToggle({isOpen,onToggle}:NavToggleProps) {
  return (
    <Box display={{ base: "block", md: "none" }} onClick={onToggle}>
      {isOpen ? <FontAwesomeIcon icon={faXmark} /> : <FontAwesomeIcon icon={faBurger} />}
    </Box>
  )
}

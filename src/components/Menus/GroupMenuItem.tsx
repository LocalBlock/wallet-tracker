import { Box, Flex, MenuItem } from "@chakra-ui/react";
import React from "react";
import ModalRemove from "./ModalRemove";
import GroupModal from "./GroupModal";


interface MenuItemGroupProps {
  groupName: string;
  onCloseMenu: () => void;
}


export default function GroupMenuItem({
  groupName,
  onCloseMenu,
}: MenuItemGroupProps) {


  return (
    <MenuItem
      as={Box}
      justifyContent={"space-between"}
      closeOnSelect={false} //Desactive close behavior
    >
      {groupName}
      <Flex gap={1}>
        <GroupModal action='Edit' groupNameEdit={groupName} onCloseMenu={onCloseMenu}/>
        <ModalRemove
          onCloseMenu={onCloseMenu}
          groupName={groupName}
          alertHeader="Remove Group"
          alertBody={`Do you want to remove this group : <b>${groupName}</b> ?`}
        />
      </Flex>
    </MenuItem>
  );
}

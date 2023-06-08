import { Flex } from '@chakra-ui/react';
import React from 'react'
import GroupModal from './GroupModal';
import ModalRemove from './ModalRemove';

interface Props {
    groupName: string;

  }

export default function GroupItem({groupName}:Props) {
  return (
    <Flex justifyContent={"space-between"} gap={5} alignItems={"center"}>
    {groupName}
    <Flex gap={1}>
      <GroupModal action='Edit' groupNameEdit={groupName} 
      />
      <ModalRemove
        groupName={groupName}
        alertHeader="Remove Group"
        alertBody={`Do you want to remove this group : <b>${groupName}</b> ?`}
      />
    </Flex>
  </Flex>
  )
}

import {
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormHelperText,
  FormLabel,
  Stack,
} from "@chakra-ui/react";
import React from "react";

type Props ={
    defaultValue:string[]
    wallets:{id:string,displayName:string}[]
    onChangeCheckbox:React.Dispatch<string[]>
}

export default function GroupCheckbox({defaultValue,wallets,onChangeCheckbox}:Props) {

  return (
    <FormControl as={"fieldset"}>
      <FormLabel as={"legend"}>Group&apos;s addresses</FormLabel>
      <CheckboxGroup
        colorScheme="green"
        onChange={onChangeCheckbox}
        defaultValue={defaultValue}
      >
        <Stack
          spacing={0}
          direction={["column", "row"]}
          wrap={"wrap"}
          columnGap={6}
          rowGap={2}
        >
          {wallets.map((wallet) => (
            <Checkbox id={wallet.id} key={wallet.id} value={wallet.id}>
              {wallet.displayName}
            </Checkbox>
          ))}
        </Stack>
      </CheckboxGroup>
      <FormHelperText>Select one or more addresses</FormHelperText>
    </FormControl>
  );
}

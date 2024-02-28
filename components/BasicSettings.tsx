import { updateSelectedCurrency } from "@/app/actions/user";
import { appSettings } from "@/app/appSettings";
import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  Select,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";

type Props = {
  currency: string;
};

export default function BasicSettings({ currency }: Props) {
  const queryClient = useQueryClient();
  const mutationCurrency = useMutation({
    mutationFn: updateSelectedCurrency,
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
  });
  return (
    <Box padding={4} borderWidth="2px" borderRadius="lg">
      <FormControl>
        <FormLabel>Currency</FormLabel>
        <Select
          name="currency"
          onChange={(e) => {
            mutationCurrency.mutateAsync(e.target.value);
          }}
          width={"fit-content"}
          defaultValue={currency}
        >
          {appSettings.currencies.map((currency) => (
            <option key={currency.id} value={currency.id}>
              {currency.symbol + " " + currency.name}
            </option>
          ))}
        </Select>
        <FormHelperText>Currency to display</FormHelperText>
      </FormControl>
    </Box>
  );
}

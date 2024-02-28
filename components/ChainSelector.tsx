import React from "react";
import { ButtonGroup, IconButton } from "@chakra-ui/react";
import { appSettings } from "@/app/appSettings";
import Image from "next/image";
import { updateSelectedChains } from "@/app/actions/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ChainSelector({
  selectedChains,
}: {
  selectedChains: string[];
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateSelectedChains,
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
  });

  const handleClick = async (chain: string) => {
    if (selectedChains.length != 1 || !selectedChains.includes(chain)) {
      let newSelectedChains: string[];
      if (selectedChains.includes(chain))
        newSelectedChains = selectedChains.filter(
          (element) => element != chain
        );
      //Remove Chain
      else newSelectedChains = [...selectedChains, chain]; //Add Chain
      // Mutate!
      mutation.mutate(newSelectedChains);
    }
  };

  return (
    <ButtonGroup>
      {appSettings.chains.map((chain) => {
        return (
          <IconButton
            key={chain.id}
            onClick={() => handleClick(chain.id)}
            filter={
              selectedChains.includes(chain.id)
                ? undefined
                : "grayscale(1) opacity(0.6)"
            }
            _hover={
              selectedChains.includes(chain.id) ? undefined : { filter: "none" }
            }
            aria-label={chain.name}
            icon={
              <Image
                src={"/" + chain.image}
                alt={chain.name}
                width={25}
                height={25}
              />
            }
          />
        );
      })}
    </ButtonGroup>
  );
}

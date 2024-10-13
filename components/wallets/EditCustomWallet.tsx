import {
  Box,
  Button,
  Flex,
  Image,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tooltip,
  VStack,
  useDisclosure,
  NumberInput,
  NumberInputField,
  Divider,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import AddCoinForm, { AddCoin } from "./AddCoinForm";
import { createCoinData, getCoinsData } from "@/app/actions/coinData";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateCustomWallet } from "@/app/actions/wallet";
import { CustomWallet } from "@prisma/client";

interface Props {
  wallet:CustomWallet
}

export type CoinList = {
  image: string;
  name: string;
  symbol: string;
} & CustomWallet["coins"][number];

export default function EditCustomWallet({ wallet}: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data: coinsData } = useQuery({
    queryKey: ["coinsData"],
    queryFn: () => getCoinsData(),
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateCustomWallet,
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
    },
  });

  const mutationCoinsData = useMutation({
    mutationFn: createCoinData,
    onSuccess: (data) => {
      queryClient.setQueryData(["coinsData"], data);
    },
  });


  const initialCoinList = wallet.coins.map((coin) => {
    const data = coinsData!.find((coinD) => coinD.id === coin.coinDataId)!;
    return {
      balance: coin.balance,
      coinDataId: coin.coinDataId,
      image: data.image,
      name: data.name,
      symbol: data.symbol,
    };
  });

  const [coinList, setCoinlist] = useState<CoinList[]>(initialCoinList);

  const handleSubmit = async () => {
    // check if new Coindata
    const coinIds = coinList.map((cl) => cl.coinDataId);
    const coinIdsDataToCreate = coinIds.filter(
      (id) => !coinsData?.map((cd) => cd.id).includes(id)
    );
    if (coinIdsDataToCreate.length != 0) {
      // Create coinsData and mutate
      await mutationCoinsData.mutateAsync(coinIdsDataToCreate);
    }

    // Mutata customWallet
    await mutation.mutateAsync({
      walletId:wallet.id,
      coins: coinList.map((cl) => {
        return { balance: cl.balance, coinDataId: cl.coinDataId };
      }),
    });

    onClose();
    //refetch();
  };

  const handleAddCoin = (newCoin: AddCoin) => {
    setCoinlist([
      ...coinList,
      {
        coinDataId: newCoin.id,
        balance: newCoin.amount,
        name: newCoin.name,
        symbol: newCoin.symbol,
        image: newCoin.large,
      },
    ]);
  };

  const updateCoinBalance = (coinId: string, balance: string) => {
    const updatedCoinlist = coinList.map((coin) => {
      if (coin.coinDataId === coinId) {
        return { ...coin, balance, needUpdate: true };
      } else return coin;
    });
    setCoinlist(updatedCoinlist);
  };

  const removeCoin = (coinId: string) => {
    setCoinlist(coinList.filter((coin) => coin.coinDataId != coinId));
  };

  return (
    <>
      <Tooltip label="Edit" openDelay={500}>
        <IconButton
          aria-label="edit"
          size={"sm"}
          icon={<FaEdit />}
          onClick={onOpen}
        />
      </Tooltip>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setCoinlist(initialCoinList);
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Wallet : {wallet.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch">
              {coinList.map((coin) => (
                <Flex
                  key={coin.coinDataId}
                  alignItems={"center"}
                  justifyContent={"space-between"}
                >
                  <Flex gap={3} alignItems={"center"}>
                    <Image boxSize="50px" src={coin.image} alt={coin.name} />
                    <Box>
                      <Text as="b" fontSize="lg">
                        {coin.name}
                      </Text>
                      <Text fontSize={"sm"}>{coin.symbol.toUpperCase()}</Text>
                    </Box>
                  </Flex>
                  <Flex gap={1}>
                    <NumberInput
                      maxWidth={150}
                      defaultValue={coin.balance}
                      onChange={(valueString) =>
                        updateCoinBalance(coin.coinDataId, valueString)
                      }
                    >
                      <NumberInputField
                        name={coin.coinDataId + "_amount"}
                        placeholder="Amount"
                        paddingInlineEnd={"var(--chakra-space-4)"}
                      />
                    </NumberInput>
                    <IconButton
                      aria-label="Remove"
                      colorScheme="red"
                      //size={"sm"}
                      icon={<FaTrash />}
                      onClick={() => removeCoin(coin.coinDataId)}
                    />
                  </Flex>
                </Flex>
              ))}
              <Divider />
              <AddCoinForm onAddCoin={handleAddCoin} coinlist={coinList} />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              mr={3}
              onClick={() => {
                onClose();
                setCoinlist(initialCoinList);
              }}
            >
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

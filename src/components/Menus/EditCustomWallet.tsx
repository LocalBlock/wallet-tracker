import {
  Box,
  Button,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tooltip,
  useDisclosure,
  Image,
  Flex,
  Text,
  VStack,
  Divider,
  NumberInput,
  NumberInputField,
  FormControl,
  FormLabel,
  FormHelperText,
} from "@chakra-ui/react";
import {

  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useContext, useState } from "react";
import { AllWalletContext } from "../../contexts/AllWalletContext";
import AddCoinForm, { AddCoin } from "./AddCoinForm";
import { CustomWallet } from "../../classes/Wallet";
import { Coin } from "../../classes/Coin";
import { getAllWallet } from "../../functions/localstorage";

interface EditCustomWalletProps {
  walletId: string;
}

export default function EditCustomWallet({
  walletId,
}: EditCustomWalletProps) {
  const { allWallet,setAllWallet } = useContext(AllWalletContext);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const currentWallet = allWallet.find(
    (wallet) => wallet.id === walletId
  ) as CustomWallet;
  
  const [coinList, setCoinlist] = useState<Coin[]>([...currentWallet.coins]);


  const handleSubmit = async() => {
    console.log(currentWallet.coins,coinList)
    currentWallet.coins=coinList
    await currentWallet.fetchData(true)
    //currentWallet.updateWallet()
    setCoinlist([...currentWallet.coins])
    onClose()
    setAllWallet(getAllWallet())
  };

  const handleAddCoin = (coinData: AddCoin) => {
    setCoinlist([...coinList, new Coin(coinData.id,coinData.name,coinData.symbol,coinData.large,coinData.amount)]);
  };

  const updateCoinBalance=(coinId:string,balance:string)=>{
    const updatedCoinlist= coinList.map(coin=>{
      if (coin.id===coinId){
        return new Coin(coin.id,coin.name,coin.symbol,coin.image,balance)
      }
      else
      return coin
    })
    setCoinlist(updatedCoinlist)
  }
  const removeCoin=(coinId:string)=>{
    setCoinlist(coinList.filter(coin=>coin.id!=coinId))
  }
  //console.log("render editwallet", coinList);
  return (
    <>
      <Tooltip label="Edit" openDelay={500}>
        <IconButton
          aria-label="edit"
          size={"sm"}
          icon={<FontAwesomeIcon icon={faEdit} />}
          onClick={() => {
            //onCloseMenu(); // Close Menu
            onOpen();
          }}
        />
      </Tooltip>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Wallet : {currentWallet.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch">
              {coinList.map((token) => (
                <Flex key={token.id} alignItems={"center"} justifyContent={"space-between"}>
                  <Flex gap={3} alignItems={"center"}>
                    <Image boxSize="50px" src={token.image} alt={token.name} />
                    <Box>
                      <Text as="b" fontSize="lg">
                        {token.name}
                      </Text>
                      <Text fontSize={"sm"}>{token.symbol.toUpperCase()}</Text>
                    </Box>
                  </Flex>
                  <Flex gap={1}>
                    <NumberInput
                      maxWidth={150}
                      defaultValue={token.balance}
                      onChange={(valueString) => updateCoinBalance(token.id,valueString)}
                    >
                      <NumberInputField
                        placeholder="Amount"
                        paddingInlineEnd={"var(--chakra-space-4)"}
                      />
                    </NumberInput>

                    <IconButton
                      aria-label="Remove"
                      colorScheme="red"
                      //size={"sm"}
                      icon={<FontAwesomeIcon icon={faTrash} />}
                      onClick={()=>removeCoin(token.id)}
                    />
                  </Flex>
                </Flex>
              ))}
              <Divider />
              <FormControl>
                <FormLabel>Add Coin</FormLabel>
              <AddCoinForm onAddCoin={handleAddCoin} coinlist={coinList} />
              <FormHelperText>You can add any supported coin by CoinGecko</FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

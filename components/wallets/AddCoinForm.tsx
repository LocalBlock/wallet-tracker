import { useEffect, useState } from "react";
import {
  Input,
  Box,
  UnorderedList,
  ListItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Text,
  Image,
  Flex,
  InputGroup,
  InputLeftElement,
  IconButton,
  NumberInput,
  NumberInputField,
  useToast,
  Tooltip,
  FormControl,
  FormHelperText,
  FormLabel,
} from "@chakra-ui/react";
import { FaEdit } from "react-icons/fa";
import { FaMagnifyingGlass, FaPlus } from "react-icons/fa6";
import { SearchResultApi } from "@/types";
import { search } from "@/lib/coingecko";
import { CoinList } from "./EditCustomWallet";

export type AddCoin = SearchResultApi["coins"][number] & { amount: string };

interface Props {
  onAddCoin: (coin: AddCoin) => void;
  coinlist: CoinList[];
}

export default function AddCoinForm({ onAddCoin, coinlist }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResultApi["coins"]>([]);
  const [selectedCoin, setSelectedCoin] = useState<
    SearchResultApi["coins"][number]
  >({
    id: "",
    name: "",
    api_symbol: "",
    symbol: "",
    market_cap_rank: 0,
    thumb: "",
    large: "",
  });
  const [coinAmount, setCoinAmount] = useState("");
  const [editMode, setEditMode] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();

  /** Type of icon on plusButton : with or whithout beat animation */
  const plusIconButton =
    coinAmount && selectedCoin.id && !editMode ? <FaPlus /> : <FaPlus />;

  // Fonction pour gérer le changement de valeur de l'entrée
  const handleChangeSearchInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInputValue(event.target.value);
    setIsOpen(true);
  };

  // Fonction pour gérer la sélection d'une suggestion
  const handleSelect = (coin: typeof selectedCoin) => {
    setInputValue("");
    setEditMode(false);
    setSelectedCoin(coin);
    setSuggestions([]);
  };
  const handleAdd = () => {
    if (coinlist.some((coin) => coin.coinDataId === selectedCoin.id)) {
      toast({
        description: selectedCoin.name + " already exist in wallet",
        status: "warning",
        position: "top",
        duration: 9000,
        isClosable: true,
      });
    } else {
      onAddCoin({
        id: selectedCoin.id,
        name: selectedCoin.name,
        api_symbol: selectedCoin.api_symbol,
        symbol: selectedCoin.symbol,
        market_cap_rank: selectedCoin.market_cap_rank,
        thumb: selectedCoin.thumb,
        large: selectedCoin.large,
        amount: coinAmount,
      });
      setEditMode(true);
      setCoinAmount("");
    }
  };

  useEffect(() => {
    let timeoutID: number;
    if (inputValue.length > 2) {
      timeoutID = window.setTimeout(async () => {
        const result = await search(inputValue);
        setSuggestions(result.coins);
      }, 1000);
    }
    // Cleanup function
    return () => {
      clearTimeout(timeoutID);
    };
  }, [inputValue]);

  return (
    <FormControl>
      <FormLabel as={"legend"}>Add Coin</FormLabel>
      <Flex
        width={"100%"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Box>
          <Popover isOpen={isOpen} autoFocus={false}>
            <PopoverTrigger>
              <Box>
                <InputGroup hidden={editMode ? false : true}>
                  <InputLeftElement pointerEvents="none">
                    <FaMagnifyingGlass />
                  </InputLeftElement>
                  <Input
                    id="searchCoin"
                    value={inputValue}
                    onChange={handleChangeSearchInput}
                    placeholder="Search coin"
                  />
                </InputGroup>
                <Flex
                  gap={2}
                  alignItems={"center"}
                  hidden={editMode ? true : false}
                >
                  <Image
                    boxSize="50px"
                    src={selectedCoin.large}
                    alt={selectedCoin.name}
                  />
                  <Flex direction={"column"}>
                    <Text as="b" fontSize="lg">
                      {selectedCoin.name}
                    </Text>
                    <Text fontSize={"sm"}>
                      {selectedCoin.symbol + " "}
                      <IconButton
                        aria-label={"edit"}
                        icon={<FaEdit />}
                        size={"xs"}
                        onClick={() => setEditMode(true)}
                      />
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </PopoverTrigger>
            <PopoverContent width="100%">
              <PopoverBody p={0}>
                {suggestions.length > 0 && (
                  <UnorderedList mt={2} overflow={"auto"} maxHeight={200}>
                    {suggestions.map((item) => (
                      <ListItem
                        key={item.id}
                        cursor="pointer"
                        onClick={() => {
                          handleSelect(item);
                        }}
                        listStyleType="none"
                        _hover={{ backgroundColor: "gray.200" }}
                      >
                        <Flex gap={2}>
                          <Image src={item.thumb} alt={item.name} /> {item.name}{" "}
                          ({item.symbol})
                        </Flex>
                      </ListItem>
                    ))}
                  </UnorderedList>
                )}
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </Box>
        <Flex gap={1}>
          <NumberInput
            id="amount"
            maxWidth={150}
            onChange={(valueString) => setCoinAmount(valueString)}
            value={coinAmount}
          >
            <NumberInputField
              placeholder="Amount"
              paddingInlineEnd={"var(--chakra-space-4)"}
            />
          </NumberInput>
          <Tooltip label="Add coin to wallet">
            <IconButton
              colorScheme="blue"
              aria-label={"add"}
              icon={plusIconButton}
              onClick={handleAdd}
              isDisabled={
                coinAmount === "" || selectedCoin.id === "" || editMode
              }
            />
          </Tooltip>
        </Flex>
      </Flex>
      <FormHelperText>
        You can add any supported coin by CoinGecko
      </FormHelperText>
    </FormControl>
  );
}

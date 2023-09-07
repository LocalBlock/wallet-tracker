import React, { useEffect, useState } from "react";
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
} from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faMagnifyingGlass,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Coin } from "../../classes/Coin";

type SearchResultApi = {
  coins: {
    id: string;
    name: string;
    api_symbol: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    large: string;
  }[];
  exchanges: {
    id: string;
    name: string;
    market_type: string;
    thumb: string;
    large: string;
  }[];
  icos: [];
  categories: { id: number; name: string }[];
  nfts: { id: string; name: string; symbol: string; thumb: string }[];
};

export type AddCoin = SearchResultApi["coins"][number] & { amount: string };

interface Props {
  onAddCoin: (coin: AddCoin) => void;
  coinlist: Coin[];
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
    coinAmount && selectedCoin.id ? (
      <FontAwesomeIcon icon={faPlus} beat />
    ) : (
      <FontAwesomeIcon icon={faPlus} />
    );

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
    if (coinlist.some((coin) => coin.id === selectedCoin.id)) {
      toast({
        //title: 'Account created.',
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

  async function search(query: string) {
    const url = `https://api.coingecko.com/api/v3/search?query=${query}`;
    const r = await fetch(url, {
      headers: {
        accept: "application/json",
      },
    });
    if (r.ok) {
      return r.json() as Promise<SearchResultApi>;
    }
    throw new Error("Coingecko response not OK");
  }

  useEffect(() => {
    console.log("useEffect search");
    let timeoutID: number;
    if (inputValue.length > 2) {
      timeoutID = window.setTimeout(async () => {
        console.log("Search : " + inputValue);
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
    <Flex width={"100%"} justifyContent={"space-between"} alignItems={"center"}>
      <Box>
        <Popover isOpen={isOpen} autoFocus={false}>
          <PopoverTrigger>
            <Box>
              <InputGroup hidden={editMode ? false : true}>
                <InputLeftElement pointerEvents="none">
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </InputLeftElement>
                <Input
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
                      icon={<FontAwesomeIcon icon={faEdit} />}
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
                        <Image src={item.thumb} /> {item.name} ({item.symbol})
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
            aria-label={"add"}
            icon={plusIconButton}
            onClick={handleAdd}
            isDisabled={coinAmount === "" || selectedCoin.id === ""}
          />
        </Tooltip>
      </Flex>
    </Flex>
  );
}

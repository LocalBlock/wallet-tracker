import { Box, Image, Text } from '@chakra-ui/react'
import React from 'react'

export default function Logo() {
  return (
    <Box bgColor={'Highlight'} display={'flex'}>

        <Image src='Logo.svg'/>
        <Text>Mon Super site Powered by CoinGecko</Text>
    </Box>
  )
}

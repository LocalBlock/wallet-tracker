import { Box } from '@chakra-ui/layout'
import { Button } from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'

import { socket } from '../socket';




export default function About() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    //const [fooEvents, setFooEvents] = useState<string[]>([]);
    useEffect(() => {
        console.log("useEffect WebSocket");
        function onConnect() {
          setIsConnected(true);
        }
    
        function onDisconnect() {
          setIsConnected(false);
        }
    
        function onNotification(value:string) {
            console.log(JSON.parse(value));
          //setFooEvents(previous => [...previous, value]);
        }
    
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('notification', onNotification);
    
        return () => {
          socket.off('connect', onConnect);
          socket.off('disconnect', onDisconnect);
          socket.off('notification', onNotification);
        };
      }, []);
  return (
    <Box>
      <div>Version : v{import.meta.env.VITE_REACT_APP_VERSION}</div>
      <div>Connecté: {isConnected?"oui":"non"}</div>
      <div>APIKEY :{import.meta.env.VITE_APIKEY_ALCHEMY}</div>
      <Button onClick={()=>socket.disconnect()}>Test</Button>
    </Box>
  )
}



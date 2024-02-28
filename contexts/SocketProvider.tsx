"use client";
import { getUserData } from "@/app/actions/user";
import { useQuery } from "@tanstack/react-query";
import { createContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

export const SocketContext = createContext<Socket | undefined>(undefined);

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [socket, setSocket] = useState<Socket>();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });

  useEffect(() => {
    if (user?.address) {
      console.log("Initialize Socket for user");
      const socketInstance = io({
        path: "/api/socket/io",
        auth: { userAddress: user.address },
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user?.address]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

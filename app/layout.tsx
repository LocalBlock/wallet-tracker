import type { Metadata } from "next";
import { Providers } from "./providers";
import Navbar from "@/components/navbar/Navbar";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { getUserData } from "./actions/user";
import { getCoinsData } from "./actions/coinData";
import SocketProvider from "@/contexts/SocketProvider";
import Notifications from "@/components/Notifications";
import { cookieToInitialState } from "wagmi";
import { headers } from "next/headers";
import { getConfig } from "./wagmi";

export const metadata: Metadata = {
  title: "Wallet Tracker",
  description: "Track your crypto assets",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["user"],
    queryFn: () => getUserData(),
  });

  await queryClient.prefetchQuery({
    queryKey: ["coinsData"],
    queryFn: () => getCoinsData(),
  });

  // Get environment variable from server to pass to wagmi provider context
  // This is tricky solution te get env var on client side at runtime with a builded docker image 
  const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECTID;

  const initialState = cookieToInitialState(
    getConfig(wcProjectId),
    headers().get("cookie")
  );

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <Providers initialState={initialState} wcProjectId={wcProjectId}>
          <HydrationBoundary state={dehydrate(queryClient)}>
            {/* Need to put socket provider AFTER hydratation boundary to get prefetch user in provider */}
            <SocketProvider>
              <Notifications />
              <Navbar />
              <main>{children}</main>
            </SocketProvider>
          </HydrationBoundary>
        </Providers>
      </body>
    </html>
  );
}

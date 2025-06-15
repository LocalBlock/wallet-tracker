import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import { fetchTokensBalance } from "@/lib/alchemy";
import { appSettings } from "@/app/appSettings";


export type BalanceAPIResult = {
  address: string;
  nativeTokens: {
    balance: string;
    coinDataId: string;
    chain: (typeof appSettings)["chains"][number]["id"];
  }[];
  tokens: {
    balance: string;
    contractAddress: string;
    chain: (typeof appSettings)["chains"][number]["id"];
    coinDataId: string | undefined;
  }[];
}[];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const addresses = searchParams.get("addresses");

  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (!session.isLoggedIn) {
    return NextResponse.json<Error>(
      {
        name: "Unauthorized",
        message: "User not logged in",
      },
      {
        status: 401,
      }
    );
  }
  if (!addresses) {
    return NextResponse.json<Error>(
      { name: "Parameter error", message: "Missing addresses" },
      {
        status: 400,
      }
    );
  }
  try {
    console.group("[Fetch Balance] : " + addresses);
    const tokens = await fetchTokensBalance(addresses.split(","));
    console.groupEnd();
    return NextResponse.json(tokens);
  } catch (error: any) {
    const alchemyError = error as Error;

    return NextResponse.json<Error>(
      {
        name: "Balance error",
        message: alchemyError.message,
        cause: alchemyError.cause,
      },
      { status: 500 }
    );
  }
}

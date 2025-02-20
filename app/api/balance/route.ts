import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import { appSettings } from "@/app/appSettings";
import { fetchNativeBalance, fetchTokensBalance } from "@/lib/alchemy";

//export const dynamic = 'force-static' // caching

export type BalanceAPIResult = {
  nativeTokens: Awaited<ReturnType<typeof fetchNativeBalance>>[];
  tokens: Awaited<ReturnType<typeof fetchTokensBalance>>;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");

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
  if (!address) {
    return NextResponse.json<Error>(
      { name: "Parameter error", message: "Missing address" },
      {
        status: 400,
      }
    );
  }
  try {
    const newNativeTokens: BalanceAPIResult["nativeTokens"] = [];
    const newTokens: BalanceAPIResult["tokens"] = [];
    console.group("[Fetch balances] : " + address);
    // For each chains in appsettings
    for await (const chain of appSettings.chains) {
      console.group(chain.name);
      // Native balance
      const nativeToken = await fetchNativeBalance(address, chain);
      // Tokens
      const tokensBalance = await fetchTokensBalance(address, chain);
      console.groupEnd();
      // Merge result between chain
      newNativeTokens.push(nativeToken);
      newTokens.push(...tokensBalance);
    }
    console.groupEnd();

    return NextResponse.json<BalanceAPIResult>({
      nativeTokens: newNativeTokens,
      tokens: newTokens,
    });
  } catch (error: any) {
    const alchemyError = error as Error;
    console.groupEnd();
    console.groupEnd();

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

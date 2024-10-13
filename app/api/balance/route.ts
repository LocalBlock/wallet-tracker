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

  // @ts-ignore for cookies()
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
    let newTokens: BalanceAPIResult["tokens"] = [];
    // For each chains in appsettings
    for await (const chain of appSettings.chains) {
      // Native balance
      const nativeToken = await fetchNativeBalance(address, chain);
      // Tokens
      const tokensBalance = await fetchTokensBalance(address, chain);

      // Merge result between chain
      newNativeTokens.push(nativeToken);
      newTokens.push(...tokensBalance);
    }

    return NextResponse.json<BalanceAPIResult>({
      nativeTokens: newNativeTokens,
      tokens: newTokens,
    });
  } catch (error: any) {
    // Catch all no 2xx errors from alchemy sdk
    const alchemyError = JSON.parse(error.body);
    console.log(alchemyError);

    return NextResponse.json<Error>(
      {
        name: "Alchemy fetch error",
        message: alchemyError.error.message,
      },
      { status: error.status }
    );
  }
}

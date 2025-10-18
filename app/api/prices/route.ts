import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import { fetchCoinsMarket, fetchCoinsPrice } from "@/lib/coingecko";

export type PricesAPIResult = {
  dataMarket: Awaited<ReturnType<typeof fetchCoinsMarket>>;
  dataPrice: Awaited<ReturnType<typeof fetchCoinsPrice>>;
};

export async function POST(request: NextRequest) {
  const coinIds = (await request.json()) as string[];
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
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
  try {
    // Fetch Market
    const newDataMarket = await fetchCoinsMarket(coinIds);
    //Fetch price
    const newDataPrice = await fetchCoinsPrice(coinIds);

    return NextResponse.json<PricesAPIResult>({
      dataMarket: newDataMarket,
      dataPrice: newDataPrice,
    });
  } catch (error: unknown) {
    if (error instanceof Error){

      console.log(error.message);
      return NextResponse.json<Error>(
        { name: "Prices fetch error", message: error.message },
        { status: 500 }
      );
    }
  }
}

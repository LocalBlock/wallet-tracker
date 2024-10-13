import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import { fetchAavePools, fetchAaveSafetyModule } from "@/lib/aave";
import { type ReadContractErrorType } from "@wagmi/core";

export type AaveAPIResult = {
  safetyModule: Awaited<ReturnType<typeof fetchAaveSafetyModule>>;
  aavePools: Awaited<ReturnType<typeof fetchAavePools>>;
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
    console.log("[Fetch] Aave Safety Module");
    // Aave Safety Module
    const safetyModule = await fetchAaveSafetyModule(address);

    // Aave Pools
    console.log("[Fetch] Aave Pools");
    const aavePools = await fetchAavePools(address);

    return NextResponse.json<AaveAPIResult>({
      safetyModule,
      aavePools,
    });
  } catch (e: any) {
    if (e.name === "Error") {
      //Standard Error
      const error = e as Error;
      console.log(error.message);
      return NextResponse.json<Error>(
        { name: "Aave fetch error", message: error.message },
        { status: 500 }
      );
    } else {
      // Viem Error
      const error = e as ReadContractErrorType;
      return NextResponse.json<Error>(
        {
          name: "Aave fetch error",
          message: error.shortMessage,
          cause: error.message,
        },
        { status: 500 }
      );
    }
  }
}

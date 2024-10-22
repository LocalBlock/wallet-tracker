import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import { fetchAavePools, fetchAaveSafetyModule } from "@/lib/aave";

export type AaveAPIResult = {
  safetyModule: Awaited<ReturnType<typeof fetchAaveSafetyModule>>;
  aavePools: Awaited<ReturnType<typeof fetchAavePools>>;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");

  // @ts-expect-error for cookies()
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
    console.group("[Fetch Aave] : " + address);
    console.group("Aave Safety Module");
    // Aave Safety Module
    const safetyModule = await fetchAaveSafetyModule(address);
    console.groupEnd();
    console.group("Aave Pools");
    // Aave Pools
    const aavePools = await fetchAavePools(address);
    console.groupEnd();
    console.groupEnd();
    return NextResponse.json<AaveAPIResult>({
      safetyModule,
      aavePools,
    });
  } catch (error: any) {
    console.groupEnd();
    console.groupEnd();
    return NextResponse.json<Error>(
      { name: "Aave fetch error", message: error.message, cause: error.cause },
      { status: 500 }
    );
  }
}

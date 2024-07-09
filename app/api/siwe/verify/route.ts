import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/app/session";
import { verifySiweMessage } from "viem/siwe";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export async function POST(request: NextRequest) {
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  // Request Body
  const { message, signature } = (await request.json()) as {
    message: string;
    signature: `0x${string}`;
  };

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  // Verify SIWE message
  const isValid = await verifySiweMessage(publicClient, {
    message,
    signature,
    nonce: session.nonce,
  });

  return Response.json(isValid);
}

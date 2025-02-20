import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import { generateSiweNonce } from "viem/siwe";

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  // Generate Nonce
  session.nonce = generateSiweNonce();
  // Save in session
  await session.save();
  return new Response(session.nonce);
}

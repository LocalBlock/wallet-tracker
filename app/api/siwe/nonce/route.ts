import { cookies } from "next/headers";
import { getIronSession} from "iron-session";
import { SessionData, sessionOptions } from "@/app/session";
import { generateNonce } from "siwe";

export async function GET() {
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  // Generate Nonce
  session.nonce = generateNonce();
  // Save in session
  await session.save();
  return new Response(session.nonce);
}

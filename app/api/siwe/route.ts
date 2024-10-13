import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { defaultSession, sessionOptions, SessionData } from "@/app/session";
import { db } from "@/lib/db";
import { verifySiweMessage, parseSiweMessage } from "viem/siwe";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

// login
export async function POST(request: NextRequest) {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  const { message, signature } = (await request.json()) as {
    message: string;
    signature: `0x${string}`;
  };

  try {
    const parsedMessage = parseSiweMessage(message);

    // Verifiy SIWE Message
    const isValid = await verifySiweMessage(
      createPublicClient({
        chain: mainnet,
        transport: http(),
      }),
      {
        message,
        signature,
        nonce: session.nonce,
      }
    );

    // Return unchanged session if not valid
    if (!isValid) return Response.json(session);
    
    //Signature is valid, find existing user
    const user = await db.user.findUnique({
      where: { address: parsedMessage.address },
    });
    if (user) {
      console.log("[Authentification] Success, User exist");
    } else {
      console.log("[Authentification] Success, Create a new user");
      await db.user.create({
        data: { address: parsedMessage.address! },
      });
    }

    // Update session data
    session.isLoggedIn = true;
    session.address = parsedMessage.address!;
    await session.save();

    return Response.json(session);
  } catch (error) {
    console.log(error);
    return Response.json(error, { status: 500 });
  }
}

// read session
export async function GET() {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (session.isLoggedIn !== true) {
    return Response.json(defaultSession);
  }

  return Response.json(session);
}

// logout
export async function DELETE() {
  // @ts-expect-error for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  session.destroy();

  return Response.json(defaultSession);
}

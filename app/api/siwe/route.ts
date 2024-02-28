import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { defaultSession, sessionOptions, SessionData } from "@/app/session";
import { SiweMessage, SiweResponse } from "siwe";
import { db } from "@/lib/db";

// login
export async function POST(request: NextRequest) {
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  const { message, signature } = (await request.json()) as {
    message: SiweMessage;
    signature: string;
  };

  try {
    const siweMessage = new SiweMessage(message);
    const { data } = await siweMessage.verify({
      signature,
      nonce: session.nonce,
    });
    //Signature is valid, find existing user

    const user = await db.user.findUnique({
      where: { address: siweMessage.address },
    });
    if (user) {
      console.log("[Authentification] Success, User exist");
    } else {
      console.log("[Authentification] Success, Create a new user");
      await db.user.create({
        data: { address: siweMessage.address },
      });
    }

    // Update session data
    session.isLoggedIn = true;
    session.address = siweMessage.address;
    await session.save();

    return Response.json(session);
  } catch (error) {
    // Error is SiweResponse
    const siweResponse = error as SiweResponse;
    throw new Error(JSON.stringify(siweResponse.error));
  }
}

// read session
export async function GET() {
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (session.isLoggedIn !== true) {
    return Response.json(defaultSession);
  }

  return Response.json(session);
}

// logout
export async function DELETE() {
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  session.destroy();

  return Response.json(defaultSession);
}

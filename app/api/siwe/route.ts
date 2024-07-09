import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { defaultSession, sessionOptions, SessionData } from "@/app/session";
import { db } from "@/lib/db";

// login
export async function POST(request: NextRequest) {
  // @ts-ignore for cookies()
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  // Request Body
  const { userAddress } = (await request.json()) as {
    userAddress: string;
  };

  try {
    //Signature is valid, find existing user
    const user = await db.user.findUnique({
      where: { address: userAddress },
    });
    if (user) {
      console.log("[Authentification] Success, User exist");
    } else {
      console.log("[Authentification] Success, Create a new user");
      await db.user.create({
        data: { address: userAddress },
      });
    }

    // Update session data
    session.isLoggedIn = true;
    session.address = userAddress;
    await session.save();

    return Response.json(session);
  } catch (error) {
    console.log(error);
    return Response.json(error, { status: 500 });
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

import { SessionOptions } from "iron-session";

export interface SessionData {
  nonce: string;
  isLoggedIn: boolean;
  address: string;
}

export const defaultSession: SessionData = {
  nonce:"",
  isLoggedIn: false,
  address: "",
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD??"Not a secure password, need to set ENV data",
  cookieName: "SIWE",
  cookieOptions: {
    // secure only works in `https` environments
    // if your localhost is not on `https`, then use: `secure: process.env.NODE_ENV === "production"`
    secure: process.env.NODE_ENV === "production",
  },
};

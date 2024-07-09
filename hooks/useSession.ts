import useSWR from "swr";
import { SessionData, defaultSession } from "@/app/session";
import useSWRMutation from "swr/mutation";

const sessionApiRoute =
  "/api/siwe";

async function fetchJson<JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<JSON> {
  return fetch(input, {
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    ...init,
  }).then((res) => res.json());
}

function doLogin(url: string, { arg }: { arg: {userAddress:string} }) {
  return fetchJson<SessionData>(url, {
    method: "POST",
    body: JSON.stringify({ userAddress: arg.userAddress}),
  });
}

function doLogout(url: string) {
  return fetchJson<SessionData>(url, {
    method: "DELETE",
  });
}

export default function useSession() {
  const { data: session, isLoading } = useSWR(
    sessionApiRoute,
    fetchJson<SessionData>,
    {
      fallbackData: defaultSession,
    },
  );

  const { trigger: login } = useSWRMutation(sessionApiRoute, doLogin, {
    // the login route already provides the updated information, no need to revalidate
    // revalidate: false,  (no)
  });
  const { trigger: logout } = useSWRMutation(sessionApiRoute, doLogout);

  return { session, logout, login, isLoading };
}
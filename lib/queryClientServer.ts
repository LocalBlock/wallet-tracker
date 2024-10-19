/**
 * This is a workaround inspired from prisma troubleshooting when instantiating prisma client.
 * In local developpement context, a simple "const myObject = new Something()" don't persist, because next.js compile VERY often route handlers or other route...
 * It create a multiple instance of this object in memory and we loose data between each compile
 * Theoricaly, in production this is not needed.
 * 
 * This queryClient is used for managing cache data on server side
 * I tried to use wagmi cache time without success...
 */
import { QueryClient } from '@tanstack/react-query'
const queryClientSingleton = () => {
  return new QueryClient()
}

declare const globalThis: {
  queryClientGlobal: ReturnType<typeof queryClientSingleton>;
} & typeof global;

export const queryClientServer = globalThis.queryClientGlobal ?? queryClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.queryClientGlobal = queryClientServer
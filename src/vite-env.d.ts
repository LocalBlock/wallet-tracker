/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_APIKEY_ALCHEMY: string
    // more env variables...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
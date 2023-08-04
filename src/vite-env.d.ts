/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite/client" />
interface ImportMetaEnv {
  /** Alchemy APIKEY */
  readonly VITE_APIKEY_ALCHEMY: string;
  /** App version from package.json */
  readonly VITE_REACT_APP_VERSION: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

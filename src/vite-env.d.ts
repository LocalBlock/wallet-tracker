/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite/client" />
interface ImportMetaEnv {
  /** Alchemy Api Key */
  readonly VITE_ALCHEMY_APIKEY: string;
  /** Alchemy Auth Token */
  readonly VITE_ALCHEMY_AUTHTOKEN: string;
  /** Webhook Url for alchemy notifications */
  readonly VITE_ALCHEMY_WEBHOOKURL: string
  /** App version from package.json */
  readonly VITE_REACT_APP_VERSION: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

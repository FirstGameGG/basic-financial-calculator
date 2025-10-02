/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare interface ImportMetaEnv {
  readonly VITE_BOT_ENDPOINT?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}

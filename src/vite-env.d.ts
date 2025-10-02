/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_BOT_ENDPOINT?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Umami website ID; analytics stays off when unset. */
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  /** Umami tracker script URL; defaults to Umami Cloud. Set for self-hosted Umami. */
  readonly VITE_UMAMI_SCRIPT_URL?: string;
}

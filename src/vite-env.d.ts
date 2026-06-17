/// <reference types="vite/client" />

// Allow importing Python source as a raw string (Vite's `?raw` suffix).
declare module "*.py?raw" {
  const src: string;
  export default src;
}

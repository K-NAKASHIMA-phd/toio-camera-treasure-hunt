import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/toio-camera-treasure-hunt/" : "/",
  build: {
    target: "es2022",
  },
});
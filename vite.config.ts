import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    proxy: {
      "/alchemyfetch": "http://localhost:3000",
      "/alchemynotify": "http://localhost:3000",
      "/siwe/": "http://localhost:3000",
      "/status":"http://localhost:3000",
      "/socket.io": {
        target: "ws://localhost:3000",
        ws: true,
      },
    },
  },
  build: {
    target:"esnext"
  },
});

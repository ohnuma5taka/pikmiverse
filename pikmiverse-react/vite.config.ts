import { defineConfig, loadEnv } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    assetsInclude: ["**/*.svg", "**/*.csv"],
    server: {
      host: true,
      proxy: {
        "/api": {
          target: `http://localhost:8000/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "/"),
        },
        "/ws": {
          target: `ws://localhost:8000/`,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/ws/, "/"),
        },
      },
    },
  };
});

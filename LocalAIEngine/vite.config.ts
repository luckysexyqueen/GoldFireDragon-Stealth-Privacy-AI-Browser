import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: [
      '@mlc-ai/web-llm',
      '@wllama/wllama',
      '@xenova/transformers',
    ],
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks(id) {
          if (id.includes('@mlc-ai/web-llm')) return 'webllm';
          if (id.includes('@wllama/wllama')) return 'wllama';
          if (id.includes('@xenova/transformers')) return 'transformers';
        },
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    // Temporary: helps Lighthouse Treemap identify bundle modules.
    sourcemap: true,

    // Keep compressed-size reporting in build output.
    reportCompressedSize: true,

    // Warning threshold only; it does not change application behavior.
    chunkSizeWarningLimit: 700,
  },
});
import { defineConfig } from "vitest/config";

export default defineConfig({
  // relative asset URLs, so the same build works at / and under a sub-path
  base: "./",
});

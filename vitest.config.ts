import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "apps/**/*.unit.test.ts",
      "packages/**/*.unit.test.ts",
    ],
    clearMocks: true,
  },
});
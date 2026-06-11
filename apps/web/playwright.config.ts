import { defineConfig } from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `pnpm build && pnpm exec next start --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

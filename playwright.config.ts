import fs from 'node:fs';
import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

const LOCAL_HEADLESS_SHELL = '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell';
const customExecutable =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (fs.existsSync(LOCAL_HEADLESS_SHELL) ? LOCAL_HEADLESS_SHELL : undefined);

const chromiumLaunchArgs = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-webgl',
  '--ignore-gpu-blocklist',
  '--no-sandbox',
];

const projects: NonNullable<PlaywrightTestConfig['projects']> = [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: {
        ...(customExecutable ? { executablePath: customExecutable } : {}),
        args: chromiumLaunchArgs,
      },
    },
  },
];

if (process.env.PLAYWRIGHT_INCLUDE_FIREFOX === 'true') {
  projects.push({
    name: 'firefox',
    use: {
      ...devices['Desktop Firefox'],
      launchOptions: {},
    },
  });
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
  },
  projects,
  webServer: {
    command: 'PORT=3100 npx tsx server/src/devPreview.ts',
    url: 'http://127.0.0.1:3100/api/health',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

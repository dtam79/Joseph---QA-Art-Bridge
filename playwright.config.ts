import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'art-bridge',
      testDir: './projects/art-bridge/specs',
      use: {
        ...devices['iPhone 13'],
        baseURL: process.env.ART_BRIDGE_URL,
      },
    },
    {
      name: 'hot-deal',
      testDir: './projects/hot-deal/specs',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.HOT_DEAL_URL,
      },
    },
    {
      name: 'oh-good',
      testDir: './projects/oh-good/specs',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.OH_GOOD_URL,
      },
    },
  ],
});

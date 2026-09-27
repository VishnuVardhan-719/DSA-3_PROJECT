import { defineConfig, devices } from '@playwright/test'
import { apiServerCommand, e2eDatabaseUrl } from './e2e/database'

// Dedicated, non-default API port. Port 8000 is commonly occupied by unrelated local
// services, and any FastAPI app answers /health, so reusing it would silently point the
// suite at the wrong backend.
const apiPort = Number(process.env.E2E_API_PORT ?? 8100)
const apiUrl = `http://127.0.0.1:${apiPort}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:5181', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: apiServerCommand(apiPort),
      url: `${apiUrl}/health`,
      env: { DATABASE_URL: e2eDatabaseUrl },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5181',
      url: 'http://127.0.0.1:5181',
      env: { VITE_API_BASE_URL: apiUrl },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})

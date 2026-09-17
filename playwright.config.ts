import { defineConfig, devices } from '@playwright/test'

const python = process.platform === 'win32' ? '".\\.venv\\Scripts\\python.exe"' : 'python'

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
    { command: `${python} -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000`, url: 'http://127.0.0.1:8000/health', reuseExistingServer: !process.env.CI, timeout: 120_000 },
    { command: 'npm run dev -- --host 127.0.0.1 --port 5181', url: 'http://127.0.0.1:5181', reuseExistingServer: !process.env.CI, timeout: 120_000 },
  ],
})

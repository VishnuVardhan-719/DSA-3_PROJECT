import path from 'node:path'

const databasePath = path.resolve('backend', 'data', 'e2e.db')

/** Throwaway database used only by the Playwright suite. */
export const e2eDatabaseUrl = `sqlite:///${databasePath.replace(/\\/g, '/')}`

/**
 * The browser suite creates, archives, approves, and restores records. Running it
 * against the developer database would pollute the demonstration data and leave the
 * next run failing on state created by the previous one, so the suite always starts
 * from a freshly seeded throwaway database.
 *
 * The reset runs inside this command rather than in Playwright's global setup because
 * the web server is launched first, and a running server holds the SQLite file open on
 * Windows so it cannot be deleted from global setup.
 */
export function apiServerCommand(port: number) {
  const python = process.platform === 'win32' ? '..\\.venv\\Scripts\\python.exe' : 'python'
  return [
    'cd backend',
    `"${python}" -m app.seed reset`,
    `"${python}" -m uvicorn app.main:app --host 127.0.0.1 --port ${port}`,
  ].join(' && ')
}

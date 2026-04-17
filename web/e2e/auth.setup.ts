import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authDir = path.join(__dirname, '../playwright/.auth');
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3451';

async function loginAndSaveState(username: string, password: string, outFile: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed for ${username}: ${res.status} ${body}`);
  }

  const { access_token } = (await res.json()) as { access_token: string };

  // Build minimal localStorage state for Playwright
  const origin = 'http://localhost:3450';
  const state = {
    origins: [
      {
        origin,
        localStorage: [{ name: 'chemical_saas_token', value: access_token }],
      },
    ],
  };

  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(state, null, 2));
}

setup('authenticate as superadmin', async () => {
  await loginAndSaveState(
    'superadmin',
    'admin123',
    path.join(authDir, 'superadmin.json'),
  );
});

setup('authenticate as tenantadmin', async () => {
  await loginAndSaveState(
    'tenantadmin',
    'tenant123',
    path.join(authDir, 'tenantadmin.json'),
  );
});

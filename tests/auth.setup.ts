import { test as setup, expect } from '@fixtures/index';
import type { Page } from '@playwright/test';
import { validateBaseUrl, validateAuthCredentials, envConfig } from '@config/env.config';
import { AUTH_DIR, AUTH_STORAGE_PATH, AUTH_SESSION_PATH } from '@config/auth-paths';
import fs from 'fs/promises';

// Configuración de seguridad para el setup de autenticación
setup.use({
  trace: 'off',
  video: 'off',
  screenshot: 'off',
});

function assertProfileValid(profile: string | null): asserts profile is string {
  if (!profile || profile.trim() === '') {
    throw new Error('La clave perfil no existe o está vacía en sessionStorage tras autenticar.');
  }
}

async function captureSessionMetadata(
  page: Page,
): Promise<{ perfil: string } | { mode: 'storage-only' }> {
  const profile = await page.evaluate(() => window.sessionStorage.getItem('perfil'));
  if (profile) {
    assertProfileValid(profile);
    return { perfil: profile };
  }

  await expect(page.getByText('SUPER ADMINISTRADOR', { exact: true })).toBeVisible();
  return { mode: 'storage-only' };
}

setup(
  'Autenticar contratista y guardar sesión de Acreditación',
  { tag: ['@smoke', '@critical'] },
  async ({ page, loginPage, accreditationHomePage }) => {
    validateBaseUrl();
    validateAuthCredentials();

    // 1. Cargar y comprobar pantalla de login
    await loginPage.goto();
    await loginPage.assertIsLoaded();

    // 2. Realizar login como CONTRATISTA
    await loginPage.loginToAccreditationHome(envConfig.adminUser, envConfig.adminPassword || '');

    // 3. Comprobar llegada exitosa a la página principal de Acreditación (/v2/inicio)
    await accreditationHomePage.assertIsLoaded();

    // Validar el perfil antes de escribir cualquier archivo de autenticación
    const sessionMetadata = await captureSessionMetadata(page);

    // 5. Crear el directorio de autenticación del ambiente activo si no existe
    await fs.mkdir(AUTH_DIR, { recursive: true });

    // A. Guardar localStorage y cookies mediante storageState nativo de Playwright
    await page.context().storageState({
      path: AUTH_STORAGE_PATH,
    });

    // Guardar exclusivamente {"perfil": "valor"} en AUTH_SESSION_PATH
    await fs.writeFile(AUTH_SESSION_PATH, JSON.stringify(sessionMetadata, null, 2), 'utf-8');
  },
);

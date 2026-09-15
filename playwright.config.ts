import { defineConfig, devices } from '@playwright/test';
import { envConfig } from './src/config/env.config';
import { AUTH_STORAGE_PATH } from './src/config/auth-paths';

/**
 * Configuración empresarial de Playwright Test.
 * Soporta ejecución en QA y UAT, capturas condicionales y reporter HTML.
 */
const isUAT = envConfig.envName === 'uat';

// Evita que los fallos adjunten snapshots ARIA con datos de la aplicación.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';

export default defineConfig({
  testDir: './tests',
  /* Ejecución en paralelo total para suites independientes */
  fullyParallel: true,
  /* Falla la build en CI si se dejó accidentalmente test.only en el código */
  forbidOnly: !!process.env.CI,
  /* Reintentos: 0 localmente, 1 en CI para amortiguar fluctuaciones de red */
  retries: process.env.CI ? 1 : 0,
  /*
   * Concurrencia segura:
   * - UAT: estrictamente 1 worker para evitar sobrecarga o conflictos de datos transaccionales.
   * - QA / Local: workers configurables o automáticos según CPU (2 en CI).
   */
  workers: isUAT ? 1 : process.env.CI ? 2 : undefined,
  /* Reporter HTML sin auto-apertura y listado en consola */
  reporter: [
    ['./src/reporters/privacy.reporter.ts'],
    [
      './src/reporters/executive-html.reporter.ts',
      {
        outputFolder: 'executive-report',
        title: 'Reporte Ejecutivo de Automatización',
      },
    ],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
  ],
  /* Configuración compartida entre proyectos */
  use: {
    /* URL base tomada del ambiente activo sin exponer secretos */
    baseURL: envConfig.baseUrl || undefined,

    /*
     * La aplicación maneja credenciales y datos personales.
     * Las evidencias visuales y de red permanecen desactivadas por privacidad.
     */
    screenshot: 'off',
    video: 'off',
    trace: 'off',
  },

  /* Navegadores y proyectos configurados */
  projects: [
    {
      name: 'unit',
      testMatch: /unit\/.*\.spec\.ts/,
    },
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        trace: 'off',
        video: 'off',
        screenshot: 'off',
      },
    },
    {
      name: 'chromium-authenticated',
      testMatch: /authenticated\/.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STORAGE_PATH,
      },
      workers: 1,
    },
    {
      name: 'chromium',
      testIgnore: [/auth\.setup\.ts/, /authenticated/, /unit/],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: [/auth\.setup\.ts/, /authenticated/, /unit/],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testIgnore: [/auth\.setup\.ts/, /authenticated/, /unit/],
      use: { ...devices['Desktop Safari'] },
    },
  ],
});

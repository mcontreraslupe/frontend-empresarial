import { test } from '@fixtures/authenticated.fixture';
import { validateBaseUrl } from '@config/env.config';

function assertNoSessionRedirect(url: string): void {
  if (url.includes('/sign-in') || url.includes('/v2/account/select-platform')) {
    throw new Error(
      'El estado de sesión no fue restaurado correctamente. La aplicación redirigió a autenticación o selección de plataforma.',
    );
  }
}

test.describe('Sesión Autenticada de Contratista', () => {
  test(
    'Reutilización de sesión y visualización del menú de Acreditación',
    {
      tag: ['@smoke', '@critical'],
    },
    async ({ page, accreditationHomePage }) => {
      validateBaseUrl();

      await test.step('Restaurar la sesión autenticada', async () => {
        await page.goto('/v2/inicio');
        assertNoSessionRedirect(page.url());
      });

      await test.step('Validar página principal de Acreditación', async () => {
        await accreditationHomePage.assertIsLoaded();
      });

      await test.step('Validar menú completo de Acreditación', async () => {
        await accreditationHomePage.sidebar.open();
        await accreditationHomePage.sidebar.assertAllModulesAreVisible();
        await accreditationHomePage.sidebar.close();
      });
    },
  );
});

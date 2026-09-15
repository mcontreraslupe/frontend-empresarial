import { test } from '@fixtures/index';
import { validateBaseUrl } from '@config/env.config';

test.describe('Módulo de Autenticación', () => {
  test(
    'Visualización correcta de la pantalla de inicio de sesión',
    {
      tag: ['@smoke', '@critical'],
    },
    async ({ loginPage }) => {
      validateBaseUrl();
      await loginPage.goto();
      await loginPage.assertIsLoaded();
    },
  );
});

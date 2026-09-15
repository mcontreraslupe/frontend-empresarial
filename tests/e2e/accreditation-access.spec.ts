import { test } from '@fixtures/index';
import { validateBaseUrl, validateAuthCredentials, envConfig } from '@config/env.config';

// Configuración de seguridad: No generar trace ni video a nivel de archivo para proteger credenciales
test.use({
  trace: 'off',
  video: 'off',
});

test.describe('Acceso al Sistema y Menú de Acreditación', () => {
  test(
    'Acceso de contratista al sistema de Acreditación y visualización del menú',
    {
      tag: ['@smoke', '@critical'],
    },
    async ({ loginPage, accreditationHomePage }) => {
      validateBaseUrl();
      validateAuthCredentials();

      await test.step('Validar pantalla de inicio de sesión', async () => {
        await loginPage.goto();
        await loginPage.assertIsLoaded();
      });

      await test.step(
        'Autenticar y acceder a Acreditación',
        async () => {
          await loginPage.loginToAccreditationHome(
            envConfig.adminUser,
            envConfig.adminPassword || '',
          );
        },
        { subtitle: 'Acceso con las credenciales configuradas para el ambiente' },
      );

      await test.step('Validar página principal de Acreditación', async () => {
        await accreditationHomePage.assertIsLoaded();
      });

      await test.step('Validar módulos disponibles en el menú lateral', async () => {
        await accreditationHomePage.sidebar.open();
        await accreditationHomePage.sidebar.assertAllModulesAreVisible();
        await accreditationHomePage.sidebar.close();
      });
    },
  );
});

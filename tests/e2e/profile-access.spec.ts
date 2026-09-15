import { test, expect } from '@playwright/test';
import { validateBaseUrl, getProfileCredentials } from '@config/env.config';
import { LoginPage } from '@pages/login.page';
import { AccreditationHomePage } from '@pages/accreditation-home.page';
import { PROFILE_ACCESS_MATRIX } from '@data/static/profile-access-matrix';

test.use({
  trace: 'off',
  video: 'off',
  screenshot: 'off',
});

test.describe(
  'Control de Acceso y Sesión por Perfil',
  { tag: ['@regression', '@critical'] },
  () => {
    for (const profileConfig of PROFILE_ACCESS_MATRIX) {
      test(`Inicio de sesión y control de accesos para perfil ${profileConfig.label}`, async ({
        browser,
      }) => {
        validateBaseUrl();
        const credentials = getProfileCredentials(profileConfig.profileKey);

        const { context, page } = await test.step(
          'Preparar una sesión aislada para el perfil',
          async () => {
            const isolatedContext = await browser.newContext();
            return {
              context: isolatedContext,
              page: await isolatedContext.newPage(),
            };
          },
          { params: { perfil: profileConfig.label } },
        );

        try {
          const loginPage = new LoginPage(page);
          const accreditationHomePage = new AccreditationHomePage(page);

          await test.step('Validar pantalla de inicio de sesión', async () => {
            await loginPage.goto();
            await loginPage.assertIsLoaded();
          });

          await test.step(
            `Autenticar perfil ${profileConfig.label}`,
            async () => {
              await loginPage.loginToAccreditationHome(credentials.username, credentials.password);
              await accreditationHomePage.assertIsLoaded();
            },
            { subtitle: 'Ingreso al portal de Acreditación' },
          );

          await test.step(
            'Validar perfil activo',
            async () => {
              await accreditationHomePage.topbar.assertProfileBadge(
                profileConfig.expectedProfileBadge,
              );
            },
            { params: { perfilEsperado: profileConfig.expectedProfileBadge } },
          );

          await test.step(
            'Validar módulos permitidos',
            async () => {
              await accreditationHomePage.sidebar.open();
              await accreditationHomePage.sidebar.assertModulesVisible(
                profileConfig.visibleModules,
              );
            },
            { params: { cantidadEsperada: profileConfig.visibleModules.length } },
          );

          await test.step(
            'Validar módulos restringidos',
            async () => {
              await accreditationHomePage.sidebar.assertModulesHidden(
                profileConfig.restrictedModules,
              );
            },
            { params: { cantidadEsperada: profileConfig.restrictedModules.length } },
          );

          await test.step(
            'Comprobar navegación a un módulo permitido',
            async () => {
              await accreditationHomePage.sidebar.verifySampleModule(
                profileConfig.sampleAllowedModule,
              );
            },
            { params: { modulo: profileConfig.sampleAllowedModule.moduleName } },
          );

          await test.step('Comprobar bloqueo de una ruta restringida', async () => {
            await page.goto(profileConfig.sampleRestrictedRoute);
            await page.waitForLoadState('domcontentloaded');
            await expect(page).toHaveURL(/.*(\/not-found|\/v2\/inicio)$/);
          });

          await test.step('Cerrar sesión y volver al inicio de sesión', async () => {
            await page.goto('/v2/inicio');
            await accreditationHomePage.assertIsLoaded();
            await accreditationHomePage.topbar.logout();
            await loginPage.assertIsLoaded();
          });
        } finally {
          await test.step('Cerrar la sesión aislada del navegador', async () => {
            await context.close();
          });
        }
      });
    }
  },
);

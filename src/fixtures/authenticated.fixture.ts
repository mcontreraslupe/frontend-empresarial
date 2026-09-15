import { test as baseTest, expect } from './index';
import { AUTH_SESSION_PATH } from '@config/auth-paths';
import { envConfig, validateBaseUrl } from '@config/env.config';
import { parseStoredAuthSession } from '@utils/auth-session';
import fs from 'fs';

export const test = baseTest.extend({
  page: async ({ page }, use) => {
    validateBaseUrl();
    // 1. Validar existencia del archivo de sesión
    if (!fs.existsSync(AUTH_SESSION_PATH)) {
      throw new Error(
        'El archivo de sesión de autenticación no existe. Ejecute el proyecto auth-setup previamente.',
      );
    }

    // 2. Leer y parsear el archivo contractor-accreditation-session.json
    const sessionRaw = await fs.promises.readFile(AUTH_SESSION_PATH, 'utf-8');
    // 3. Validar el objeto JSON y su perfil antes de restaurar la sesión
    const storedSession = parseStoredAuthSession(sessionRaw);

    // 4. Extraer el origin de BASE_URL para restaurar únicamente en el dominio de la aplicación
    const targetOrigin = new URL(envConfig.baseUrl).origin;

    // 5. Inyectar init script para restaurar sessionStorage.perfil antes de que carguen los scripts de la página
    if (storedSession.mode === 'profile') {
      await page.addInitScript(
        ({ origin, perfil }) => {
          if (window.location.origin === origin) {
            window.sessionStorage.setItem('perfil', perfil);
          }
        },
        { origin: targetOrigin, perfil: storedSession.profile },
      );
    }

    // 6. Entregar la página configurada para la ejecución de la prueba
    await use(page);
  },
});

export { expect };

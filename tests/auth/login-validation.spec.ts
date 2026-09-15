import { test, expect } from '@fixtures/index';
import { validateBaseUrl } from '@config/env.config';
import { createIncompleteLoginValue } from '@data/dynamic/login-data';

test.describe('Validación de campos obligatorios del login', { tag: '@regression' }, () => {
  test('Impide iniciar sesión cuando falta la contraseña', async ({ loginPage }) => {
    validateBaseUrl();
    await loginPage.goto();
    await loginPage.assertIsLoaded();
    await loginPage.usernameInput.fill(createIncompleteLoginValue());
    await expect(loginPage.passwordInput).toBeEmpty();
    await expect(loginPage.loginButton).toBeDisabled();
  });

  test('Impide iniciar sesión cuando falta el usuario', async ({ loginPage }) => {
    validateBaseUrl();
    await loginPage.goto();
    await loginPage.assertIsLoaded();
    await loginPage.passwordInput.fill(createIncompleteLoginValue());
    await expect(loginPage.usernameInput).toBeEmpty();
    await expect(loginPage.loginButton).toBeDisabled();
  });
});

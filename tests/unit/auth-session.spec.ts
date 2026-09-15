import { test, expect } from '@playwright/test';
import { parseSessionProfile, parseStoredAuthSession } from '@utils/auth-session';
import { resolveAuthPaths } from '@config/auth-paths';
import { INVALID_SESSION_CASES } from '@data/static/auth-session-cases';

test.describe('Validación de sesión persistida', { tag: '@regression' }, () => {
  for (const scenario of INVALID_SESSION_CASES) {
    test(`Impide restaurar una sesión con ${scenario.name}`, () => {
      expect(() => parseSessionProfile(scenario.raw)).toThrow(
        scenario.name === 'JSON malformado'
          ? 'El archivo de sesión de autenticación contiene un formato JSON inválido.'
          : 'La clave perfil no es válida o está vacía en el archivo de sesión.',
      );
    });
  }

  test('Conserva el perfil válido que debe restaurarse', () => {
    const profile = JSON.stringify({ tipo: 'contratista' });
    expect(parseSessionProfile(JSON.stringify({ perfil: profile }))).toBe(profile);
  });

  test('Acepta una sesión storage-only para perfiles que llegan directo a inicio', () => {
    expect(parseStoredAuthSession(JSON.stringify({ mode: 'storage-only' }))).toEqual({
      mode: 'storage-only',
    });
  });

  test('Conserva el perfil de una sesión compatible con el formato anterior', () => {
    const profile = JSON.stringify({ tipo: 'contratista' });
    expect(parseStoredAuthSession(JSON.stringify({ perfil: profile }))).toEqual({
      mode: 'profile',
      profile,
    });
  });

  test('El error de JSON no expone el contenido de la sesión', () => {
    const syntheticValue = 'contenido_sintetico_privado';
    expect(() => parseSessionProfile(`{"perfil":"${syntheticValue}"`)).toThrow(
      /^El archivo de sesión de autenticación contiene un formato JSON inválido\.$/,
    );
  });

  test('QA y UAT utilizan archivos de autenticación distintos', () => {
    const qa = resolveAuthPaths('qa');
    const uat = resolveAuthPaths('uat');
    expect(qa.directory).not.toBe(uat.directory);
    expect(qa.storage).not.toBe(uat.storage);
    expect(qa.session).not.toBe(uat.session);
  });
});

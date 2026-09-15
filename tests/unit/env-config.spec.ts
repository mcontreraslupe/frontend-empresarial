import { test, expect } from '@playwright/test';
import {
  getProfileCredentials,
  validateAllProfileCredentials,
  PROFILE_ENV_VAR_MAP,
  type ProfileKey,
} from '@config/env.config';

test.describe('Configuración y credenciales de perfiles', { tag: '@regression' }, () => {
  test('Obtiene credenciales correctamente para un perfil configurado', () => {
    const creds = getProfileCredentials('EECC');
    expect(creds.username).toBeTruthy();
    expect(creds.password).toBeTruthy();
  });

  test('El error al faltar una variable de usuario menciona solo el nombre de la variable ausente', () => {
    const original = process.env.AUTH_USER_EECC;
    try {
      delete process.env.AUTH_USER_EECC;
      expect(() => getProfileCredentials('EECC')).toThrow(
        /Faltan las siguientes variables requeridas para el perfil 'EECC'.*AUTH_USER_EECC/,
      );
    } finally {
      process.env.AUTH_USER_EECC = original;
    }
  });

  test('El error al faltar la contraseña compartida menciona solo AUTH_PASSWORD_SHARED', () => {
    const original = process.env.AUTH_PASSWORD_SHARED;
    try {
      delete process.env.AUTH_PASSWORD_SHARED;
      expect(() => getProfileCredentials('EECC')).toThrow(/AUTH_PASSWORD_SHARED/);
    } finally {
      process.env.AUTH_PASSWORD_SHARED = original;
    }
  });

  test('El mensaje de error nunca expone contraseñas ni valores de usuario', () => {
    const original = process.env.AUTH_USER_ADC_CODELCO;
    try {
      delete process.env.AUTH_USER_ADC_CODELCO;
      expect(() => getProfileCredentials('ADC_CODELCO')).toThrow(
        /Faltan las siguientes variables requeridas para el perfil 'ADC_CODELCO'.*AUTH_USER_ADC_CODELCO/,
      );
    } finally {
      process.env.AUTH_USER_ADC_CODELCO = original;
    }
  });

  test('Todas las claves de perfil tienen un mapeo de variable de entorno definido', () => {
    const expectedKeys: ProfileKey[] = [
      'EECC',
      'ADC_CODELCO',
      'DGFREC',
      'AUDITOR',
      'INSPECTOR',
      'SUPERVISOR',
    ];
    for (const key of expectedKeys) {
      expect(PROFILE_ENV_VAR_MAP[key]).toBeDefined();
      expect(PROFILE_ENV_VAR_MAP[key]).toMatch(/^AUTH_USER_/);
    }
  });

  test('validateAllProfileCredentials no arroja error cuando todas las variables están presentes', () => {
    expect(() => validateAllProfileCredentials()).not.toThrow();
  });
});

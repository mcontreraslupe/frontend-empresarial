import path from 'path';
import dotenv from 'dotenv';

export type EnvironmentName = 'qa' | 'uat';

const ALLOWED_ENVIRONMENTS: readonly EnvironmentName[] = ['qa', 'uat'] as const;

function resolveEnvironmentName(): EnvironmentName {
  const rawEnv = process.env.ENV;
  if (!rawEnv) {
    return 'qa';
  }

  const normalized = rawEnv.toLowerCase();
  if (normalized === 'qa' || normalized === 'uat') {
    return normalized;
  }

  throw new Error(
    `[Config Error] Ambiente no permitido. Los valores permitidos son: ${ALLOWED_ENVIRONMENTS.join(', ')}.`,
  );
}

const targetEnv: EnvironmentName = resolveEnvironmentName();
const envFilePath = path.resolve(process.cwd(), 'environments', `.env.${targetEnv}`);

// Cargar variables si el archivo existe
dotenv.config({ path: envFilePath, quiet: true });

export interface EnvironmentConfig {
  envName: EnvironmentName;
  baseUrl: string;
  adminUser: string;
  adminPassword?: string;
  authPasswordShared?: string;
}

export const envConfig: EnvironmentConfig = {
  envName: targetEnv,
  baseUrl: process.env.BASE_URL || '',
  adminUser: process.env.ADMIN_USER || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  authPasswordShared: process.env.AUTH_PASSWORD_SHARED || '',
};

export type ProfileKey = 'EECC' | 'ADC_CODELCO' | 'DGFREC' | 'AUDITOR' | 'INSPECTOR' | 'SUPERVISOR';

export const PROFILE_ENV_VAR_MAP: Record<ProfileKey, string> = {
  EECC: 'AUTH_USER_EECC',
  ADC_CODELCO: 'AUTH_USER_ADC_CODELCO',
  DGFREC: 'AUTH_USER_DGFREC',
  AUDITOR: 'AUTH_USER_AUDITOR',
  INSPECTOR: 'AUTH_USER_INSPECTOR',
  SUPERVISOR: 'AUTH_USER_SUPERVISOR',
};

export interface ProfileCredentials {
  username: string;
  password: string;
}

/**
 * Obtiene las credenciales para un perfil específico.
 * SEGURIDAD: Si falta una variable, solo informa el nombre de la variable faltante.
 * Nunca imprime valores ni contraseñas.
 */
export function getProfileCredentials(profileKey: ProfileKey): ProfileCredentials {
  const userVarName = PROFILE_ENV_VAR_MAP[profileKey];
  const missing: string[] = [];

  const username = process.env[userVarName];
  const password = process.env.AUTH_PASSWORD_SHARED;

  if (!username) {
    missing.push(userVarName);
  }
  if (!password) {
    missing.push('AUTH_PASSWORD_SHARED');
  }

  if (missing.length > 0) {
    throw new Error(
      `[Config Error] Faltan las siguientes variables requeridas para el perfil '${profileKey}' en el ambiente '${targetEnv}': ` +
        `${missing.join(', ')}. ` +
        `Por favor configúralas en 'environments/.env.${targetEnv}'.`,
    );
  }

  return { username: username!, password: password! };
}

/**
 * Valida que todas las credenciales de perfiles estén configuradas.
 * SEGURIDAD: Solo reporta los nombres de las variables ausentes.
 */
export function validateAllProfileCredentials(): void {
  const missing: string[] = [];
  for (const [, varName] of Object.entries(PROFILE_ENV_VAR_MAP)) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  if (!process.env.AUTH_PASSWORD_SHARED) {
    missing.push('AUTH_PASSWORD_SHARED');
  }

  if (missing.length > 0) {
    throw new Error(
      `[Config Error] Faltan las siguientes variables requeridas para el ambiente '${targetEnv}': ` +
        `${missing.join(', ')}. ` +
        `Por favor configúralas en 'environments/.env.${targetEnv}'.`,
    );
  }
}

/**
 * Valida exclusivamente que BASE_URL esté definida y sea una URL http/https válida.
 * SEGURIDAD: Nunca imprime valores ni secretos en mensajes de error.
 */
export function validateBaseUrl(): void {
  if (!envConfig.baseUrl) {
    throw new Error(
      `[Config Error] Falta la variable requerida 'BASE_URL' para el ambiente '${targetEnv}'. ` +
        `Por favor configúrala en 'environments/.env.${targetEnv}'.`,
    );
  }

  try {
    const parsedUrl = new URL(envConfig.baseUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error(
        `[Config Error] La variable 'BASE_URL' debe utilizar un protocolo http: o https:.`,
      );
    }
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        `[Config Error] La variable 'BASE_URL' no contiene una estructura de URL válida.`,
      );
    }
    throw err;
  }
}

/**
 * Valida exclusivamente que ADMIN_USER y ADMIN_PASSWORD estén presentes.
 * SEGURIDAD: Nunca imprime contraseñas ni valores en mensajes de error;
 * únicamente indica el nombre de las variables faltantes.
 */
export function validateAuthCredentials(): void {
  const missing: string[] = [];

  if (!envConfig.adminUser) {
    missing.push('ADMIN_USER');
  }
  if (!envConfig.adminPassword) {
    missing.push('ADMIN_PASSWORD');
  }

  if (missing.length > 0) {
    throw new Error(
      `[Config Error] Faltan las siguientes variables requeridas para el ambiente '${targetEnv}': ` +
        `${missing.join(', ')}. ` +
        `Por favor configúralas en 'environments/.env.${targetEnv}'.`,
    );
  }
}

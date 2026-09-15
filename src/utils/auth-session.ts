/** Valida la sesión persistida sin incluir su contenido en los errores. */
export function parseSessionProfile(sessionRaw: string): string {
  const sessionData = parseSessionJson(sessionRaw);

  if (
    !('perfil' in sessionData) ||
    typeof sessionData.perfil !== 'string' ||
    sessionData.perfil.trim() === ''
  ) {
    throw new Error('La clave perfil no es válida o está vacía en el archivo de sesión.');
  }

  return sessionData.perfil;
}

export type StoredAuthSession = { mode: 'profile'; profile: string } | { mode: 'storage-only' };

function parseSessionJson(sessionRaw: string): Record<string, unknown> {
  let sessionData: unknown;
  try {
    sessionData = JSON.parse(sessionRaw);
  } catch {
    throw new Error('El archivo de sesión de autenticación contiene un formato JSON inválido.');
  }

  if (typeof sessionData !== 'object' || sessionData === null || Array.isArray(sessionData)) {
    throw new Error('La clave perfil no es válida o está vacía en el archivo de sesión.');
  }

  return sessionData as Record<string, unknown>;
}

export function parseStoredAuthSession(sessionRaw: string): StoredAuthSession {
  const sessionData = parseSessionJson(sessionRaw);
  if (sessionData.mode === 'storage-only') return { mode: 'storage-only' };
  return { mode: 'profile', profile: parseSessionProfile(sessionRaw) };
}

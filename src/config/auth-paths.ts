import path from 'path';
import { envConfig, type EnvironmentName } from './env.config';

export function resolveAuthPaths(environment: EnvironmentName) {
  const directory = path.resolve(process.cwd(), 'playwright/.auth', environment);

  return {
    directory,
    storage: path.join(directory, 'contractor-accreditation.json'),
    session: path.join(directory, 'contractor-accreditation-session.json'),
  };
}

const authPaths = resolveAuthPaths(envConfig.envName);

export const AUTH_DIR = authPaths.directory;
export const AUTH_STORAGE_PATH = authPaths.storage;
export const AUTH_SESSION_PATH = authPaths.session;

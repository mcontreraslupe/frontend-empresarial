import { randomUUID } from 'node:crypto';

/** Dato sintético para formularios incompletos; nunca se envía como credencial. */
export function createIncompleteLoginValue(): string {
  return randomUUID();
}

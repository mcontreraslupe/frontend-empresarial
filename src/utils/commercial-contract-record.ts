import fs from 'node:fs/promises';
import path from 'node:path';
import { envConfig } from '@config/env.config';

const FIRST_CONTRACT_NUMBER = 4_610_000_001;

interface CommercialContractRecord {
  contractNumber: string;
  requestNumber: string;
  center: 'División Salvador';
  status: 'ENVIADO';
  createdAt: string;
}

function recordPath(): string {
  return path.resolve(
    process.cwd(),
    'playwright/.runtime',
    envConfig.envName,
    'latest-commercial-contract.json',
  );
}

function sequencePath(): string {
  return path.resolve(
    process.cwd(),
    'playwright/.runtime',
    envConfig.envName,
    'last-commercial-contract-sequence.json',
  );
}

async function storedContractNumber(target: string): Promise<number | undefined> {
  try {
    const stored = JSON.parse(await fs.readFile(target, 'utf8')) as { contractNumber?: unknown };
    if (typeof stored.contractNumber === 'string' && /^461\d{7}$/.test(stored.contractNumber)) {
      return Number(stored.contractNumber);
    }
    return undefined;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return undefined;
    throw new Error('No se pudo leer la secuencia del último contrato.');
  }
}

export async function reserveNextCommercialContractNumber(
  existingNumbers: string[],
): Promise<string> {
  let latest = FIRST_CONTRACT_NUMBER - 1;
  for (const value of existingNumbers) {
    if (/^461\d{7}$/.test(value)) latest = Math.max(latest, Number(value));
  }

  const storedNumbers = await Promise.all([
    storedContractNumber(recordPath()),
    storedContractNumber(sequencePath()),
  ]);
  for (const stored of storedNumbers) {
    if (stored !== undefined) latest = Math.max(latest, stored);
  }

  const contractNumber = String(latest + 1);
  const target = sequencePath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify({ contractNumber }, null, 2), 'utf8');
  return contractNumber;
}

export async function saveCommercialContractRecord(
  contractNumber: string,
  requestNumber: string,
): Promise<void> {
  const target = recordPath();
  const record: CommercialContractRecord = {
    contractNumber,
    requestNumber,
    center: 'División Salvador',
    status: 'ENVIADO',
    createdAt: new Date().toISOString(),
  };
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(record, null, 2), 'utf8');
}

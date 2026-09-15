import { randomInt, randomUUID } from 'node:crypto';

export interface CommercialContractData {
  contractNumber: string;
  serviceDescription: string;
  contractCategory: string;
  management: string;
  workArea: string;
  startDate: string;
  endDate: string;
  workers: string;
  vehicles: string;
  person: {
    rut: string;
    fullName: string;
    email: string;
    phone: string;
  };
}

function rutCheckDigit(body: string): string {
  const sum = [...body]
    .reverse()
    .reduce((total, digit, index) => total + Number(digit) * (2 + (index % 6)), 0);
  const result = 11 - (sum % 11);
  if (result === 11) return '0';
  if (result === 10) return 'K';
  return String(result);
}

function formatDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('day')}/${value('month')}/${value('year')}`;
}

export function createCommercialContractData(contractNumber: string): CommercialContractData {
  const rutBody = String(randomInt(40_000_000, 49_000_000));
  const suffix = randomUUID().slice(0, 8);

  return {
    contractNumber,
    serviceDescription: `Servicio automatizado QA ${suffix}`,
    contractCategory: 'Acondicionamiento De Edificios',
    management: 'DSAL > AUDITORÍA INTERNA',
    workArea: 'DSAL > AUDITORÍA INTERNA > JEFE DE GESTIÓN',
    startDate: formatDate(new Date()),
    endDate: '31/12/2029',
    workers: String(randomInt(1, 51)),
    vehicles: String(randomInt(0, 11)),
    person: {
      rut: `${rutBody}-${rutCheckDigit(rutBody)}`,
      fullName: `PERSONA PRUEBA ${suffix.toUpperCase()}`,
      email: `contrato.${suffix}@example.com`,
      phone: `9${randomInt(10_000_000, 100_000_000)}`,
    },
  };
}

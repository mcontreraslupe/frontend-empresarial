import { test, expect } from '@playwright/test';
import type { TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import PrivacyReporter from '../../src/reporters/privacy.reporter';
import { createIncompleteLoginValue } from '@data/dynamic/login-data';

test.describe('Privacidad del reporte', { tag: '@regression' }, () => {
  test('Omite valores enviados a campos y conserva el fallo del paso', () => {
    const value = createIncompleteLoginValue();
    const step = {
      title: `Fill "${value}"`,
      category: 'pw:api',
      steps: [],
      error: { message: `No se pudo enviar ${value}`, stack: `Call log: ${value}` },
    } as unknown as TestStep;
    const reporter = new PrivacyReporter();
    reporter.onStepBegin({} as TestCase, {} as TestResult, step);
    reporter.onStepEnd({} as TestCase, {} as TestResult, step);
    expect(step.title).toBe('Fill (valor omitido por privacidad)');
    expect(step.error?.message).toBe(
      'No se pudo completar el campo (detalle omitido por privacidad).',
    );
    expect(step.error?.stack).toBeUndefined();
  });

  test('Sanea pasos anidados antes de guardar el resultado', () => {
    const step = {
      title: `Fill "${createIncompleteLoginValue()}"`,
      category: 'pw:api',
      steps: [],
    } as unknown as TestStep;
    const parent = { title: 'Autenticar', category: 'test.step', steps: [step] } as TestStep;
    new PrivacyReporter().onTestEnd({} as TestCase, { steps: [parent] } as TestResult);
    expect(parent.title).toBe('Autenticar');
    expect(step.title).toBe('Fill (valor omitido por privacidad)');
  });

  test('Omite el contexto ARIA de error antes de generar reportes', () => {
    const result = {
      steps: [],
      attachments: [
        { name: 'error-context', contentType: 'text/markdown' },
        { name: 'resultado-seguro', contentType: 'text/plain' },
      ],
    } as unknown as TestResult;
    new PrivacyReporter().onTestEnd({} as TestCase, result);
    expect(result.attachments).toEqual([{ name: 'resultado-seguro', contentType: 'text/plain' }]);
  });
});

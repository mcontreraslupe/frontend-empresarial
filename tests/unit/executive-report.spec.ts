import { test, expect } from '@playwright/test';
import {
  buildExecutiveSummary,
  extractExecutiveSteps,
  isExecutiveProject,
  renderExecutiveReport,
  sanitizeReportText,
  type ExecutiveTestRecord,
} from '../../src/reporters/executive-html.reporter';
import type { TestStep } from '@playwright/test/reporter';

function record(
  status: ExecutiveTestRecord['status'],
  outcome: ExecutiveTestRecord['outcome'] = status === 'passed' ? 'expected' : 'unexpected',
  overrides: Partial<ExecutiveTestRecord> = {},
): ExecutiveTestRecord {
  return {
    id: `${status}-${outcome}`,
    title: 'Validar acceso permitido',
    suite: 'Control de acceso',
    project: 'chromium',
    file: 'tests/e2e/profile-access.spec.ts',
    line: 10,
    status,
    outcome,
    expectedStatus: 'passed',
    startedAt: '2026-09-15T10:00:00.000Z',
    duration: 1_500,
    retry: 0,
    tags: ['@critical'],
    annotations: [],
    steps: [],
    ...overrides,
  };
}

test.describe('Reporte ejecutivo', { tag: '@regression' }, () => {
  test('Sanea credenciales e identificadores antes de mostrar errores', () => {
    const password = 'Password-Demo-123';
    const user = 'usuario.demo@abc123';
    const sanitized = sanitizeReportText(
      `password=${password}; usuario=${user}; correo=persona@example.com; RUT=12.345.678-5`,
      [password, user],
    );

    expect(sanitized).not.toContain(password);
    expect(sanitized).not.toContain(user);
    expect(sanitized).not.toContain('persona@example.com');
    expect(sanitized).not.toContain('12.345.678-5');
    expect(sanitized).toContain('[dato confidencial omitido]');
    expect(sanitized).toContain('[correo omitido]');
    expect(sanitized).toContain('[RUT omitido]');
  });

  test('Calcula indicadores ejecutivos con fallos, omitidos e inestables', () => {
    const summary = buildExecutiveSummary(
      [
        record('passed'),
        record('passed', 'flaky', { id: 'flaky' }),
        record('failed', 'unexpected', { id: 'failed' }),
        record('skipped', 'skipped', { id: 'skipped' }),
      ],
      { status: 'failed', startTime: new Date('2026-09-15T10:00:00.000Z'), duration: 8_000 },
      {
        title: 'Reporte ejecutivo',
        environment: 'qa',
        execution: 'Local',
        workers: 1,
        planned: 4,
      },
    );

    expect(summary).toMatchObject({
      total: 4,
      passed: 1,
      flaky: 1,
      failed: 1,
      skipped: 1,
      passRate: 66.7,
    });
  });

  test('Incluye únicamente proyectos E2E en el reporte', () => {
    expect(isExecutiveProject('chromium')).toBe(true);
    expect(isExecutiveProject('chromium-authenticated')).toBe(true);
    expect(isExecutiveProject('unit')).toBe(false);
    expect(isExecutiveProject('auth-setup')).toBe(false);
  });

  test('Construye una línea de tiempo con pasos de negocio y acciones anidadas', () => {
    const steps = [
      {
        title: 'Autenticar perfil EECC',
        subtitle: 'Ingreso al portal de Acreditación',
        category: 'test.step',
        duration: 1_200,
        params: { perfil: 'EECC' },
        steps: [
          {
            title: 'Click',
            subtitle: "getByRole('button')",
            category: 'pw:api',
            duration: 100,
            steps: [],
          },
          {
            title: 'Expect to be visible',
            category: 'expect',
            duration: 30,
            steps: [],
          },
        ],
      },
    ] as unknown as TestStep[];

    expect(extractExecutiveSteps(steps)).toEqual([
      expect.objectContaining({
        title: 'Autenticar perfil EECC',
        subtitle: 'Ingreso al portal de Acreditación',
        category: 'Negocio',
        status: 'passed',
        parameters: '{"perfil":"EECC"}',
        steps: [
          expect.objectContaining({ title: 'Click', category: 'Acción' }),
          expect.objectContaining({ title: 'Expect to be visible', category: 'Validación' }),
        ],
      }),
    ]);
  });

  test('Genera HTML interactivo y escapa contenido de los casos', () => {
    const summary = buildExecutiveSummary(
      [
        record('failed', 'unexpected', {
          title: '<script>alert(1)</script>',
          steps: [
            {
              title: 'Validar perfil activo',
              category: 'Negocio',
              status: 'passed',
              duration: 250,
              steps: [],
            },
          ],
        }),
      ],
      { status: 'failed', startTime: new Date('2026-09-15T10:00:00.000Z'), duration: 1_500 },
      {
        title: 'Reporte ejecutivo',
        environment: 'qa',
        execution: 'CI',
        workers: 1,
        planned: 1,
      },
    );
    const html = renderExecutiveReport(summary);

    expect(html).toContain('Indicadores principales');
    expect(html).toContain('Detalle de casos');
    expect(html).toContain('Casos E2E ejecutados');
    expect(html).toContain('Ver ejecución paso a paso (1)');
    expect(html).toContain('Validar perfil activo');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});

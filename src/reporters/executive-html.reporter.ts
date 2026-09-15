import fs from 'node:fs';
import path from 'node:path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import { envConfig } from '@config/env.config';

type TestStatus = TestResult['status'];
type TestOutcome = ReturnType<TestCase['outcome']>;

export interface ExecutiveStepRecord {
  title: string;
  subtitle?: string;
  category: 'Negocio' | 'Validación' | 'Acción';
  status: 'passed' | 'failed';
  duration: number;
  parameters?: string;
  steps: ExecutiveStepRecord[];
}

export interface ExecutiveTestRecord {
  id: string;
  title: string;
  suite: string;
  project: string;
  file: string;
  line: number;
  status: TestStatus;
  outcome: TestOutcome;
  expectedStatus: TestCase['expectedStatus'];
  startedAt: string;
  duration: number;
  retry: number;
  tags: string[];
  annotations: string[];
  steps: ExecutiveStepRecord[];
  error?: string;
}

export interface ExecutiveSummary {
  title: string;
  environment: string;
  execution: 'CI' | 'Local';
  runStatus: FullResult['status'];
  startedAt: string;
  generatedAt: string;
  duration: number;
  workers: number;
  planned: number;
  total: number;
  passed: number;
  flaky: number;
  failed: number;
  skipped: number;
  passRate: number;
  tests: ExecutiveTestRecord[];
}

interface ExecutiveReporterOptions {
  outputFolder?: string;
  title?: string;
}

const STATUS_LABEL: Record<TestStatus, string> = {
  passed: 'Aprobado',
  failed: 'Fallido',
  timedOut: 'Tiempo agotado',
  skipped: 'Omitido',
  interrupted: 'Interrumpido',
};

const RUN_STATUS_LABEL: Record<FullResult['status'], string> = {
  passed: 'APROBADO',
  failed: 'FALLIDO',
  timedout: 'TIEMPO AGOTADO',
  interrupted: 'INTERRUMPIDO',
};

export function isExecutiveProject(project: string): boolean {
  return project !== 'unit' && project !== 'auth-setup';
}

function confidentialEnvironmentValues(): string[] {
  return Object.entries(process.env)
    .filter(([name, value]) =>
      Boolean(
        value && /(?:PASSWORD|TOKEN|SECRET|AUTH_USER|ADMIN_USER)/i.test(name) && value.length >= 3,
      ),
    )
    .map(([, value]) => value as string)
    .sort((left, right) => right.length - left.length);
}

export function sanitizeReportText(
  value: string,
  confidentialValues: string[] = confidentialEnvironmentValues(),
): string {
  let sanitized = value;
  for (const confidential of confidentialValues) {
    sanitized = sanitized.replaceAll(confidential, '[dato confidencial omitido]');
  }
  return sanitized
    .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [token omitido]')
    .replace(
      /\b(?:password|contraseña|token|secret)\b(\s*[=:]\s*)[^\s,;]+/gi,
      (_match, separator: string) => `credencial${separator}[dato confidencial omitido]`,
    )
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[correo omitido]')
    .replace(/\b[a-z][a-z0-9._-]{2,}@[a-f0-9]{3,}\b/gi, '[identificador omitido]')
    .replace(/\b\d{1,2}(?:\.\d{3}){2}-[\dK]\b/gi, '[RUT omitido]')
    .replace(/\b\d{7,8}-[\dK]\b/gi, '[RUT omitido]')
    .replace(/Fill\s+"[^"]*"/gi, 'Fill (valor omitido por privacidad)');
}

function stepCategory(category: string): ExecutiveStepRecord['category'] {
  if (category === 'test.step') return 'Negocio';
  if (category === 'expect') return 'Validación';
  return 'Acción';
}

function serializeStepParameters(params: TestStep['params']): string | undefined {
  if (!params || !Object.keys(params).length) return undefined;
  try {
    return sanitizeReportText(JSON.stringify(params)).slice(0, 800);
  } catch {
    return 'Parámetros no serializables';
  }
}

function relevantStep(step: TestStep): boolean {
  return ['test.step', 'expect', 'pw:api'].includes(step.category);
}

function mapStep(step: TestStep, depth = 0): ExecutiveStepRecord {
  const children = depth >= 2 ? [] : step.steps.filter(relevantStep).slice(0, 100);
  return {
    title: sanitizeReportText(step.title),
    subtitle: step.subtitle ? sanitizeReportText(step.subtitle).slice(0, 800) : undefined,
    category: stepCategory(step.category),
    status: step.error ? 'failed' : 'passed',
    duration: step.duration,
    parameters: step.category === 'test.step' ? serializeStepParameters(step.params) : undefined,
    steps: children.map((child) => mapStep(child, depth + 1)),
  };
}

export function extractExecutiveSteps(steps: TestStep[]): ExecutiveStepRecord[] {
  const businessSteps = steps.filter((step) => step.category === 'test.step');
  const selected = businessSteps.length ? businessSteps : steps.filter(relevantStep);
  return selected.slice(0, 150).map((step) => mapStep(step));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDuration(duration: number): string {
  if (duration < 1_000) return `${Math.round(duration)} ms`;
  const totalSeconds = Math.round(duration / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes} min ${seconds.toString().padStart(2, '0')} s` : `${seconds} s`;
}

function displayStatus(record: ExecutiveTestRecord): string {
  return record.outcome === 'flaky' ? 'Inestable' : STATUS_LABEL[record.status];
}

function statusKey(record: ExecutiveTestRecord): 'passed' | 'flaky' | 'failed' | 'skipped' {
  if (record.outcome === 'flaky') return 'flaky';
  if (record.status === 'passed') return 'passed';
  if (record.status === 'skipped') return 'skipped';
  return 'failed';
}

export function buildExecutiveSummary(
  records: ExecutiveTestRecord[],
  run: Pick<FullResult, 'status' | 'startTime' | 'duration'>,
  metadata: {
    title: string;
    environment: string;
    execution: 'CI' | 'Local';
    workers: number;
    planned: number;
  },
): ExecutiveSummary {
  const tests = [...records].sort((left, right) => {
    const statusOrder = { failed: 0, timedOut: 0, interrupted: 0, flaky: 1, passed: 2, skipped: 3 };
    const leftStatus = left.outcome === 'flaky' ? 'flaky' : left.status;
    const rightStatus = right.outcome === 'flaky' ? 'flaky' : right.status;
    return statusOrder[leftStatus] - statusOrder[rightStatus] || right.duration - left.duration;
  });
  const passed = tests.filter((record) => statusKey(record) === 'passed').length;
  const flaky = tests.filter((record) => statusKey(record) === 'flaky').length;
  const failed = tests.filter((record) => statusKey(record) === 'failed').length;
  const skipped = tests.filter((record) => statusKey(record) === 'skipped').length;
  const executed = tests.length - skipped;
  const passRate = executed ? Math.round(((passed + flaky) / executed) * 1_000) / 10 : 0;

  return {
    ...metadata,
    runStatus: run.status,
    startedAt: run.startTime.toISOString(),
    generatedAt: new Date().toISOString(),
    duration: run.duration,
    total: tests.length,
    passed,
    flaky,
    failed,
    skipped,
    passRate,
    tests,
  };
}

function aggregationRows(
  summary: ExecutiveSummary,
  selector: (record: ExecutiveTestRecord) => string[],
): string {
  const groups = new Map<string, ExecutiveTestRecord[]>();
  for (const test of summary.tests) {
    for (const key of selector(test)) {
      groups.set(key, [...(groups.get(key) ?? []), test]);
    }
  }

  if (!groups.size) return '<tr><td colspan="5" class="empty">Sin información</td></tr>';
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, tests]) => {
      const passed = tests.filter((test) => ['passed', 'flaky'].includes(statusKey(test))).length;
      const failed = tests.filter((test) => statusKey(test) === 'failed').length;
      const skipped = tests.filter((test) => statusKey(test) === 'skipped').length;
      const rate =
        tests.length - skipped ? Math.round((passed / (tests.length - skipped)) * 100) : 0;
      return `<tr>
        <td><strong>${escapeHtml(name)}</strong></td>
        <td>${tests.length}</td>
        <td class="number-success">${passed}</td>
        <td class="number-danger">${failed}</td>
        <td><div class="bar"><span style="width:${rate}%"></span></div><small>${rate}%</small></td>
      </tr>`;
    })
    .join('');
}

function stepSearchText(steps: ExecutiveStepRecord[]): string {
  return steps
    .flatMap((step) => [step.title, step.subtitle ?? '', stepSearchText(step.steps)])
    .join(' ');
}

function stepTimeline(steps: ExecutiveStepRecord[], nested = false): string {
  return `<ol class="timeline${nested ? ' nested' : ''}">${steps
    .map((step) => {
      const details = [step.subtitle, step.parameters]
        .filter((value): value is string => Boolean(value))
        .map((value) => `<div class="step-detail">${escapeHtml(value)}</div>`)
        .join('');
      const children = step.steps.length
        ? `<details class="technical"><summary>${step.steps.length} ${step.steps.length === 1 ? 'acción técnica' : 'acciones técnicas'}</summary>${stepTimeline(step.steps, true)}</details>`
        : '';
      return `<li class="step-item ${step.status}">
        <span class="step-marker" aria-hidden="true"></span>
        <div class="step-content">
          <div class="step-heading"><strong>${escapeHtml(step.title)}</strong><span class="step-category">${step.category}</span><time>${formatDuration(step.duration)}</time></div>
          ${details}${children}
        </div>
      </li>`;
    })
    .join('')}</ol>`;
}

function testRows(summary: ExecutiveSummary): string {
  if (!summary.tests.length) {
    return '<tr><td colspan="6" class="empty">No se ejecutaron casos.</td></tr>';
  }
  return summary.tests
    .map((test) => {
      const key = statusKey(test);
      const tags = test.tags.length
        ? test.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')
        : '<span class="muted">Sin etiquetas</span>';
      const error = test.error
        ? `<details><summary>Ver detalle sanitizado</summary><pre>${escapeHtml(test.error)}</pre></details>`
        : '';
      const annotations = test.annotations.length
        ? `<div class="annotations">${test.annotations.map(escapeHtml).join(' · ')}</div>`
        : '';
      const execution = test.steps.length
        ? `<details class="execution"><summary>Ver ejecución paso a paso (${test.steps.length})</summary>${stepTimeline(test.steps)}</details>`
        : '<div class="muted">Este caso no declaró pasos de ejecución.</div>';
      return `<tr class="test-row" data-status="${key}" data-search="${escapeHtml(
        `${test.title} ${test.suite} ${test.project} ${test.tags.join(' ')} ${stepSearchText(test.steps)}`.toLowerCase(),
      )}">
        <td><span class="status ${key}">${displayStatus(test)}</span></td>
        <td>
          <strong>${escapeHtml(test.title)}</strong>
          <div class="muted">${escapeHtml(test.suite)}</div>
          ${annotations}${execution}${error}
        </td>
        <td>${escapeHtml(test.project)}</td>
        <td><div class="tags">${tags}</div></td>
        <td>${formatDuration(test.duration)}${test.retry ? `<div class="muted">Reintento ${test.retry}</div>` : ''}</td>
        <td><code>${escapeHtml(`${test.file}:${test.line}`)}</code></td>
      </tr>`;
    })
    .join('');
}

export function renderExecutiveReport(summary: ExecutiveSummary): string {
  const strictStatus = summary.failed
    ? { label: 'Atención requerida', className: 'failed' }
    : summary.flaky
      ? { label: 'Aprobado con inestabilidad', className: 'flaky' }
      : { label: 'Ejecución satisfactoria', className: 'passed' };
  const projects = aggregationRows(summary, (test) => [test.project]);
  const tags = aggregationRows(summary, (test) =>
    test.tags.length ? test.tags : ['Sin etiqueta'],
  );
  const slowest = [...summary.tests]
    .filter((test) => test.status !== 'skipped')
    .sort((left, right) => right.duration - left.duration)
    .slice(0, 5)
    .map(
      (test, index) => `<li>
        <span class="rank">${index + 1}</span>
        <div><strong>${escapeHtml(test.title)}</strong><small>${escapeHtml(test.project)}</small></div>
        <time>${formatDuration(test.duration)}</time>
      </li>`,
    )
    .join('');
  const failureMessage = summary.failed
    ? `${summary.failed} caso${summary.failed === 1 ? '' : 's'} requiere${summary.failed === 1 ? '' : 'n'} revisión.`
    : 'No se detectaron fallos funcionales en esta ejecución.';

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(summary.title)}</title>
  <style>
    :root{--navy:#172338;--navy-2:#24334a;--orange:#e85b00;--orange-soft:#fff1e8;--green:#21845b;--green-soft:#e8f6ef;--red:#c43f3f;--red-soft:#fcecec;--amber:#a86b00;--amber-soft:#fff6dc;--blue:#2878b8;--ink:#273247;--muted:#6d7788;--line:#e4e8ef;--surface:#fff;--background:#f3f5f8}
    *{box-sizing:border-box} body{margin:0;background:var(--background);color:var(--ink);font:14px/1.5 Inter,Segoe UI,Arial,sans-serif}
    header{background:linear-gradient(125deg,var(--navy),var(--navy-2));color:#fff;padding:34px max(28px,calc((100% - 1440px)/2));border-bottom:5px solid var(--orange)}
    .brand{display:flex;align-items:center;gap:12px;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#ffb37d}.brand-mark{width:30px;height:30px;border:7px solid var(--orange);border-radius:50%;position:relative}.brand-mark:after{content:"";position:absolute;width:13px;height:7px;background:var(--navy);bottom:-9px;left:2px}
    h1{font-size:30px;line-height:1.2;margin:20px 0 8px}.subtitle{color:#cbd4e2;margin:0}.meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.meta span{background:#ffffff13;border:1px solid #ffffff24;border-radius:20px;padding:6px 11px}
    main{max-width:1440px;margin:auto;padding:28px}.status-banner{display:flex;justify-content:space-between;align-items:center;gap:18px;background:var(--surface);border:1px solid var(--line);border-left:5px solid var(--green);border-radius:12px;padding:18px 22px;box-shadow:0 4px 18px #1520330a}.status-banner.failed{border-left-color:var(--red)}.status-banner.flaky{border-left-color:var(--amber)}.status-banner h2{margin:0 0 3px;font-size:18px}.status-banner p{margin:0;color:var(--muted)}
    .cards{display:grid;grid-template-columns:repeat(6,minmax(150px,1fr));gap:14px;margin:20px 0}.card,.panel{background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:0 4px 18px #15203308}.card{padding:18px}.card small{display:block;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.06em}.card strong{display:block;font-size:28px;margin-top:7px}.card.success strong{color:var(--green)}.card.danger strong{color:var(--red)}.card.warning strong{color:var(--amber)}
    .layout{display:grid;grid-template-columns:1.3fr .7fr;gap:20px;margin-bottom:20px}.panel{overflow:hidden}.panel-header{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid var(--line)}.panel-header h2{font-size:17px;margin:0}.panel-body{padding:18px 20px}.ring-wrap{display:flex;align-items:center;gap:24px}.ring{--rate:0;width:128px;height:128px;border-radius:50%;background:conic-gradient(var(--green) calc(var(--rate)*1%),#e9edf2 0);display:grid;place-items:center}.ring:after{content:"";width:92px;height:92px;background:#fff;border-radius:50%;grid-area:1/1}.ring strong{font-size:23px;z-index:1;grid-area:1/1}.legend{display:grid;gap:9px}.legend span{display:flex;align-items:center;gap:8px}.dot{width:9px;height:9px;border-radius:50%;background:var(--green)}.dot.failed{background:var(--red)}.dot.flaky{background:var(--amber)}.dot.skipped{background:#9aa3af}
    table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;background:#fafbfc}tr:last-child td{border-bottom:0}.number-success{color:var(--green);font-weight:700}.number-danger{color:var(--red);font-weight:700}.bar{display:inline-block;width:78px;height:7px;background:#e9edf2;border-radius:8px;margin-right:8px;overflow:hidden}.bar span{display:block;height:100%;background:var(--green)}
    .slow-list{list-style:none;padding:0;margin:0;display:grid;gap:13px}.slow-list li{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:10px}.slow-list small{display:block;color:var(--muted)}.rank{display:grid;place-items:center;width:26px;height:26px;border-radius:7px;background:var(--orange-soft);color:var(--orange);font-weight:700}.slow-list time{font-weight:700}
    .toolbar{display:flex;flex-wrap:wrap;gap:10px}.toolbar input,.toolbar select{border:1px solid #cfd6e0;border-radius:8px;padding:9px 11px;background:#fff;color:var(--ink)}.toolbar input{min-width:260px}.table-scroll{overflow:auto}.test-table{min-width:1040px}.status{display:inline-flex;border-radius:20px;padding:4px 9px;font-size:12px;font-weight:700;white-space:nowrap}.status.passed{background:var(--green-soft);color:var(--green)}.status.failed{background:var(--red-soft);color:var(--red)}.status.flaky{background:var(--amber-soft);color:var(--amber)}.status.skipped{background:#eef0f3;color:#687180}.tags{display:flex;gap:4px;flex-wrap:wrap}.tag{background:#edf4fb;color:var(--blue);border-radius:12px;padding:2px 7px;font-size:11px}.muted{color:var(--muted);font-size:12px;margin-top:3px}.annotations{color:var(--amber);font-size:12px;margin-top:4px}code{font-size:12px;color:#4b5565}details{margin-top:8px}summary{cursor:pointer;color:var(--red);font-size:12px}pre{white-space:pre-wrap;max-width:760px;background:#fff7f7;border:1px solid #f2d4d4;border-radius:8px;padding:10px;color:#7b3030;font:12px/1.5 Consolas,monospace}.empty{text-align:center;color:var(--muted);padding:28px}
    .execution{margin-top:10px;border-top:1px dashed var(--line);padding-top:8px}.execution>summary{color:var(--blue);font-weight:700}.timeline{list-style:none;padding:4px 0 0 9px;margin:10px 0 0;border-left:2px solid #dfe5ec}.timeline.nested{margin:8px 0 4px 9px}.step-item{position:relative;padding:0 0 14px 18px}.step-marker{position:absolute;width:10px;height:10px;border-radius:50%;left:-6px;top:5px;background:var(--green);box-shadow:0 0 0 3px var(--green-soft)}.step-item.failed>.step-marker{background:var(--red);box-shadow:0 0 0 3px var(--red-soft)}.step-heading{display:flex;align-items:flex-start;gap:7px;flex-wrap:wrap}.step-heading>strong{font-size:13px}.step-heading time{margin-left:auto;color:var(--muted);font-size:11px}.step-category{background:#f0f2f5;color:#667085;border-radius:10px;padding:1px 6px;font-size:10px;text-transform:uppercase;letter-spacing:.04em}.step-detail{color:var(--muted);font-size:11px;margin-top:3px;overflow-wrap:anywhere}.technical>summary{color:var(--muted);font-weight:600}
    footer{max-width:1440px;margin:0 auto;padding:0 28px 30px;color:var(--muted);font-size:12px}.privacy{display:inline-flex;gap:6px;align-items:center;background:#edf4fb;color:#42617c;border-radius:7px;padding:7px 10px}
    @media(max-width:1100px){.cards{grid-template-columns:repeat(3,1fr)}.layout{grid-template-columns:1fr}}@media(max-width:650px){header{padding:26px 20px}main{padding:18px}.cards{grid-template-columns:repeat(2,1fr)}h1{font-size:25px}.status-banner{align-items:flex-start;flex-direction:column}.toolbar input{min-width:100%}}
  </style>
</head>
<body>
  <header>
    <div class="brand"><span class="brand-mark" aria-hidden="true"></span>Calidad E2E</div>
    <h1>${escapeHtml(summary.title)}</h1>
    <p class="subtitle">Visión ejecutiva y trazabilidad paso a paso de los casos automatizados E2E.</p>
    <div class="meta">
      <span>Ambiente: <strong>${escapeHtml(summary.environment.toUpperCase())}</strong></span>
      <span>Ejecución: <strong>${summary.execution}</strong></span>
      <span>Inicio: <strong>${escapeHtml(new Date(summary.startedAt).toLocaleString('es-CL'))}</strong></span>
      <span>Workers: <strong>${summary.workers}</strong></span>
    </div>
  </header>
  <main>
    <section class="status-banner ${strictStatus.className}">
      <div><h2>${strictStatus.label}</h2><p>${failureMessage}</p></div>
      <span class="status ${strictStatus.className}">${RUN_STATUS_LABEL[summary.runStatus]}</span>
    </section>
    <section class="cards" aria-label="Indicadores principales">
      <article class="card"><small>Casos E2E ejecutados</small><strong>${summary.total}</strong></article>
      <article class="card success"><small>Aprobados</small><strong>${summary.passed}</strong></article>
      <article class="card danger"><small>Fallidos</small><strong>${summary.failed}</strong></article>
      <article class="card warning"><small>Inestables</small><strong>${summary.flaky}</strong></article>
      <article class="card"><small>Omitidos</small><strong>${summary.skipped}</strong></article>
      <article class="card"><small>Duración total</small><strong>${formatDuration(summary.duration)}</strong></article>
    </section>
    <section class="layout">
      <article class="panel">
        <div class="panel-header"><h2>Resultado por proyecto</h2><span class="muted">${summary.planned} planificados</span></div>
        <div class="table-scroll"><table><thead><tr><th>Proyecto</th><th>Total</th><th>Aprobados</th><th>Fallidos</th><th>Tasa</th></tr></thead><tbody>${projects}</tbody></table></div>
      </article>
      <article class="panel">
        <div class="panel-header"><h2>Tasa de aprobación</h2></div>
        <div class="panel-body ring-wrap">
          <div class="ring" style="--rate:${summary.passRate}"><strong>${summary.passRate}%</strong></div>
          <div class="legend"><span><i class="dot"></i>Aprobados: ${summary.passed}</span><span><i class="dot flaky"></i>Inestables: ${summary.flaky}</span><span><i class="dot failed"></i>Fallidos: ${summary.failed}</span><span><i class="dot skipped"></i>Omitidos: ${summary.skipped}</span></div>
        </div>
      </article>
    </section>
    <section class="layout">
      <article class="panel">
        <div class="panel-header"><h2>Cobertura por etiqueta</h2></div>
        <div class="table-scroll"><table><thead><tr><th>Etiqueta</th><th>Total</th><th>Aprobados</th><th>Fallidos</th><th>Tasa</th></tr></thead><tbody>${tags}</tbody></table></div>
      </article>
      <article class="panel">
        <div class="panel-header"><h2>Casos con mayor duración</h2></div>
        <div class="panel-body"><ol class="slow-list">${slowest || '<li class="empty">Sin información</li>'}</ol></div>
      </article>
    </section>
    <section class="panel">
      <div class="panel-header">
        <h2>Detalle de casos</h2>
        <div class="toolbar"><input id="case-search" type="search" placeholder="Buscar caso, proyecto o etiqueta"><select id="status-filter"><option value="all">Todos los estados</option><option value="failed">Fallidos</option><option value="flaky">Inestables</option><option value="passed">Aprobados</option><option value="skipped">Omitidos</option></select></div>
      </div>
      <div class="table-scroll"><table class="test-table"><thead><tr><th>Estado</th><th>Caso</th><th>Proyecto</th><th>Etiquetas</th><th>Duración</th><th>Ubicación</th></tr></thead><tbody>${testRows(summary)}</tbody></table></div>
    </section>
  </main>
  <footer><span class="privacy">Alcance: solo casos E2E. Las pruebas unitarias, la preparación de sesión, credenciales y adjuntos sensibles se excluyen del reporte.</span></footer>
  <script>
    const search = document.getElementById('case-search');
    const status = document.getElementById('status-filter');
    const rows = [...document.querySelectorAll('.test-row')];
    function filterRows(){const query=search.value.trim().toLowerCase();const selected=status.value;for(const row of rows){const matchesText=!query||row.dataset.search.includes(query);const matchesStatus=selected==='all'||row.dataset.status===selected;row.hidden=!(matchesText&&matchesStatus)}}
    search.addEventListener('input',filterRows);status.addEventListener('change',filterRows);
  </script>
</body>
</html>`;
}

function testProject(test: TestCase): string {
  let current: Suite | undefined = test.parent;
  while (current) {
    const project = current.project();
    if (project) return project.name;
    current = current.parent;
  }
  return 'Sin proyecto';
}

export default class ExecutiveHtmlReporter implements Reporter {
  private readonly records = new Map<string, ExecutiveTestRecord>();
  private readonly outputFolder: string;
  private readonly reportTitle: string;
  private planned = 0;
  private workers = 1;

  constructor(options: ExecutiveReporterOptions = {}) {
    this.outputFolder = path.resolve(process.cwd(), options.outputFolder ?? 'executive-report');
    this.reportTitle = options.title ?? 'Reporte Ejecutivo de Automatización';
  }

  printsToStdio(): boolean {
    return false;
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.planned = suite.allTests().filter((test) => isExecutiveProject(testProject(test))).length;
    this.workers = config.workers;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const project = testProject(test);
    if (!isExecutiveProject(project)) return;
    const titlePath = test.titlePath().filter(Boolean);
    const suite = titlePath.slice(0, -1).join(' › ');
    const relativeFile = path.relative(process.cwd(), test.location.file).replaceAll('\\', '/');
    const error = result.error?.message ?? result.errors[0]?.message;
    const annotations = result.annotations
      .map(({ type, description }) => `${type}${description ? `: ${description}` : ''}`)
      .map((annotation) => sanitizeReportText(annotation));

    this.records.set(test.id, {
      id: test.id,
      title: sanitizeReportText(test.title),
      suite: sanitizeReportText(suite),
      project: sanitizeReportText(project),
      file: sanitizeReportText(relativeFile),
      line: test.location.line,
      status: result.status,
      outcome: test.outcome(),
      expectedStatus: test.expectedStatus,
      startedAt: result.startTime.toISOString(),
      duration: result.duration,
      retry: result.retry,
      tags: test.tags.map((tag) => sanitizeReportText(tag)),
      annotations,
      steps: extractExecutiveSteps(result.steps),
      error: error ? sanitizeReportText(error).slice(0, 2_000) : undefined,
    });
  }

  onEnd(_result: FullResult): void {
    const records = [...this.records.values()];
    if (!records.length) return;
    const startedAt = Math.min(...records.map((record) => Date.parse(record.startedAt)));
    const finishedAt = Math.max(
      ...records.map((record) => Date.parse(record.startedAt) + record.duration),
    );
    const hasInterrupted = records.some((record) => record.status === 'interrupted');
    const hasFailure = records.some((record) => ['failed', 'timedOut'].includes(record.status));
    const executiveResult: Pick<FullResult, 'status' | 'startTime' | 'duration'> = {
      status: hasInterrupted ? 'interrupted' : hasFailure ? 'failed' : 'passed',
      startTime: new Date(startedAt),
      duration: Math.max(0, finishedAt - startedAt),
    };
    const summary = buildExecutiveSummary(records, executiveResult, {
      title: this.reportTitle,
      environment: envConfig.envName,
      execution: process.env.CI ? 'CI' : 'Local',
      workers: this.workers,
      planned: this.planned,
    });
    fs.mkdirSync(this.outputFolder, { recursive: true });
    fs.writeFileSync(
      path.join(this.outputFolder, 'summary.json'),
      JSON.stringify(summary, null, 2),
      'utf8',
    );
    fs.writeFileSync(path.join(this.outputFolder, 'index.html'), renderExecutiveReport(summary));
  }
}

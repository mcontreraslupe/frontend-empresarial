import type { Reporter, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import fs from 'node:fs';
import path from 'node:path';

/** Se ejecuta antes de HTML/list para omitir los valores de los campos editados. */
export default class PrivacyReporter implements Reporter {
  displaysStdio(): boolean {
    return false;
  }

  onStepBegin(_test: TestCase, _result: TestResult, step: TestStep): void {
    this.sanitizeFillStep(step);
  }

  onStepEnd(_test: TestCase, _result: TestResult, step: TestStep): void {
    this.sanitizeFillStep(step);
  }

  onTestEnd(_test: TestCase, result: TestResult): void {
    const visit = (step: TestStep): void => {
      this.sanitizeFillStep(step);
      step.steps.forEach(visit);
    };
    result.steps.forEach(visit);

    const attachments = result.attachments ?? [];
    for (let index = attachments.length - 1; index >= 0; index -= 1) {
      const attachment = attachments[index];
      if (attachment.name !== 'error-context') continue;
      if (
        attachment.path &&
        path.basename(attachment.path) === 'error-context.md' &&
        fs.existsSync(attachment.path)
      ) {
        fs.unlinkSync(attachment.path);
      }
      attachments.splice(index, 1);
    }
  }

  private sanitizeFillStep(step: TestStep): void {
    if (step.category !== 'pw:api' || !step.title.startsWith('Fill ')) {
      return;
    }

    step.title = 'Fill (valor omitido por privacidad)';
    if (step.error) {
      // El fallo se conserva; el call log original puede contener el valor enviado.
      step.error = {
        message: 'No se pudo completar el campo (detalle omitido por privacidad).',
        location: step.error.location,
      };
    }
  }
}

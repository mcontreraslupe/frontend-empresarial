import { type Locator, type Page, expect } from '@playwright/test';
import type { CommercialContractData } from '@data/dynamic/commercial-contract-data';
import fs from 'node:fs';

export class CommercialContractApplicationPage {
  readonly heading: Locator;
  readonly contractualSection: Locator;
  readonly personalSection: Locator;
  readonly companySection: Locator;
  readonly documentsSection: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {
      name: 'Solicitar Acreditación Contrato Comercial',
      exact: true,
    });
    this.contractualSection = page.getByRole('region', {
      name: /Datos Contractuales$/,
    });
    this.personalSection = page.getByRole('region', {
      name: /Información de Personal$/,
    });
    this.companySection = page.getByRole('region', { name: /Empresa$/ });
    this.documentsSection = page.getByRole('region', { name: /Documentos$/ });
  }

  private dropdown(label: string): Locator {
    return this.page.getByLabel(label, { exact: true });
  }

  private async selectDropdown(label: string, option: string, filter?: string): Promise<void> {
    const dropdown = this.dropdown(label);
    const trigger = dropdown.getByRole('button', { name: 'dropdown trigger', exact: true });
    const filterInput = dropdown.getByRole('textbox');
    const optionLocator = this.page.getByRole('option', { name: option, exact: true });

    await expect(async () => {
      if (!(await filterInput.isVisible())) {
        await trigger.click();
      }
      if (filter) {
        await expect(filterInput).toBeVisible();
        await filterInput.fill(filter);
      }
      await expect(optionLocator).toBeVisible({ timeout: 2_000 });
      await optionLocator.click({ timeout: 2_000 });
      await expect(dropdown).toContainText(option);
    }).toPass({ timeout: 30_000 });
  }

  private async chooseDate(label: string, value: string): Promise<void> {
    const calendar = this.page.getByLabel(label, { exact: true });
    const input = calendar.getByRole('textbox');
    await input.click();

    const [day, month, year] = value.split('/');
    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    await expect(async () => {
      const selected = await calendar.evaluate(
        (root, target) => {
          const field = root.querySelector('input');
          if (field?.value === target.value) return true;

          const visible = (element: Element): element is HTMLElement =>
            element instanceof HTMLElement && element.getBoundingClientRect().width > 0;
          const byText = (tag: 'button' | 'span', text: string): HTMLElement | undefined =>
            [...root.querySelectorAll(tag)].find(
              (element) => visible(element) && element.textContent?.trim() === text,
            ) as HTMLElement | undefined;

          if (target.today) {
            byText('button', 'Hoy')?.click();
            return false;
          }

          const buttons = [...root.querySelectorAll('button')].filter(visible);
          const displayedYear = buttons.find((button) =>
            /^\d{4}$/.test(button.textContent?.trim() ?? ''),
          );
          const displayedMonth = buttons.find((button) =>
            /^(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)$/.test(
              button.textContent?.trim() ?? '',
            ),
          );

          if (
            displayedYear?.textContent?.trim() === target.year &&
            displayedMonth?.textContent?.trim() === target.fullMonth
          ) {
            byText('span', target.day)?.click();
            return false;
          }

          const monthOption = byText('span', target.shortMonth);
          if (monthOption) {
            monthOption.click();
            return false;
          }

          const yearOption = byText('span', target.year);
          if (yearOption) {
            yearOption.click();
            return false;
          }

          if (displayedYear) displayedYear.click();
          else if (field instanceof HTMLElement) field.click();
          return false;
        },
        {
          value,
          today: label === 'Seleccione fecha Fecha de Inicio de Contrato',
          day: String(Number(day)),
          year,
          shortMonth: monthNames[Number(month) - 1],
          fullMonth: 'Diciembre',
        },
      );
      expect(selected).toBeTruthy();
    }).toPass({ timeout: 60_000 });

    await expect(input).toHaveValue(value);
  }

  async selectSalvador(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
    await this.selectDropdown('Lista de centros de trabajo', 'División Salvador');
    const continueButton = this.page.getByRole('button', { name: 'Crear perfil', exact: true });
    await expect(continueButton).toHaveText('Continuar');
    const [categoryCatalogResponse, managementCatalogResponse] = await Promise.all([
      this.page.waitForResponse((response) =>
        /\/acreditacion-comunes\/extras\/categorias-empresa\/\d+$/.test(
          new URL(response.url()).pathname,
        ),
      ),
      this.page.waitForResponse((response) =>
        /\/acreditacion-administracion\/gerencias\/(?:public\/)?listar-by-centro$/.test(
          new URL(response.url()).pathname,
        ),
      ),
      continueButton.click(),
    ]);
    await Promise.all([categoryCatalogResponse.finished(), managementCatalogResponse.finished()]);
    expect(categoryCatalogResponse.ok()).toBeTruthy();
    expect(managementCatalogResponse.ok()).toBeTruthy();
    await expect(this.contractualSection).toBeVisible({ timeout: 30_000 });
  }

  async completeContractualData(data: CommercialContractData): Promise<void> {
    await this.contractualSection
      .getByLabel('Ingrese Identificador de Contrato o Servicio', { exact: true })
      .fill(data.contractNumber);
    await this.contractualSection
      .getByLabel('Ingrese Descripción del Servicio', { exact: true })
      .fill(data.serviceDescription);
    await this.selectDropdown(
      'Seleccione Rubro del Contrato',
      data.contractCategory,
      data.contractCategory,
    );
    const workAreaCatalogResponsePromise = this.page.waitForResponse((response) =>
      /\/acreditacion-administracion\/areas-trabajo\/(?:public\/)?listar-by-gerencia$/.test(
        new URL(response.url()).pathname,
      ),
    );
    await this.selectDropdown('Seleccione Gerencias', data.management);
    const workAreaCatalogResponse = await workAreaCatalogResponsePromise;
    await workAreaCatalogResponse.finished();
    expect(workAreaCatalogResponse.ok()).toBeTruthy();
    await this.selectDropdown('Seleccione Áreas de Trabajo', data.workArea);
    await this.chooseDate('Seleccione fecha Fecha de Inicio de Contrato', data.startDate);
    await this.chooseDate('Seleccione fecha Fecha de Término de Contrato', data.endDate);

    await this.contractualSection.getByRole('button', { name: 'Incorporar', exact: true }).click();
    const dialog = this.page.getByRole('dialog');
    await expect(dialog.getByText('Crear Jornadas', { exact: true })).toBeVisible();
    await this.selectDropdown('Lista de Tipos de jornadas', 'Ordinaria');
    await this.selectDropdown('Lista de turnos', '10X5');
    const saveShiftButton = dialog.getByRole('button', { name: 'Crear tipo', exact: true });
    await expect(saveShiftButton).toContainText('Guardar y Seguir');
    await saveShiftButton.click();
    const success = this.page.getByText('Jornada incorporada exitosamente', { exact: true });
    await expect(success).toBeVisible();
    await this.page.getByRole('button', { name: 'OK', exact: true }).click();

    await this.contractualSection
      .getByLabel('Ingrese Dotación Ref. de Trabajadores', { exact: true })
      .fill(data.workers);
    await this.contractualSection
      .getByLabel('Ingrese Cantidad Referencial Vehículo/maquinaria/equipo', { exact: true })
      .fill(data.vehicles);
    await this.selectAdcWithoutReadingPersonalData();
    await this.selectEcf();
    await expect(
      this.contractualSection.getByRole('button', { name: 'Siguiente', exact: true }),
    ).toBeEnabled();
    await this.contractualSection.getByRole('button', { name: 'Siguiente', exact: true }).click();
    await expect(this.personalSection).toBeVisible();
  }

  private async selectAdcWithoutReadingPersonalData(): Promise<void> {
    const control = this.dropdown('Seleccione ADC Codelco');
    const opener = control.getByRole('button', { name: 'dropdown trigger', exact: true });
    const options = this.page.getByRole('option');

    await expect(async () => {
      const selectVisibleOption = (): Promise<boolean> =>
        options.evaluateAll((elements) => {
          const candidates = elements.filter((element) => {
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 && rect.height > 0 && element.getAttribute('aria-label') !== 'CODELCO'
            );
          });
          const candidate = candidates[Math.floor(Math.random() * candidates.length)];
          if (!(candidate instanceof HTMLElement)) return false;
          candidate.click();
          return true;
        });

      if (await selectVisibleOption()) return;
      await opener.click({ timeout: 2_000 });
      expect(await selectVisibleOption()).toBeTruthy();
    }).toPass({ timeout: 30_000 });

    await expect
      .poll(() =>
        control.evaluate((root) => {
          const selectedLabel = root.querySelector('.p-dropdown-label');
          return Boolean(
            selectedLabel &&
            !selectedLabel.classList.contains('p-placeholder') &&
            selectedLabel.textContent?.trim(),
          );
        }),
      )
      .toBeTruthy();
  }

  private async selectEcf(): Promise<void> {
    const control = this.dropdown('Seleccione ECF');
    const choice = ['ECF3', 'ECF4', 'ECF21'][Math.floor(Math.random() * 3)];
    await control.locator('.p-multiselect-trigger').click();
    await control.getByLabel(choice, { exact: true }).click();
    await expect(control).toContainText(choice);
    await control.locator('.p-multiselect-close').click();
  }

  async completePersonalData(data: CommercialContractData): Promise<void> {
    const person = data.person;
    await this.selectDropdown('Seleccione Tipo de Identificación ADC Contratista', 'RUT');
    await this.personalSection
      .getByLabel('Ingrese Identificación ADC Contratista')
      .fill(person.rut);
    await this.personalSection
      .getByLabel('Ingrese Nombre y Apellido ADC Contratista')
      .fill(person.fullName);
    await this.personalSection.getByLabel('Ingrese Correo ADC Contratista').fill(person.email);
    await this.selectDropdown('Seleccione Tipo de Identificación APR', 'RUT');
    await this.personalSection.getByLabel('Ingrese Identificación APR').fill(person.rut);
    await this.personalSection.getByLabel('Ingrese Nombre y Apellido APR').fill(person.fullName);
    await this.personalSection.getByLabel('Ingrese Correo de APR').fill(person.email);

    await this.personalSection.getByRole('button', { name: 'Incorporar', exact: true }).click();
    const dialog = this.page.getByRole('dialog');
    await expect(
      dialog.getByText('Crear personas para retiro de credenciales', { exact: true }),
    ).toBeVisible();
    await this.selectDropdown('Lista de Tipos de identificación', 'RUT');
    await dialog.getByLabel('Ingrese una Identificación', { exact: true }).fill(person.rut);
    await dialog.getByLabel('Ingrese Nombre y Apellido', { exact: true }).fill(person.fullName);
    await dialog.getByLabel('Ingrese una categoría', { exact: true }).fill(person.email);
    await dialog.getByLabel('Ingrese un teléfono', { exact: true }).fill(person.phone);
    const saveAuthorizedPersonButton = dialog.getByRole('button', {
      name: 'Crear tipo',
      exact: true,
    });
    await expect(saveAuthorizedPersonButton).toContainText('Guardar y Seguir');
    await saveAuthorizedPersonButton.click();
    await this.page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(
      this.personalSection.getByRole('button', { name: 'Siguiente', exact: true }),
    ).toBeEnabled();
    await this.personalSection.getByRole('button', { name: 'Siguiente', exact: true }).click();
    await expect(this.companySection).toBeVisible();
    await expect(
      this.companySection.getByRole('heading', { name: 'Empresa *', exact: true }),
    ).toBeVisible();
    await expect(
      this.companySection.getByRole('button', { name: 'Siguiente', exact: true }),
    ).toBeEnabled();
    await this.companySection.getByRole('button', { name: 'Siguiente', exact: true }).click();
    await expect(this.documentsSection).toBeVisible();
  }

  async uploadMandatoryDocuments(pdfPath: string, imagePath: string): Promise<string[]> {
    const selector = this.documentsSection.locator('#documentos');
    const trigger = selector.getByRole('button', { name: 'dropdown trigger', exact: true });
    await trigger.click();
    const documentOptions = this.page.locator('.p-dropdown-item');
    await expect
      .poll(() =>
        documentOptions.evaluateAll(
          (items) =>
            items.filter((item) => {
              const rect = item.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            }).length,
        ),
      )
      .toBeGreaterThan(0);
    const mandatory = await documentOptions.evaluateAll((items) =>
      items
        .filter((item) => {
          const rect = item.getBoundingClientRect();
          return (
            rect.width > 0 && rect.height > 0 && Boolean(item.querySelector('.required-control'))
          );
        })
        .map((item) => item.getAttribute('aria-label'))
        .filter((name): name is string => Boolean(name)),
    );
    expect(mandatory).toHaveLength(4);

    for (const [index, optionName] of mandatory.entries()) {
      const option = this.page.getByRole('option', { name: optionName, exact: true });
      await expect(async () => {
        if (!(await option.isVisible())) await trigger.click({ timeout: 2_000 });
        await expect(option).toBeVisible({ timeout: 2_000 });
        await option.click({ timeout: 2_000 });
      }).toPass({ timeout: 30_000 });

      const fileInput = this.documentsSection.locator('input[type="file"]');
      const accept = (await fileInput.getAttribute('accept')) || '';
      const isImage = /image|jpg|jpeg|png/i.test(accept);
      const target = isImage ? imagePath : pdfPath;
      await fileInput.setInputFiles({
        name: `documento-obligatorio-${index + 1}.${isImage ? 'jpg' : 'pdf'}`,
        mimeType: isImage ? 'image/jpeg' : 'application/pdf',
        buffer: await fs.promises.readFile(target),
      });

      const uploadedRow = this.documentsSection.getByRole('row').filter({ hasText: optionName });
      await expect(uploadedRow).toBeVisible({ timeout: 30_000 });
      await expect(uploadedRow).toContainText('BORRADOR');
    }
    return mandatory;
  }

  async submit(data: CommercialContractData): Promise<string> {
    await expect(
      this.documentsSection.getByRole('button', { name: 'Guardar y enviar', exact: true }),
    ).toBeEnabled();
    await this.documentsSection
      .getByRole('button', { name: 'Guardar y enviar', exact: true })
      .click();
    const confirmation = this.page.getByText('¿Estás seguro de que quieres continuar?', {
      exact: true,
    });
    await expect(confirmation).toBeVisible();
    const failedResponses: Array<{ method: string; status: number }> = [];
    const collectFailure = (response: import('@playwright/test').Response): void => {
      const method = response.request().method();
      if (response.status() >= 400 && ['POST', 'PUT', 'PATCH'].includes(method)) {
        failedResponses.push({ method, status: response.status() });
      }
    };
    this.page.on('response', collectFailure);
    await this.page.getByRole('button', { name: 'Sí', exact: true }).click();
    await expect(confirmation).toBeHidden({ timeout: 30_000 });
    const success = this.page.getByText(/Solicitud SCE-CONTRATO-\d+ guardada correctamente/);
    const activePopup = this.page.locator('.swal2-popup.swal2-show');
    let outcome: 'success' | 'list' = 'success';
    try {
      await expect
        .poll(
          async () => {
            if (await success.isVisible()) return 'success';
            if (/lista-solicitudes/.test(this.page.url())) return 'list';
            return 'waiting';
          },
          { timeout: 60_000 },
        )
        .toMatch(/^(success|list)$/);
      outcome = (await success.isVisible())
        ? 'success'
        : /lista-solicitudes/.test(this.page.url())
          ? 'list'
          : 'success';
    } catch {
      const popupTitle = (await activePopup.locator('.swal2-title').textContent())?.trim();
      const popupMessage = (await activePopup.textContent())?.trim();
      const iconClass = (await activePopup.locator('.swal2-icon').getAttribute('class')) ?? '';
      const alertKind = iconClass.includes('swal2-error')
        ? 'error'
        : iconClass.includes('swal2-warning')
          ? 'advertencia'
          : 'sin clasificación';
      const safeTitle = popupTitle
        ? this.redactGeneratedPersonalData(popupTitle, data)
        : 'sin título';
      const safeMessage = popupMessage
        ? this.redactGeneratedPersonalData(popupMessage, data).slice(0, 500)
        : 'sin mensaje';
      const statuses = failedResponses
        .map(({ method, status }) => `${method} ${status}`)
        .join(', ');
      throw new Error(
        `El envío no finalizó en 60 segundos (${alertKind}; ${safeTitle}; ${safeMessage}; respuestas fallidas: ${statuses || 'ninguna'}).`,
      );
    } finally {
      this.page.off('response', collectFailure);
    }

    if (outcome === 'list') {
      const row = this.page
        .getByRole('row')
        .filter({ has: this.page.getByText(data.contractNumber, { exact: true }) });
      await expect(row).toContainText('ENVIADO', { timeout: 30_000 });
      const requestNumber = (await row.innerText()).match(/SCE-CONTRATO-\d+/)?.[0];
      if (!requestNumber) throw new Error('La fila enviada no contiene un número de solicitud.');
      return requestNumber;
    }

    const message = (await success.textContent()) || '';
    const requestNumber = message.match(/SCE-CONTRATO-\d+/)?.[0];
    if (!requestNumber)
      throw new Error('La confirmación no contiene el número de solicitud esperado.');
    await this.page.getByRole('button', { name: 'OK', exact: true }).click();
    return requestNumber;
  }

  private redactGeneratedPersonalData(message: string, data: CommercialContractData): string {
    return [data.person.rut, data.person.fullName, data.person.email, data.person.phone].reduce(
      (redacted, value) => redacted.replaceAll(value, '[dato omitido]'),
      message,
    );
  }
}

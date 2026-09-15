import { type Locator, type Page, expect } from '@playwright/test';
import { SidebarComponent } from '@components/sidebar.component';

export class CommercialContractRequestsPage {
  readonly heading: Locator;
  readonly createRequestButton: Locator;
  private readonly sidebar: SidebarComponent;

  constructor(private readonly page: Page) {
    this.sidebar = new SidebarComponent(page);
    this.heading = page.getByRole('heading', { name: 'Lista de Solicitudes Creadas', exact: true });
    this.createRequestButton = page.getByRole('button', {
      name: 'Ir a crear solicitud',
      exact: true,
    });
  }

  async open(): Promise<void> {
    await this.page.goto('/v2/inicio');
    await this.sidebar.open();
    await this.sidebar.companiesContractsMenuItem.click();
    await this.sidebar.container
      .locator('a')
      .filter({ has: this.page.getByText('Lista de Solicitudes', { exact: true }) })
      .click();
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
  }

  async visibleAutomationContractNumbers(): Promise<string[]> {
    return this.page.getByText(/^461\d{7}$/).allTextContents();
  }

  async startCommercialContractRequest(): Promise<Page> {
    await expect(this.createRequestButton).toBeEnabled();
    await this.createRequestButton.click();
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const requestType = dialog.getByLabel('Seleccione un tipo de solicitud', { exact: true });
    await requestType.getByRole('button', { name: 'dropdown trigger', exact: true }).click();
    await this.page
      .getByRole('option', {
        name: 'Solicitar Acreditación Contrato Comercial',
        exact: true,
      })
      .click();

    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      dialog.getByRole('button', { name: 'Continuar', exact: true }).click(),
    ]);
    await newPage.waitForURL(/\/v2\/empresas\/contratos\/solicitud\/crear\/sol-acred-cont$/, {
      waitUntil: 'domcontentloaded',
    });
    return newPage;
  }
}

import { type Locator, type Page, expect } from '@playwright/test';

export class SidebarComponent {
  readonly openButton: Locator;
  readonly closeButton: Locator;
  readonly container: Locator;

  readonly companiesContractsMenuItem: Locator;
  readonly peopleMenuItem: Locator;
  readonly driverLicenseMenuItem: Locator;
  readonly vehiclesMenuItem: Locator;
  readonly reportsMenuItem: Locator;
  readonly visitsMenuItem: Locator;
  readonly consultRecordsMenuItem: Locator;
  readonly flexibleReportsMenuItem: Locator;

  readonly changePlatformButton: Locator;

  constructor(private readonly page: Page) {
    this.openButton = page.locator('.el-toggle-sidebar-open');
    this.closeButton = page.locator('.el-toggle-sidebar-close');
    this.container = page.locator('.menu-wrapper');

    this.companiesContractsMenuItem = this.menuItem('Empresas / Contratos');
    this.peopleMenuItem = this.menuItem('Personas');
    this.driverLicenseMenuItem = this.menuItem('Licencia de Conducir');
    this.vehiclesMenuItem = this.menuItem('Vehículos');
    this.reportsMenuItem = this.menuItem('Reportes');
    this.visitsMenuItem = this.menuItem('Visitas');
    this.consultRecordsMenuItem = this.menuItem('Consultar Fichas');
    this.flexibleReportsMenuItem = this.menuItem('Reportes Flexibles');

    this.changePlatformButton = page.getByRole('button', { name: 'Ir a Control Laboral' });
  }

  menuItem(name: string): Locator {
    return this.container.locator('a').filter({
      has: this.page.getByText(name, { exact: true }),
    });
  }

  subMenuItem(name: string): Locator {
    return this.container.locator('a').filter({
      has: this.page.getByText(name, { exact: true }),
    });
  }

  async assertModulesVisible(modules: readonly string[]): Promise<void> {
    for (const moduleName of modules) {
      await expect(this.menuItem(moduleName)).toBeVisible();
    }
  }

  async assertModulesHidden(modules: readonly string[]): Promise<void> {
    for (const moduleName of modules) {
      await expect(this.menuItem(moduleName)).toBeHidden();
    }
  }

  async navigateToSubmodule(parentModule: string, submoduleName: string): Promise<void> {
    const parent = this.menuItem(parentModule);
    await expect(parent).toBeVisible();
    await parent.click();
    const sub = this.subMenuItem(submoduleName);
    await expect(sub).toBeVisible();
    await sub.click();
  }

  async verifySampleModule(sample: {
    moduleName: string;
    submoduleName?: string;
    expectedUrlPattern?: RegExp;
  }): Promise<void> {
    if (sample.submoduleName) {
      await this.navigateToSubmodule(sample.moduleName, sample.submoduleName);
      if (sample.expectedUrlPattern) {
        await expect(this.page).toHaveURL(sample.expectedUrlPattern);
      }
    } else {
      await this.menuItem(sample.moduleName).click();
      await expect(this.menuItem(sample.moduleName)).toBeVisible();
    }
  }

  async open(): Promise<void> {
    const isAlreadyOpen = await this.container
      .evaluate((el) => el.classList.contains('layout-sidebar-active'))
      .catch(() => false);

    if (!isAlreadyOpen) {
      await expect(this.openButton).toBeVisible();
      await this.openButton.click();
    }

    await expect(this.container).toHaveClass(/layout-sidebar-active/);
    await expect(this.closeButton).toBeVisible();
  }

  async assertAllModulesAreVisible(): Promise<void> {
    await expect(this.companiesContractsMenuItem).toBeVisible();
    await expect(this.peopleMenuItem).toBeVisible();
    await expect(this.driverLicenseMenuItem).toBeVisible();
    await expect(this.vehiclesMenuItem).toBeVisible();
    await expect(this.reportsMenuItem).toBeVisible();
    await expect(this.visitsMenuItem).toBeVisible();
    await expect(this.consultRecordsMenuItem).toBeVisible();
    await expect(this.flexibleReportsMenuItem).toBeVisible();
  }

  async close(): Promise<void> {
    const isOpen = await this.container
      .evaluate((el) => el.classList.contains('layout-sidebar-active'))
      .catch(() => false);

    if (isOpen) {
      await expect(this.closeButton).toBeVisible();
      await this.closeButton.click();
    }

    await expect(this.container).not.toHaveClass(/layout-sidebar-active/);
    await expect(this.openButton).toBeVisible();
  }
}

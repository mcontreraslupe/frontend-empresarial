import { type Locator, type Page, expect } from '@playwright/test';

export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly contractorProfileButton: Locator;
  readonly codelcoProfileButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByLabel(/usuario/i);

    // Se utiliza 'input#password' debido a que en el DOM actual de PrimeNG:
    // 1) El label 'Contraseña *' no está asociado semánticamente (carece de atributo 'for' y no envuelve al input).
    // 2) El atributo id="password" se encuentra duplicado en el DOM (<p-password id="password"> y <input id="password">).
    // Se especifica el tag 'input' para desambiguar e impedir una violación de modo estricto (strict mode violation).
    this.passwordInput = page.locator('input#password');

    this.loginButton = page.getByRole('button', { name: 'Iniciar sesión' });
    this.contractorProfileButton = page.getByRole('button', { name: 'CONTRATISTA' });
    this.codelcoProfileButton = page.getByRole('button', { name: 'CODELCO' });
    this.rememberMeCheckbox = page.getByRole('checkbox', { name: /recordarme/i });
    this.heading = page.getByRole('heading', {
      name: /sistema único de acreditación y control laboral/i,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/sign-in');
  }

  async assertIsLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/sign-in$/);
    await expect(this.heading).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
    await expect(this.usernameInput).toBeEditable();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.passwordInput).toBeEditable();
    await expect(this.loginButton).toBeVisible();
    await expect(this.loginButton).toBeDisabled();
  }

  async selectContractorProfile(): Promise<void> {
    await expect(this.contractorProfileButton).toBeVisible();
    const isSelected = await this.contractorProfileButton.evaluate((el) =>
      el.classList.contains('p-highlight'),
    );

    if (!isSelected) {
      await this.contractorProfileButton.click();
    }

    await expect(this.contractorProfileButton).toHaveClass(/p-highlight/);
  }

  async loginAsContractor(
    username: string,
    password: string,
  ): Promise<'platform-selection' | 'home'> {
    await this.selectContractorProfile();
    try {
      await this.usernameInput.fill(username);
      await this.passwordInput.fill(password);
    } catch {
      // El call log de fill puede incluir el valor enviado al campo.
      throw new Error('No se pudieron completar los campos de autenticación.');
    }
    await expect(this.loginButton).toBeEnabled();
    await this.loginButton.click();
    await this.page.waitForURL(
      (url) => /\/v2\/(account\/select-platform|inicio)$/.test(url.pathname),
      { waitUntil: 'domcontentloaded', timeout: 30_000 },
    );
    if (this.page.url().endsWith('/v2/inicio')) {
      await expect(this.page).toHaveURL(/\/v2\/inicio$/);
      return 'home';
    }
    await expect(this.page).toHaveURL(/\/v2\/account\/select-platform$/);
    return 'platform-selection';
  }

  async loginToAccreditationHome(username: string, password: string): Promise<void> {
    const destination = await this.loginAsContractor(username, password);
    if (destination === 'platform-selection') {
      const accreditationCard = this.page.getByTitle('Ir a Acreditación');
      await expect(accreditationCard).toBeVisible();
      await accreditationCard.click();
    }
    await expect(this.page).toHaveURL(/\/v2\/inicio$/);
  }
}

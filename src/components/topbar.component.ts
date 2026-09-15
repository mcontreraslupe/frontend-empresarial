import { type Locator, type Page, expect } from '@playwright/test';

export class TopbarComponent {
  readonly profileBadge: Locator;
  readonly avatarTrigger: Locator;
  readonly logoutOption: Locator;
  readonly confirmLogoutDialog: Locator;
  readonly confirmYesButton: Locator;

  constructor(private readonly page: Page) {
    // El elemento del perfil se ubica en la sección derecha de la barra superior.
    this.profileBadge = page.locator('.layout-topbar-right b');

    // Menú desplegable del usuario activado por el avatar
    this.avatarTrigger = page.locator('.topbar-item.user-profile > a');
    this.logoutOption = page
      .locator('.topbar-item.user-profile')
      .getByText('Cerrar Sesión', { exact: true });

    // Diálogo modal de confirmación de cierre de sesión
    this.confirmLogoutDialog = page.getByRole('dialog');
    this.confirmYesButton = this.confirmLogoutDialog.getByRole('button', {
      name: 'Sí',
      exact: true,
    });
  }

  async assertProfileBadge(expectedBadge: string): Promise<void> {
    await expect(this.profileBadge).toBeVisible();
    await expect(this.profileBadge).toHaveText(expectedBadge);
  }

  async logout(): Promise<void> {
    await expect(this.avatarTrigger).toBeVisible();
    await this.avatarTrigger.click();

    await expect(this.logoutOption).toBeVisible();
    await this.logoutOption.click();

    await expect(this.confirmLogoutDialog).toBeVisible();
    await expect(
      this.confirmLogoutDialog.getByText('¿Está Seguro(a) de cerrar sesión?'),
    ).toBeVisible();

    await expect(this.confirmYesButton).toBeVisible();
    await this.confirmYesButton.click();

    await this.page.waitForURL((url) => /\/sign-in/.test(url.pathname), {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });
    await expect(this.page).toHaveURL(/.*\/sign-in$/);
  }
}

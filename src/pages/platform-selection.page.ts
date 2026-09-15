import { type Locator, type Page, expect } from '@playwright/test';

export class PlatformSelectionPage {
  readonly accreditationCard: Locator;
  readonly laborControlCard: Locator;

  constructor(private readonly page: Page) {
    this.accreditationCard = page.getByTitle('Ir a Acreditación');
    this.laborControlCard = page.getByTitle('Ir a Certificación');
  }

  async assertIsLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/v2\/account\/select-platform$/);
    await expect(this.accreditationCard).toBeVisible();
    await expect(this.laborControlCard).toBeVisible();
  }

  async selectAccreditation(): Promise<void> {
    await expect(this.accreditationCard).toBeVisible();
    await this.accreditationCard.click();
    await expect(this.page).toHaveURL(/.*\/v2\/inicio$/);
  }
}

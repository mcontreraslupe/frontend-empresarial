import { type Page, expect } from '@playwright/test';
import { SidebarComponent } from '@components/sidebar.component';
import { TopbarComponent } from '@components/topbar.component';

export class AccreditationHomePage {
  readonly sidebar: SidebarComponent;
  readonly topbar: TopbarComponent;

  constructor(private readonly page: Page) {
    this.sidebar = new SidebarComponent(page);
    this.topbar = new TopbarComponent(page);
  }

  async assertIsLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/v2\/inicio$/);
    await expect(this.sidebar.openButton).toBeVisible();
    await expect(this.sidebar.container).toBeVisible();
    await expect(this.page.getByRole('searchbox')).toBeVisible();
  }
}

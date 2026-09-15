import { test as base, expect } from '@playwright/test';
import { LoginPage } from '@pages/login.page';
import { PlatformSelectionPage } from '@pages/platform-selection.page';
import { AccreditationHomePage } from '@pages/accreditation-home.page';
import { CommercialContractRequestsPage } from '@pages/commercial-contract-requests.page';

export interface PageFixtures {
  loginPage: LoginPage;
  platformSelectionPage: PlatformSelectionPage;
  accreditationHomePage: AccreditationHomePage;
  commercialContractRequestsPage: CommercialContractRequestsPage;
}

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  platformSelectionPage: async ({ page }, use) => {
    await use(new PlatformSelectionPage(page));
  },
  accreditationHomePage: async ({ page }, use) => {
    await use(new AccreditationHomePage(page));
  },
  commercialContractRequestsPage: async ({ page }, use) => {
    await use(new CommercialContractRequestsPage(page));
  },
});

export { expect };

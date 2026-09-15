import { Page } from '@playwright/test';

/**
 * BasePage minimalista.
 *
 * REGLA DE ARQUITECTURA:
 * No envuelve métodos nativos de Playwright (click, fill, locator, waitForTimeout, expect).
 * Las clases que extiendan BasePage deben interactuar directamente con `this.page`
 * y sus `Locator` nativos aprovechando las esperas automáticas de Playwright.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}
}

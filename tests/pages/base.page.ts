import { expect, Locator, Page } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  protected get cartLink(): Locator { return this.page.getByTestId('enlace-carrito'); }
  protected get logoutButton(): Locator { return this.page.getByTestId('cerrar-sesion'); }

  async open(path: string): Promise<void> { await this.page.goto(path); }
  async goToCart(): Promise<void> { await this.cartLink.click(); }
  async logout(): Promise<void> { await this.logoutButton.click(); }
  async expectCartCount(units: number): Promise<void> {
    await expect(this.cartLink).toContainText(`Carrito (${units})`, { timeout: 5_000 });
  }
}

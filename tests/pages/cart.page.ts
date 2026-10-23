import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  private get rows(): Locator { return this.page.getByTestId('linea'); }
  private get error(): Locator { return this.page.getByTestId('error'); }
  private get continueButton(): Locator { return this.page.getByTestId('continuar'); }
  private get subtotal(): Locator { return this.page.getByTestId('subtotal'); }
  private get emptyMessage(): Locator { return this.page.getByTestId('vacio'); }

  async open(): Promise<void> { await super.open('/carrito.html'); }
  async rowCount(): Promise<number> { return this.rows.count(); }
  async productNames(): Promise<string[]> { return this.rows.locator('td:first-child').allTextContents(); }
  async setQuantity(id: string, quantity: string): Promise<void> {
    const input = this.page.getByTestId(`cantidad-${id}`);
    await input.fill(quantity);
    await input.dispatchEvent('change');
  }
  async removeProduct(id: string): Promise<void> { await this.page.getByTestId(`quitar-${id}`).click(); }
  async continueToCheckout(): Promise<void> { await this.continueButton.click(); }
  async expectError(message: string): Promise<void> { await expect(this.error).toHaveText(message); }
  async expectCheckoutBlocked(): Promise<void> { await expect(this.continueButton).toBeDisabled(); }
  async expectSubtotal(amount: number): Promise<void> { await expect(this.subtotal).toHaveText(`Q${amount.toFixed(2)}`); }
  async expectEmpty(): Promise<void> { await expect(this.emptyMessage).toBeVisible(); }
  async expectOpen(): Promise<void> { await expect(this.page).toHaveURL(/carrito(?:\.html)?$/); }
}

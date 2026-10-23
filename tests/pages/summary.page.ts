import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export interface OrderTotals { subtotal: number; discountPercent: number; discount: number; shipping: number; total: number; }

export class SummaryPage extends BasePage {
  private get subtotal(): Locator { return this.page.getByTestId('subtotal'); }
  private get discountPercent(): Locator { return this.page.getByTestId('descuento-pct'); }
  private get discount(): Locator { return this.page.getByTestId('descuento'); }
  private get shipping(): Locator { return this.page.getByTestId('envio'); }
  private get total(): Locator { return this.page.getByTestId('total'); }
  private get confirmButton(): Locator { return this.page.getByTestId('confirmar'); }

  async expectTotals(expected: OrderTotals): Promise<void> {
    await expect(this.subtotal).toHaveText(`Q${expected.subtotal.toFixed(2)}`);
    await expect(this.discountPercent).toHaveText(String(expected.discountPercent));
    await expect(this.discount).toHaveText(`-Q${expected.discount.toFixed(2)}`);
    await expect(this.shipping).toHaveText(`Q${expected.shipping.toFixed(2)}`);
    await expect(this.total).toHaveText(`Q${expected.total.toFixed(2)}`);
  }
  async confirm(): Promise<void> { await this.confirmButton.click(); }
}

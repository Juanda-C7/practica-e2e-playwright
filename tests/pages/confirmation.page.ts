import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ConfirmationPage extends BasePage {
  private get orderNumber(): Locator { return this.page.getByTestId('pedido'); }
  async expectSixDigitOrder(): Promise<void> { await expect(this.orderNumber).toHaveText(/^\d{6}$/); }
  async expectOpen(): Promise<void> { await expect(this.page).toHaveURL(/confirmacion(?:\.html)?$/); }
}

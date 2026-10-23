import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export interface ShippingData { firstName: string; lastName: string; postalCode: string; coupon?: string; }

export class CheckoutPage extends BasePage {
  private get firstName(): Locator { return this.page.getByTestId('nombre'); }
  private get lastName(): Locator { return this.page.getByTestId('apellido'); }
  private get postalCode(): Locator { return this.page.getByTestId('cp'); }
  private get coupon(): Locator { return this.page.getByTestId('cupon'); }
  private get continueButton(): Locator { return this.page.getByTestId('continuar'); }
  private get error(): Locator { return this.page.getByTestId('error'); }

  async open(): Promise<void> { await super.open('/checkout.html'); }
  async submit(data: ShippingData): Promise<void> {
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.postalCode.fill(data.postalCode);
    await this.coupon.fill(data.coupon ?? '');
    await this.continueButton.click();
  }
  async expectError(message: string): Promise<void> { await expect(this.error).toHaveText(message); }
  async expectSummary(): Promise<void> { await expect(this.page).toHaveURL(/resumen(?:\.html)?$/); }
}

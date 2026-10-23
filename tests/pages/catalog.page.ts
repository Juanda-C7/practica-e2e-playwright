import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export type SortOrder = 'az' | 'za' | 'precio-asc' | 'precio-desc';

export class CatalogPage extends BasePage {
  private get sort(): Locator { return this.page.getByTestId('orden'); }
  private get products(): Locator { return this.page.getByTestId('producto'); }

  async open(): Promise<void> { await super.open('/catalogo.html'); }
  async expectOpen(): Promise<void> { await expect(this.page).toHaveURL(/catalogo(?:\.html)?$/); }
  async sortBy(order: SortOrder): Promise<void> { await this.sort.selectOption(order); }
  async productNames(): Promise<string[]> { return this.products.locator('h2').allTextContents(); }
  async productPrices(): Promise<number[]> {
    return (await this.products.getByTestId('precio').allTextContents()).map((value) => Number(value.replace(/[Q,]/g, '')));
  }
  async addProduct(id: string): Promise<void> { await this.page.getByTestId(`agregar-${id}`).click(); }
  async expectProductAdded(id: string): Promise<void> { await expect(this.page.getByTestId(`quitar-${id}`)).toBeVisible(); }
}

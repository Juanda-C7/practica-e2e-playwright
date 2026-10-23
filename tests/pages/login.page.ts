import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  private get username(): Locator { return this.page.getByTestId('usuario'); }
  private get password(): Locator { return this.page.getByTestId('clave'); }
  private get submitButton(): Locator { return this.page.getByTestId('ingresar'); }
  private get error(): Locator { return this.page.getByTestId('error'); }

  async open(): Promise<void> { await super.open('/'); }
  async login(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submitButton.click();
  }
  async submit(): Promise<void> { await this.submitButton.click(); }
  async expectError(message: string): Promise<void> { await expect(this.error).toHaveText(message); }
  async expectCatalog(): Promise<void> { await expect(this.page).toHaveURL(/catalogo(?:\.html)?$/); }
  async expectLogin(): Promise<void> { await expect(this.page).toHaveURL(/\/(?:index\.html)?(?:\?sesion)?$/); }
  async expectSubmittingSlowLogin(): Promise<void> { await expect(this.submitButton).toBeDisabled(); }
}

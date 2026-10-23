import { test as base } from '@playwright/test';
import { CartPage } from './pages/cart.page';
import { CatalogPage } from './pages/catalog.page';
import { CheckoutPage } from './pages/checkout.page';
import { ConfirmationPage } from './pages/confirmation.page';
import { LoginPage } from './pages/login.page';
import { SummaryPage } from './pages/summary.page';

export type Shop = {
  login: LoginPage;
  catalog: CatalogPage;
  cart: CartPage;
  checkout: CheckoutPage;
  summary: SummaryPage;
  confirmation: ConfirmationPage;
};

export const test = base.extend<{ shop: Shop }>({
  shop: async ({ page }, use) => {
    await use({
      login: new LoginPage(page),
      catalog: new CatalogPage(page),
      cart: new CartPage(page),
      checkout: new CheckoutPage(page),
      summary: new SummaryPage(page),
      confirmation: new ConfirmationPage(page)
    });
  }
});

export { expect } from '@playwright/test';

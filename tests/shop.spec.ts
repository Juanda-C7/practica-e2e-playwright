import { Shop, expect, test } from './fixtures';
import { ShippingData } from './pages/checkout.page';

const password = 'calidad2026';
const validAddress: ShippingData = { firstName: 'Ana', lastName: 'López', postalCode: '01001' };

const products = {
  coffee250: 'cafe-250',
  coffee500: 'cafe-500',
  mug: 'taza',
  press: 'prensa',
  grinder: 'molino',
  filters: 'filtros'
} as const;

async function loginAs(shop: Shop, username = 'estandar'): Promise<void> {
  await shop.login.open();
  await shop.login.login(username, password);
  await shop.catalog.expectOpen();
}

async function withCart(shop: Shop, ids: string[]): Promise<void> {
  await loginAs(shop);
  for (const id of ids) await shop.catalog.addProduct(id);
  await shop.catalog.goToCart();
}

async function checkoutWith(shop: Shop, items: Array<[string, string]>): Promise<void> {
  await withCart(shop, items.map(([id]) => id));
  for (const [id, quantity] of items) {
    if (quantity !== '1') await shop.cart.setQuantity(id, quantity);
  }
  await shop.cart.continueToCheckout();
}

function specifiedTotals(subtotal: number, postalCode: string, coupon = '') {
  const discountPercent = subtotal >= 500 ? 10 : subtotal >= 200 ? 5 : 0;
  const discount = subtotal * discountPercent / 100;
  const discountedSubtotal = subtotal - discount;
  const shipping = discountedSubtotal >= 300 || coupon.trim().toUpperCase() === 'ENVIOGRATIS'
    ? 0
    : postalCode.startsWith('01') ? 25 : 40;
  return { subtotal, discountPercent, discount, shipping, total: discountedSubtotal + shipping };
}

test.describe('Ingreso y sesión', () => {
  test('Ingreso — campos obligatorios [Particiones de equivalencia]', async ({ shop }) => {
    await shop.login.open();
    await shop.login.submit();
    await shop.login.expectError('Falta el usuario.');
    await shop.login.login('estandar', '');
    await shop.login.expectError('Falta la contraseña.');
  });

  test('Ingreso — credenciales incorrectas no permiten entrar [Particiones de equivalencia]', async ({ shop }) => {
    await shop.login.open();
    await shop.login.login('desconocido', password);
    await shop.login.expectError('Usuario o contraseña incorrectos.');
    await shop.login.expectLogin();
  });

  test('Ingreso — usuario bloqueado no permite entrar [Tabla de decisión]', async ({ shop }) => {
    await shop.login.open();
    await shop.login.login('bloqueado', password);
    await shop.login.expectError('Este usuario está bloqueado.');
  });

  test('Ingreso — credenciales válidas llevan al catálogo [Particiones de equivalencia]', async ({ shop }) => {
    await loginAs(shop);
  });

  test('Ingreso — usuario lento completa autenticación sin espera fija [Transición de estados]', async ({ shop }) => {
    await shop.login.open();
    await shop.login.login('lento', password);
    await shop.login.expectSubmittingSlowLogin();
    await shop.login.expectCatalog();
  });

  test('Sesión — página protegida sin sesión redirige al ingreso [Transición de estados]', async ({ shop }) => {
    await shop.cart.open();
    await shop.login.expectLogin();
  });

  for (const [route, open] of [
    ['/catalogo', (shop: Shop) => shop.catalog.open()],
    ['/checkout', (shop: Shop) => shop.checkout.open()],
    ['/resumen', (shop: Shop) => shop.summary.open()],
    ['/confirmacion', (shop: Shop) => shop.confirmation.open()]
  ] as const) {
    test(`Sesión — ${route} sin sesión redirige al ingreso [Transición de estados]`, async ({ shop }) => {
      await open(shop);
      await shop.login.expectLogin();
    });
  }

  test('Sesión — cerrar sesión vacía el carrito [Transición de estados]', async ({ shop }) => {
    await withCart(shop, [products.coffee250]);
    await shop.cart.logout();
    await shop.login.expectLogin();
    await loginAs(shop);
    await shop.catalog.goToCart();
    await shop.cart.expectEmpty();
  });

  test('Sesión — el carrito se conserva al navegar entre páginas protegidas [Transición de estados]', async ({ shop }) => {
    await withCart(shop, [products.coffee250]);
    await shop.cart.goToCart();
    await shop.cart.expectCartCount(1);
    await shop.cart.goToCart();
    await shop.cart.expectSubtotal(75);
  });
});

test.describe('Catálogo', () => {
  const namesAscending = ['Café de Antigua 500 g', 'Café de Huehuetenango 250 g', 'Filtros de papel (100)', 'Molino manual', 'Prensa francesa', 'Taza de barro'];
  const pricesAscending = [25, 60, 75, 140, 225, 350];

  test('Catálogo — orden inicial por nombre A a Z de todos los productos [Particiones de equivalencia]', async ({ shop }) => {
    await loginAs(shop);
    await expect(await shop.catalog.productNames()).toEqual(namesAscending);
  });

  test('Catálogo — orden por nombre ascendente y descendente de todos los productos [Particiones de equivalencia]', async ({ shop }) => {
    await loginAs(shop);
    await shop.catalog.sortBy('az');
    await expect(await shop.catalog.productNames()).toEqual(namesAscending);
    await shop.catalog.sortBy('za');
    await expect(await shop.catalog.productNames()).toEqual([...namesAscending].reverse());
  });

  test('Catálogo — orden por precio ascendente y descendente de todos los productos [Particiones de equivalencia]', async ({ shop }) => {
    await loginAs(shop);
    await shop.catalog.sortBy('precio-asc');
    await expect(await shop.catalog.productPrices()).toEqual(pricesAscending);
    await shop.catalog.sortBy('precio-desc');
    await expect(await shop.catalog.productPrices()).toEqual([...pricesAscending].reverse());
  });

  test('Usuario problema — catálogo conserva el orden por precio [Particiones de equivalencia]', async ({ shop }) => {
    await loginAs(shop, 'problema');
    await shop.catalog.sortBy('precio-asc');
    await expect(await shop.catalog.productPrices()).toEqual(pricesAscending);
  });

  test('Usuario problema — catálogo conserva el orden descendente por precio [Particiones de equivalencia]', async ({ shop }) => {
    await loginAs(shop, 'problema');
    await shop.catalog.sortBy('precio-desc');
    await expect(await shop.catalog.productPrices()).toEqual([...pricesAscending].reverse());
  });
});

test.describe('Carrito y cantidad', () => {
  test('Carrito — agregar un producto una vez no duplica la línea [Transición de estados]', async ({ shop }) => {
    await withCart(shop, [products.coffee250]);
    await expect(await shop.cart.rowCount()).toBe(1);
    await shop.cart.expectCartCount(1);
  });

  test('Carrito — cantidad válida mínima 1 conserva el producto [Valores límite]', async ({ shop }) => {
    await withCart(shop, [products.coffee250]);
    await shop.cart.setQuantity(products.coffee250, '1');
    await shop.cart.expectSubtotal(75);
  });

  test('Carrito — cantidad válida máxima 5 actualiza subtotal y contador de unidades [Valores límite]', async ({ shop }) => {
    await withCart(shop, [products.coffee250]);
    await shop.cart.setQuantity(products.coffee250, '5');
    await shop.cart.expectSubtotal(375);
    await shop.cart.expectCartCount(5);
  });

  for (const invalid of ['0', '6', '-1', '1.5']) {
    test(`Cantidad — ${invalid} impide continuar al pago [Valores límite]`, async ({ shop }) => {
      await withCart(shop, [products.coffee250]);
      await shop.cart.setQuantity(products.coffee250, invalid);
      await shop.cart.expectError('La cantidad tiene que estar entre 1 y 5.');
      await shop.cart.expectCheckoutBlocked();
    });
  }

  test('Carrito — agregar, actualizar y quitar mantiene el estado y el contador [Transición de estados]', async ({ shop }) => {
    await withCart(shop, [products.coffee250, products.mug]);
    await shop.cart.setQuantity(products.coffee250, '2');
    await shop.cart.expectCartCount(3);
    await shop.cart.removeProduct(products.mug);
    await shop.cart.expectCartCount(2);
    await expect(await shop.cart.productNames()).toEqual(['Café de Huehuetenango 250 g']);
  });

  test('Usuario problema — agregar Taza agrega exactamente Taza [Transición de estados]', async ({ shop }) => {
    await loginAs(shop, 'problema');
    await shop.catalog.addProduct(products.mug);
    await shop.catalog.goToCart();
    await expect(await shop.cart.productNames()).toEqual(['Taza de barro']);
  });
});

test.describe('Datos de envío y cupón', () => {
  for (const [field, data, message] of [
    ['nombre', { ...validAddress, firstName: '' }, 'Falta el nombre.'],
    ['apellido', { ...validAddress, lastName: '' }, 'Falta el apellido.'],
    ['código postal', { ...validAddress, postalCode: '' }, 'El código postal tiene que tener 5 dígitos.']
  ] as const) {
    test(`Datos de envío — ${field} es obligatorio [Particiones de equivalencia]`, async ({ shop }) => {
      await checkoutWith(shop, [[products.coffee250, '1']]);
      await shop.checkout.submit(data);
      await shop.checkout.expectError(message);
    });
  }

  for (const postalCode of ['0100', '010001', '01A01']) {
    test(`Código postal — ${postalCode} es inválido [Valores límite]`, async ({ shop }) => {
      await checkoutWith(shop, [[products.coffee250, '1']]);
      await shop.checkout.submit({ ...validAddress, postalCode });
      await shop.checkout.expectError('El código postal tiene que tener 5 dígitos.');
    });
  }

  test('Código postal — cinco dígitos permite continuar [Valores límite]', async ({ shop }) => {
    await checkoutWith(shop, [[products.coffee250, '1']]);
    await shop.checkout.submit(validAddress);
    await shop.checkout.expectSummary();
  });

  for (const coupon of ['env iograt is', 'OTRO', 'ENVIOGRATISX']) {
    test(`Cupón — ${coupon} se rechaza con el mensaje exacto [Particiones de equivalencia]`, async ({ shop }) => {
      await checkoutWith(shop, [[products.coffee250, '1']]);
      await shop.checkout.submit({ ...validAddress, coupon });
      await shop.checkout.expectError('El cupón no existe.');
    });
  }

  for (const coupon of ['enviogratis', '  ENVIOGRATIS  ']) {
    test(`Cupón — ${JSON.stringify(coupon)} válido tras normalizar mayúsculas y extremos [Particiones de equivalencia]`, async ({ shop }) => {
      await checkoutWith(shop, [[products.coffee250, '1']]);
      await shop.checkout.submit({ ...validAddress, coupon });
      await shop.checkout.expectSummary();
    });
  }

  test('Usuario problema — apellido válido permite continuar [Particiones de equivalencia]', async ({ shop }) => {
    await shop.login.open();
    await shop.login.login('problema', password);
    await shop.catalog.addProduct(products.coffee250);
    await shop.catalog.goToCart();
    await shop.cart.continueToCheckout();
    await shop.checkout.submit(validAddress);
    await shop.checkout.expectSummary();
  });
});

test.describe('Descuentos, envío, total y confirmación', () => {
  test('Descuento — subtotal menor a Q200 no aplica descuento [Valores límite]', async ({ shop }) => {
    // Q199 no es alcanzable: todos los precios y cantidades válidas producen múltiplos de Q5; Q195 representa esta partición.
    await checkoutWith(shop, [[products.coffee250, '1'], [products.mug, '2']]);
    await shop.checkout.submit(validAddress);
    await shop.summary.expectTotals(specifiedTotals(195, '01001'));
  });

  test('Descuento — Q200 aplica 5 % [Valores límite]', async ({ shop }) => {
    await checkoutWith(shop, [[products.coffee500, '1'], [products.mug, '1']]);
    await shop.checkout.submit(validAddress);
    await shop.summary.expectTotals(specifiedTotals(200, '01001'));
  });

  test('Descuento — subtotal inferior alcanzable a Q500 aplica 5 % [Valores límite]', async ({ shop }) => {
    // Q499 tampoco es alcanzable con el catálogo; Q490 es el representante alcanzable inmediato de la partición.
    await checkoutWith(shop, [[products.grinder, '1'], [products.coffee500, '1']]);
    await shop.checkout.submit(validAddress);
    await shop.summary.expectTotals(specifiedTotals(490, '01001'));
  });

  test('Descuento — Q500 aplica 10 % [Valores límite]', async ({ shop }) => {
    await checkoutWith(shop, [[products.press, '1'], [products.coffee500, '1'], [products.coffee250, '1'], [products.mug, '1']]);
    await shop.checkout.submit(validAddress);
    await shop.summary.expectTotals(specifiedTotals(500, '01001'));
  });

  test('Envío — subtotal bajo y CP 01 cuesta Q25 [Tabla de decisión]', async ({ shop }) => {
    await checkoutWith(shop, [[products.coffee250, '1']]);
    await shop.checkout.submit(validAddress);
    await shop.summary.expectTotals(specifiedTotals(75, '01001'));
  });

  test('Envío — subtotal bajo y otro CP cuesta Q40 [Tabla de decisión]', async ({ shop }) => {
    await checkoutWith(shop, [[products.coffee250, '1']]);
    await shop.checkout.submit({ ...validAddress, postalCode: '99999' });
    await shop.summary.expectTotals(specifiedTotals(75, '99999'));
  });

  test('Envío — base con descuento de Q300 o más es gratis [Tabla de decisión]', async ({ shop }) => {
    await checkoutWith(shop, [[products.grinder, '1']]);
    await shop.checkout.submit({ ...validAddress, postalCode: '99999' });
    await shop.summary.expectTotals(specifiedTotals(350, '99999'));
  });

  test('Envío — cupón válido da envío gratis para cualquier CP [Tabla de decisión]', async ({ shop }) => {
    await checkoutWith(shop, [[products.coffee250, '1']]);
    await shop.checkout.submit({ ...validAddress, postalCode: '99999', coupon: 'ENVIOGRATIS' });
    await shop.summary.expectTotals(specifiedTotals(75, '99999', 'ENVIOGRATIS'));
  });

  test('Total y confirmación — subtotal menos descuento más envío, pedido de seis dígitos y carrito vacío [Tabla de decisión]', async ({ shop }) => {
    await checkoutWith(shop, [[products.coffee250, '1']]);
    await shop.checkout.submit(validAddress);
    await shop.summary.expectTotals(specifiedTotals(75, '01001'));
    await shop.summary.confirm();
    await shop.confirmation.expectOpen();
    await shop.confirmation.expectSixDigitOrder();
    await shop.confirmation.goToCart();
    await shop.cart.expectEmpty();
  });
});

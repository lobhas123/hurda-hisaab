const test = require('node:test');
const assert = require('node:assert/strict');
const Store = require('../js/store.js');

function seedProduct() {
  const base = Store.emptyState();
  const result = Store.addProduct(base, {
    name: 'Hurda',
    unit: 'kg',
    emoji: '🌾',
    sellPrice: 0,
    lowStock: 2,
  });
  assert.equal(result.ok, true);
  return result.state;
}

function stateWithHistory() {
  let state = seedProduct();
  const productId = state.products[0].id;
  let result = Store.setPrice(state, productId, 150, '2026-11-01');
  assert.equal(result.ok, true);
  state = result.state;
  result = Store.addPurchase(state, {
    productId,
    qty: 5,
    rate: 100,
    date: '2026-11-01',
  });
  assert.equal(result.ok, true);
  state = result.state;
  result = Store.addPurchase(state, {
    productId,
    qty: 5,
    rate: 120,
    date: '2026-11-02',
  });
  assert.equal(result.ok, true);
  state = result.state;
  result = Store.addSale(state, {
    productId,
    qty: 2,
    rate: 150,
    date: '2026-11-02',
  });
  assert.equal(result.ok, true);
  state = result.state;
  return { state, productId };
}

test('creates a product with zero stock', () => {
  const state = seedProduct();
  assert.equal(state.products.length, 1);
  assert.equal(state.products[0].name, 'Hurda');
  assert.equal(state.products[0].stock, 0);
  assert.equal(state.products[0].avgCost, 0);
});

test('creates a product with opening stock and weighted cost', () => {
  const base = Store.emptyState();
  const result = Store.addProduct(base, {
    name: 'Hurda',
    unit: 'kg',
    openingQty: 10,
    openingRate: 90,
    sellPrice: 120,
    lowStock: 2,
  });
  assert.equal(result.ok, true);
  const product = result.state.products[0];
  assert.equal(product.stock, 10);
  assert.equal(product.avgCost, 90);
  assert.equal(result.state.transactions[0].type, 'opening');
});

test('purchases update stock and weighted average cost', () => {
  const { state, productId } = stateWithHistory();
  const product = Store.productById(state, productId);
  assert.equal(product.stock, 8);
  assert.equal(product.avgCost, 110);
});

test('sales calculate profit from average cost', () => {
  const { state } = stateWithHistory();
  const sale = state.transactions.find((t) => t.type === 'sale');
  assert.equal(sale.amount, 300);
  assert.equal(sale.cost, 220);
  assert.equal(sale.profit, 80);
});

test('cannot sell more than available stock', () => {
  const { state, productId } = stateWithHistory();
  const result = Store.addSale(state, {
    productId,
    qty: 9,
    rate: 150,
    date: '2026-11-02',
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /Only 8 kg in stock/);
});

test('price changes keep stock unchanged and log history', () => {
  const { state, productId } = stateWithHistory();
  const result = Store.setPrice(state, productId, 160, '2026-11-02');
  assert.equal(result.ok, true);
  const product = Store.productById(result.state, productId);
  assert.equal(product.stock, 8);
  assert.equal(product.sellPrice, 160);
  const priceTxn = result.state.transactions.find((t) => t.type === 'price' && t.newPrice === 160);
  assert.ok(priceTxn);
  assert.equal(priceTxn.oldPrice, 150);
});

test('adjustment sets stock to a counted quantity', () => {
  const { state, productId } = stateWithHistory();
  const result = Store.adjustStock(state, productId, 7.5, 'Counted at closing');
  assert.equal(result.ok, true);
  const product = Store.productById(result.state, productId);
  assert.equal(product.stock, 7.5);
  const adjustment = result.state.transactions.find((t) => t.type === 'adjustment');
  assert.equal(adjustment.delta, -0.5);
});

test('editing a sale recalculates stock and profit', () => {
  const { state, productId } = stateWithHistory();
  const sale = state.transactions.find((t) => t.type === 'sale');
  const result = Store.updateTransaction(state, sale.id, {
    qty: 1,
  });
  assert.equal(result.ok, true);
  const product = Store.productById(result.state, productId);
  assert.equal(product.stock, 9);
  const updated = result.state.transactions.find((t) => t.id === sale.id);
  assert.equal(updated.amount, 150);
  assert.equal(updated.cost, 110);
  assert.equal(updated.profit, 40);
});

test('deleting a purchase that would make stock negative is blocked', () => {
  let state = seedProduct();
  const productId = state.products[0].id;
  state = Store.addPurchase(state, {
    productId,
    qty: 5,
    rate: 100,
    date: '2026-11-01',
  }).state;
  state = Store.addSale(state, {
    productId,
    qty: 4,
    rate: 150,
    date: '2026-11-02',
  }).state;
  const purchase = state.transactions.find((t) => t.type === 'purchase');
  const result = Store.deleteTransaction(state, purchase.id);
  assert.equal(result.ok, false);
  assert.match(result.error, /Can't delete this entry/);
});

test('a backdated sale before its purchase is blocked', () => {
  let state = seedProduct();
  const productId = state.products[0].id;
  const purchase = Store.addPurchase(state, {
    productId,
    qty: 5,
    rate: 100,
    date: '2026-11-02',
  });
  assert.equal(purchase.ok, true);
  state = purchase.state;

  const result = Store.addSale(state, {
    productId,
    qty: 2,
    rate: 150,
    date: '2026-11-01',
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /2026-11-01/);
  assert.match(result.error, /short by 2 kg/);
});

test('backup validation rejects a backdated sale with no stock', () => {
  let state = seedProduct();
  const productId = state.products[0].id;
  state = Store.addPurchase(state, {
    productId,
    qty: 5,
    rate: 100,
    date: '2026-11-02',
  }).state;
  state.transactions.push({
    id: 'txn_old_sale',
    type: 'sale',
    productId,
    qty: 2,
    rate: 150,
    date: '2026-11-01',
    createdAt: '2026-11-01T10:00:00.000Z',
  });

  const result = Store.validateImportedState({
    app: 'hurda-hisaab',
    schema: 1,
    state,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /2026-11-01/);
});

test('deleting a sale returns stock', () => {
  const { state, productId } = stateWithHistory();
  const sale = state.transactions.find((t) => t.type === 'sale');
  const result = Store.deleteTransaction(state, sale.id);
  assert.equal(result.ok, true);
  assert.equal(Store.productById(result.state, productId).stock, 10);
});

test('stats aggregate purchases, sales and profit', () => {
  const { state, productId } = stateWithHistory();
  const stats = Store.statsForProduct(state, productId, '2026-11-01', '2026-11-02');
  assert.equal(stats.purchaseQty, 10);
  assert.equal(stats.purchaseAmount, 1100);
  assert.equal(stats.soldQty, 2);
  assert.equal(stats.salesAmount, 300);
  assert.equal(stats.profit, 80);
  assert.equal(stats.salesCount, 1);
});

test('stockAt returns historical stock', () => {
  const { state, productId } = stateWithHistory();
  assert.equal(Store.stockAt(state, productId, '2026-11-01').stock, 5);
  assert.equal(Store.stockAt(state, productId, '2026-11-02').stock, 8);
});

test('fractional packet sales round correctly', () => {
  const base = Store.emptyState();
  const add = Store.addProduct(base, {
    name: 'Hurda',
    unit: 'kg',
    sellPrice: 120,
    openingQty: 1,
    openingRate: 90,
    date: '2026-11-01',
  });
  const productId = add.state.products[0].id;
  const result = Store.addSale(add.state, {
    productId,
    qty: 0.4167,
    rate: 120,
    date: '2026-11-02',
  });
  assert.equal(result.ok, true);
  assert.equal(Store.productById(result.state, productId).stock, 0.583);
  const sale = result.state.transactions.find((t) => t.type === 'sale');
  assert.equal(sale.amount, 50.04);
  assert.equal(sale.profit, 12.51);
});

test('backup validation accepts a real backup and rejects junk', () => {
  const { state } = stateWithHistory();
  const valid = Store.validateImportedState({
    app: 'hurda-hisaab',
    schema: 1,
    state,
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.state.products.length, 1);

  const invalid = Store.validateImportedState({ hello: 'world' });
  assert.equal(invalid.ok, false);
});

test('archiving hides product from active list but keeps history', () => {
  const { state, productId } = stateWithHistory();
  const archived = Store.setArchived(state, productId, true);
  assert.equal(archived.ok, true);
  assert.equal(archived.state.products[0].active, false);
  assert.ok(archived.state.transactions.length >= 3);
});

test('products can be added later without breaking kg product', () => {
  let { state } = stateWithHistory();
  const result = Store.addProduct(state, {
    name: 'Groundnut Chikki',
    unit: 'piece',
    sellPrice: 20,
    lowStock: 10,
    openingQty: 25,
    openingRate: 12,
  });
  assert.equal(result.ok, true);
  state = result.state;
  assert.equal(state.products.length, 2);
  assert.equal(state.products[0].stock, 8);
  assert.equal(state.products[1].stock, 25);
});

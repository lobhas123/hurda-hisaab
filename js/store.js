/*
 * Hurda Hisaab — data layer
 * Pure state functions, no DOM. Loaded as a classic script in the browser and
 * via require() in tests.
 */
(function (global) {
  'use strict';

  const SCHEMA_VERSION = 1;
  const EPS = 0.000001;
  const TYPES = new Set(['opening', 'purchase', 'sale', 'adjustment', 'price']);

  const UNITS = {
    kg: { label: 'kg', one: 'kg', decimals: 3, step: 0.5, kind: 'weight' },
    g: { label: 'g', one: 'g', decimals: 0, step: 100, kind: 'weight' },
    litre: { label: 'L', one: 'L', decimals: 2, step: 0.5, kind: 'volume' },
    piece: { label: 'pcs', one: 'pc', decimals: 0, step: 1, kind: 'count' },
    packet: { label: 'packets', one: 'packet', decimals: 0, step: 1, kind: 'count' },
  };

  const UNIT_TEXT = {
    en: {
      kg: { label: 'kg', one: 'kg' },
      g: { label: 'g', one: 'g' },
      litre: { label: 'L', one: 'L' },
      piece: { label: 'pcs', one: 'pc' },
      packet: { label: 'packets', one: 'packet' },
    },
    mr: {
      kg: { label: 'किलो', one: 'किलो' },
      g: { label: 'ग्रॅम', one: 'ग्रॅम' },
      litre: { label: 'लिटर', one: 'लिटर' },
      piece: { label: 'नग', one: 'नग' },
      packet: { label: 'पॅकेट', one: 'पॅकेट' },
    },
  };

  const TEXT = {
    'product.name': ['Enter a product name.', 'वस्तूचे नाव भरा.'],
    'unit.invalid': ['Choose a valid unit.', 'योग्य एकक निवडा.'],
    'product.notFound': ['Product not found.', 'वस्तू सापडली नाही.'],
    'unit.locked': [
      'The unit cannot be changed after stock entries exist.',
      'स्टॉक नोंदी झाल्यानंतर एकक बदलता येत नाही.',
    ],
    'price.invalid': ['Enter a valid selling price.', 'योग्य विक्री भाव भरा.'],
    'qty.positive': [
      'Enter a quantity greater than 0.',
      '0 पेक्षा जास्त प्रमाण भरा.',
    ],
    'rate.purchase': ['Enter a valid purchase rate.', 'योग्य खरेदी भाव भरा.'],
    'product.choose': ['Choose a product.', 'वस्तू निवडा.'],
    'rate.sale': ['Enter a valid selling rate.', 'योग्य विक्री भाव भरा.'],
    'stock.only': [
      'Only {qty} {unit} in stock.',
      'फक्त {qty} {unit} स्टॉकमध्ये आहे.',
    ],
    'qty.stock': ['Enter a valid stock quantity.', 'योग्य स्टॉक संख्या भरा.'],
    'entry.notFound': ['Entry not found.', 'नोंद सापडली नाही.'],
    'price.edit': [
      'Price changes cannot be edited. Set a new price instead.',
      'भाव बदल बदलता येत नाही. नवीन भाव सेट करा.',
    ],
    'qty.update': [
      'Quantity must be greater than 0.',
      'प्रमाण 0 पेक्षा जास्त असावे.',
    ],
    'rate.update': ['Rate must be 0 or more.', 'भाव 0 किंवा जास्त असावा.'],
    'stock.negative': ['Stock cannot be negative.', 'स्टॉक ऋण असू शकत नाही.'],
    'update.prefix': ["Can't update this entry. ", 'ही नोंद बदलता आली नाही. '],
    'delete.prefix': ["Can't delete this entry. ", 'ही नोंद काढता आली नाही. '],
    'backup.invalid': [
      'This file does not look like a Hurda Hisaab backup.',
      'ही फाइल हुरडा हिसाबचा बॅकअप वाटत नाही.',
    ],
    'backup.empty': [
      'The backup file is empty or damaged.',
      'बॅकअप फाइल रिकामी किंवा खराब आहे.',
    ],
    'backup.missing': [
      'The backup is missing product or transaction data.',
      'बॅकअपमध्ये वस्तू किंवा नोंदींची माहिती नाही.',
    ],
    'backup.noProducts': [
      'The backup does not contain any products.',
      'बॅकअपमध्ये कोणतीही वस्तू नाही.',
    ],
    'backup.newer': [
      'This backup was made by a newer version of the app.',
      'हा बॅकअप अ‍ॅपच्या नव्या आवृत्तीतून बनवला आहे.',
    ],
    'backup.stockProblem': [
      'The backup has a stock problem: ',
      'बॅकअपमध्ये स्टॉकची अडचण आहे: ',
    ],
    'stock.short': [
      'Not enough stock for {name} on {date} (short by {qty} {unit}). Record a purchase on or before that date.',
      '{name} साठी {date} रोजी पुरेसा स्टॉक नव्हता ({qty} {unit} कमी). त्या तारखेला किंवा त्यापूर्वी खरेदी नोंदवा.',
    ],
  };

  let language = 'en';

  function setLanguage(next) {
    language = next === 'mr' ? 'mr' : 'en';
  }

  function tr(key, vars) {
    const pair = TEXT[key];
    if (!pair) return key;
    let text = pair[language === 'mr' ? 1 : 0];
    if (text === undefined) text = pair[0];
    if (vars) {
      text = text.replace(/\{(\w+)\}/g, function (match, name) {
        return vars[name] === undefined || vars[name] === null
          ? ''
          : String(vars[name]);
      });
    }
    return text;
  }

  function round(value, decimals) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    const factor = Math.pow(10, decimals === undefined ? 2 : decimals);
    return Math.round((n + Number.EPSILON) * factor) / factor;
  }

  const roundQty = (value) => round(value, 3);
  const roundMoney = (value) => round(value, 2);

  function uid(prefix) {
    return (
      prefix +
      '_' +
      Date.now().toString(36) +
      '_' +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function localDate(date) {
    const d = date ? new Date(date) : new Date();
    const shifted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return shifted.toISOString().slice(0, 10);
  }

  // Monotonic timestamps keep same-millisecond entries in the order they were
  // entered, which matters when replaying the transaction log.
  let lastTimestamp = 0;
  function nowIso() {
    const timestamp = Math.max(Date.now(), lastTimestamp + 1);
    lastTimestamp = timestamp;
    return new Date(timestamp).toISOString();
  }

  function unitInfo(unit) {
    const key = UNITS[unit] ? unit : 'kg';
    const info = UNITS[key];
    const text = UNIT_TEXT[language][key] || UNIT_TEXT.en[key];
    return Object.assign({}, info, text);
  }

  function formatQty(value) {
    const n = roundQty(value);
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 3,
    }).format(n);
  }

  function emptyState() {
    return {
      schema: SCHEMA_VERSION,
      settings: {
        shopName: 'Hurda Hisaab',
        language: 'en',
        pinHash: null,
        pinSalt: null,
        lastBackupAt: null,
        createdAt: nowIso(),
      },
      products: [],
      transactions: [],
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function productById(state, id) {
    return state.products.find((p) => p.id === id) || null;
  }

  function fail(error) {
    return { ok: false, error: error };
  }

  function ok(state, extra) {
    return Object.assign({ ok: true, state: state }, extra || {});
  }

  function sortAsc(a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  }

  function sortDesc(a, b) {
    return sortAsc(b, a);
  }

  /**
   * Rebuilds stock, cost and sale profit from the transaction log.
   * This makes edits and deletes safe — the log is the source of truth.
   */
  function normalize(state) {
    if (!state || typeof state !== 'object') return state;

    const defaults = emptyState();
    state.schema = SCHEMA_VERSION;
    state.settings = Object.assign({}, defaults.settings, state.settings || {});
    if (!Array.isArray(state.products)) state.products = [];
    if (!Array.isArray(state.transactions)) state.transactions = [];

    const seenProductIds = new Set();
    state.products.forEach((p) => {
      if (!p || typeof p !== 'object') return;
      p.id = p.id || uid('prd');
      if (seenProductIds.has(p.id)) p.id = uid('prd');
      seenProductIds.add(p.id);
      p.name = String(p.name || 'Product').trim() || 'Product';
      p.unit = UNITS[p.unit] ? p.unit : 'kg';
      p.emoji = String(p.emoji || '📦').slice(0, 8);
      p.sellPrice = roundMoney(p.sellPrice || 0);
      p.lowStock = roundQty(Math.max(0, Number(p.lowStock) || 0));
      p.active = p.active !== false;
      p.createdAt = p.createdAt || nowIso();
      p.stock = 0;
      p.avgCost = 0;
    });
    state.products = state.products.filter(Boolean);

    const productIds = new Set(state.products.map((p) => p.id));
    state.transactions = state.transactions
      .filter((t) => t && typeof t === 'object')
      .filter((t) => t.id && TYPES.has(t.type) && productIds.has(t.productId))
      .map((t) => {
        t.qty = roundQty(Math.max(0, Number(t.qty) || 0));
        t.rate = roundMoney(Math.max(0, Number(t.rate) || 0));
        t.amount = roundMoney(Number(t.amount) || 0);
        t.date = /^\d{4}-\d{2}-\d{2}$/.test(t.date || '') ? t.date : localDate();
        t.createdAt = t.createdAt || nowIso();
        t.note = String(t.note || '');
        if (t.type === 'price') {
          t.oldPrice = roundMoney(t.oldPrice || 0);
          t.newPrice = roundMoney(t.newPrice || 0);
          t.qty = 0;
          t.amount = 0;
        }
        return t;
      });

    // Detect duplicate transaction ids.
    const seenTxnIds = new Set();
    state.transactions.forEach((t) => {
      if (seenTxnIds.has(t.id)) t.id = uid('txn');
      seenTxnIds.add(t.id);
    });

    for (const product of state.products) {
      const list = state.transactions
        .filter((t) => t.productId === product.id && t.type !== 'price')
        .sort(sortAsc);

      let stock = 0;
      let avgCost = 0;

      for (const t of list) {
        if (t.type === 'opening' || t.type === 'purchase') {
          const qty = t.qty;
          const rate = t.rate;
          const newStock = stock + qty;
          if (newStock > EPS) {
            avgCost = (stock * avgCost + qty * rate) / newStock;
          }
          stock = newStock;
          t.amount = roundMoney(qty * rate);
          delete t.costPerUnit;
          delete t.cost;
          delete t.profit;
        } else if (t.type === 'sale') {
          const qty = t.qty;
          t.amount = roundMoney(qty * t.rate);
          t.costPerUnit = round(avgCost, 4);
          t.cost = roundMoney(qty * avgCost);
          t.profit = roundMoney(t.amount - t.cost);
          stock -= qty;
        } else if (t.type === 'adjustment') {
          t.delta = roundQty(t.qty - stock);
          t.rate = round(avgCost, 4);
          t.amount = roundMoney(t.qty * avgCost);
          stock = t.qty;
        }
      }

      product.stock = roundQty(stock);
      product.avgCost = round(avgCost, 4);
    }

    state.transactions.sort(sortDesc);
    return state;
  }

  function stockErrors(state) {
    const errors = [];

    for (const product of state.products) {
      const list = state.transactions
        .filter((t) => t.productId === product.id && t.type !== 'price')
        .sort(sortAsc);

      let stock = 0;
      for (const t of list) {
        if (t.type === 'opening' || t.type === 'purchase') {
          stock += t.qty;
        } else if (t.type === 'sale') {
          stock -= t.qty;
          if (stock < -EPS) {
            errors.push(
              tr('stock.short', {
                name: product.name,
                date: t.date,
                qty: formatQty(-stock),
                unit: unitInfo(product.unit).label,
              })
            );
            break;
          }
        } else if (t.type === 'adjustment') {
          stock = t.qty;
        }
      }
    }

    return errors;
  }

  function finish(state, extra) {
    normalize(state);
    const errors = stockErrors(state);
    if (errors.length) return fail(errors[0]);
    return ok(state, extra);
  }

  function addProduct(state, input) {
    const name = String((input && input.name) || '').trim();
    if (!name) return fail(tr('product.name'));
    if (input.unit && !UNITS[input.unit]) return fail(tr('unit.invalid'));

    const s = clone(state);
    const product = {
      id: uid('prd'),
      name: name,
      unit: input.unit || 'kg',
      emoji: String(input.emoji || '📦').slice(0, 8),
      sellPrice: roundMoney(input.sellPrice || 0),
      lowStock: roundQty(Math.max(0, Number(input.lowStock) || 0)),
      active: true,
      stock: 0,
      avgCost: 0,
      createdAt: nowIso(),
    };
    s.products.push(product);

    const qty = roundQty(input.openingQty || 0);
    const rate = roundMoney(input.openingRate || 0);
    if (qty > 0) {
      s.transactions.push({
        id: uid('txn'),
        type: 'opening',
        productId: product.id,
        qty: qty,
        rate: rate,
        amount: roundMoney(qty * rate),
        date: input.date || localDate(),
        note: String(input.note || 'Opening stock'),
        createdAt: nowIso(),
      });
    }

    const result = finish(s, { productId: product.id });
    return result;
  }

  function updateProduct(state, id, patch) {
    const s = clone(state);
    const product = productById(s, id);
    if (!product) return fail(tr('product.notFound'));

    const name =
      patch.name !== undefined ? String(patch.name).trim() : product.name;
    if (!name) return fail(tr('product.name'));

    const hasTransactions = s.transactions.some((t) => t.productId === id);
    if (patch.unit && patch.unit !== product.unit && hasTransactions) {
      return fail(tr('unit.locked'));
    }
    if (patch.unit && !UNITS[patch.unit]) return fail(tr('unit.invalid'));

    product.name = name;
    if (patch.emoji !== undefined) {
      product.emoji = String(patch.emoji || '📦').slice(0, 8) || '📦';
    }
    if (patch.unit) product.unit = patch.unit;
    if (patch.lowStock !== undefined) {
      product.lowStock = roundQty(
        Math.max(0, Number(patch.lowStock) || 0)
      );
    }
    if (patch.active !== undefined) product.active = !!patch.active;

    return finish(s);
  }

  function setArchived(state, id, archived) {
    return updateProduct(state, id, { active: !archived });
  }

  function setPrice(state, id, newPrice, date, note) {
    const s = clone(state);
    const product = productById(s, id);
    if (!product) return fail(tr('product.notFound'));

    const price = roundMoney(newPrice);
    if (!(price >= 0)) return fail(tr('price.invalid'));

    const oldPrice = product.sellPrice;
    if (Math.abs(oldPrice - price) < 0.001) {
      return ok(s, { unchanged: true });
    }

    product.sellPrice = price;
    s.transactions.push({
      id: uid('txn'),
      type: 'price',
      productId: id,
      oldPrice: oldPrice,
      newPrice: price,
      qty: 0,
      rate: price,
      amount: 0,
      date: date || localDate(),
      note: String(note || ''),
      createdAt: nowIso(),
    });

    return finish(s);
  }

  function addPurchase(state, input) {
    const qty = roundQty(input.qty);
    const rate = roundMoney(input.rate);
    if (!(qty > 0)) return fail(tr('qty.positive'));
    if (!(rate >= 0)) return fail(tr('rate.purchase'));

    const s = clone(state);
    const product = productById(s, input.productId);
    if (!product) return fail(tr('product.choose'));

    s.transactions.push({
      id: uid('txn'),
      type: 'purchase',
      productId: product.id,
      qty: qty,
      rate: rate,
      amount: roundMoney(qty * rate),
      date: input.date || localDate(),
      note: String(input.note || ''),
      createdAt: nowIso(),
    });

    return finish(s);
  }

  function addSale(state, input) {
    const qty = roundQty(input.qty);
    const rate = roundMoney(input.rate);
    if (!(qty > 0)) return fail(tr('qty.positive'));
    if (!(rate >= 0)) return fail(tr('rate.sale'));

    const s = clone(state);
    const product = productById(s, input.productId);
    if (!product) return fail(tr('product.choose'));
    if (qty > product.stock + EPS) {
      return fail(
        tr('stock.only', {
          qty: formatQty(product.stock),
          unit: unitInfo(product.unit).label,
        })
      );
    }

    s.transactions.push({
      id: uid('txn'),
      type: 'sale',
      productId: product.id,
      qty: qty,
      rate: rate,
      amount: roundMoney(qty * rate),
      date: input.date || localDate(),
      note: String(input.note || ''),
      createdAt: nowIso(),
    });

    return finish(s);
  }

  function adjustStock(state, id, newQty, note, date) {
    const qty = roundQty(newQty);
    if (!(qty >= 0)) return fail(tr('qty.stock'));

    const s = clone(state);
    const product = productById(s, id);
    if (!product) return fail(tr('product.notFound'));
    if (Math.abs(product.stock - qty) < EPS) {
      return ok(s, { unchanged: true });
    }

    s.transactions.push({
      id: uid('txn'),
      type: 'adjustment',
      productId: id,
      qty: qty,
      rate: product.avgCost,
      amount: roundMoney(qty * product.avgCost),
      date: date || localDate(),
      note: String(note || 'Stock adjusted'),
      createdAt: nowIso(),
    });

    return finish(s);
  }

  function updateTransaction(state, id, patch) {
    const s = clone(state);
    const txn = s.transactions.find((t) => t.id === id);
    if (!txn) return fail(tr('entry.notFound'));
    if (txn.type === 'price') {
      return fail(tr('price.edit'));
    }

    if (patch.date) txn.date = patch.date;
    if (patch.note !== undefined) txn.note = String(patch.note);

    if (
      txn.type === 'opening' ||
      txn.type === 'purchase' ||
      txn.type === 'sale'
    ) {
      if (patch.qty !== undefined) txn.qty = roundQty(patch.qty);
      if (patch.rate !== undefined) txn.rate = roundMoney(patch.rate);
      if (!(txn.qty > 0)) return fail(tr('qty.update'));
      if (!(txn.rate >= 0)) return fail(tr('rate.update'));
    } else if (txn.type === 'adjustment') {
      if (patch.qty !== undefined) txn.qty = roundQty(patch.qty);
      if (!(txn.qty >= 0)) return fail(tr('stock.negative'));
    }

    const result = finish(s);
    if (!result.ok) {
      return fail(tr('update.prefix') + result.error);
    }
    return result;
  }

  function deleteTransaction(state, id) {
    const s = clone(state);
    const index = s.transactions.findIndex((t) => t.id === id);
    if (index === -1) return fail(tr('entry.notFound'));
    s.transactions.splice(index, 1);
    const result = finish(s);
    if (!result.ok) {
      return fail(tr('delete.prefix') + result.error);
    }
    return result;
  }

  function replayProduct(state, productId, endDate) {
    const product = productById(state, productId);
    if (!product) return { stock: 0, avgCost: 0 };
    const list = state.transactions
      .filter((t) => t.productId === productId && t.type !== 'price')
      .filter((t) => !endDate || t.date <= endDate)
      .sort(sortAsc);
    let stock = 0;
    let avgCost = 0;
    for (const t of list) {
      if (t.type === 'opening' || t.type === 'purchase') {
        const newStock = stock + t.qty;
        if (newStock > EPS) {
          avgCost = (stock * avgCost + t.qty * t.rate) / newStock;
        }
        stock = newStock;
      } else if (t.type === 'sale') {
        stock -= t.qty;
      } else if (t.type === 'adjustment') {
        stock = t.qty;
      }
    }
    return { stock: roundQty(stock), avgCost: round(avgCost, 4) };
  }

  function stockAt(state, productId, endDate) {
    return replayProduct(state, productId, endDate);
  }

  function statsForProduct(state, productId, from, to) {
    const list = state.transactions.filter(
      (t) =>
        t.productId === productId &&
        (!from || t.date >= from) &&
        (!to || t.date <= to)
    );
    const purchases = list.filter(
      (t) => t.type === 'purchase' || t.type === 'opening'
    );
    const sales = list.filter((t) => t.type === 'sale');
    const adjustments = list.filter((t) => t.type === 'adjustment');
    const priceChanges = list.filter((t) => t.type === 'price');

    const sum = (items, key) =>
      items.reduce((total, item) => total + (Number(item[key]) || 0), 0);

    return {
      purchaseQty: roundQty(sum(purchases, 'qty')),
      purchaseAmount: roundMoney(sum(purchases, 'amount')),
      soldQty: roundQty(sum(sales, 'qty')),
      salesAmount: roundMoney(sum(sales, 'amount')),
      profit: roundMoney(sum(sales, 'profit')),
      salesCount: sales.length,
      purchaseCount: purchases.length,
      adjustmentCount: adjustments.length,
      priceCount: priceChanges.length,
      transactionCount: list.length,
    };
  }

  function statsOverall(state, from, to) {
    const list = state.transactions.filter(
      (t) => (!from || t.date >= from) && (!to || t.date <= to)
    );
    const purchases = list.filter(
      (t) => t.type === 'purchase' || t.type === 'opening'
    );
    const sales = list.filter((t) => t.type === 'sale');
    const sum = (items, key) =>
      items.reduce((total, item) => total + (Number(item[key]) || 0), 0);

    return {
      purchaseAmount: roundMoney(sum(purchases, 'amount')),
      salesAmount: roundMoney(sum(sales, 'amount')),
      profit: roundMoney(sum(sales, 'profit')),
      salesCount: sales.length,
      purchaseCount: purchases.length,
      transactionCount: list.length,
    };
  }

  function inventoryValue(state) {
    let cost = 0;
    let retail = 0;
    for (const p of state.products) {
      if (!p.active) continue;
      cost += p.stock * p.avgCost;
      retail += p.stock * p.sellPrice;
    }
    return { cost: roundMoney(cost), retail: roundMoney(retail) };
  }

  function priceHistory(state, productId) {
    return state.transactions
      .filter((t) => t.productId === productId && t.type === 'price')
      .sort(sortDesc);
  }

  function productTransactions(state, productId) {
    return state.transactions
      .filter((t) => t.productId === productId)
      .sort(sortDesc);
  }

  function validateImportedState(data) {
    if (!data || typeof data !== 'object') {
      return fail(tr('backup.invalid'));
    }
    const raw = data.state ? data.state : data;
    if (!raw || typeof raw !== 'object') {
      return fail(tr('backup.empty'));
    }
    if (!Array.isArray(raw.products) || !Array.isArray(raw.transactions)) {
      return fail(tr('backup.missing'));
    }
    if (raw.products.length === 0) {
      return fail(tr('backup.noProducts'));
    }
    if (raw.schema && Number(raw.schema) > SCHEMA_VERSION) {
      return fail(tr('backup.newer'));
    }

    const s = normalize(clone(raw));
    const errors = stockErrors(s);
    if (errors.length) {
      return fail(tr('backup.stockProblem') + errors[0]);
    }
    return ok(s);
  }

  function makeSeedState() {
    const s = emptyState();
    const result = addProduct(s, {
      name: 'Hurda',
      unit: 'kg',
      emoji: '🌾',
      sellPrice: 0,
      lowStock: 2,
    });
    return result.ok ? result.state : s;
  }

  const Store = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    UNITS: UNITS,
    setLanguage: setLanguage,
    emptyState: emptyState,
    makeSeedState: makeSeedState,
    normalize: normalize,
    clone: clone,
    productById: productById,
    unitInfo: unitInfo,
    formatQty: formatQty,
    addProduct: addProduct,
    updateProduct: updateProduct,
    setArchived: setArchived,
    setPrice: setPrice,
    addPurchase: addPurchase,
    addSale: addSale,
    adjustStock: adjustStock,
    updateTransaction: updateTransaction,
    deleteTransaction: deleteTransaction,
    stockAt: stockAt,
    statsForProduct: statsForProduct,
    statsOverall: statsOverall,
    inventoryValue: inventoryValue,
    priceHistory: priceHistory,
    productTransactions: productTransactions,
    validateImportedState: validateImportedState,
    stockErrors: stockErrors,
    today: localDate,
    nowIso: nowIso,
    roundMoney: roundMoney,
    roundQty: roundQty,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Store;
  }
  global.HurdaStore = Store;
})(typeof window !== 'undefined' ? window : globalThis);

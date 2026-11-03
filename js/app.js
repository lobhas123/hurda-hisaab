(function () {
  'use strict';

  const Store = window.HurdaStore;
  const I18n = window.HurdaI18n;
  if (!Store || !I18n) {
    document.body.innerHTML =
      '<div style="padding:30px;font-family:sans-serif">Could not load the app data layer.<br>अ‍ॅपचा डेटा भाग लोड होऊ शकला नाही.</div>';
    return;
  }

  const STORAGE_KEY = 'hurda-hisaab-v1';
  const SESSION_KEY = 'hurda-hisaab-unlocked';
  const APP_VERSION = '1.1.0';

  const EMOJIS = ['🌾', '🥜', '🫘', '🧂', '🍯', '🍪', '🧺', '📦'];

  let state = loadState();
  syncLanguage();
  let locked = isPinSet() && !isSessionUnlocked();
  let deferredInstallPrompt = null;
  let lockEntry = '';
  let lockChecking = false;

  const ui = {
    screen: 'home',
    homeProductId: null,
    historyPeriod: 'today',
    historyFilter: 'all',
    purchaseMode: 'rate',
    saleMode: 'qty',
    showArchived: false,
  };

  // ---------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) =>
    Array.from((root || document).querySelectorAll(selector));

  function tr(key, vars) {
    return I18n.t(key, vars);
  }

  function currentLanguage() {
    return state.settings.language === 'mr' ? 'mr' : 'en';
  }

  function syncLanguage() {
    const lang = currentLanguage();
    I18n.setLanguage(lang);
    Store.setLanguage(lang);
    document.documentElement.lang = lang;
  }

  function browserLanguage() {
    const list =
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || 'en'];
    return list.some(function (item) {
      return String(item).toLowerCase().indexOf('mr') === 0;
    })
      ? 'mr'
      : 'en';
  }

  function changeLanguage(next) {
    const lang = next === 'mr' ? 'mr' : 'en';
    if (currentLanguage() === lang) {
      render();
      return;
    }
    state = Store.clone(state);
    state.settings.language = lang;
    syncLanguage();
    persistState(state);
    render();
  }

  function displayShopName() {
    return state.settings.shopName === 'Hurda Hisaab'
      ? tr('app.name')
      : state.settings.shopName;
  }

  function typeLabel(type) {
    const key = 'type.' + type;
    const label = tr(key);
    return label === key ? type : label;
  }

  const inr = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  function money(value) {
    return '₹' + inr.format(Store.roundMoney(value));
  }

  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(
      /[&<>"']/g,
      function (ch) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[ch];
      }
    );
  }

  function icon(name, cls) {
    return (
      '<svg class="icon ' +
      (cls || '') +
      '" aria-hidden="true"><use href="#i-' +
      name +
      '"></use></svg>'
    );
  }

  function unitLabel(unit) {
    return Store.unitInfo(unit).label;
  }

  function unitOne(unit) {
    return Store.unitInfo(unit).one;
  }

  function qtyText(value, unit) {
    return Store.formatQty(value) + ' ' + unitLabel(unit);
  }

  function smartQty(value, unit) {
    const n = Number(value) || 0;
    if (unit === 'kg' && n > 0 && n < 1)
      return Math.round(n * 1000) + ' ' + unitLabel('g');
    if (unit === 'litre' && n > 0 && n < 1)
      return Math.round(n * 1000) + ' ' + tr('unit.ml');
    return qtyText(n, unit);
  }

  function plural(count, oneKey, manyKey) {
    return count + ' ' + tr(count === 1 ? oneKey : manyKey);
  }

  function today() {
    return Store.today();
  }

  function dateObj(iso) {
    return new Date(iso + 'T12:00:00');
  }

  function addDays(iso, days) {
    const d = dateObj(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function longDate(iso) {
    return dateObj(iso).toLocaleDateString(I18n.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  function shortDate(iso) {
    return dateObj(iso).toLocaleDateString(I18n.locale(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  function dateLabel(iso) {
    const day = today();
    if (iso === day) return tr('common.today');
    if (iso === addDays(day, -1)) return tr('common.yesterday');
    return shortDate(iso);
  }

  function timeLabel(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString(I18n.locale(), {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function backupDateLabel(iso) {
    if (!iso) return tr('settings.backup.none');
    return new Date(iso).toLocaleDateString(I18n.locale(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function readNum(id) {
    const el = document.getElementById(id);
    if (!el) return NaN;
    const raw = String(el.value).replace(/,/g, '').trim();
    if (raw === '') return NaN;
    return Number(raw);
  }

  function activeProducts() {
    return state.products.filter((p) => p.active);
  }

  function findProduct(id) {
    return state.products.find((p) => p.id === id) || null;
  }

  function selectedHomeProduct() {
    let product = state.products.find(
      (p) => p.id === ui.homeProductId && p.active
    );
    if (!product) product = activeProducts()[0] || null;
    if (product) ui.homeProductId = product.id;
    return product;
  }

  function stockStatus(product) {
    if (!product) return { key: 'out', label: tr('status.out') };
    if (product.stock <= 0.0001)
      return { key: 'out', label: tr('status.out') };
    if (
      product.lowStock > 0 &&
      product.stock <= product.lowStock + 0.0001
    ) {
      return { key: 'low', label: tr('status.low') };
    }
    return { key: 'ok', label: tr('status.ok') };
  }

  function isLowStock(product) {
    return stockStatus(product).key !== 'ok';
  }

  function marginPerUnit(product) {
    return Store.roundMoney(product.sellPrice - product.avgCost);
  }

  function marginPercent(product) {
    if (!(product.sellPrice > 0)) return 0;
    return ((product.sellPrice - product.avgCost) / product.sellPrice) * 100;
  }

  function toast(message, type) {
    const root = $('#toast-root');
    if (!root) return;
    root.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' error' : '');
    el.innerHTML =
      icon(type === 'error' ? 'alert' : 'check') +
      '<span></span>';
    el.querySelector('span').textContent = String(message || '');
    root.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add('show');
    });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () {
        el.remove();
      }, 220);
    }, 2400);
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);
  }

  // ---------------------------------------------------------------------
  // Storage, PIN session, small state helpers
  // ---------------------------------------------------------------------

  function loadState() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      raw = null;
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const result = Store.validateImportedState(parsed);
        if (result.ok) return result.state;
      } catch (error) {
        // Fall through to a fresh state.
      }
    }
    const seed = Store.makeSeedState();
    seed.settings.language = browserLanguage();
    persistState(seed);
    return seed;
  }

  function persistState(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next || state));
    } catch (error) {
      toast(tr('error.storage'), 'error');
    }
  }

  function saveResult(result, successMessage) {
    if (!result.ok) {
      toast(result.error, 'error');
      return false;
    }
    state = result.state;
    persistState(state);
    if (successMessage) toast(successMessage);
    return true;
  }

  function setSessionUnlocked(value) {
    try {
      if (value) sessionStorage.setItem(SESSION_KEY, '1');
      else sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      // Private mode can block session storage; the app still works.
    }
  }

  function isSessionUnlocked() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function isPinSet() {
    return !!(state.settings && state.settings.pinHash);
  }

  function makeSalt() {
    return (
      Math.random().toString(36).slice(2, 10) +
      Math.random().toString(36).slice(2, 10)
    );
  }

  function hashPin(pin, salt) {
    let hash = 2166136261;
    const input = String(salt || '') + '|' + String(pin) + '|hurda-hisaab';
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  // ---------------------------------------------------------------------
  // App shell
  // ---------------------------------------------------------------------

  function render() {
    syncLanguage();
    if (locked) {
      $('#app-shell').classList.add('hidden');
      renderLock();
      return;
    }

    $('#app-shell').classList.remove('hidden');
    $('#lock-root').innerHTML = '';

    let html = '';
    if (ui.screen === 'history') html = renderHistory();
    else if (ui.screen === 'products') html = renderProducts();
    else if (ui.screen === 'settings') html = renderSettings();
    else html = renderHome();

    $('#screen').innerHTML = html;
    renderNav();
    const brand = tr('app.name');
    const shop = displayShopName();
    document.title = shop === brand ? brand : shop + ' · ' + brand;
  }

  function renderNav() {
    const items = [
      { id: 'home', label: tr('nav.home'), icon: 'home' },
      { id: 'history', label: tr('nav.history'), icon: 'history' },
      { id: 'products', label: tr('nav.products'), icon: 'package' },
      { id: 'settings', label: tr('nav.settings'), icon: 'settings' },
    ];
    $('#bottom-nav').setAttribute('aria-label', tr('nav.main'));
    $('#bottom-nav').innerHTML = items
      .map(function (item) {
        const active = ui.screen === item.id;
        return (
          '<button type="button" class="nav-item' +
          (active ? ' active' : '') +
          '" data-action="nav" data-screen="' +
          item.id +
          '"' +
          (active ? ' aria-current="page"' : '') +
          '>' +
          icon(item.icon) +
          '<span>' +
          esc(item.label) +
          '</span></button>'
        );
      })
      .join('');
  }

  function header(title, subtitle, actions) {
    return (
      '<header class="topbar">' +
      '<div class="brand-mark">' +
      icon('wheat') +
      '</div>' +
      '<div class="topbar-copy"><h1>' +
      esc(title) +
      '</h1><p class="topbar-sub">' +
      esc(subtitle) +
      '</p></div>' +
      (actions ? '<div class="topbar-actions">' + actions + '</div>' : '') +
      '</header>'
    );
  }

  function emptyBox(iconName, title, text, actionHtml) {
    return (
      '<div class="empty-state"><div class="empty-icon">' +
      icon(iconName) +
      '</div><h3>' +
      esc(title) +
      '</h3><p>' +
      esc(text) +
      '</p>' +
      (actionHtml || '') +
      '</div>'
    );
  }

  // ---------------------------------------------------------------------
  // Home
  // ---------------------------------------------------------------------

  function renderHome() {
    const products = activeProducts();
    const product = selectedHomeProduct();
    const date = today();

    let html = header(
      displayShopName(),
      longDate(date),
      '<button type="button" class="lang-pill" data-action="toggle-language" aria-label="' +
        esc(tr('lang.switchTo')) +
        '">' +
        esc(tr('lang.other')) +
        '</button>' +
        '<button type="button" class="icon-btn" data-action="nav" data-screen="settings" aria-label="' +
        esc(tr('home.settingsAria')) +
        '">' +
        icon('settings') +
        '</button>'
    );

    if (!product) {
      return (
        html +
        emptyBox(
          'package',
          tr('home.empty.title'),
          tr('home.empty.text'),
          '<button type="button" class="btn primary" style="margin-top:14px" data-action="open-add-product">' +
            icon('plus') +
            ' ' +
            esc(tr('home.addProduct')) +
            '</button>'
        )
      );
    }

    const status = stockStatus(product);
    const stats = Store.statsForProduct(
      state,
      product.id,
      date,
      date
    );
    const hasSales = state.transactions.some(
      (t) => t.type === 'sale' && t.productId === product.id
    );
    const setupComplete = hasSales;

    if (!setupComplete) {
      html += setupCard(product, hasSales);
    }

    if (products.length > 1) {
      html +=
        '<div class="product-selector">' +
        products
          .map(function (p) {
            return (
              '<button type="button" class="product-pill' +
              (p.id === product.id ? ' active' : '') +
              '" data-action="select-product" data-id="' +
              p.id +
              '"><span class="pill-emoji">' +
              esc(p.emoji) +
              '</span>' +
              esc(p.name) +
              '</button>'
            );
          })
          .join('') +
        '</div>';
    }

    html +=
      '<section class="stock-card">' +
      '<svg class="stock-watermark icon" aria-hidden="true"><use href="#i-wheat"></use></svg>' +
      '<div class="stock-top">' +
      '<div><span class="stock-eyebrow">' +
      esc(tr('home.stockNow')) +
      '</span><span class="stock-name">' +
      esc(product.emoji + ' ' + product.name) +
      '</span></div>' +
      '<span class="status-pill ' +
      status.key +
      '"><span class="dot"></span>' +
      esc(status.label) +
      '</span>' +
      '</div>' +
      '<div class="stock-main"><span class="stock-number">' +
      Store.formatQty(product.stock) +
      '</span><span class="stock-unit">' +
      unitLabel(product.unit) +
      '</span></div>' +
      '<div class="stock-meta">' +
      '<div><span class="stock-meta-label">' +
      esc(tr('home.avgCost')) +
      '</span><span class="stock-meta-value">' +
      (product.avgCost > 0
        ? money(product.avgCost) + ' / ' + unitOne(product.unit)
        : esc(tr('common.notSetYet'))) +
      '</span></div>' +
      '<div><span class="stock-meta-label">' +
      esc(tr('home.stockValue')) +
      '</span><span class="stock-meta-value">' +
      money(product.stock * product.avgCost) +
      '</span></div>' +
      '</div>' +
      '</section>';

    const lowProducts = products.filter(isLowStock);
    if (lowProducts.length) {
      const first = lowProducts[0];
      html +=
        '<button type="button" class="low-stock-banner" data-action="open-purchase" data-id="' +
        first.id +
        '">' +
        icon('alert') +
        '<span class="banner-copy"><strong>' +
        (lowProducts.length === 1
          ? esc(stockStatus(first).label)
          : esc(
              tr('home.needsAttention', { count: lowProducts.length })
            )) +
        '</strong><span>' +
        lowProducts
          .map(function (p) {
            return esc(
              p.name +
                ' · ' +
                tr('common.left', {
                  qty: qtyText(p.stock, p.unit),
                })
            );
          })
          .join(' · ') +
        '</span></span><span class="chev">' +
        icon('chevron-right') +
        '</span></button>';
    }

    html +=
      '<div class="quick-actions">' +
      '<button type="button" class="quick-action in" data-action="open-purchase">' +
      '<span class="qa-icon">' +
      icon('arrow-down') +
      '</span><span class="qa-copy"><span class="qa-title">' +
      esc(tr('home.quick.stockIn')) +
      '</span><span class="qa-sub">' +
      esc(tr('home.quick.stockInSub')) +
      '</span></span></button>' +
      '<button type="button" class="quick-action out" data-action="open-sale">' +
      '<span class="qa-icon">' +
      icon('arrow-up') +
      '</span><span class="qa-copy"><span class="qa-title">' +
      esc(tr('home.quick.sale')) +
      '</span><span class="qa-sub">' +
      esc(tr('home.quick.saleSub')) +
      '</span></span></button>' +
      '</div>';

    html += renderPriceCard(product);

    html +=
      '<section class="section">' +
      '<div class="section-head"><h2 class="section-title">' +
      esc(tr('home.today')) +
      '</h2><span class="section-link muted">' +
      shortDate(date) +
      '</span></div>' +
      '<div class="stats-grid">' +
      statTile(
        tr('home.stat.stockIn'),
        smartQty(stats.purchaseQty, product.unit),
        money(stats.purchaseAmount)
      ) +
      statTile(
        tr('home.stat.sold'),
        smartQty(stats.soldQty, product.unit),
        plural(stats.salesCount, 'common.sale', 'common.sales')
      ) +
      statTile(
        tr('home.stat.sales'),
        money(stats.salesAmount),
        tr('home.stat.collected')
      ) +
      '</div>' +
      '<div class="profit-banner"><span class="pb-label">' +
      icon('receipt') +
      ' ' +
      esc(tr('home.estimatedProfit')) +
      '</span><strong>' +
      money(stats.profit) +
      '</strong></div>' +
      '</section>';

    const recent = state.transactions.slice(0, 4);
    html +=
      '<section class="section">' +
      '<div class="section-head"><h2 class="section-title">' +
      esc(tr('home.recent')) +
      '</h2>' +
      (state.transactions.length
        ? '<button type="button" class="section-link" data-action="nav" data-screen="history">' +
          esc(tr('home.viewAll')) +
          '</button>'
        : '') +
      '</div>';
    if (recent.length) {
      html +=
        '<div class="activity-card">' +
        recent.map(activityRow).join('') +
        '</div>';
    } else {
      html += emptyBox(
        'receipt',
        tr('home.noEntries.title'),
        tr('home.noEntries.text')
      );
    }
    html += '</section>';

    return html;
  }

  function setupCard(product, hasSales) {
    const priceDone = product.sellPrice > 0;
    const stockDone = product.stock > 0;
    return (
      '<div class="setup-card">' +
      '<div class="setup-head"><div class="setup-emoji">' +
      esc(product.emoji) +
      '</div><div><h2 class="setup-title">' +
      esc(tr('setup.title')) +
      '</h2><p class="setup-text">' +
      esc(tr('setup.text')) +
      '</p></div></div>' +
      '<ol class="setup-steps">' +
      '<li class="setup-step ' +
      (priceDone ? 'done' : '') +
      '"><span class="num">' +
      (priceDone ? icon('check') : '1') +
      '</span><span class="label">' +
      esc(tr('setup.price')) +
      '</span>' +
      (priceDone
        ? ''
        : '<button type="button" data-action="open-price">' +
          esc(tr('common.set')) +
          '</button>') +
      '</li>' +
      '<li class="setup-step ' +
      (stockDone ? 'done' : '') +
      '"><span class="num">' +
      (stockDone ? icon('check') : '2') +
      '</span><span class="label">' +
      esc(tr('setup.stock')) +
      '</span>' +
      (stockDone
        ? ''
        : '<button type="button" data-action="open-purchase">' +
          esc(tr('common.add')) +
          '</button>') +
      '</li>' +
      '<li class="setup-step ' +
      (hasSales ? 'done' : '') +
      '"><span class="num">' +
      (hasSales ? icon('check') : '3') +
      '</span><span class="label">' +
      esc(tr('setup.sale')) +
      '</span>' +
      (hasSales
        ? ''
        : '<button type="button" data-action="open-sale">' +
          esc(tr('setup.sell')) +
          '</button>') +
      '</li>' +
      '</ol></div>'
    );
  }

  function renderPriceCard(product) {
    if (!(product.sellPrice > 0)) {
      return (
        '<section class="price-card">' +
        '<div class="price-head"><span class="price-label">' +
        esc(tr('price.selling')) +
        '</span></div>' +
        '<div class="price-empty"><span class="icon-wrap">' +
        icon('tag') +
        '</span><span class="price-empty-copy"><strong>' +
        esc(tr('price.setTitle')) +
        '</strong><span>' +
        esc(tr('price.setSub')) +
        '</span></span>' +
        '<button type="button" class="btn small primary" data-action="open-price">' +
        esc(tr('common.set')) +
        '</button></div>' +
        '</section>'
      );
    }

    const margin = marginPerUnit(product);
    const percent = marginPercent(product);
    const unit = unitOne(product.unit);
    let html =
      '<section class="price-card">' +
      '<div class="price-head"><span class="price-label">' +
      esc(tr('price.selling')) +
      '</span>' +
      '<button type="button" class="edit-pill" data-action="open-price">' +
      icon('pencil') +
      ' ' +
      esc(tr('price.change')) +
      '</button></div>' +
      '<div class="price-row"><span class="price-big">' +
      money(product.sellPrice) +
      '</span><span class="price-unit">/ ' +
      unit +
      '</span></div>' +
      '<div class="margin-row">' +
      '<span class="margin-chip">' +
      esc(tr('price.cost')) +
      ' ' +
      (product.avgCost > 0
        ? money(product.avgCost) + '/' + unit
        : esc(tr('common.notSetYet'))) +
      '</span>' +
      (product.avgCost > 0
        ? '<span class="margin-chip ' +
          (margin >= 0 ? 'profit' : 'loss') +
          '">' +
          esc(tr('price.profit')) +
          ' ' +
          money(margin) +
          '/' +
          unit +
          ' (' +
          Math.round(percent) +
          '%)</span>'
        : '') +
      '</div>';

    if (product.unit === 'kg' || product.unit === 'litre') {
      const smallUnit = product.unit === 'kg' ? 'g' : 'ml';
      html +=
        '<div class="pack-row">' +
        [10, 20, 50]
          .map(function (amount) {
            const small = Math.round((amount / product.sellPrice) * 1000);
            return (
              '<div class="pack-chip"><strong>₹' +
              amount +
              '</strong><span>≈ ' +
              small +
              ' ' +
              smallUnit +
              '</span></div>'
            );
          })
          .join('') +
        '</div>';
    }

    return html + '</section>';
  }

  function statTile(label, value, sub) {
    return (
      '<div class="stat-tile"><span class="stat-label">' +
      esc(label) +
      '</span><span class="stat-value">' +
      esc(value) +
      '</span><span class="stat-sub">' +
      esc(sub) +
      '</span></div>'
    );
  }

  function txnMeta(txn) {
    const product = findProduct(txn.productId);
    const name = product ? product.name : tr('common.product');
    const unit = product ? product.unit : 'kg';
    const unitWord = unitOne(unit);
    const when = timeLabel(txn.createdAt);
    let iconName = 'receipt';
    let iconClass = 'in';
    let title = name;
    let sub = '';
    let amount = '';
    let amountClass = 'negative';
    let extra = '';

    if (txn.type === 'purchase' || txn.type === 'opening') {
      iconName = 'arrow-down';
      iconClass = 'in';
      title =
        name +
        ' · ' +
        tr(
          txn.type === 'opening' ? 'txn.openingSuffix' : 'txn.stockInSuffix'
        );
      sub =
        qtyText(txn.qty, unit) +
        ' × ' +
        money(txn.rate) +
        '/' +
        unitWord +
        ' · ' +
        when;
      amount = '−' + money(txn.amount);
      amountClass = 'negative';
    } else if (txn.type === 'sale') {
      iconName = 'arrow-up';
      iconClass = 'out';
      title = name + ' · ' + tr('txn.saleSuffix');
      sub =
        qtyText(txn.qty, unit) +
        ' × ' +
        money(txn.rate) +
        '/' +
        unitWord +
        ' · ' +
        when;
      amount = '+' + money(txn.amount);
      amountClass = 'positive';
      extra = tr('txn.profit', { amount: money(txn.profit) });
    } else if (txn.type === 'price') {
      iconName = 'tag';
      iconClass = 'price';
      title = name + ' · ' + tr('txn.priceChanged');
      sub =
        money(txn.oldPrice) +
        ' → ' +
        money(txn.newPrice) +
        ' · ' +
        when;
      amount = money(txn.newPrice);
      amountClass = 'negative';
      extra = tr('txn.perUnit', { unit: unitWord });
    } else if (txn.type === 'adjustment') {
      iconName = 'scale';
      iconClass = 'adjust';
      title = name + ' · ' + tr('txn.adjusted');
      sub = tr('txn.countedAt', { qty: qtyText(txn.qty, unit) }) + ' · ' + when;
      const delta = Number(txn.delta) || 0;
      amount =
        (delta > 0 ? '+' : delta < 0 ? '−' : '') +
        (delta === 0 ? tr('common.noChange') : smartQty(Math.abs(delta), unit));
      amountClass = delta >= 0 ? 'positive' : 'negative';
      extra = tr('common.correction');
    }

    return {
      icon: iconName,
      iconClass: iconClass,
      title: title,
      sub: sub,
      amount: amount,
      amountClass: amountClass,
      extra: extra,
    };
  }

  function activityRow(txn) {
    const meta = txnMeta(txn);
    return (
      '<button type="button" class="activity-row" data-action="open-txn" data-id="' +
      txn.id +
      '"><span class="activity-icon ' +
      meta.iconClass +
      '">' +
      icon(meta.icon) +
      '</span><span class="activity-copy"><span class="activity-title">' +
      esc(meta.title) +
      '</span><span class="activity-sub">' +
      esc(meta.sub) +
      '</span></span><span class="activity-right"><span class="activity-amount ' +
      meta.amountClass +
      '">' +
      meta.amount +
      '</span>' +
      (meta.extra
        ? '<span class="activity-extra">' + esc(meta.extra) + '</span>'
        : '') +
      '</span></button>'
    );
  }

  // ---------------------------------------------------------------------
  // Products
  // ---------------------------------------------------------------------

  function renderProducts() {
    const active = state.products.filter((p) => p.active);
    const archived = state.products.filter((p) => !p.active);
    const value = Store.inventoryValue(state);

    let html = header(
      tr('products.title'),
      tr('products.subtitle'),
      '<button type="button" class="btn small primary" data-action="open-add-product">' +
        icon('plus') +
        ' ' +
        esc(tr('products.add')) +
        '</button>'
    );

    html +=
      '<div class="stats-grid">' +
      statTile(
        tr('products.title'),
        String(active.length),
        tr('products.stat.active')
      ) +
      statTile(
        tr('products.stat.stockValue'),
        money(value.cost),
        tr('products.stat.atCost')
      ) +
      statTile(
        tr('products.stat.retail'),
        money(value.retail),
        tr('products.stat.ifSold')
      ) +
      '</div>';

    html +=
      '<section class="section"><div class="section-head"><h2 class="section-title">' +
      esc(tr('products.your')) +
      '</h2></div>';

    if (active.length) {
      html +=
        '<div class="product-list">' +
        active.map(productCard).join('') +
        '</div>';
    } else {
      html += emptyBox(
        'package',
        tr('products.empty.title'),
        tr('products.empty.text'),
        '<button type="button" class="btn primary" style="margin-top:14px" data-action="open-add-product">' +
          icon('plus') +
          ' ' +
          esc(tr('home.addProduct')) +
          '</button>'
      );
    }
    html += '</section>';

    if (archived.length) {
      html +=
        '<div class="archived-title"><span>' +
        plural(
          archived.length,
          'common.archivedProduct',
          'common.archivedProducts'
        ) +
        '</span><button type="button" data-action="toggle-archived">' +
        esc(ui.showArchived ? tr('products.hide') : tr('products.show')) +
        '</button></div>';
      if (ui.showArchived) {
        html +=
          '<div class="product-list">' +
          archived.map(productCard).join('') +
          '</div>';
      }
    }

    return html;
  }

  function productCard(product) {
    const status = stockStatus(product);
    const priceLine =
      product.sellPrice > 0
        ? money(product.sellPrice) + ' / ' + unitOne(product.unit)
        : tr('products.priceNotSet');
    const costLine =
      product.avgCost > 0
        ? tr('common.cost') + ' ' + money(product.avgCost)
        : tr('products.noCost');
    return (
      '<button type="button" class="product-card' +
      (product.active ? '' : ' archived') +
      '" data-action="open-product" data-id="' +
      product.id +
      '"><span class="product-emoji">' +
      esc(product.emoji) +
      '</span><span class="product-info"><span class="product-name">' +
      esc(product.name) +
      '</span><span class="product-meta">' +
      esc(priceLine + ' · ' + costLine) +
      '</span></span><span class="product-right"><span class="product-stock">' +
      Store.formatQty(product.stock) +
      ' <span>' +
      unitLabel(product.unit) +
      '</span></span><span class="product-status ' +
      status.key +
      '">' +
      esc(product.active ? status.label : tr('status.archived')) +
      '</span></span>' +
      icon('chevron-right', 'chev') +
      '</button>'
    );
  }

  // ---------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------

  function historyRange() {
    const day = today();
    if (ui.historyPeriod === '7d') {
      return {
        from: addDays(day, -6),
        to: day,
        label: tr('history.range.7d'),
      };
    }
    if (ui.historyPeriod === '30d') {
      return {
        from: addDays(day, -29),
        to: day,
        label: tr('history.range.30d'),
      };
    }
    if (ui.historyPeriod === 'all') {
      return { from: null, to: null, label: tr('history.range.all') };
    }
    return { from: day, to: day, label: tr('common.today') };
  }

  function filteredTransactions() {
    const range = historyRange();
    return state.transactions.filter(function (txn) {
      if (range.from && txn.date < range.from) return false;
      if (range.to && txn.date > range.to) return false;
      if (
        ui.historyFilter === 'purchase' &&
        txn.type !== 'purchase' &&
        txn.type !== 'opening'
      ) {
        return false;
      }
      if (ui.historyFilter === 'sale' && txn.type !== 'sale') return false;
      if (ui.historyFilter === 'price' && txn.type !== 'price') return false;
      if (
        ui.historyFilter === 'adjustment' &&
        txn.type !== 'adjustment'
      ) {
        return false;
      }
      return true;
    });
  }

  function renderHistory() {
    const range = historyRange();
    const list = filteredTransactions();
    const stats = Store.statsOverall(state, range.from, range.to);

    let html = header(
      tr('history.title'),
      tr('history.subtitle'),
      '<button type="button" class="icon-btn" data-action="export-csv" aria-label="' +
        esc(tr('history.exportAria')) +
        '">' +
        icon('download') +
        '</button>'
    );

    html +=
      '<div class="history-top"><div class="segmented">' +
      [
        ['today', tr('history.period.today')],
        ['7d', tr('history.period.7d')],
        ['30d', tr('history.period.30d')],
        ['all', tr('history.period.all')],
      ]
        .map(function (item) {
          return (
            '<button type="button" class="seg-btn' +
            (ui.historyPeriod === item[0] ? ' active' : '') +
            '" data-action="history-period" data-value="' +
            item[0] +
            '">' +
            item[1] +
            '</button>'
          );
        })
        .join('') +
      '</div></div>';

    html +=
      '<div class="summary-card"><span class="summary-label">' +
      esc(tr('history.overview', { range: range.label })) +
      '</span><div class="summary-grid">' +
      '<div class="summary-item"><span class="value">' +
      money(stats.salesAmount) +
      '</span><span class="sub">' +
      plural(stats.salesCount, 'common.sale', 'common.sales') +
      '</span></div>' +
      '<div class="summary-item"><span class="value">' +
      money(stats.profit) +
      '</span><span class="sub">' +
      esc(tr('history.estimatedProfit')) +
      '</span></div>' +
      '<div class="summary-item"><span class="value">' +
      money(stats.purchaseAmount) +
      '</span><span class="sub">' +
      plural(stats.purchaseCount, 'common.stockEntry', 'common.stockEntries') +
      '</span></div>' +
      '<div class="summary-item"><span class="value">' +
      list.length +
      '</span><span class="sub">' +
      esc(tr('history.entriesView')) +
      '</span></div>' +
      '</div></div>';

    html +=
      '<div class="filter-chips">' +
      [
        ['all', tr('history.filter.all')],
        ['purchase', tr('history.filter.stockIn')],
        ['sale', tr('history.filter.sales')],
        ['price', tr('history.filter.prices')],
        ['adjustment', tr('history.filter.adjustments')],
      ]
        .map(function (item) {
          return (
            '<button type="button" class="chip' +
            (ui.historyFilter === item[0] ? ' active' : '') +
            '" data-action="history-filter" data-value="' +
            item[0] +
            '">' +
            item[1] +
            '</button>'
          );
        })
        .join('') +
      '</div>';

    if (!list.length) {
      html += emptyBox(
        'receipt',
        tr('history.empty.title'),
        tr('history.empty.text'),
        '<button type="button" class="btn primary" style="margin-top:14px" data-action="open-sale">' +
          icon('plus') +
          ' ' +
          esc(tr('history.recordSale')) +
          '</button>'
      );
      return html;
    }

    const groups = new Map();
    list.forEach(function (txn) {
      if (!groups.has(txn.date)) groups.set(txn.date, []);
      groups.get(txn.date).push(txn);
    });

    groups.forEach(function (txns, date) {
      const daySales = txns
        .filter((t) => t.type === 'sale')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      html +=
        '<div class="date-group"><div class="date-head"><span>' +
        esc(dateLabel(date)) +
        '</span><span class="date-total">' +
        (daySales > 0
          ? esc(tr('common.sold', { amount: money(daySales) }))
          : plural(txns.length, 'common.entry', 'common.entries')) +
        '</span></div><div class="activity-card">' +
        txns.map(activityRow).join('') +
        '</div></div>';
    });

    return html;
  }

  // ---------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------

  function renderSettings() {
    const pinOn = isPinSet();
    const backupAge = state.settings.lastBackupAt
      ? Date.now() - new Date(state.settings.lastBackupAt).getTime()
      : null;
    const backupFresh =
      backupAge !== null && backupAge < 8 * 24 * 60 * 60 * 1000;
    const standalone = isStandalone();
    const installButton = standalone
      ? '<span class="status-dot">Installed</span>'
      : '<button type="button" class="btn small primary" data-action="' +
        (deferredInstallPrompt ? 'install' : 'install-help') +
        '">' +
        (deferredInstallPrompt ? 'Install app' : 'How to install') +
        '</button>';

    let html = header(
      tr('settings.title'),
      tr('settings.subtitle'),
      '<span class="status-dot' +
        (backupFresh ? '' : ' off') +
        '">' +
        esc(backupFresh ? tr('settings.backedUp') : tr('settings.backupDue')) +
        '</span>'
    );

    html +=
      '<div class="settings-card"><div class="settings-card-head"><h2 class="settings-card-title">' +
      esc(tr('lang.title')) +
      '</h2><p class="settings-card-sub">' +
      esc(tr('lang.sub')) +
      '</p></div><div class="segmented language-switch" role="group" aria-label="' +
      esc(tr('lang.title')) +
      '">' +
      '<button type="button" class="seg-btn' +
      (currentLanguage() === 'en' ? ' active' : '') +
      '" data-action="set-language" data-value="en">English</button>' +
      '<button type="button" class="seg-btn' +
      (currentLanguage() === 'mr' ? ' active' : '') +
      '" data-action="set-language" data-value="mr">मराठी</button>' +
      '</div></div>';

    html +=
      '<div class="settings-card"><div class="settings-card-head"><h2 class="settings-card-title">' +
      esc(tr('settings.shop.title')) +
      '</h2><p class="settings-card-sub">' +
      esc(tr('settings.shop.sub')) +
      '</p></div>' +
      '<form id="shop-form" class="inline-form" novalidate><div class="input-wrap compact"><input id="shop-name" maxlength="40" autocomplete="off" value="' +
      esc(state.settings.shopName) +
      '" aria-label="' +
      esc(tr('settings.shop.nameAria')) +
      '"></div><button type="submit" class="btn small primary">' +
      esc(tr('settings.shop.save')) +
      '</button></form></div>';

    html +=
      '<div class="settings-card"><div class="settings-card-head"><h2 class="settings-card-title">' +
      esc(tr('settings.backup.title')) +
      '</h2><p class="settings-card-sub">' +
      esc(tr('settings.backup.sub')) +
      '</p></div>' +
      '<div class="settings-row"><div class="settings-row-copy"><span class="settings-row-title">' +
      esc(tr('settings.backup.last')) +
      '</span><span class="settings-row-sub">' +
      esc(backupDateLabel(state.settings.lastBackupAt)) +
      '</span></div><span class="status-dot' +
      (backupFresh ? '' : ' off') +
      '">' +
      esc(backupFresh ? tr('settings.backup.safe') : tr('settings.backup.due')) +
      '</span></div>' +
      '<div class="button-stack"><button type="button" class="btn outline" data-action="backup">' +
      icon('download') +
      ' ' +
      esc(tr('settings.backup.download')) +
      '</button><button type="button" class="btn outline" data-action="restore">' +
      icon('upload') +
      ' ' +
      esc(tr('settings.backup.restore')) +
      '</button></div>' +
      '<p class="card-note">' +
      esc(tr('settings.backup.note')) +
      '</p></div>';

    html +=
      '<div class="settings-card"><div class="settings-card-head"><h2 class="settings-card-title">' +
      esc(tr('settings.lock.title')) +
      '</h2><p class="settings-card-sub">' +
      esc(tr('settings.lock.sub')) +
      '</p></div>' +
      '<div class="settings-row"><div class="settings-row-copy"><span class="settings-row-title">' +
      esc(tr('settings.lock.pin')) +
      '</span><span class="settings-row-sub">' +
      esc(pinOn ? tr('settings.lock.on') : tr('settings.lock.off')) +
      '</span></div><button type="button" class="switch' +
      (pinOn ? ' on' : '') +
      '" data-action="' +
      (pinOn ? 'remove-pin' : 'set-pin') +
      '" aria-label="' +
      esc(pinOn ? tr('settings.lock.turnOff') : tr('settings.lock.turnOn')) +
      '" aria-pressed="' +
      (pinOn ? 'true' : 'false') +
      '"></button></div>' +
      (pinOn
        ? '<div class="button-stack"><div class="btn-row"><button type="button" class="btn outline small" data-action="change-pin">' +
          esc(tr('settings.lock.change')) +
          '</button><button type="button" class="btn outline small" data-action="lock-now">' +
          icon('lock') +
          ' ' +
          esc(tr('settings.lock.now')) +
          '</button></div></div>'
        : '') +
      '</div>';

    html +=
      '<div class="settings-card"><div class="settings-card-head"><h2 class="settings-card-title">' +
      esc(tr('settings.install.title')) +
      '</h2><p class="settings-card-sub">' +
      esc(tr('settings.install.sub')) +
      '</p></div>' +
      '<div class="settings-row"><div class="settings-row-copy"><span class="settings-row-title">' +
      esc(tr('settings.install.row')) +
      '</span><span class="settings-row-sub">' +
      esc(
        standalone
          ? tr('settings.install.installedText')
          : tr('settings.install.notInstalledText')
      ) +
      '</span></div>' +
      installButton +
      '</div></div>';

    html +=
      '<div class="settings-card"><div class="settings-card-head"><h2 class="settings-card-title">' +
      esc(tr('settings.help.title')) +
      '</h2><p class="settings-card-sub">' +
      esc(tr('settings.help.sub')) +
      '</p></div><div class="button-stack"><button type="button" class="btn outline" data-action="open-help">' +
      icon('info') +
      ' ' +
      esc(tr('settings.help.button')) +
      '</button></div></div>';

    html +=
      '<div class="settings-card"><div class="settings-card-head"><h2 class="settings-card-title">' +
      esc(tr('settings.data.title')) +
      '</h2><p class="settings-card-sub">' +
      plural(state.products.length, 'common.product', 'common.products') +
      ' · ' +
      plural(state.transactions.length, 'common.entry', 'common.entries') +
      '</p></div><div class="button-stack"><button type="button" class="btn outline" data-action="export-all-csv">' +
      icon('download') +
      ' ' +
      esc(tr('settings.data.downloadCsv')) +
      '</button><button type="button" class="btn danger" data-action="reset">' +
      icon('trash') +
      ' ' +
      esc(tr('settings.data.reset')) +
      '</button></div><p class="card-note">' +
      esc(tr('settings.data.resetNote')) +
      '</p></div>';

    html +=
      '<div class="settings-card about-box"><div class="about-logo">' +
      icon('wheat') +
      '</div><div class="about-name">' +
      esc(tr('app.name')) +
      '</div><div class="about-version">' +
      esc(tr('settings.about.version', { version: APP_VERSION })) +
      '</div><p class="about-text">' +
      esc(tr('settings.about.text')) +
      '</p></div>';

    return html;
  }

  // ---------------------------------------------------------------------
  // CSV export
  // ---------------------------------------------------------------------

  function csvCell(value) {
    const text = value === null || value === undefined ? '' : String(value);
    if (/[",\r\n]/.test(text)) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function exportTransactionsCsv(list, label) {
    if (!list.length) {
      toast(tr('csv.empty'), 'error');
      return;
    }
    const rows = list
      .slice()
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return a.createdAt < b.createdAt ? -1 : 1;
      })
      .map(function (txn) {
        const product = findProduct(txn.productId);
        return [
          txn.date,
          timeLabel(txn.createdAt),
          TYPE_LABEL[txn.type] || txn.type,
          product ? product.name : tr('common.product'),
          product ? unitLabel(product.unit) : '',
          txn.type === 'price' ? '' : Store.roundQty(txn.qty),
          txn.type === 'price' ? txn.newPrice : txn.rate,
          txn.type === 'price' ? '' : txn.amount,
          txn.type === 'sale' ? txn.cost : '',
          txn.type === 'sale' ? txn.profit : '',
          txn.note || '',
        ];
      });
    const header = [
      tr('csv.date'),
      tr('csv.time'),
      tr('csv.type'),
      tr('csv.product'),
      tr('csv.unit'),
      tr('csv.quantity'),
      tr('csv.rate'),
      tr('csv.amount'),
      tr('csv.cost'),
      tr('csv.profit'),
      tr('csv.note'),
    ];
    const csv = [header]
      .concat(rows)
      .map(function (row) {
        return row.map(csvCell).join(',');
      })
      .join('\r\n');
    downloadFile(
      '\ufeff' + csv,
      'hurda-hisaab-' + label + '-' + today() + '.csv',
      'text/csv;charset=utf-8'
    );
    toast(tr('csv.downloaded'));
  }

  function exportHistoryCsv() {
    exportTransactionsCsv(filteredTransactions(), ui.historyPeriod);
  }

  function exportAllCsv() {
    exportTransactionsCsv(
      state.transactions.slice(),
      'all-' + today()
    );
  }


  // ---------------------------------------------------------------------
  // Sheets
  // ---------------------------------------------------------------------

  function openSheet(options) {
    closeSheet(true);
    const toastRoot = $('#toast-root');
    if (toastRoot) toastRoot.innerHTML = '';
    const root = $('#sheet-root');
    root.innerHTML =
      '<div class="sheet-layer"><div class="sheet-backdrop" data-action="close-sheet"></div>' +
      '<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">' +
      '<div class="sheet-grip"></div>' +
      '<header class="sheet-head"><div><h2 id="sheet-title">' +
      esc(options.title || '') +
      '</h2>' +
      (options.subtitle
        ? '<p>' + esc(options.subtitle) + '</p>'
        : '') +
      '</div><button type="button" class="icon-btn sheet-close" data-action="close-sheet" aria-label="Close">' +
      icon('x') +
      '</button></header>' +
      '<div class="sheet-body">' +
      (options.body || '') +
      '</div>' +
      (options.footer
        ? '<footer class="sheet-foot">' + options.footer + '</footer>'
        : '') +
      '</section></div>';
    document.body.classList.add('sheet-open');
    requestAnimationFrame(function () {
      const layer = root.querySelector('.sheet-layer');
      if (layer) layer.classList.add('open');
    });
    if (options.onMount) options.onMount(root);
  }

  function closeSheet(immediate) {
    const root = $('#sheet-root');
    const layer = root.querySelector('.sheet-layer');
    if (!layer) return;
    if (immediate) {
      root.innerHTML = '';
      document.body.classList.remove('sheet-open');
      return;
    }
    layer.classList.remove('open');
    document.body.classList.remove('sheet-open');
    setTimeout(function () {
      if (root.querySelector('.sheet-layer') === layer) root.innerHTML = '';
    }, 260);
  }

  function setInput(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function showFormError(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
  }

  function clearFormError(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = '';
    el.classList.remove('show');
  }

  function productSelectHtml(id, selectedId) {
    return (
      '<div class="field"><label class="field-label" for="' +
      id +
      '">Product</label><div class="input-wrap"><select id="' +
      id +
      '">' +
      activeProducts()
        .map(function (product) {
          return (
            '<option value="' +
            product.id +
            '"' +
            (product.id === selectedId ? ' selected' : '') +
            '>' +
            esc(product.emoji + ' ' + product.name) +
            '</option>'
          );
        })
        .join('') +
      '</select>' +
      icon('chevron-down', 'select-arrow') +
      '</div></div>'
    );
  }

  function productStrip(product, extra) {
    const status = stockStatus(product);
    return (
      '<div class="product-detail-hero"><span class="product-detail-emoji">' +
      esc(product.emoji) +
      '</span><span class="product-detail-copy"><span class="product-detail-name">' +
      esc(product.name) +
      '</span><span class="product-detail-sub">' +
      esc(
        'In stock: ' +
          qtyText(product.stock, product.unit) +
          (extra ? ' · ' + extra : '')
      ) +
      '</span></span><span class="product-status ' +
      status.key +
      '">' +
      status.label +
      '</span></div>'
    );
  }

  function lastPurchaseRate(productId) {
    const txn = state.transactions.find(function (t) {
      return (
        t.productId === productId &&
        (t.type === 'purchase' || t.type === 'opening')
      );
    });
    return txn ? txn.rate : 0;
  }

  function qtyChips(unit, mode) {
    let values;
    if (mode === 'amount') values = [10, 20, 50, 100];
    else if (unit === 'kg' || unit === 'litre') values = [1, 2, 5, 10];
    else if (unit === 'g') values = [100, 250, 500, 1000];
    else values = [1, 2, 5, 10];
    return values
      .map(function (value) {
        return (
          '<button type="button" class="quick-chip" data-quick="' +
          value +
          '">' +
          (mode === 'amount'
            ? '₹' + value
            : smartQty(value, unit)) +
          '</button>'
        );
      })
      .join('');
  }

  // ---------------------------------------------------------------------
  // Stock In sheet
  // ---------------------------------------------------------------------

  function openPurchase(productId, editTxn) {
    const product = editTxn
      ? findProduct(editTxn.productId)
      : findProduct(productId) || selectedHomeProduct();

    if (!product) {
      toast(tr('error.addProductFirst'), 'error');
      return;
    }

    const isEdit = !!editTxn;
    const active = activeProducts();
    const canSelect = !isEdit && active.length > 1;
    let mode = isEdit ? 'rate' : ui.purchaseMode || 'rate';
    const lastRate = isEdit ? editTxn.rate : lastPurchaseRate(product.id);
    const startRate = isEdit ? editTxn.rate : lastRate;
    const unit = product.unit;

    const body =
      '<form id="purchase-form" novalidate>' +
      (canSelect
        ? productSelectHtml('p-product', product.id)
        : productStrip(product, isEdit ? 'Editing this entry' : '')) +
      '<div class="field"><label class="field-label" for="p-qty">Quantity</label>' +
      '<div class="input-wrap"><input id="p-qty" inputmode="decimal" autocomplete="off" placeholder="0" value="' +
      (isEdit ? esc(editTxn.qty) : '') +
      '"><span class="suffix">' +
      unitLabel(unit) +
      '</span></div>' +
      '<div class="chips" id="p-qty-chips">' +
      qtyChips(unit, 'qty') +
      '</div></div>' +
      '<div class="field"><span class="field-label" id="p-cost-label">Cost</span>' +
      '<div class="segmented" id="p-cost-mode">' +
      '<button type="button" class="seg-btn' +
      (mode === 'rate' ? ' active' : '') +
      '" data-mode="rate">Rate per ' +
      unitOne(unit) +
      '</button>' +
      '<button type="button" class="seg-btn' +
      (mode === 'total' ? ' active' : '') +
      '" data-mode="total">Total paid</button></div>' +
      '<div class="input-wrap" style="margin-top:8px"><span class="prefix">₹</span><input id="p-cost" inputmode="decimal" autocomplete="off" placeholder="0" value="' +
      (startRate > 0 ? esc(startRate) : '') +
      '"><span class="suffix" id="p-cost-suffix">' +
      (mode === 'rate' ? '/' + unitOne(unit) : 'total') +
      '</span></div>' +
      '<div class="calc-box" id="p-calc"></div>' +
      '<div class="form-error" id="p-error"></div></div>' +
      '<div class="form-grid"><div class="field"><label class="field-label" for="p-date">Date</label><div class="input-wrap"><input type="date" id="p-date" value="' +
      (isEdit ? esc(editTxn.date) : today()) +
      '"></div></div>' +
      '<div class="field"><label class="field-label">Last rate</label><div class="input-wrap compact"><span class="prefix" style="font-size:15px;font-weight:800;color:var(--ink)">' +
      (lastRate > 0 ? money(lastRate) + '/' + unitOne(unit) : '—') +
      '</span></div></div></div>' +
      '<details class="note-details"><summary>Add a note ' +
      icon('chevron-down') +
      '</summary><div class="textarea-wrap"><textarea id="p-note" rows="2" placeholder="Supplier, vehicle, quality…">' +
      (isEdit ? esc(editTxn.note) : '') +
      '</textarea></div></details>' +
      '</form>';

    openSheet({
      title: isEdit ? 'Edit stock entry' : 'Stock In',
      subtitle: isEdit
        ? 'Changes will recalculate stock and cost.'
        : 'Record new stock that arrived.',
      body: body,
      footer:
        '<button type="submit" form="purchase-form" class="btn primary">' +
        icon('check') +
        (isEdit ? ' Update entry' : ' Add stock') +
        '</button>',
      onMount: function () {
        const qtyEl = $('#p-qty');
        const costEl = $('#p-cost');
        const calcEl = $('#p-calc');
        const costLabel = $('#p-cost-label');
        const costSuffix = $('#p-cost-suffix');

        function recalc() {
          const qty = readNum('p-qty');
          const raw = readNum('p-cost');
          const hasQty = Number.isFinite(qty) && qty > 0;
          const hasCost = Number.isFinite(raw) && raw >= 0;
          let total = 0;
          let rate = 0;
          if (hasQty && hasCost) {
            if (mode === 'rate') {
              rate = raw;
              total = qty * raw;
            } else {
              total = raw;
              rate = raw / qty;
            }
          }
          if (calcEl) {
            calcEl.className = 'calc-box';
            calcEl.innerHTML = hasQty && hasCost
              ? '<span><span class="calc-big">' +
                money(total) +
                '</span><span class="calc-sub">' +
                esc(qtyText(qty, unit)) +
                ' at ' +
                money(rate) +
                '/' +
                unitOne(unit) +
                '</span></span><span class="calc-side"><span class="label">Per ' +
                unitOne(unit) +
                '</span><span class="value">' +
                money(rate) +
                '</span></span>'
              : '<span><span class="calc-big">₹0</span><span class="calc-sub">Enter quantity and cost</span></span>';
          }
        }

        function setMode(nextMode) {
          if (nextMode === mode) return;
          const qty = readNum('p-qty');
          const current = readNum('p-cost');
          if (
            Number.isFinite(qty) &&
            qty > 0 &&
            Number.isFinite(current) &&
            current >= 0
          ) {
            if (nextMode === 'total') {
              setInput('p-cost', String(Store.roundMoney(qty * current)));
            } else {
              setInput('p-cost', String(Store.roundMoney(current / qty)));
            }
          }
          mode = nextMode;
          ui.purchaseMode = nextMode;
          $$('#p-cost-mode .seg-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.mode === mode);
          });
          if (costLabel)
            costLabel.textContent =
              mode === 'rate' ? 'Rate per ' + unitOne(unit) : 'Total paid';
          if (costSuffix)
            costSuffix.textContent =
              mode === 'rate' ? '/' + unitOne(unit) : 'total';
          recalc();
        }

        if (canSelect) {
          const select = $('#p-product');
          if (select) {
            select.addEventListener('change', function () {
              closeSheet(true);
              openPurchase(select.value);
            });
          }
        }

        $$('#p-cost-mode .seg-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            setMode(btn.dataset.mode);
          });
        });

        $$('#p-qty-chips .quick-chip').forEach(function (chip) {
          chip.addEventListener('click', function () {
            setInput('p-qty', chip.dataset.quick);
            recalc();
            if (qtyEl) qtyEl.focus();
          });
        });

        if (qtyEl) qtyEl.addEventListener('input', recalc);
        if (costEl) costEl.addEventListener('input', recalc);
        recalc();

        $('#purchase-form').addEventListener('submit', function (event) {
          event.preventDefault();
          clearFormError('p-error');
          const qty = readNum('p-qty');
          const raw = readNum('p-cost');
          if (!(qty > 0)) {
            showFormError('p-error', 'Enter a quantity greater than 0.');
            return;
          }
          if (!(raw >= 0)) {
            showFormError('p-error', 'Enter the cost.');
            return;
          }
          const rate = mode === 'rate' ? raw : raw / qty;
          const date = $('#p-date').value || today();
          const note = $('#p-note').value.trim();
          const result = isEdit
            ? Store.updateTransaction(state, editTxn.id, {
                qty: qty,
                rate: Store.roundMoney(rate),
                date: date,
                note: note,
              })
            : Store.addPurchase(state, {
                productId: product.id,
                qty: qty,
                rate: Store.roundMoney(rate),
                date: date,
                note: note,
              });

          if (!result.ok) {
            showFormError('p-error', result.error);
            return;
          }
          state = result.state;
          persistState(state);
          closeSheet(true);
          render();
          toast(
            isEdit
              ? 'Stock entry updated'
              : 'Stock added · ' + qtyText(qty, unit)
          );
        });
      },
    });
  }

  // ---------------------------------------------------------------------
  // Sale sheet
  // ---------------------------------------------------------------------

  function openSale(productId, editTxn) {
    const product = editTxn
      ? findProduct(editTxn.productId)
      : findProduct(productId) || selectedHomeProduct();

    if (!product) {
      toast(tr('error.addProductFirst'), 'error');
      return;
    }

    const isEdit = !!editTxn;
    const active = activeProducts();
    const canSelect = !isEdit && active.length > 1;
    let mode = isEdit ? 'qty' : ui.saleMode || 'qty';
    const unit = product.unit;
    const unitWord =
      unit === 'kg' || unit === 'litre'
        ? unitOne(unit)
        : unit === 'g'
          ? 'grams'
          : unitLabel(unit);
    const startRate = isEdit ? editTxn.rate : product.sellPrice;
    const maxQty = product.stock + (isEdit ? editTxn.qty : 0);
    const outOfStock = !isEdit && product.stock <= 0.0001;

    const body =
      '<form id="sale-form" novalidate>' +
      (canSelect
        ? productSelectHtml('s-product', product.id)
        : productStrip(product, isEdit ? 'Editing this sale' : '')) +
      (outOfStock
        ? '<button type="button" class="low-stock-banner" style="margin:0 0 13px" data-action="open-purchase" data-id="' +
          product.id +
          '">' +
          icon('alert') +
          '<span class="banner-copy"><strong>Out of stock</strong><span>Add stock before recording a sale.</span></span><span class="chev">' +
          icon('chevron-right') +
          '</span></button>'
        : '') +
      '<div class="field"><span class="field-label">How are you selling?</span>' +
      '<div class="segmented" id="sale-mode">' +
      '<button type="button" class="seg-btn' +
      (mode === 'qty' ? ' active' : '') +
      '" data-mode="qty">By ' +
      esc(unitWord) +
      '</button>' +
      '<button type="button" class="seg-btn' +
      (mode === 'amount' ? ' active' : '') +
      '" data-mode="amount">By ₹ amount</button></div></div>' +
      '<div class="field"><label class="field-label" for="s-rate">Rate per ' +
      unitOne(unit) +
      '</label><div class="input-wrap"><span class="prefix">₹</span><input id="s-rate" inputmode="decimal" autocomplete="off" placeholder="0" value="' +
      (startRate > 0 ? esc(startRate) : '') +
      '"><span class="suffix">/' +
      unitOne(unit) +
      '</span></div><p class="field-hint">Applies to this sale only. Use “Change” on Home to update the regular price.</p></div>' +
      '<div class="field" id="s-qty-field"><label class="field-label" for="s-qty">Quantity sold <span class="optional">In stock: ' +
      esc(qtyText(product.stock, unit)) +
      '</span></label><div class="input-wrap"><input id="s-qty" inputmode="decimal" autocomplete="off" placeholder="0" value="' +
      (isEdit ? esc(editTxn.qty) : '') +
      '"><span class="suffix">' +
      unitLabel(unit) +
      '</span></div><div class="chips" id="s-qty-chips">' +
      qtyChips(unit, 'qty') +
      '</div></div>' +
      '<div class="field hidden" id="s-amount-field"><label class="field-label" for="s-amount">Amount received</label><div class="input-wrap"><span class="prefix">₹</span><input id="s-amount" inputmode="decimal" autocomplete="off" placeholder="0"></div><div class="chips" id="s-amount-chips">' +
      qtyChips(unit, 'amount') +
      '</div></div>' +
      '<div class="calc-box" id="s-calc"></div>' +
      '<div class="form-error" id="s-error"></div>' +
      '<div class="form-grid"><div class="field"><label class="field-label" for="s-date">Date</label><div class="input-wrap"><input type="date" id="s-date" value="' +
      (isEdit ? esc(editTxn.date) : today()) +
      '"></div></div><div class="field"><label class="field-label">Stock after sale</label><div class="input-wrap compact"><span class="prefix" id="s-after" style="font-size:14px;font-weight:800;color:var(--ink)">—</span></div></div></div>' +
      '<details class="note-details"><summary>Add a note ' +
      icon('chevron-down') +
      '</summary><div class="textarea-wrap"><textarea id="s-note" rows="2" placeholder="Customer, packet details…">' +
      (isEdit ? esc(editTxn.note) : '') +
      '</textarea></div></details>' +
      '</form>';

    openSheet({
      title: isEdit ? 'Edit sale' : 'Sale',
      subtitle: isEdit
        ? 'Changes will recalculate stock and profit.'
        : 'Record what was sold. No customer details needed.',
      body: body,
      footer:
        '<button type="submit" form="sale-form" id="sale-submit" class="btn amber">' +
        icon('check') +
        (isEdit ? ' Update sale' : ' Record sale') +
        '</button>',
      onMount: function () {
        const rateEl = $('#s-rate');
        const qtyEl = $('#s-qty');
        const amountEl = $('#s-amount');
        const calcEl = $('#s-calc');
        const afterEl = $('#s-after');
        const submitEl = $('#sale-submit');

        function values() {
          const rate = readNum('s-rate');
          let qty = 0;
          let amount = 0;
          if (mode === 'qty') {
            qty = readNum('s-qty');
            if (!Number.isFinite(qty)) qty = 0;
            amount = qty * rate;
          } else {
            amount = readNum('s-amount');
            if (!Number.isFinite(amount)) amount = 0;
            qty = rate > 0 ? Store.roundQty(amount / rate) : 0;
          }
          return { rate: rate, qty: qty, amount: amount };
        }

        function recalc() {
          const val = values();
          const rateOk = Number.isFinite(val.rate) && val.rate > 0;
          const qtyOk = val.qty > 0;
          const amountOk = mode === 'qty' || val.amount > 0;
          const over = qtyOk && val.qty > maxQty + 0.000001;
          const valid = rateOk && qtyOk && amountOk && !over;
          const after = maxQty - val.qty;

          if (submitEl) submitEl.disabled = !valid;
          clearFormError('s-error');

          if (calcEl) {
            calcEl.className = 'calc-box' + (over ? ' bad' : '');
            if (over) {
              calcEl.innerHTML =
                '<span><span class="calc-big">Not enough stock</span><span class="calc-sub">Only ' +
                esc(qtyText(maxQty, unit)) +
                ' available for this sale.</span></span>';
            } else if (!rateOk) {
              calcEl.innerHTML =
                '<span><span class="calc-big">Set a rate</span><span class="calc-sub">Enter the selling rate above.</span></span>';
            } else if (!qtyOk) {
              calcEl.innerHTML =
                '<span><span class="calc-big">₹0</span><span class="calc-sub">' +
                (mode === 'qty'
                  ? 'Enter the quantity sold'
                  : 'Enter the amount received') +
                '</span></span>';
            } else if (mode === 'qty') {
              calcEl.innerHTML =
                '<span><span class="calc-big">' +
                money(val.amount) +
                '</span><span class="calc-sub">' +
                esc(qtyText(val.qty, unit)) +
                ' × ' +
                money(val.rate) +
                '/' +
                unitOne(unit) +
                '</span></span><span class="calc-side"><span class="label">Profit</span><span class="value">' +
                money(val.qty * (val.rate - product.avgCost)) +
                '</span></span>';
            } else {
              calcEl.innerHTML =
                '<span><span class="calc-big">' +
                smartQty(val.qty, unit) +
                '</span><span class="calc-sub">for ' +
                money(val.amount) +
                ' at ' +
                money(val.rate) +
                '/' +
                unitOne(unit) +
                '</span></span><span class="calc-side"><span class="label">Profit</span><span class="value">' +
                money(val.qty * (val.rate - product.avgCost)) +
                '</span></span>';
            }
          }

          if (afterEl) {
            afterEl.textContent = over
              ? 'Not enough'
              : qtyOk
                ? qtyText(Math.max(0, after), unit)
                : qtyText(maxQty, unit);
            afterEl.style.color = over ? 'var(--red)' : 'var(--ink)';
          }

          if (over) {
            showFormError(
              's-error',
              'Only ' + qtyText(maxQty, unit) + ' available for this sale.'
            );
          }
        }

        function setMode(nextMode) {
          if (nextMode === mode) return;
          mode = nextMode;
          ui.saleMode = nextMode;
          $$('#sale-mode .seg-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.mode === mode);
          });
          const qtyField = $('#s-qty-field');
          const amountField = $('#s-amount-field');
          if (qtyField) qtyField.classList.toggle('hidden', mode !== 'qty');
          if (amountField)
            amountField.classList.toggle('hidden', mode !== 'amount');
          recalc();
        }

        if (canSelect) {
          const select = $('#s-product');
          if (select) {
            select.addEventListener('change', function () {
              closeSheet(true);
              openSale(select.value);
            });
          }
        }

        $$('#sale-mode .seg-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            setMode(btn.dataset.mode);
          });
        });

        $$('#s-qty-chips .quick-chip').forEach(function (chip) {
          chip.addEventListener('click', function () {
            setInput('s-qty', chip.dataset.quick);
            recalc();
            if (qtyEl) qtyEl.focus();
          });
        });

        $$('#s-amount-chips .quick-chip').forEach(function (chip) {
          chip.addEventListener('click', function () {
            setInput('s-amount', chip.dataset.quick);
            recalc();
            if (amountEl) amountEl.focus();
          });
        });

        if (rateEl) rateEl.addEventListener('input', recalc);
        if (qtyEl) qtyEl.addEventListener('input', recalc);
        if (amountEl) amountEl.addEventListener('input', recalc);
        recalc();

        $('#sale-form').addEventListener('submit', function (event) {
          event.preventDefault();
          const val = values();
          if (!(val.rate > 0)) {
            showFormError('s-error', 'Enter a selling rate greater than 0.');
            return;
          }
          if (!(val.qty > 0)) {
            showFormError('s-error', 'Enter a quantity greater than 0.');
            return;
          }
          if (val.qty > maxQty + 0.000001) {
            showFormError(
              's-error',
              'Only ' + qtyText(maxQty, unit) + ' available for this sale.'
            );
            return;
          }
          const date = $('#s-date').value || today();
          const note = $('#s-note').value.trim();
          const result = isEdit
            ? Store.updateTransaction(state, editTxn.id, {
                qty: val.qty,
                rate: Store.roundMoney(val.rate),
                date: date,
                note: note,
              })
            : Store.addSale(state, {
                productId: product.id,
                qty: val.qty,
                rate: Store.roundMoney(val.rate),
                date: date,
                note: note,
              });

          if (!result.ok) {
            showFormError('s-error', result.error);
            return;
          }
          const finalAmount = val.qty * val.rate;
          state = result.state;
          persistState(state);
          closeSheet(true);
          render();
          toast(
            isEdit
              ? 'Sale updated'
              : 'Sale recorded · ' + money(finalAmount)
          );
        });
      },
    });
  }

  // ---------------------------------------------------------------------
  // Price sheet
  // ---------------------------------------------------------------------

  function openPrice(productId) {
    const product = findProduct(productId);
    if (!product) {
      toast(tr('product.notFound'), 'error');
      return;
    }
    const unit = unitOne(product.unit);
    const body =
      '<form id="price-form" novalidate>' +
      productStrip(product) +
      '<div class="field"><label class="field-label" for="pr-price">' +
      tr('price.new') +
      '</label>' +
      '<div class="input-wrap"><span class="prefix">₹</span><input id="pr-price" inputmode="decimal" autocomplete="off" placeholder="0" value="' +
      (product.sellPrice > 0 ? esc(product.sellPrice) : '') +
      '"><span class="suffix">/' +
      unit +
      '</span></div>' +
      '<div class="chips" id="pr-chips">' +
      [-5, -1, 1, 5, 10]
        .map(function (delta) {
          return (
            '<button type="button" class="quick-chip" data-adjust="' +
            delta +
            '">' +
            (delta > 0 ? '+' : '−') +
            '₹' +
            Math.abs(delta) +
            '</button>'
          );
        })
        .join('') +
      '</div></div>' +
      '<div class="calc-box" id="pr-calc"></div>' +
      '<p class="field-hint">' +
      tr('price.hint') +
      '</p>' +
      '<div class="form-error" id="pr-error"></div>' +
      '</form>';

    openSheet({
      title: tr('price.sheetTitle'),
      subtitle: product.emoji + ' ' + product.name,
      body: body,
      footer:
        '<button type="submit" form="price-form" id="price-submit" class="btn primary">' +
        icon('check') +
        ' ' +
        tr('price.update') +
        '</button>',
      onMount: function () {
        const priceEl = $('#pr-price');
        const calcEl = $('#pr-calc');
        const submitEl = $('#price-submit');

        function recalc() {
          const price = readNum('pr-price');
          const ok = Number.isFinite(price) && price > 0;
          if (submitEl) submitEl.disabled = !ok;
          clearFormError('pr-error');
          if (!calcEl) return;
          if (!ok) {
            calcEl.className = 'calc-box';
            calcEl.innerHTML =
              '<span><span class="calc-big">' +
              tr('price.enterPrice') +
              '</span><span class="calc-sub">' +
              tr('price.enterAboveZero') +
              '</span></span>';
            return;
          }
          if (!(product.avgCost > 0)) {
            calcEl.className = 'calc-box';
            calcEl.innerHTML =
              '<span><span class="calc-big">' +
              money(price) +
              ' / ' +
              unit +
              '</span><span class="calc-sub">' +
              tr('price.addStockForMargin') +
              '</span></span>';
            return;
          }
          const margin = price - product.avgCost;
          const percent = (margin / price) * 100;
          calcEl.className = 'calc-box' + (margin < 0 ? ' bad' : '');
          calcEl.innerHTML =
            '<span><span class="calc-big">' +
            money(price) +
            ' / ' +
            unit +
            '</span><span class="calc-sub">' +
            tr('common.cost') +
            ' ' +
            money(product.avgCost) +
            ' · ' +
            tr('common.profit') +
            ' ' +
            money(margin) +
            '/' +
            unit +
            '</span></span><span class="calc-side"><span class="label">' +
            tr('price.margin') +
            '</span><span class="value">' +
            Math.round(percent) +
            '%</span></span>';
        }

        $$('#pr-chips .quick-chip').forEach(function (chip) {
          chip.addEventListener('click', function () {
            const current = readNum('pr-price');
            const base = Number.isFinite(current) ? current : 0;
            const next = Math.max(
              0,
              Store.roundMoney(base + Number(chip.dataset.adjust))
            );
            setInput('pr-price', String(next));
            recalc();
            if (priceEl) priceEl.focus();
          });
        });

        if (priceEl) priceEl.addEventListener('input', recalc);
        recalc();

        $('#price-form').addEventListener('submit', function (event) {
          event.preventDefault();
          const price = readNum('pr-price');
          if (!(price > 0)) {
            showFormError('pr-error', tr('price.error'));
            return;
          }
          const result = Store.setPrice(
            state,
            product.id,
            price,
            today(),
            'Selling price changed'
          );
          if (!result.ok) {
            showFormError('pr-error', result.error);
            return;
          }
          state = result.state;
          persistState(state);
          closeSheet(true);
          render();
          toast(
            result.unchanged
              ? tr('price.toast.unchanged', { amount: money(price) })
              : tr('price.toast.updated', { amount: money(price), unit: unit })
          );
        });
      },
    });
  }

  // ---------------------------------------------------------------------
  // Adjust stock sheet
  // ---------------------------------------------------------------------

  function openAdjust(productId) {
    const product = findProduct(productId);
    if (!product) {
      toast(tr('product.notFound'), 'error');
      return;
    }
    const unit = product.unit;
    const body =
      '<form id="adjust-form" novalidate>' +
      productStrip(product, tr('adjust.subtitle')) +
      '<div class="field"><label class="field-label" for="a-qty">' +
      tr('adjust.newCount') +
      '</label>' +
      '<div class="input-wrap"><input id="a-qty" inputmode="decimal" autocomplete="off" value="' +
      esc(product.stock) +
      '"><span class="suffix">' +
      unitLabel(unit) +
      '</span></div>' +
      '<p class="field-hint">' +
      tr('adjust.hint') +
      '</p></div>' +
      '<div class="calc-box" id="a-calc"></div>' +
      '<div class="form-grid"><div class="field"><label class="field-label" for="a-date">' +
      tr('purchase.date') +
      '</label><div class="input-wrap"><input type="date" id="a-date" value="' +
      today() +
      '"></div></div><div class="field"><label class="field-label" for="a-note">' +
      tr('adjust.reason') +
      ' <span class="optional">' +
      tr('common.optional') +
      '</span></label><div class="input-wrap compact"><input id="a-note" maxlength="60" placeholder="' +
      esc(tr('adjust.reasonPlaceholder')) +
      '"></div></div></div>' +
      '<div class="form-error" id="a-error"></div>' +
      '</form>';

    openSheet({
      title: tr('adjust.title'),
      subtitle: product.emoji + ' ' + product.name,
      body: body,
      footer:
        '<button type="submit" form="adjust-form" class="btn primary">' +
        icon('check') +
        ' ' +
        tr('adjust.save') +
        '</button>',
      onMount: function () {
        const qtyEl = $('#a-qty');
        const calcEl = $('#a-calc');

        function recalc() {
          const next = readNum('a-qty');
          const ok = Number.isFinite(next) && next >= 0;
          clearFormError('a-error');
          if (!calcEl) return;
          if (!ok) {
            calcEl.className = 'calc-box bad';
            calcEl.innerHTML =
              '<span><span class="calc-big">' +
              tr('adjust.enterCount') +
              '</span><span class="calc-sub">' +
              tr('adjust.negative') +
              '</span></span>';
            return;
          }
          const delta = Store.roundQty(next - product.stock);
          calcEl.className =
            'calc-box' + (delta < 0 ? ' warn' : '');
          calcEl.innerHTML =
            '<span><span class="calc-big">' +
            (delta > 0 ? '+' : delta < 0 ? '−' : '') +
            (delta === 0 ? tr('common.noChange') : smartQty(Math.abs(delta), unit)) +
            '</span><span class="calc-sub">' +
            tr('adjust.newStock', {
              qty: qtyText(next, unit),
              old: qtyText(product.stock, unit),
            }) +
            '</span></span>';
        }

        if (qtyEl) qtyEl.addEventListener('input', recalc);
        recalc();

        $('#adjust-form').addEventListener('submit', function (event) {
          event.preventDefault();
          const next = readNum('a-qty');
          if (!(next >= 0)) {
            showFormError('a-error', tr('adjust.error'));
            return;
          }
          const result = Store.adjustStock(
            state,
            product.id,
            next,
            $('#a-note').value.trim() || tr('adjust.defaultNote'),
            $('#a-date').value || today()
          );
          if (!result.ok) {
            showFormError('a-error', result.error);
            return;
          }
          state = result.state;
          persistState(state);
          closeSheet(true);
          render();
          toast(
            result.unchanged
              ? tr('adjust.toast.unchanged')
              : tr('adjust.toast.updated', { qty: qtyText(next, unit) })
          );
        });
      },
    });
  }

  // ---------------------------------------------------------------------
  // Add / edit product sheet
  // ---------------------------------------------------------------------

  function openProductForm(productId) {
    const isEdit = !!productId;
    const product = isEdit ? findProduct(productId) : null;
    if (isEdit && !product) {
      toast(tr('product.notFound'), 'error');
      return;
    }

    const hasTxns =
      isEdit &&
      state.transactions.some((txn) => txn.productId === product.id);
    let selectedEmoji = product ? product.emoji : '🌾';
    const startUnit = product ? product.unit : 'kg';
    const startPrice = product && product.sellPrice > 0 ? product.sellPrice : '';
    const startLow = product ? product.lowStock : 2;
    const unitOptions = [
      ['kg', 'Kilograms (kg)'],
      ['g', 'Grams (g)'],
      ['litre', 'Litres (L)'],
      ['piece', 'Pieces (pcs)'],
      ['packet', 'Packets'],
    ];

    const body =
      '<form id="product-form" novalidate>' +
      '<div class="field"><label class="field-label" for="pf-name">Product name</label><div class="input-wrap"><input id="pf-name" maxlength="40" autocomplete="off" placeholder="e.g. Hurda" value="' +
      (product ? esc(product.name) : '') +
      '"></div></div>' +
      '<div class="field"><span class="field-label">Icon</span><div class="emoji-picker" id="pf-emojis">' +
      EMOJIS.map(function (emoji) {
        return (
          '<button type="button" class="emoji-option' +
          (emoji === selectedEmoji ? ' active' : '') +
          '" data-emoji="' +
          emoji +
          '">' +
          emoji +
          '</button>'
        );
      }).join('') +
      '</div></div>' +
      '<div class="form-grid"><div class="field"><label class="field-label" for="pf-unit">Unit</label><div class="input-wrap"><select id="pf-unit"' +
      (hasTxns ? ' disabled' : '') +
      '>' +
      unitOptions
        .map(function (item) {
          return (
            '<option value="' +
            item[0] +
            '"' +
            (item[0] === startUnit ? ' selected' : '') +
            '>' +
            item[1] +
            '</option>'
          );
        })
        .join('') +
      '</select>' +
      icon('chevron-down', 'select-arrow') +
      '</div></div>' +
      '<div class="field"><label class="field-label" for="pf-price">Selling price</label><div class="input-wrap"><span class="prefix">₹</span><input id="pf-price" inputmode="decimal" autocomplete="off" placeholder="0" value="' +
      esc(startPrice) +
      '"><span class="suffix" id="pf-price-unit">/' +
      unitOne(startUnit) +
      '</span></div></div></div>' +
      (hasTxns
        ? '<p class="field-hint">The unit is locked because this product already has entries. Selling price changes are logged in history.</p>'
        : '') +
      '<div class="form-grid"><div class="field"><label class="field-label" for="pf-low">Low stock alert</label><div class="input-wrap"><input id="pf-low" inputmode="decimal" autocomplete="off" placeholder="0" value="' +
      esc(startLow) +
      '"><span class="suffix" id="pf-low-unit">' +
      unitLabel(startUnit) +
      '</span></div></div>' +
      (isEdit
        ? '<div class="field"><label class="field-label">Current stock</label><div class="input-wrap compact"><span class="prefix" style="font-size:14px;font-weight:800;color:var(--ink)">' +
          esc(qtyText(product.stock, product.unit)) +
          '</span></div></div>'
        : '<div class="field"><label class="field-label" for="pf-open">Opening stock <span class="optional">optional</span></label><div class="input-wrap"><input id="pf-open" inputmode="decimal" autocomplete="off" placeholder="0"><span class="suffix" id="pf-open-unit">' +
          unitLabel(startUnit) +
          '</span></div></div>') +
      '</div>' +
      (!isEdit
        ? '<div class="field"><label class="field-label" for="pf-open-rate"><span id="pf-open-rate-label">Opening cost per ' +
          unitOne(startUnit) +
          '</span> <span class="optional">optional</span></label><div class="input-wrap"><span class="prefix">₹</span><input id="pf-open-rate" inputmode="decimal" autocomplete="off" placeholder="0"><span class="suffix" id="pf-open-rate-unit">/' +
          unitOne(startUnit) +
          '</span></div><p class="field-hint">If you already have stock at home, add it now. You can also use “Adjust stock” later.</p></div>'
        : '') +
      '<div class="form-error" id="pf-error"></div>' +
      '</form>';

    openSheet({
      title: isEdit ? 'Edit product' : 'Add product',
      subtitle: isEdit
        ? 'Names, icon and alerts'
        : 'Hurda is already here. Add more items anytime.',
      body: body,
      footer:
        '<button type="submit" form="product-form" class="btn primary">' +
        icon('check') +
        (isEdit ? ' Save changes' : ' Add product') +
        '</button>',
      onMount: function () {
        $$('#pf-emojis .emoji-option').forEach(function (btn) {
          btn.addEventListener('click', function () {
            selectedEmoji = btn.dataset.emoji;
            $$('#pf-emojis .emoji-option').forEach(function (item) {
              item.classList.toggle('active', item === btn);
            });
          });
        });

        const unitSelect = $('#pf-unit');
        function updateUnits() {
          const unit = unitSelect.value;
          const one = unitOne(unit);
          const label = unitLabel(unit);
          if ($('#pf-price-unit')) $('#pf-price-unit').textContent = '/' + one;
          if ($('#pf-low-unit')) $('#pf-low-unit').textContent = label;
          if ($('#pf-open-unit')) $('#pf-open-unit').textContent = label;
          if ($('#pf-open-rate-label'))
            $('#pf-open-rate-label').textContent = 'Opening cost per ' + one;
          if ($('#pf-open-rate-unit'))
            $('#pf-open-rate-unit').textContent = '/' + one;
        }
        if (unitSelect) unitSelect.addEventListener('change', updateUnits);

        $('#product-form').addEventListener('submit', function (event) {
          event.preventDefault();
          clearFormError('pf-error');
          const name = $('#pf-name').value.trim();
          const unit = $('#pf-unit').value;
          const price = readNum('pf-price');
          const low = readNum('pf-low');
          const openingQty = readNum('pf-open');
          const openingRate = readNum('pf-open-rate');

          if (!name) {
            showFormError('pf-error', 'Enter a product name.');
            return;
          }
          if (Number.isFinite(price) && price < 0) {
            showFormError('pf-error', 'Selling price cannot be negative.');
            return;
          }
          if (Number.isFinite(low) && low < 0) {
            showFormError('pf-error', 'Low stock alert cannot be negative.');
            return;
          }
          if (
            !isEdit &&
            Number.isFinite(openingQty) &&
            openingQty < 0
          ) {
            showFormError('pf-error', 'Opening stock cannot be negative.');
            return;
          }
          if (
            !isEdit &&
            Number.isFinite(openingRate) &&
            openingRate < 0
          ) {
            showFormError('pf-error', 'Opening cost cannot be negative.');
            return;
          }

          let result;
          if (isEdit) {
            result = Store.updateProduct(state, product.id, {
              name: name,
              unit: unit,
              emoji: selectedEmoji,
              lowStock: Number.isFinite(low) ? low : product.lowStock,
            });
            if (
              result.ok &&
              Number.isFinite(price) &&
              Math.abs(price - product.sellPrice) >= 0.005
            ) {
              result = Store.setPrice(
                result.state,
                product.id,
                price,
                today(),
                'Updated from product details'
              );
            }
          } else {
            result = Store.addProduct(state, {
              name: name,
              unit: unit,
              emoji: selectedEmoji,
              sellPrice: Number.isFinite(price) ? price : 0,
              lowStock: Number.isFinite(low) ? low : 0,
              openingQty:
                Number.isFinite(openingQty) ? openingQty : 0,
              openingRate:
                Number.isFinite(openingRate) ? openingRate : 0,
              date: today(),
            });
          }

          if (!result.ok) {
            showFormError('pf-error', result.error);
            return;
          }
          state = result.state;
          persistState(state);
          if (!isEdit && result.productId) {
            ui.homeProductId = result.productId;
          }
          closeSheet(true);
          render();
          toast(isEdit ? 'Product updated' : 'Product added');
        });
      },
    });
  }

  // ---------------------------------------------------------------------
  // Product detail sheet
  // ---------------------------------------------------------------------

  function openProductDetail(productId) {
    const product = findProduct(productId);
    if (!product) {
      toast(tr('product.notFound'), 'error');
      return;
    }
    const status = stockStatus(product);
    const margin = marginPerUnit(product);
    const priceText =
      product.sellPrice > 0
        ? money(product.sellPrice) + ' / ' + unitOne(product.unit)
        : tr('common.notSet');
    const costText =
      product.avgCost > 0
        ? money(product.avgCost) + ' / ' + unitOne(product.unit)
        : tr('common.notSet');

    const recent = Store.productTransactions(state, product.id).slice(0, 5);
    const prices = Store.priceHistory(state, product.id).slice(0, 4);

    let body =
      productStrip(
        product,
        tr('product.stockValue', { amount: money(product.stock * product.avgCost) })
      ) +
      '<div class="detail-stats">' +
      detailStat(tr('product.stock'), qtyText(product.stock, product.unit)) +
      detailStat(tr('product.sellingPrice'), priceText) +
      detailStat(tr('product.avgCost'), costText) +
      detailStat(
        tr('product.profitPer', { unit: unitOne(product.unit) }),
        product.sellPrice > 0 && product.avgCost > 0 ? money(margin) : '—',
        margin >= 0 ? 'profit' : 'loss'
      ) +
      '</div>';

    if (product.sellPrice > 0 && (product.unit === 'kg' || product.unit === 'litre')) {
      const smallUnit = product.unit === 'kg' ? unitLabel('g') : tr('unit.ml');
      body +=
        '<div class="pack-row">' +
        [10, 20, 50]
          .map(function (amount) {
            return (
              '<div class="pack-chip"><strong>₹' +
              amount +
              '</strong><span>≈ ' +
              Math.round((amount / product.sellPrice) * 1000) +
              ' ' +
              smallUnit +
              '</span></div>'
            );
          })
          .join('') +
        '</div>';
    }

    if (product.active) {
      body +=
        '<div class="detail-actions" style="margin-top:14px"><button type="button" class="btn outline small" data-action="open-price" data-id="' +
        product.id +
        '">' +
        icon('tag') +
        ' ' +
        tr('product.changePrice') +
        '</button><button type="button" class="btn outline small" data-action="open-adjust" data-id="' +
        product.id +
        '">' +
        icon('scale') +
        ' ' +
        tr('product.adjustStock') +
        '</button><button type="button" class="btn outline small" style="grid-column:1 / -1" data-action="open-edit-product" data-id="' +
        product.id +
        '">' +
        icon('pencil') +
        ' ' +
        tr('product.editDetails') +
        '</button></div>';
    } else {
      body +=
        '<div class="detail-actions" style="margin-top:14px"><button type="button" class="btn primary small" style="grid-column:1 / -1" data-action="restore-product" data-id="' +
        product.id +
        '">' +
        icon('refresh') +
        ' ' +
        tr('product.restore') +
        '</button></div>';
    }

    body +=
      '<div class="detail-section-title"><span>' +
      tr('product.recent') +
      '</span></div>';
    if (recent.length) {
      body +=
        '<div class="sheet-detail-rows">' +
        recent.map(compactTxnLine).join('') +
        '</div>';
    } else {
      body +=
        '<p class="field-hint" style="margin:0 0 8px">' +
        tr('product.noEntries') +
        '</p>';
    }

    body +=
      '<div class="detail-section-title"><span>' +
      tr('type.price') +
      '</span></div>';
    if (prices.length) {
      body +=
        '<div class="sheet-detail-rows">' +
        prices
          .map(function (txn) {
            return (
              '<div class="sheet-detail-row"><span class="label">' +
              dateLabel(txn.date) +
              ' · ' +
              timeLabel(txn.createdAt) +
              '</span><span class="value">' +
              money(txn.oldPrice) +
              ' → ' +
              money(txn.newPrice) +
              '</span></div>'
            );
          })
          .join('') +
        '</div>';
    } else {
      body +=
        '<p class="field-hint" style="margin:0 0 8px">' +
        tr('product.noPriceChanges') +
        '</p>';
    }

    if (product.active) {
      body +=
        '<button type="button" class="btn danger block" style="margin-top:14px" data-action="archive-product" data-id="' +
        product.id +
        '">' +
        icon('archive') +
        ' ' +
        tr('product.archiveButton') +
        '</button><p class="field-hint" style="text-align:center;margin-top:6px">' +
        tr('product.archiveHint') +
        '</p>';
    }

    openSheet({
      title: product.emoji + ' ' + product.name,
      subtitle:
        (product.active ? tr('product.active') : tr('product.archived')) +
        ' · ' +
        status.label,
      body: body,
    });
  }

  function detailStat(label, value, className) {
    return (
      '<div class="detail-stat"><span class="label">' +
      esc(label) +
      '</span><span class="value' +
      (className ? ' ' + className : '') +
      '">' +
      esc(value) +
      '</span></div>'
    );
  }

  function compactTxnLine(txn) {
    const product = findProduct(txn.productId);
    const unit = product ? product.unit : 'kg';
    let sub = '';
    let right = '';
    if (txn.type === 'purchase' || txn.type === 'opening') {
      sub = dateLabel(txn.date) + ' · ' + qtyText(txn.qty, unit);
      right = money(txn.amount);
    } else if (txn.type === 'sale') {
      sub = dateLabel(txn.date) + ' · ' + qtyText(txn.qty, unit);
      right = money(txn.amount);
    } else if (txn.type === 'adjustment') {
      sub = dateLabel(txn.date) + ' · new count ' + qtyText(txn.qty, unit);
      right =
        (txn.delta > 0 ? '+' : txn.delta < 0 ? '−' : '') +
        smartQty(Math.abs(txn.delta), unit);
    } else if (txn.type === 'price') {
      sub = dateLabel(txn.date);
      right = money(txn.oldPrice) + ' → ' + money(txn.newPrice);
    }
    return (
      '<div class="sheet-detail-row"><span class="label"><span style="font-weight:800;color:var(--ink)">' +
      (TYPE_LABEL[txn.type] || txn.type) +
      '</span> · ' +
      esc(sub) +
      '</span><span class="value">' +
      right +
      '</span></div>'
    );
  }

  // ---------------------------------------------------------------------
  // Entry detail
  // ---------------------------------------------------------------------

  function openTxn(txnId) {
    const txn = state.transactions.find((item) => item.id === txnId);
    if (!txn) {
      toast(tr('txn.notFound'), 'error');
      return;
    }
    const product = findProduct(txn.productId);
    const unit = product ? product.unit : 'kg';
    const when = longDate(txn.date) + ' · ' + timeLabel(txn.createdAt);
    const titles = {
      opening: tr('type.opening'),
      purchase: tr('txn.stockEntry'),
      sale: tr('txn.saleDetails'),
      adjustment: tr('type.adjustment'),
      price: tr('type.price'),
    };

    let rows = '';
    rows += detailRow(tr('txn.dateTime'), when);
    rows += detailRow(tr('txn.type'), TYPE_LABEL[txn.type] || txn.type);
    if (product) {
      rows += detailRow(tr('txn.product'), product.emoji + ' ' + product.name);
    }

    if (txn.type === 'price') {
      rows += detailRow(tr('txn.oldPrice'), money(txn.oldPrice));
      rows += detailRow(tr('txn.newPrice'), money(txn.newPrice));
    } else {
      if (txn.type === 'adjustment') {
        rows += detailRow(tr('txn.newCountLabel'), qtyText(txn.qty, unit));
        const delta = Number(txn.delta) || 0;
        rows += detailRow(
          tr('txn.change'),
          (delta > 0 ? '+' : delta < 0 ? '−' : '') +
            (delta === 0 ? tr('common.noChange') : smartQty(Math.abs(delta), unit))
        );
      } else {
        rows += detailRow(tr('txn.qty'), qtyText(txn.qty, unit));
        rows += detailRow(
          tr('txn.rate'),
          money(txn.rate) + ' / ' + unitOne(unit)
        );
        rows += detailRow(tr('txn.amount'), money(txn.amount));
      }
      if (txn.type === 'sale') {
        rows += detailRow(tr('txn.costOfGoods'), money(txn.cost));
        rows += detailRow(
          tr('txn.profitLabel'),
          money(txn.profit),
          txn.profit >= 0 ? 'profit' : 'loss'
        );
      }
    }

    let body =
      '<div class="sheet-detail-rows">' +
      rows +
      '</div>' +
      (txn.note ? '<div class="detail-note">' + esc(txn.note) + '</div>' : '');

    if (txn.type !== 'price') {
      body += '<div class="btn-row" style="margin-top:14px">';
      if (txn.type !== 'adjustment') {
        body +=
          '<button type="button" class="btn outline" data-action="edit-txn" data-id="' +
          txn.id +
          '">' +
          icon('pencil') +
          ' ' +
          tr('txn.edit') +
          '</button>';
      }
      body +=
        '<button type="button" class="btn danger" data-action="delete-txn" data-id="' +
        txn.id +
        '">' +
        icon('trash') +
        ' ' +
        tr('txn.delete') +
        '</button></div>';
      if (txn.type === 'adjustment') {
        body +=
          '<p class="field-hint" style="text-align:center;margin-top:8px">' +
          tr('txn.adjustHint') +
          '</p>';
      }
    } else {
      body +=
        '<p class="field-hint" style="text-align:center;margin-top:14px">' +
        tr('txn.priceHint') +
        '</p>';
    }

    openSheet({
      title: titles[txn.type] || tr('txn.details'),
      subtitle: when,
      body: body,
    });
  }

  function detailRow(label, value, className) {
    return (
      '<div class="sheet-detail-row"><span class="label">' +
      esc(label) +
      '</span><span class="value' +
      (className ? ' ' + className : '') +
      '">' +
      esc(value) +
      '</span></div>'
    );
  }

  // ---------------------------------------------------------------------
  // Confirm dialog
  // ---------------------------------------------------------------------

  function openConfirm(options) {
    openSheet({
      title: options.title || tr('common.pleaseConfirm'),
      subtitle: options.subtitle || '',
      body:
        '<div class="confirm-icon">' +
        icon(options.icon || 'alert') +
        '</div><p class="confirm-text">' +
        esc(options.message || '') +
        '</p>',
      footer:
        '<div class="btn-row"><button type="button" class="btn soft" data-action="close-sheet">' +
        tr('common.cancel') +
        '</button><button type="button" id="confirm-action" class="btn ' +
        (options.danger ? 'danger' : 'primary') +
        '">' +
        esc(options.confirmLabel || tr('common.confirm')) +
        '</button></div>',
      onMount: function () {
        const button = $('#confirm-action');
        if (button) {
          button.addEventListener('click', function () {
            closeSheet(true);
            options.onConfirm();
          });
        }
      },
    });
  }

  // ---------------------------------------------------------------------
  // PIN setup
  // ---------------------------------------------------------------------

  function openPinForm(isChange) {
    const body =
      '<form id="pin-form" novalidate>' +
      '<div class="field"><label class="field-label" for="pin-new">' +
      (isChange ? tr('pin.new') : tr('pin.current')) +
      '</label><div class="input-wrap"><input id="pin-new" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]*" autocomplete="new-password" placeholder="••••"></div></div>' +
      '<div class="field"><label class="field-label" for="pin-confirm">' +
      tr('pin.confirm') +
      '</label><div class="input-wrap"><input id="pin-confirm" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]*" autocomplete="new-password" placeholder="••••"></div></div>' +
      '<div class="form-error" id="pin-error"></div>' +
      '<p class="field-hint">' +
      tr('pin.hint') +
      '</p>' +
      '</form>';

    openSheet({
      title: isChange ? tr('pin.changeTitle') : tr('pin.setTitle'),
      subtitle: tr('pin.subtitle'),
      body: body,
      footer:
        '<button type="submit" form="pin-form" class="btn primary">' +
        icon('lock') +
        ' ' +
        tr('pin.save') +
        '</button>',
      onMount: function () {
        const newPin = $('#pin-new');
        const confirmPin = $('#pin-confirm');
        if (newPin) newPin.focus();
        $('#pin-form').addEventListener('submit', function (event) {
          event.preventDefault();
          clearFormError('pin-error');
          const pin = newPin.value.trim();
          const confirm = confirmPin.value.trim();
          if (!/^\d{4}$/.test(pin)) {
            showFormError('pin-error', tr('pin.error.length'));
            return;
          }
          if (pin !== confirm) {
            showFormError('pin-error', tr('pin.error.match'));
            return;
          }
          const salt = makeSalt();
          state = Store.clone(state);
          state.settings.pinSalt = salt;
          state.settings.pinHash = hashPin(pin, salt);
          persistState(state);
          setSessionUnlocked(true);
          locked = false;
          closeSheet(true);
          render();
          toast(tr('pin.toast.on'));
        });
      },
    });
  }

  // ---------------------------------------------------------------------
  // Install help
  // ---------------------------------------------------------------------

  function openInstallHelp() {
    const isFile = window.location.protocol === 'file:';
    openSheet({
      title: tr('installHelp.title'),
      subtitle: tr('installHelp.subtitle'),
      body:
        '<div class="sheet-detail-rows">' +
        '<div class="sheet-detail-row"><span class="label">' +
        tr('installHelp.android') +
        '</span><span class="value">' +
        tr('installHelp.androidStep') +
        '</span></div>' +
        '<div class="sheet-detail-row"><span class="label">' +
        tr('installHelp.iphone') +
        '</span><span class="value">' +
        tr('installHelp.iphoneStep') +
        '</span></div>' +
        '<div class="sheet-detail-row"><span class="label">' +
        tr('installHelp.after') +
        '</span><span class="value">' +
        tr('installHelp.afterStep') +
        '</span></div>' +
        '</div>' +
        '<div class="detail-note">' +
        (isFile
          ? tr('installHelp.fileNote')
          : tr('installHelp.onlineNote')) +
        '</div>',
      footer:
        '<button type="submit" class="btn primary" data-action="close-sheet">' +
        tr('installHelp.gotIt') +
        '</button>',
    });
  }

  function openHelp() {
    const steps = [
      tr('help.step1'),
      tr('help.step2'),
      tr('help.step3'),
      tr('help.step4'),
      tr('help.step5'),
    ];
    const body =
      '<div class="sheet-detail-rows">' +
      steps
        .map(function (step, index) {
          return (
            '<div class="sheet-detail-row"><span class="label" style="font-weight:700;color:var(--color-primary)">' +
            (index + 1) +
            '.</span><span class="value" style="text-align:left;white-space:normal">' +
            esc(step) +
            '</span></div>'
          );
        })
        .join('') +
      '</div>';

    openSheet({
      title: tr('help.title'),
      subtitle: tr('help.subtitle'),
      body: body,
      footer:
        '<button type="button" class="btn primary" data-action="close-sheet">' +
        tr('help.close') +
        '</button>',
    });
  }

  // ---------------------------------------------------------------------
  // Backup, restore, reset
  // ---------------------------------------------------------------------

  function doBackup() {
    state = Store.clone(state);
    state.settings.lastBackupAt = new Date().toISOString();
    persistState(state);

    // The PIN protects this device only. Never put it in a backup file.
    const backupState = Store.clone(state);
    delete backupState.settings.pinHash;
    delete backupState.settings.pinSalt;

    const payload = {
      app: 'hurda-hisaab',
      schema: Store.SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      state: backupState,
    };
    downloadFile(
      JSON.stringify(payload, null, 2),
      'hurda-hisaab-backup-' + today() + '.json',
      'application/json'
    );
    render();
    toast(tr('backup.downloaded'));
  }

  function restoreBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (!file) return;
      file
        .text()
        .then(function (text) {
          let parsed;
          try {
            parsed = JSON.parse(text);
          } catch (error) {
            toast(tr('restore.invalid'), 'error');
            return;
          }
          const result = Store.validateImportedState(parsed);
          if (!result.ok) {
            toast(result.error, 'error');
            return;
          }
          const imported = result.state;
          openConfirm({
            title: tr('restore.title'),
            message: tr('restore.message', {
              products: plural(imported.products.length, 'common.product', 'common.products'),
              entries: plural(imported.transactions.length, 'common.entry', 'common.entries'),
            }),
            confirmLabel: tr('restore.confirm'),
            danger: true,
            icon: 'upload',
            onConfirm: function () {
              state = imported;
              // A restored backup should open without a PIN. The PIN is not
              // part of a backup, and restoring is also how a forgotten PIN
              // is recovered.
              state.settings.pinHash = null;
              state.settings.pinSalt = null;
              setSessionUnlocked(true);
              locked = false;
              ui.homeProductId = null;
              persistState(state);
              render();
              toast(tr('restore.done'));
            },
          });
        })
        .catch(function () {
          toast(tr('restore.readError'), 'error');
        });
    });
    input.click();
  }

  function resetAll() {
    openConfirm({
      title: tr('reset.title'),
      message: tr('reset.message'),
      confirmLabel: tr('reset.continue'),
      danger: true,
      icon: 'trash',
      onConfirm: function () {
        openConfirm({
          title: tr('reset.confirmTitle'),
          message: tr('reset.confirmMessage'),
          confirmLabel: tr('reset.confirm'),
          danger: true,
          icon: 'trash',
          onConfirm: function () {
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch (error) {
              // Ignore and overwrite below.
            }
            state = Store.makeSeedState();
            persistState(state);
            setSessionUnlocked(true);
            locked = false;
            ui.homeProductId = null;
            ui.screen = 'home';
            ui.historyPeriod = 'today';
            ui.historyFilter = 'all';
            render();
            toast(tr('reset.done'));
          },
        });
      },
    });
  }

  function archiveProduct(productId) {
    const product = findProduct(productId);
    if (!product) return;
    openConfirm({
      title: tr('product.archiveTitle', { name: product.name }),
      message: tr('product.archiveMessage'),
      confirmLabel: tr('product.archiveButton'),
      icon: 'archive',
      onConfirm: function () {
        const result = Store.setArchived(state, productId, true);
        if (!result.ok) {
          toast(result.error, 'error');
          return;
        }
        state = result.state;
        persistState(state);
        render();
        toast(tr('product.archiveToast'));
      },
    });
  }

  function restoreProduct(productId) {
    const result = Store.setArchived(state, productId, false);
    if (!result.ok) {
      toast(result.error, 'error');
      return;
    }
    state = result.state;
    persistState(state);
    ui.homeProductId = productId;
    closeSheet(true);
    render();
    toast(tr('product.restoreToast'));
  }

  function deleteTxn(txnId) {
    const txn = state.transactions.find((item) => item.id === txnId);
    if (!txn) return;
    openConfirm({
      title: tr('txn.deleteTitle'),
      message: tr('txn.deleteMessage'),
      confirmLabel: tr('txn.deleteButton'),
      danger: true,
      icon: 'trash',
      onConfirm: function () {
        const result = Store.deleteTransaction(state, txnId);
        if (!result.ok) {
          toast(result.error, 'error');
          return;
        }
        state = result.state;
        persistState(state);
        render();
        toast(tr('txn.deleted'));
      },
    });
  }

  // ---------------------------------------------------------------------
  // Lock screen
  // ---------------------------------------------------------------------

  function renderLock() {
    lockEntry = '';
    lockChecking = false;
    const root = $('#lock-root');
    root.innerHTML =
      '<div class="lock-screen" id="lock-screen">' +
      '<div class="lock-brand">' +
      icon('wheat') +
      '</div>' +
      '<h1>Hurda Hisaab</h1>' +
      '<p class="lock-sub">Enter your 4-digit PIN</p>' +
      '<div class="pin-dots" id="pin-dots">' +
      '<span class="pin-dot"></span><span class="pin-dot"></span><span class="pin-dot"></span><span class="pin-dot"></span>' +
      '</div>' +
      '<div class="pin-error" id="pin-error"></div>' +
      '<div class="keypad">' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map(function (digit) {
          return (
            '<button type="button" class="key" data-pin="' +
            digit +
            '" aria-label="' +
            digit +
            '">' +
            digit +
            '</button>'
          );
        })
        .join('') +
      '<span class="key blank"></span>' +
      '<button type="button" class="key" data-pin="0" aria-label="0">0</button>' +
      '<button type="button" class="key" data-pin="back" aria-label="Delete">' +
      icon('backspace') +
      '</button>' +
      '</div>' +
      '<div class="lock-hint">Forgot the PIN? Clear this site’s data in your browser settings, open the app again, then restore your latest backup. The backup opens without a PIN.</div>' +
      '</div>';

    $$('[data-pin]', root).forEach(function (button) {
      button.addEventListener('click', function () {
        handlePinKey(button.dataset.pin);
      });
    });
  }

  function updatePinDots() {
    $$('#pin-dots .pin-dot').forEach(function (dot, index) {
      dot.classList.toggle('filled', index < lockEntry.length);
    });
  }

  function handlePinKey(key) {
    if (lockChecking) return;
    if (key === 'back') {
      lockEntry = lockEntry.slice(0, -1);
      updatePinDots();
      return;
    }
    if (!/^\d$/.test(key) || lockEntry.length >= 4) return;
    const pinError = $('#pin-error');
    if (pinError) pinError.textContent = '';
    lockEntry += key;
    updatePinDots();
    if (lockEntry.length === 4) {
      lockChecking = true;
      setTimeout(function () {
        const salt = state.settings.pinSalt || '';
        if (hashPin(lockEntry, salt) === state.settings.pinHash) {
          setSessionUnlocked(true);
          locked = false;
          lockEntry = '';
          render();
          toast(tr('lock.welcome'));
        } else {
          const error = $('#pin-error');
          const screen = $('#lock-screen');
          if (error) error.textContent = tr('lock.wrong');
          if (screen) screen.classList.add('shake');
          setTimeout(function () {
            lockEntry = '';
            lockChecking = false;
            updatePinDots();
            if (screen) screen.classList.remove('shake');
          }, 500);
        }
      }, 120);
    }
  }

  // ---------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------

  function navigate(screen) {
    if (
      screen !== 'home' &&
      screen !== 'history' &&
      screen !== 'products' &&
      screen !== 'settings'
    ) {
      return;
    }
    ui.screen = screen;
    render();
    const screenEl = $('#screen');
    if (screenEl) screenEl.scrollTop = 0;
  }

  function editTxn(txnId) {
    const txn = state.transactions.find((item) => item.id === txnId);
    if (!txn) return;
    if (txn.type === 'sale') {
      openSale(null, txn);
    } else if (txn.type === 'purchase' || txn.type === 'opening') {
      openPurchase(null, txn);
    }
  }

  function doInstall() {
    if (!deferredInstallPrompt) {
      openInstallHelp();
      return;
    }
    const prompt = deferredInstallPrompt;
    deferredInstallPrompt = null;
    prompt.prompt();
    prompt.userChoice
      .then(function () {
        render();
      })
      .catch(function () {
        render();
      });
  }

  function handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (!action) return;
    event.preventDefault();
    const id = target.dataset.id;
    const value = target.dataset.value;

    switch (action) {
      case 'close-sheet':
        closeSheet();
        break;
      case 'nav':
        navigate(target.dataset.screen);
        break;
      case 'select-product':
        ui.homeProductId = id;
        render();
        break;
      case 'history-period':
        ui.historyPeriod = value;
        render();
        break;
      case 'history-filter':
        ui.historyFilter = value;
        render();
        break;
      case 'open-purchase':
        closeSheet(true);
        openPurchase(id);
        break;
      case 'open-sale':
        closeSheet(true);
        openSale(id);
        break;
      case 'open-price':
        closeSheet(true);
        openPrice(id || ui.homeProductId);
        break;
      case 'open-adjust':
        closeSheet(true);
        openAdjust(id);
        break;
      case 'open-product':
        closeSheet(true);
        openProductDetail(id);
        break;
      case 'open-add-product':
        closeSheet(true);
        openProductForm();
        break;
      case 'open-edit-product':
        closeSheet(true);
        openProductForm(id);
        break;
      case 'open-txn':
        closeSheet(true);
        openTxn(id);
        break;
      case 'edit-txn':
        closeSheet(true);
        editTxn(id);
        break;
      case 'delete-txn':
        closeSheet(true);
        deleteTxn(id);
        break;
      case 'archive-product':
        closeSheet(true);
        archiveProduct(id);
        break;
      case 'restore-product':
        restoreProduct(id);
        break;
      case 'toggle-archived':
        ui.showArchived = !ui.showArchived;
        render();
        break;
      case 'backup':
        doBackup();
        break;
      case 'restore':
        restoreBackup();
        break;
      case 'reset':
        resetAll();
        break;
      case 'export-csv':
        exportHistoryCsv();
        break;
      case 'export-all-csv':
        exportAllCsv();
        break;
      case 'set-pin':
        openPinForm(false);
        break;
      case 'change-pin':
        openPinForm(true);
        break;
      case 'remove-pin':
        openConfirm({
          title: tr('pin.removeTitle'),
          message: tr('pin.removeMessage'),
          confirmLabel: tr('pin.removeConfirm'),
          danger: true,
          icon: 'unlock',
          onConfirm: function () {
            state = Store.clone(state);
            state.settings.pinHash = null;
            state.settings.pinSalt = null;
            persistState(state);
            setSessionUnlocked(true);
            locked = false;
            render();
            toast(tr('pin.toast.off'));
          },
        });
        break;
      case 'lock-now':
        setSessionUnlocked(false);
        locked = true;
        render();
        break;
      case 'install':
        doInstall();
        break;
      case 'install-help':
        openInstallHelp();
        break;
      case 'open-help':
        openHelp();
        break;
      case 'toggle-language':
        changeLanguage(currentLanguage() === 'mr' ? 'en' : 'mr');
        break;
      case 'set-language':
        if (value) changeLanguage(value);
        break;
      default:
        break;
    }
  }

  function handleSubmit(event) {
    if (event.target.id !== 'shop-form') return;
    event.preventDefault();
    const input = $('#shop-name');
    const name = input ? input.value.trim() : '';
    if (!name) {
      toast(tr('settings.shop.error'), 'error');
      return;
    }
    state = Store.clone(state);
    state.settings.shopName = name;
    persistState(state);
    render();
    toast(tr('settings.shop.saved'));
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      if ($('#sheet-root .sheet-layer')) closeSheet();
      return;
    }
    if (!locked) return;
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      handlePinKey(event.key);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      handlePinKey('back');
    }
  }

  // ---------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------

  function init() {
    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);
    document.addEventListener('keydown', handleKeydown);

    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      deferredInstallPrompt = event;
      if (ui.screen === 'settings') render();
    });

    window.addEventListener('appinstalled', function () {
      deferredInstallPrompt = null;
      toast(tr('installHelp.installedToast'));
      render();
    });

    if (
      'serviceWorker' in navigator &&
      /^https?:$/.test(window.location.protocol)
    ) {
      const registerSW = function () {
        navigator.serviceWorker.register('sw.js').catch(function () {
          // The app still works without the service worker.
        });
      };
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    render();
  }

  init();
})();

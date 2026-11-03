/*
 * Hurda Hisaab — English / Marathi text
 * Pair format: ['English', 'मराठी']
 */
(function (global) {
  'use strict';

  const MESSAGES = {
    'app.name': ['Hurda Hisaab', 'हुरडा हिसाब'],

    // Shared words
    'common.today': ['Today', 'आज'],
    'common.yesterday': ['Yesterday', 'काल'],
    'common.all': ['All', 'सर्व'],
    'common.product': ['Product', 'वस्तू'],
    'common.products': ['Products', 'वस्तू'],
    'common.entry': ['entry', 'नोंद'],
    'common.entries': ['entries', 'नोंदी'],
    'common.sale': ['sale', 'विक्री'],
    'common.sales': ['sales', 'विक्री'],
    'common.stockEntry': ['stock entry', 'स्टॉक नोंद'],
    'common.stockEntries': ['stock entries', 'स्टॉक नोंदी'],
    'common.archivedProduct': ['archived product', 'संग्रहित वस्तू'],
    'common.archivedProducts': ['archived products', 'संग्रहित वस्तू'],
    'product': ['Product', 'वस्तू'],
    'products': ['Products', 'वस्तू'],
    'entry': ['entry', 'नोंद'],
    'entries': ['entries', 'नोंदी'],
    'unit.ml': ['ml', 'मिली'],
    'common.optional': ['optional', 'ऐच्छिक'],
    'common.add': ['Add', 'जोडा'],
    'common.set': ['Set', 'ठरवा'],
    'common.change': ['Change', 'बदला'],
    'common.save': ['Save', 'जतन करा'],
    'common.cancel': ['Cancel', 'रद्द करा'],
    'common.edit': ['Edit', 'बदला'],
    'common.delete': ['Delete', 'काढा'],
    'common.close': ['Close', 'बंद करा'],
    'common.gotIt': ['Got it', 'समजले'],
    'common.confirm': ['Confirm', 'खात्री करा'],
    'common.pleaseConfirm': ['Please confirm', 'कृपया खात्री करा'],
    'common.per': ['per', 'प्रति'],
    'common.left': ['{qty} left', '{qty} शिल्लक'],
    'common.sold': ['{amount} sold', '{amount} विक्री'],
    'common.noChange': ['No change', 'बदल नाही'],
    'common.correction': ['Correction', 'दुरुस्ती'],
    'common.profit': ['Profit', 'नफा'],
    'common.cost': ['Cost', 'खरेदी'],
    'common.notSet': ['Not set', 'ठरवले नाही'],
    'common.notSetYet': ['Not set yet', 'अजून ठरवले नाही'],
    'common.notFound': ['Not found', 'सापडले नाही'],

    // Language switch
    'lang.switchTo': ['Switch to Marathi', 'Switch to English'],
    'lang.other': ['मराठी', 'English'],
    'lang.title': ['Language', 'भाषा'],
    'lang.sub': [
      'Choose the language that is easier for you.',
      'तुम्हाला सोपी वाटणारी भाषा निवडा.',
    ],

    // Navigation
    'nav.home': ['Home', 'होम'],
    'nav.history': ['History', 'इतिहास'],
    'nav.products': ['Products', 'वस्तू'],
    'nav.settings': ['Settings', 'सेटिंग्ज'],
    'nav.main': ['Main navigation', 'मुख्य नेव्हिगेशन'],

    // Home
    'home.settingsAria': ['Settings', 'सेटिंग्ज'],
    'home.empty.title': ['No products yet', 'अजून वस्तू नाही'],
    'home.empty.text': [
      'Add hurda or any other item you sell to get started.',
      'सुरुवात करण्यासाठी हुरडा किंवा तुम्ही विकत असलेली दुसरी वस्तू जोडा.',
    ],
    'home.addProduct': ['Add product', 'वस्तू जोडा'],
    'home.stockNow': ['Stock now', 'आत्ताचा स्टॉक'],
    'home.avgCost': ['Avg. cost', 'सरासरी खरेदी'],
    'home.stockValue': ['Stock value', 'स्टॉकची किंमत'],
    'home.needsAttention': [
      '{count} products need attention',
      '{count} वस्तूंकडे लक्ष द्या',
    ],
    'home.quick.stockIn': ['Stock In', 'स्टॉक भरा'],
    'home.quick.stockInSub': ['New arrival', 'नवीन माल'],
    'home.quick.sale': ['Sale', 'विक्री'],
    'home.quick.saleSub': ['Record a sale', 'विक्री नोंदवा'],
    'home.today': ['Today', 'आज'],
    'home.stat.stockIn': ['Stock in', 'स्टॉक भरला'],
    'home.stat.sold': ['Sold', 'विकले'],
    'home.stat.sales': ['Sales', 'विक्री'],
    'home.stat.collected': ['Collected', 'जमा'],
    'home.estimatedProfit': ['Estimated profit', 'अंदाजे नफा'],
    'home.recent': ['Recent activity', 'अलीकडील नोंदी'],
    'home.viewAll': ['View all', 'सर्व पहा'],
    'home.noEntries.title': ['No entries yet', 'अजून नोंद नाही'],
    'home.noEntries.text': [
      'Tap Stock In or Sale above. Your daily entries will appear here.',
      'वर “स्टॉक भरा” किंवा “विक्री” दाबा. तुमच्या रोजच्या नोंदी इथे दिसतील.',
    ],
    'home.outOfStockText': [
      'Add stock before recording a sale.',
      'विक्री नोंदवण्यापूर्वी स्टॉक भरा.',
    ],

    // Setup card
    'setup.title': ['Let’s get set up', 'चला सुरु करूया'],
    'setup.text': [
      'Three small steps and you are ready.',
      'तीन छोटी पायरी आणि तुम्ही तयार.',
    ],
    'setup.price': ['Set your selling price', 'विक्री भाव ठरवा'],
    'setup.stock': ['Add today’s stock', 'आजचा स्टॉक भरा'],
    'setup.sale': ['Record your first sale', 'पहिली विक्री नोंदवा'],
    'setup.sell': ['Sell', 'विका'],

    // Price card
    'price.selling': ['Selling price', 'विक्री भाव'],
    'price.change': ['Change', 'बदला'],
    'price.setTitle': ['Set your selling price', 'विक्री भाव ठरवा'],
    'price.setSub': [
      'Needed before you record sales.',
      'विक्री नोंदवण्यापूर्वी आवश्यक.',
    ],
    'price.cost': ['Cost', 'खरेदी'],
    'price.profit': ['Profit', 'नफा'],
    'price.margin': ['Margin', 'नफा'],
    'price.addStockForMargin': [
      'Add stock to see your margin.',
      'नफा पाहण्यासाठी स्टॉक भरा.',
    ],
    'price.enterPrice': ['Enter a price', 'भाव भरा'],
    'price.enterAboveZero': [
      'Enter a selling price above ₹0.',
      '₹0 पेक्षा जास्त विक्री भाव भरा.',
    ],
    'price.sheetTitle': ['Change selling price', 'विक्री भाव बदला'],
    'price.new': ['New selling price', 'नवीन विक्री भाव'],
    'price.hint': [
      'The new price applies to future sales. Past sales stay as recorded.',
      'नवीन भाव पुढील विक्रीला लागू होईल. जुन्या विक्री जशाच्या तशा राहतील.',
    ],
    'price.update': ['Update price', 'भाव बदला'],
    'price.toast.unchanged': [
      'Price is already {amount}',
      'भाव आधीच {amount} आहे',
    ],
    'price.toast.updated': [
      'Price updated to {amount} / {unit}',
      'भाव {amount} / {unit} केला',
    ],
    'price.error': [
      'Enter a selling price greater than 0.',
      '0 पेक्षा जास्त विक्री भाव भरा.',
    ],

    // Status
    'status.out': ['Out of stock', 'स्टॉक संपला'],
    'status.low': ['Low stock', 'स्टॉक कमी'],
    'status.ok': ['In stock', 'स्टॉकमध्ये'],
    'status.archived': ['Archived', 'संग्रहित'],

    // Products
    'products.title': ['Products', 'वस्तू'],
    'products.subtitle': [
      'Stock and prices at a glance',
      'स्टॉक आणि भाव एका नजरेत',
    ],
    'products.add': ['Add', 'जोडा'],
    'products.stat.active': ['Active', 'सक्रिय'],
    'products.stat.stockValue': ['Stock value', 'स्टॉकची किंमत'],
    'products.stat.atCost': ['At cost', 'खरेदी किमतीत'],
    'products.stat.retail': ['Retail value', 'विक्री किंमत'],
    'products.stat.ifSold': ['If sold today', 'आज विकल्यास'],
    'products.your': ['Your products', 'तुमच्या वस्तू'],
    'products.empty.title': ['No active products', 'कोणतीही सक्रिय वस्तू नाही'],
    'products.empty.text': [
      'Add hurda or another item to start tracking it.',
      'हुरडा किंवा दुसरी वस्तू जोडून सुरुवात करा.',
    ],
    'products.hide': ['Hide', 'लपवा'],
    'products.show': ['Show', 'दाखवा'],
    'products.priceNotSet': ['Price not set', 'भाव ठरवलेला नाही'],
    'products.noCost': ['No stock cost yet', 'अजून खरेदी भाव नाही'],

    // Product details
    'product.active': ['Active product', 'सक्रिय वस्तू'],
    'product.archived': ['Archived product', 'संग्रहित वस्तू'],
    'product.stockValue': ['Stock value {amount}', 'स्टॉकची किंमत {amount}'],
    'product.stock': ['Stock', 'स्टॉक'],
    'product.sellingPrice': ['Selling price', 'विक्री भाव'],
    'product.avgCost': ['Avg. cost', 'सरासरी खरेदी'],
    'product.profitPer': ['Profit / {unit}', 'नफा / {unit}'],
    'product.changePrice': ['Change price', 'भाव बदला'],
    'product.adjustStock': ['Adjust stock', 'स्टॉक दुरुस्त करा'],
    'product.editDetails': ['Edit product details', 'वस्तूची माहिती बदला'],
    'product.restore': ['Restore product', 'वस्तू पुन्हा सुरू करा'],
    'product.recent': ['Recent entries', 'अलीकडील नोंदी'],
    'product.noEntries': [
      'No entries yet for this product.',
      'या वस्तूच्या अजून नोंदी नाहीत.',
    ],
    'product.priceHistory': ['Price history', 'भावाचा इतिहास'],
    'product.noPrices': ['No price changes yet.', 'अजून भाव बदललेला नाही.'],
    'product.archive': ['Archive product', 'वस्तू संग्रहित करा'],
    'product.archiveHint': [
      'Archiving hides it from Home and Products. All history is kept.',
      'संग्रहित केल्यास ती होम आणि वस्तूंमधून लपते. सर्व इतिहास जतन राहतो.',
    ],
    'product.archiveTitle': ['Archive {name}?', '{name} संग्रहित करायची?'],
    'product.archiveMessage': [
      'It will be hidden from Home and Products. All stock history is kept, and you can restore it later.',
      'ती होम आणि वस्तूंमधून लपेल. सर्व स्टॉक इतिहास जतन राहतो आणि तुम्ही ती नंतर पुन्हा सुरू करू शकता.',
    ],
    'product.archiveButton': ['Archive product', 'वस्तू संग्रहित करा'],
    'product.archiveToast': ['Product archived', 'वस्तू संग्रहित केली'],
    'product.restoreToast': ['Product restored', 'वस्तू पुन्हा सुरू केली'],
    'product.noPriceChanges': ['No price changes yet.', 'अद्याप भाव बदल नाही.'],
    'product.notFound': ['Product not found.', 'वस्तू सापडली नाही.'],

    // Product form
    'product.form.addTitle': ['Add product', 'वस्तू जोडा'],
    'product.form.editTitle': ['Edit product', 'वस्तू बदला'],
    'product.form.addSubtitle': [
      'Hurda is already here. Add more items anytime.',
      'हुरडा आधीच आहे. अजून वस्तू कधीही जोडा.',
    ],
    'product.form.editSubtitle': [
      'Names, icon and alerts',
      'नाव, चिन्ह आणि सूचना',
    ],
    'product.form.name': ['Product name', 'वस्तूचे नाव'],
    'product.form.namePlaceholder': ['e.g. Hurda', 'उदा. हुरडा'],
    'product.form.icon': ['Icon', 'चिन्ह'],
    'product.form.unit': ['Unit', 'एकक'],
    'product.form.unit.kg': ['Kilograms (kg)', 'किलोग्रॅम (kg)'],
    'product.form.unit.g': ['Grams (g)', 'ग्रॅम (g)'],
    'product.form.unit.litre': ['Litres (L)', 'लिटर (L)'],
    'product.form.unit.piece': ['Pieces (pcs)', 'नग (pcs)'],
    'product.form.unit.packet': ['Packets', 'पॅकेट'],
    'product.form.sellingPrice': ['Selling price', 'विक्री भाव'],
    'product.form.lowStock': ['Low stock alert', 'स्टॉक कमी सूचना'],
    'product.form.currentStock': ['Current stock', 'सध्याचा स्टॉक'],
    'product.form.openingStock': ['Opening stock', 'सुरुवातीचा स्टॉक'],
    'product.form.openingCost': [
      'Opening cost per {unit}',
      'सुरुवातीचा खरेदी भाव प्रति {unit}',
    ],
    'product.form.openingHint': [
      'If you already have stock at home, add it now. You can also use “Adjust stock” later.',
      'घरी आधीच माल असल्यास आता भरा. नंतर “स्टॉक दुरुस्त करा” वापरू शकता.',
    ],
    'product.form.lockedUnit': [
      'The unit is locked because this product already has entries. Selling price changes are logged in history.',
      'या वस्तूच्या नोंदी आहेत म्हणून एकक बदलता येत नाही. भाव बदल इतिहासात नोंदवले जातात.',
    ],
    'product.form.saveChanges': ['Save changes', 'बदल जतन करा'],
    'product.form.addButton': ['Add product', 'वस्तू जोडा'],
    'product.form.added': ['Product added', 'वस्तू जोडली'],
    'product.form.updated': ['Product updated', 'वस्तू बदलली'],
    'product.form.error.name': ['Enter a product name.', 'वस्तूचे नाव भरा.'],
    'product.form.error.price': [
      'Selling price cannot be negative.',
      'विक्री भाव ऋण असू शकत नाही.',
    ],
    'product.form.error.low': [
      'Low stock alert cannot be negative.',
      'स्टॉक कमी सूचना ऋण असू शकत नाही.',
    ],
    'product.form.error.opening': [
      'Opening stock cannot be negative.',
      'सुरुवातीचा स्टॉक ऋण असू शकत नाही.',
    ],
    'product.form.error.openingCost': [
      'Opening cost cannot be negative.',
      'सुरुवातीचा खरेदी भाव ऋण असू शकत नाही.',
    ],

    // Stock In
    'purchase.title': ['Stock In', 'स्टॉक भरा'],
    'purchase.editTitle': ['Edit stock entry', 'स्टॉक नोंद बदला'],
    'purchase.subtitle': [
      'Record new stock that arrived.',
      'नवीन आलेला माल नोंदवा.',
    ],
    'purchase.editSubtitle': [
      'Changes will recalculate stock and cost.',
      'बदल केल्यास स्टॉक आणि खरेदी पुन्हा मोजली जाईल.',
    ],
    'purchase.editing': ['Editing this entry', 'ही नोंद बदलत आहे'],
    'purchase.qty': ['Quantity', 'प्रमाण'],
    'purchase.cost': ['Cost', 'खरेदी'],
    'purchase.ratePer': ['Rate per {unit}', 'प्रति {unit} भाव'],
    'purchase.totalPaid': ['Total paid', 'एकूण दिले'],
    'purchase.lastRate': ['Last rate', 'शेवटचा भाव'],
    'purchase.addNote': ['Add a note', 'टीप जोडा'],
    'purchase.notePlaceholder': [
      'Supplier, vehicle, quality…',
      'पुरवठादार, वाहन, प्रत…',
    ],
    'purchase.date': ['Date', 'तारीख'],
    'purchase.addStock': ['Add stock', 'स्टॉक भरा'],
    'purchase.updateEntry': ['Update entry', 'नोंद बदला'],
    'purchase.enterBoth': ['Enter quantity and cost', 'प्रमाण आणि खरेदी भरा'],
    'purchase.perUnit': ['Per {unit}', 'प्रति {unit}'],
    'purchase.toast.added': ['Stock added · {qty}', 'स्टॉक भरला · {qty}'],
    'purchase.toast.updated': ['Stock entry updated', 'स्टॉक नोंद बदलली'],
    'purchase.error.qty': [
      'Enter a quantity greater than 0.',
      '0 पेक्षा जास्त प्रमाण भरा.',
    ],
    'purchase.error.cost': ['Enter the cost.', 'खरेदी भरा.'],

    // Sale
    'sale.title': ['Sale', 'विक्री'],
    'sale.editTitle': ['Edit sale', 'विक्री बदला'],
    'sale.subtitle': [
      'Record what was sold. No customer details needed.',
      'काय विकले ते नोंदवा. ग्राहकाची माहिती आवश्यक नाही.',
    ],
    'sale.editSubtitle': [
      'Changes will recalculate stock and profit.',
      'बदल केल्यास स्टॉक आणि नफा पुन्हा मोजला जाईल.',
    ],
    'sale.editing': ['Editing this sale', 'ही विक्री बदलत आहे'],
    'sale.how': ['How are you selling?', 'विक्री कशी करत आहात?'],
    'sale.byUnit': ['By {unit}', '{unit}ने'],
    'sale.byAmount': ['By ₹ amount', '₹ रकमेने'],
    'sale.ratePer': ['Rate per {unit}', 'प्रति {unit} भाव'],
    'sale.rateHint': [
      'Applies to this sale only. Use “Change” on Home to update the regular price.',
      'फक्त या विक्रीसाठी. कायमचा भाव बदलायचा असल्यास होमवर “बदला” वापरा.',
    ],
    'sale.qtySold': ['Quantity sold', 'विकलेले प्रमाण'],
    'sale.inStock': ['In stock: {qty}', 'स्टॉकमध्ये: {qty}'],
    'sale.amountReceived': ['Amount received', 'मिळालेली रक्कम'],
    'sale.after': ['Stock after sale', 'विक्रीनंतरचा स्टॉक'],
    'sale.notePlaceholder': [
      'Customer, packet details…',
      'ग्राहक, पॅकेट तपशील…',
    ],
    'sale.record': ['Record sale', 'विक्री नोंदवा'],
    'sale.update': ['Update sale', 'विक्री बदला'],
    'sale.notEnough': ['Not enough stock', 'पुरेसा स्टॉक नाही'],
    'sale.onlyAvailable': [
      'Only {qty} available for this sale.',
      'या विक्रीसाठी फक्त {qty} उपलब्ध आहे.',
    ],
    'sale.setRate': ['Set a rate', 'भाव भरा'],
    'sale.enterRate': [
      'Enter the selling rate above.',
      'वर विक्री भाव भरा.',
    ],
    'sale.enterQty': ['Enter the quantity sold', 'विकलेले प्रमाण भरा'],
    'sale.enterAmount': ['Enter the amount received', 'मिळालेली रक्कम भरा'],
    'sale.notEnoughShort': ['Not enough', 'पुरेसा नाही'],
    'sale.toast.recorded': ['Sale recorded · {amount}', 'विक्री नोंदवली · {amount}'],
    'sale.toast.updated': ['Sale updated', 'विक्री बदलली'],
    'sale.error.rate': [
      'Enter a selling rate greater than 0.',
      '0 पेक्षा जास्त विक्री भाव भरा.',
    ],
    'sale.error.qty': [
      'Enter a quantity greater than 0.',
      '0 पेक्षा जास्त प्रमाण भरा.',
    ],

    // Adjust stock
    'adjust.title': ['Adjust stock', 'स्टॉक दुरुस्त करा'],
    'adjust.subtitle': ['Count the stock before adjusting', 'दुरुस्तीपूर्वी स्टॉक मोजा'],
    'adjust.newCount': ['New stock count', 'नवीन स्टॉक संख्या'],
    'adjust.hint': [
      'Use this after a physical count, spoilage, or a correction.',
      'मोजणी, नासाडी किंवा चुकीची नोंद दुरुस्त करण्यासाठी वापरा.',
    ],
    'adjust.reason': ['Reason', 'कारण'],
    'adjust.reasonPlaceholder': ['Spoilage, count…', 'नासाडी, मोजणी…'],
    'adjust.save': ['Save stock count', 'स्टॉक संख्या जतन करा'],
    'adjust.enterCount': ['Enter a count', 'संख्या भरा'],
    'adjust.negative': ['Stock cannot be negative.', 'स्टॉक ऋण असू शकत नाही.'],
    'adjust.newStock': [
      'New stock: {qty} · was {old}',
      'नवीन स्टॉक: {qty} · आधी {old}',
    ],
    'adjust.toast.unchanged': ['No change recorded', 'कोणताही बदल नोंदवला नाही'],
    'adjust.toast.updated': ['Stock adjusted to {qty}', 'स्टॉक {qty} केला'],
    'adjust.error': ['Enter a valid stock quantity.', 'योग्य स्टॉक संख्या भरा.'],
    'adjust.defaultNote': ['Stock adjusted', 'स्टॉक दुरुस्त केला'],

    // History
    'history.title': ['History', 'इतिहास'],
    'history.subtitle': ['Stock, sales and price changes', 'स्टॉक, विक्री आणि भाव बदल'],
    'history.exportAria': ['Download CSV', 'CSV डाउनलोड करा'],
    'history.period.today': ['Today', 'आज'],
    'history.period.7d': ['7 days', '7 दिवस'],
    'history.period.30d': ['30 days', '30 दिवस'],
    'history.period.all': ['All', 'सर्व'],
    'history.range.7d': ['Last 7 days', 'शेवटचे 7 दिवस'],
    'history.range.30d': ['Last 30 days', 'शेवटचे 30 दिवस'],
    'history.range.all': ['All time', 'सर्व काळ'],
    'history.overview': ['{range} overview', 'आढावा: {range}'],
    'history.estimatedProfit': ['Estimated profit', 'अंदाजे नफा'],
    'history.entriesView': ['Entries in this view', 'या दृश्यातील नोंदी'],
    'history.filter.all': ['All', 'सर्व'],
    'history.filter.stockIn': ['Stock in', 'स्टॉक'],
    'history.filter.sales': ['Sales', 'विक्री'],
    'history.filter.prices': ['Prices', 'भाव'],
    'history.filter.adjustments': ['Adjustments', 'दुरुस्ती'],
    'history.empty.title': ['No entries in this view', 'या दृश्यात नोंदी नाहीत'],
    'history.empty.text': [
      'Try a different period, or record a sale from the Home screen.',
      'वेगळा कालावधी निवडा किंवा होमवरून विक्री नोंदवा.',
    ],
    'history.recordSale': ['Record a sale', 'विक्री नोंदवा'],

    // Transaction types and rows
    'type.opening': ['Opening stock', 'सुरुवातीचा स्टॉक'],
    'type.purchase': ['Stock in', 'स्टॉक भरला'],
    'type.sale': ['Sale', 'विक्री'],
    'type.adjustment': ['Stock adjustment', 'स्टॉक दुरुस्ती'],
    'type.price': ['Price change', 'भाव बदल'],
    'txn.openingSuffix': ['Opening', 'सुरुवात'],
    'txn.stockInSuffix': ['Stock in', 'स्टॉक भरला'],
    'txn.saleSuffix': ['Sale', 'विक्री'],
    'txn.priceChanged': ['Price changed', 'भाव बदलला'],
    'txn.adjusted': ['Stock adjusted', 'स्टॉक दुरुस्त झाला'],
    'txn.perUnit': ['per {unit}', 'प्रति {unit}'],
    'txn.countedAt': ['Counted at {qty}', 'मोजणी {qty}'],
    'txn.profit': ['Profit {amount}', 'नफा {amount}'],
    'txn.newCount': ['new count {qty}', 'नवीन संख्या {qty}'],
    'txn.details': ['Entry details', 'नोंदीचा तपशील'],
    'txn.saleDetails': ['Sale details', 'विक्रीचा तपशील'],
    'txn.stockEntry': ['Stock entry', 'स्टॉक नोंद'],
    'txn.dateTime': ['Date & time', 'तारीख आणि वेळ'],
    'txn.type': ['Type', 'प्रकार'],
    'txn.product': ['Product', 'वस्तू'],
    'txn.oldPrice': ['Old price', 'जुना भाव'],
    'txn.newPrice': ['New price', 'नवीन भाव'],
    'txn.newCountLabel': ['New stock count', 'नवीन स्टॉक संख्या'],
    'txn.change': ['Change', 'बदल'],
    'txn.qty': ['Quantity', 'प्रमाण'],
    'txn.rate': ['Rate', 'भाव'],
    'txn.amount': ['Amount', 'रक्कम'],
    'txn.costOfGoods': ['Cost of goods', 'मालाची खरेदी किंमत'],
    'txn.profitLabel': ['Profit', 'नफा'],
    'txn.edit': ['Edit', 'बदला'],
    'txn.delete': ['Delete', 'काढा'],
    'txn.adjustHint': [
      'To correct an adjustment, delete it and add a fresh stock count.',
      'दुरुस्ती बदलायची असल्यास ती काढून नवीन स्टॉक मोजणी नोंदवा.',
    ],
    'txn.priceHint': [
      'Price history is kept for reference. To change today’s price, use “Change” on the Home screen.',
      'भावाचा इतिहास संदर्भासाठी ठेवला जातो. आजचा भाव बदलायचा असल्यास होमवर “बदला” वापरा.',
    ],
    'txn.deleteTitle': ['Delete this entry?', 'ही नोंद काढायची?'],
    'txn.deleteMessage': [
      'Stock and profit will be recalculated. This cannot be undone. If you only need to fix a number, use Edit instead.',
      'स्टॉक आणि नफा पुन्हा मोजला जाईल. हे परत करता येणार नाही. फक्त आकडा दुरुस्त करायचा असल्यास “बदला” वापरा.',
    ],
    'txn.deleteButton': ['Delete entry', 'नोंद काढा'],
    'txn.deleted': ['Entry deleted', 'नोंद काढली'],
    'txn.notFound': ['Entry not found.', 'नोंद सापडली नाही.'],

    // Settings
    'settings.title': ['Settings', 'सेटिंग्ज'],
    'settings.subtitle': ['App lock, backup and data', 'अ‍ॅप लॉक, बॅकअप आणि माहिती'],
    'settings.backedUp': ['Backed up', 'बॅकअप घेतला'],
    'settings.backupDue': ['Backup due', 'बॅकअप घ्या'],
    'settings.shop.title': ['Shop details', 'दुकानाची माहिती'],
    'settings.shop.sub': [
      'This name appears on the Home screen.',
      'हे नाव होम स्क्रीनवर दिसते.',
    ],
    'settings.shop.nameAria': ['Shop name', 'दुकानाचे नाव'],
    'settings.shop.save': ['Save', 'जतन करा'],
    'settings.shop.saved': ['Shop name saved', 'दुकानाचे नाव जतन झाले'],
    'settings.shop.error': ['Enter a shop name.', 'दुकानाचे नाव भरा.'],
    'settings.backup.title': ['Backup & restore', 'बॅकअप आणि परत आणा'],
    'settings.backup.sub': [
      'Your data lives only on this device. Download a backup regularly.',
      'तुमची माहिती फक्त या डिव्हाइसवर आहे. नियमित बॅकअप घ्या.',
    ],
    'settings.backup.last': ['Last backup', 'शेवटचा बॅकअप'],
    'settings.backup.none': ['Never', 'कधीही नाही'],
    'settings.backup.safe': ['Safe', 'सुरक्षित'],
    'settings.backup.due': ['Due', 'घ्या'],
    'settings.backup.download': ['Download backup', 'बॅकअप घ्या'],
    'settings.backup.restore': ['Restore from backup', 'बॅकअप परत आणा'],
    'settings.backup.note': [
      'Keep the backup file in Google Drive or WhatsApp “Saved messages”. Restoring replaces everything currently in the app.',
      'बॅकअप फाइल Google Drive किंवा WhatsApp “Saved messages” मध्ये ठेवा. परत आणल्यास सध्याची सर्व माहिती बदलली जाईल.',
    ],
    'settings.lock.title': ['App lock', 'अ‍ॅप लॉक'],
    'settings.lock.sub': [
      'Optional 4-digit PIN when the app opens.',
      'अ‍ॅप उघडल्यावर ऐच्छिक 4 अंकी PIN.',
    ],
    'settings.lock.pin': ['PIN lock', 'PIN लॉक'],
    'settings.lock.on': [
      'On — app asks for PIN on a fresh open.',
      'सुरू — अ‍ॅप नव्याने उघडल्यावर PIN विचारेल.',
    ],
    'settings.lock.off': [
      'Off — anyone with the phone can open it.',
      'बंद — फोन असलेला कोणीही उघडू शकतो.',
    ],
    'settings.lock.turnOff': ['Turn off PIN lock', 'PIN लॉक बंद करा'],
    'settings.lock.turnOn': ['Turn on PIN lock', 'PIN लॉक सुरू करा'],
    'settings.lock.change': ['Change PIN', 'PIN बदला'],
    'settings.lock.now': ['Lock now', 'आता लॉक करा'],
    'settings.install.title': ['Install app', 'अ‍ॅप इंस्टॉल करा'],
    'settings.install.sub': [
      'Add Hurda Hisaab to the home screen for one-tap opening.',
      'हुरडा हिसाब होम स्क्रीनवर जोडा, एका टॅपमध्ये उघडेल.',
    ],
    'settings.install.row': ['Home screen app', 'होम स्क्रीन अ‍ॅप'],
    'settings.install.installedText': [
      'This device is already using the installed app.',
      'हे डिव्हाइस आधीच इंस्टॉल केलेले अ‍ॅप वापरत आहे.',
    ],
    'settings.install.notInstalledText': [
      'Opens full screen and works without internet.',
      'पूर्ण स्क्रीनवर उघडते आणि इंटरनेटशिवाय चालते.',
    ],
    'settings.install.installed': ['Installed', 'इंस्टॉल झाले'],
    'settings.install.install': ['Install app', 'अ‍ॅप इंस्टॉल करा'],
    'settings.install.how': ['How to install', 'इंस्टॉल कसे करायचे'],
    'settings.data.title': ['Data', 'माहिती'],
    'settings.data.downloadCsv': [
      'Download all entries (CSV)',
      'सर्व नोंदी डाउनलोड करा (CSV)',
    ],
    'settings.data.reset': ['Reset all data', 'सर्व माहिती पुसा'],
    'settings.data.resetNote': [
      'Reset removes products, stock, history and the PIN from this device. Download a backup first.',
      'पुसल्यास वस्तू, स्टॉक, इतिहास आणि PIN या डिव्हाइसवरून जातील. आधी बॅकअप घ्या.',
    ],
    'settings.about.version': [
      'Version {version} · Offline-first',
      'आवृत्ती {version} · इंटरनेटशिवाय',
    ],
    'settings.about.text': [
      'A simple stock and price book made for our family shop. No accounts, no monthly fees, and your data stays on this device.',
      'आपल्या कौटुंबिक दुकानासाठी सोपे स्टॉक आणि भाव पुस्तक. खाते नाही, मासिक शुल्क नाही, माहिती या डिव्हाइसवरच राहते.',
    ],
    'settings.help.title': ['How to use', 'कसे वापरायचे'],
    'settings.help.sub': [
      'A short guide in simple words.',
      'सोप्या शब्दांत छोटी मार्गदर्शिका.',
    ],
    'settings.help.button': ['Show guide', 'मार्गदर्शिका पहा'],

    // Help guide
    'help.title': ['How to use Hurda Hisaab', 'हुरडा हिसाब कसा वापरायचा'],
    'help.subtitle': ['Five simple habits', 'पाच सोप्या सवयी'],
    'help.step1': [
      'When stock arrives, tap Stock In. Enter the quantity and what you paid.',
      'माल आल्यावर “स्टॉक भरा” दाबा. प्रमाण आणि दिलेली रक्कम भरा.',
    ],
    'help.step2': [
      'When you sell, tap Sale. Sell by kg or by ₹ amount.',
      'विक्री झाल्यावर “विक्री” दाबा. किलोने किंवा ₹ रकमेने विका.',
    ],
    'help.step3': [
      'Stock and profit update by themselves after every entry.',
      'प्रत्येक नोंदीनंतर स्टॉक आणि नफा आपोआप बदलतो.',
    ],
    'help.step4': [
      'To change your rate, tap Change on the Home screen.',
      'भाव बदलायचा असल्यास होमवर “बदला” दाबा.',
    ],
    'help.step5': [
      'Every week, open Settings and download a backup.',
      'दर आठवड्याला सेटिंग्जमध्ये जाऊन बॅकअप घ्या.',
    ],
    'help.close': ['Got it', 'समजले'],

    // PIN
    'pin.new': ['New PIN', 'नवीन PIN'],
    'pin.current': ['PIN', 'PIN'],
    'pin.confirm': ['Confirm PIN', 'PIN पुन्हा भरा'],
    'pin.hint': [
      'Use 4 digits you will remember. The PIN is a convenience lock, not encryption. If you forget it, use a backup to recover the data.',
      '4 अंक लक्षात ठेवा. PIN सोपा लॉक आहे, एन्क्रिप्शन नाही. विसरल्यास बॅकअपमधून माहिती परत आणा.',
    ],
    'pin.setTitle': ['Set PIN', 'PIN सेट करा'],
    'pin.changeTitle': ['Change PIN', 'PIN बदला'],
    'pin.subtitle': ['A simple privacy lock for the app.', 'अ‍ॅपसाठी सोपा गोपनीयता लॉक.'],
    'pin.save': ['Save PIN', 'PIN जतन करा'],
    'pin.error.length': ['Enter exactly 4 digits.', 'अचूक 4 अंक भरा.'],
    'pin.error.match': ['The two PINs do not match.', 'दोन्ही PIN जुळत नाहीत.'],
    'pin.toast.on': ['PIN lock is on', 'PIN लॉक सुरू आहे'],
    'pin.toast.off': ['PIN lock is off', 'PIN लॉक बंद आहे'],
    'pin.removeTitle': ['Turn off PIN lock?', 'PIN लॉक बंद करायचा?'],
    'pin.removeMessage': [
      'The app will open without asking for a PIN. You can turn it back on anytime.',
      'अ‍ॅप PIN न विचारता उघडेल. पुन्हा कधीही सुरू करू शकता.',
    ],
    'pin.removeConfirm': ['Turn off PIN', 'PIN बंद करा'],
    'lock.enter': ['Enter your 4-digit PIN', 'तुमचा 4 अंकी PIN भरा'],
    'lock.wrong': ['Wrong PIN. Try again.', 'चुकीचा PIN. पुन्हा प्रयत्न करा.'],
    'lock.hint': [
      'Forgot the PIN? Clear this site’s data in your browser settings, open the app again, then restore your latest backup. The backup opens without a PIN.',
      'PIN विसरला? ब्राउझर सेटिंगमध्ये या साइटची माहिती पुसा, अ‍ॅप पुन्हा उघडा आणि शेवटचा बॅकअप परत आणा. बॅकअप PIN विचारत नाही.',
    ],
    'lock.welcome': ['Welcome back', 'पुन्हा स्वागत आहे'],

    // Install help
    'installHelp.title': ['Install on your phone', 'फोनवर इंस्टॉल करा'],
    'installHelp.subtitle': ['It opens like a normal app', 'सामान्य अ‍ॅपसारखे उघडते'],
    'installHelp.android': ['Android · Chrome', 'Android · Chrome'],
    'installHelp.androidStep': [
      'Menu ⋮ → Add to Home screen',
      'Menu ⋮ → Add to Home screen',
    ],
    'installHelp.iphone': ['iPhone · Safari', 'iPhone · Safari'],
    'installHelp.iphoneStep': [
      'Share → Add to Home Screen',
      'Share → Add to Home Screen',
    ],
    'installHelp.after': ['After installing', 'इंस्टॉल केल्यानंतर'],
    'installHelp.afterStep': [
      'Open from the home screen icon',
      'होम स्क्रीनवरील चिन्हावरून उघडा',
    ],
    'installHelp.fileNote': [
      'This copy is open as a local file. To install it, host the folder online (for example Netlify Drop) or run it from localhost, then open that link on the phone.',
      'ही प्रत स्थानिक फाइल म्हणून उघडली आहे. इंस्टॉल करण्यासाठी फोल्डर ऑनलाइन होस्ट करा (उदा. Netlify Drop) किंवा localhost वरून चालवा, नंतर तो लिंक फोनवर उघडा.',
    ],
    'installHelp.onlineNote': [
      'The app works offline after the first open. Your data stays on the device; use Settings → Download backup regularly.',
      'पहिल्यांदा उघडल्यानंतर अ‍ॅप इंटरनेटशिवाय चालते. माहिती डिव्हाइसवरच राहते; सेटिंग्ज → नियमित बॅकअप घ्या.',
    ],
    'installHelp.gotIt': ['Got it', 'समजले'],
    'installHelp.installedToast': ['App installed', 'अ‍ॅप इंस्टॉल झाले'],

    // Backup / restore / reset
    'backup.downloaded': ['Backup downloaded', 'बॅकअप डाउनलोड झाला'],
    'restore.invalid': [
      'That file is not valid backup JSON.',
      'ही फाइल वैध बॅकअप JSON नाही.',
    ],
    'restore.title': ['Restore this backup?', 'हा बॅकअप परत आणायचा?'],
    'restore.message': [
      'The backup contains {products} and {entries}. Restoring will replace everything currently on this device and turn off the PIN lock.',
      'बॅकअपमध्ये {products} आणि {entries} आहेत. परत आणल्यास या डिव्हाइसवरील सर्व माहिती बदलेल आणि PIN लॉक बंद होईल.',
    ],
    'restore.confirm': ['Restore backup', 'बॅकअप परत आणा'],
    'restore.done': ['Backup restored. PIN lock is off.', 'बॅकअप परत आला. PIN लॉक बंद आहे.'],
    'restore.readError': [
      'The backup file could not be read.',
      'बॅकअप फाइल वाचता आली नाही.',
    ],
    'reset.title': ['Reset all data?', 'सर्व माहिती पुसायची?'],
    'reset.message': [
      'This removes every product, stock entry, sale, price change and the PIN from this device. It cannot be undone.',
      'यामुळे प्रत्येक वस्तू, स्टॉक नोंद, विक्री, भाव बदल आणि PIN या डिव्हाइसवरून जाईल. हे परत करता येणार नाही.',
    ],
    'reset.continue': ['Continue', 'पुढे जा'],
    'reset.confirmTitle': ['Delete everything?', 'सर्व पुसायची?'],
    'reset.confirmMessage': [
      'Please be sure. If you might need this data, cancel and download a backup first.',
      'कृपया खात्री करा. ही माहिती लागू शकते, तर रद्द करा आणि आधी बॅकअप घ्या.',
    ],
    'reset.confirm': ['Delete all data', 'सर्व माहिती पुसा'],
    'reset.done': ['All data reset', 'सर्व माहिती पुसली'],

    // CSV
    'csv.date': ['Date', 'तारीख'],
    'csv.time': ['Time', 'वेळ'],
    'csv.type': ['Type', 'प्रकार'],
    'csv.product': ['Product', 'वस्तू'],
    'csv.unit': ['Unit', 'एकक'],
    'csv.quantity': ['Quantity', 'प्रमाण'],
    'csv.rate': ['Rate', 'भाव'],
    'csv.amount': ['Amount', 'रक्कम'],
    'csv.cost': ['Cost', 'खरेदी'],
    'csv.profit': ['Profit', 'नफा'],
    'csv.note': ['Note', 'टीप'],
    'csv.empty': ['There are no entries to export.', 'निर्यात करण्यासाठी नोंदी नाहीत.'],
    'csv.downloaded': ['CSV downloaded', 'CSV डाउनलोड झाली'],

    // Misc errors and prompts
    'error.storage': [
      'Could not save. Storage may be full.',
      'जतन करता आले नाही. स्टोरेज भरलेले असू शकते.',
    ],
    'error.addProductFirst': ['Add a product first.', 'आधी वस्तू जोडा.'],
    'error.dataLayer': [
      'Could not load the app data layer.',
      'अ‍ॅपचा डेटा भाग लोड होऊ शकला नाही.',
    ],
  };

  let language = 'en';

  function setLanguage(next) {
    language = next === 'mr' ? 'mr' : 'en';
  }

  function getLanguage() {
    return language;
  }

  function locale() {
    return language === 'mr' ? 'mr-IN-u-nu-latn' : 'en-IN';
  }

  function t(key, vars) {
    const pair = MESSAGES[key];
    if (!pair) return key;
    let text = pair[language === 'mr' ? 1 : 0];
    if (text === undefined || text === null) text = pair[0];
    if (vars) {
      text = text.replace(/\{(\w+)\}/g, function (match, name) {
        return vars[name] === undefined || vars[name] === null
          ? ''
          : String(vars[name]);
      });
    }
    return text;
  }

  const api = {
    t: t,
    setLanguage: setLanguage,
    getLanguage: getLanguage,
    locale: locale,
    keys: function () {
      return Object.keys(MESSAGES);
    },
    messages: MESSAGES,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.HurdaI18n = api;
})(typeof window !== 'undefined' ? window : globalThis);

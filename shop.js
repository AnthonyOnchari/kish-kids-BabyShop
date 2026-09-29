const products = window.kishKidsProducts;
const grid = document.querySelector('#product-grid');
const categoryFilters = document.querySelector('.catalog-filters');
const searchField = document.querySelector('#product-search');
const emptyState = document.querySelector('.catalog-empty');
const resultCount = document.querySelector('.catalog-result-count');
const cartDrawer = document.querySelector('.cart-drawer');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItems = document.querySelector('.cart-items');
const cartEmpty = document.querySelector('.cart-empty');
const cartFooter = document.querySelector('.cart-footer');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const numberFormat = new Intl.NumberFormat('en-KE');
let activeCategory = new URLSearchParams(window.location.search).get('category') || 'all';
let cart = [];

try {
  cart = JSON.parse(localStorage.getItem('kish-kids-demo-cart') || '[]');
  if (!Array.isArray(cart)) cart = [];
} catch {
  cart = [];
}

function formatPrice(amount) {
  return `KSh ${numberFormat.format(amount)}`;
}

function renderProducts() {
  const query = searchField.value.trim().toLocaleLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = !query || `${product.name} ${product.category} ${product.label}`.toLocaleLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  grid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img src="${product.image}" alt="${product.alt}" loading="lazy" />
        <span class="product-label">${product.label}</span>
        <button class="quick-add" type="button" data-add-product="${product.id}" aria-label="Add ${product.name} to bag">+</button>
      </div>
      <div class="product-info">
        <span class="product-category">${product.category === 'care' ? 'BABY CARE' : product.category.toUpperCase()}</span>
        <h3>${product.name}</h3>
        <div class="product-buy-row"><strong>${formatPrice(product.price)}</strong><button class="add-to-bag" type="button" data-add-product="${product.id}">Add to bag <span>+</span></button></div>
      </div>
    </article>`).join('');
  resultCount.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? 'little find' : 'little finds'}`;
  emptyState.hidden = visibleProducts.length > 0;
  grid.hidden = visibleProducts.length === 0;
}

function saveCart() {
  try {
    localStorage.setItem('kish-kids-demo-cart', JSON.stringify(cart));
  } catch {
    // Keep the cart usable for this visit if browser storage is unavailable.
  }
}

function renderCart() {
  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
  document.querySelectorAll('.cart-count').forEach((counter) => { counter.textContent = totalQuantity; });
  document.querySelector('.cart-trigger').setAttribute('aria-label', `Open cart, ${totalQuantity} items`);
  cartEmpty.hidden = totalQuantity > 0;
  cartFooter.hidden = totalQuantity === 0;
  cartItems.innerHTML = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    if (!product) return '';
    return `<article class="cart-item"><img src="${product.image}" alt="" /><div class="cart-item-info"><h3>${product.name}</h3><strong>${formatPrice(product.price)}</strong><div class="quantity-control"><button type="button" data-quantity-change="-1" data-product-id="${product.id}" aria-label="Remove one ${product.name}">−</button><span>${item.quantity}</span><button type="button" data-quantity-change="1" data-product-id="${product.id}" aria-label="Add one ${product.name}">+</button></div></div><button class="remove-item" type="button" data-remove-product="${product.id}" aria-label="Remove ${product.name} from bag">×</button></article>`;
  }).join('');
  cartFooter.querySelector('.cart-subtotal strong').textContent = formatPrice(totalPrice);
  saveCart();
}

function openCart() {
  cartOverlay.hidden = false;
  cartDrawer.classList.add('is-open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-open');
  document.querySelector('.cart-close').focus();
}

function closeCart() {
  cartDrawer.classList.remove('is-open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  cartOverlay.hidden = true;
  document.body.classList.remove('cart-open');
  document.querySelector('.cart-trigger').focus();
}

function addToCart(id) {
  const item = cart.find((entry) => entry.id === id);
  if (item) item.quantity += 1;
  else cart.push({ id, quantity: 1 });
  renderCart();
  openCart();
}

grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add-product]');
  if (button) addToCart(button.dataset.addProduct);
});

categoryFilters.addEventListener('click', (event) => {
  const filter = event.target.closest('[data-category]');
  if (!filter) return;
  activeCategory = filter.dataset.category;
  categoryFilters.querySelectorAll('.category-tab').forEach((button) => {
    const isActive = button === filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  renderProducts();
});

searchField.addEventListener('input', renderProducts);
document.querySelector('.catalog-reset').addEventListener('click', () => {
  activeCategory = 'all';
  searchField.value = '';
  categoryFilters.querySelectorAll('.category-tab').forEach((button) => {
    const isActive = button.dataset.category === 'all';
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  renderProducts();
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchField.focus();
  }
  if (event.key === 'Escape' && cartDrawer.classList.contains('is-open')) closeCart();
});

cartItems.addEventListener('click', (event) => {
  const quantityButton = event.target.closest('[data-quantity-change]');
  const removeButton = event.target.closest('[data-remove-product]');
  if (quantityButton) {
    const item = cart.find((entry) => entry.id === quantityButton.dataset.productId);
    if (!item) return;
    item.quantity += Number(quantityButton.dataset.quantityChange);
    cart = cart.filter((entry) => entry.quantity > 0);
    renderCart();
  }
  if (removeButton) {
    cart = cart.filter((entry) => entry.id !== removeButton.dataset.removeProduct);
    renderCart();
  }
});

document.querySelector('.cart-trigger').addEventListener('click', openCart);
document.querySelector('.cart-close').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
document.querySelector('.continue-shopping').addEventListener('click', closeCart);
document.querySelector('.checkout-button').addEventListener('click', () => {
  const store = document.querySelector('#checkout-store').value;
  const phone = store === 'ruiru' ? '254110662301' : '254141848233';
  const storeName = store === 'ruiru' ? 'Ruiru' : 'Westlands';
  const lines = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return `${item.quantity} x ${product.name} — ${formatPrice(product.price * item.quantity)}`;
  });
  const total = cart.reduce((sum, item) => sum + products.find((product) => product.id === item.id).price * item.quantity, 0);
  const message = `Hi Kish Kids ${storeName}! I’d like to ask about these items:\n${lines.join('\n')}\nDemo basket total: ${formatPrice(total)}. Please confirm availability and delivery.`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
});

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  navigation.classList.toggle('is-open', !isOpen);
});
navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    navigation.classList.remove('is-open');
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();
categoryFilters.querySelectorAll('.category-tab').forEach((button) => {
  const isActive = button.dataset.category === activeCategory;
  button.classList.toggle('is-active', isActive);
  button.setAttribute('aria-pressed', String(isActive));
});
renderProducts();
renderCart();

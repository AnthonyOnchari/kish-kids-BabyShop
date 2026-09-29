const products = window.kishKidsProducts;

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const cartDrawer = document.querySelector('.cart-drawer');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItems = document.querySelector('.cart-items');
const cartEmpty = document.querySelector('.cart-empty');
const cartFooter = document.querySelector('.cart-footer');
const numberFormat = new Intl.NumberFormat('en-KE');
let activeCategory = 'all';
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
  const visibleProducts = activeCategory === 'all'
    ? products.slice(0, 4)
    : products.filter((product) => product.category === activeCategory);

  document.getElementById('product-grid').innerHTML = visibleProducts.map((product) => `
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
}

function saveCart() {
  try {
    localStorage.setItem('kish-kids-demo-cart', JSON.stringify(cart));
  } catch {
    // The bag remains usable for this visit if browser storage is unavailable.
  }
}

function renderCart() {
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  document.querySelectorAll('.cart-count').forEach((counter) => {
    counter.textContent = totalQuantity;
  });
  document.querySelector('.cart-trigger').setAttribute('aria-label', `Open shopping bag, ${totalQuantity} items`);
  cartEmpty.hidden = totalQuantity > 0;
  cartFooter.hidden = totalQuantity === 0;
  cartItems.innerHTML = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    if (!product) return '';
    return `<article class="cart-item">
      <img src="${product.image}" alt="" />
      <div class="cart-item-info"><h3>${product.name}</h3><strong>${formatPrice(product.price)}</strong><div class="quantity-control"><button type="button" data-quantity-change="-1" data-product-id="${product.id}" aria-label="Remove one ${product.name}">−</button><span>${item.quantity}</span><button type="button" data-quantity-change="1" data-product-id="${product.id}" aria-label="Add one ${product.name}">+</button></div></div>
      <button class="remove-item" type="button" data-remove-product="${product.id}" aria-label="Remove ${product.name} from bag">×</button>
    </article>`;
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

function addToCart(productId) {
  const item = cart.find((entry) => entry.id === productId);
  if (item) item.quantity += 1;
  else cart.push({ id: productId, quantity: 1 });
  renderCart();
  openCart();
}

document.querySelector('.product-grid').addEventListener('click', (event) => {
  const button = event.target.closest('[data-add-product]');
  if (button) addToCart(button.dataset.addProduct);
});

document.querySelector('.category-tabs').addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  activeCategory = button.dataset.category;
  document.querySelectorAll('.category-tab').forEach((tab) => {
    const isActive = tab === button;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-pressed', String(isActive));
  });
  renderProducts();
});

document.querySelectorAll('[data-shop-category]').forEach((link) => {
  link.addEventListener('click', () => {
    activeCategory = link.dataset.shopCategory;
    document.querySelectorAll('.category-tab').forEach((tab) => {
      const isActive = tab.dataset.category === activeCategory;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-pressed', String(isActive));
    });
    renderProducts();
  });
});

const reviewViewport = document.querySelector('.review-viewport');
let reviewPauseUntil = 0;
let reviewLastFrame = 0;
let reviewDirection = 1;
let reviewPosition = reviewViewport.scrollLeft;
let reviewWasPaused = false;
function scrollReviews(timestamp) {
  const isPaused = document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches || reviewViewport.matches(':hover') || reviewViewport.contains(document.activeElement) || timestamp <= reviewPauseUntil;
  if (isPaused) {
    reviewWasPaused = true;
  } else if (reviewLastFrame && timestamp - reviewLastFrame > 0) {
    if (reviewWasPaused) reviewPosition = reviewViewport.scrollLeft;
    reviewWasPaused = false;
    const elapsed = Math.min(timestamp - reviewLastFrame, 48);
    const maxScroll = reviewViewport.scrollWidth - reviewViewport.clientWidth;
    if (maxScroll > 0) {
      const nextPosition = reviewPosition + elapsed * 0.035 * reviewDirection;
      if (nextPosition >= maxScroll) {
        reviewPosition = maxScroll;
        reviewViewport.scrollLeft = reviewPosition;
        reviewDirection = -1;
      } else if (nextPosition <= 0) {
        reviewPosition = 0;
        reviewViewport.scrollLeft = reviewPosition;
        reviewDirection = 1;
      } else {
        reviewPosition = nextPosition;
        reviewViewport.scrollLeft = reviewPosition;
      }
    }
  }
  reviewLastFrame = timestamp;
  window.requestAnimationFrame(scrollReviews);
}
window.requestAnimationFrame(scrollReviews);
reviewViewport.addEventListener('pointerdown', () => { reviewPauseUntil = performance.now() + 3500; });
reviewViewport.addEventListener('focusin', () => { reviewPauseUntil = performance.now() + 3500; });

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
document.querySelector('.continue-shopping').addEventListener('click', () => {
  closeCart();
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
});

document.querySelector('.checkout-button').addEventListener('click', () => {
  const store = document.getElementById('checkout-store').value;
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

document.querySelectorAll('[data-review-direction]').forEach((button) => {
  button.addEventListener('click', () => {
    const firstCard = reviewViewport.querySelector('.review-card');
    const gap = Number.parseFloat(getComputedStyle(reviewViewport.querySelector('.review-cards')).columnGap) || 16;
    const direction = Number(button.dataset.reviewDirection);
    reviewDirection = direction;
    reviewViewport.scrollBy({ left: (firstCard.getBoundingClientRect().width + gap) * direction, behavior: 'smooth' });
    reviewPauseUntil = performance.now() + 3500;
  });
});

const chatModal = document.querySelector('.chat-modal');
const chatBackdrop = document.querySelector('.chat-backdrop');
const chatTrigger = document.querySelector('.floating-whatsapp');
const chatFollowup = document.querySelector('.chat-followup');
const chatOptions = document.querySelector('.chat-options');

function openChat() {
  chatBackdrop.hidden = false;
  chatModal.hidden = false;
  requestAnimationFrame(() => {
    chatBackdrop.classList.add('is-visible');
    chatModal.classList.add('is-visible');
  });
  chatModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('chat-open');
  chatModal.querySelector('.chat-close').focus();
}

function closeChat() {
  chatBackdrop.classList.remove('is-visible');
  chatModal.classList.remove('is-visible');
  chatModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('chat-open');
  window.setTimeout(() => {
    chatBackdrop.hidden = true;
    chatModal.hidden = true;
  }, 240);
  chatTrigger.focus();
}

chatTrigger.addEventListener('click', openChat);
chatModal.querySelector('.chat-close').addEventListener('click', closeChat);
chatBackdrop.addEventListener('click', closeChat);
chatModal.querySelector('.chat-back').addEventListener('click', () => {
  chatFollowup.hidden = true;
  chatOptions.hidden = false;
});

const chatResponses = {
  products: 'We have little finds for clothing, toys, baby care and gifts. Browse the shop here, or tell us what you are looking for and our team can help.',
  stores: 'You can visit us at Ambience Mall in Westlands or Gichero Mall in Ruiru. Choose your nearest branch below if you would like to chat on WhatsApp.',
  delivery: 'We can help with delivery enquiries. Tell us what you are looking for and where it needs to go, and our team will confirm the details on WhatsApp.'
};

document.querySelectorAll('[data-chat-topic]').forEach((button) => {
  button.addEventListener('click', () => {
    chatFollowup.textContent = chatResponses[button.dataset.chatTopic];
    chatFollowup.hidden = false;
    chatOptions.hidden = true;
  });
});

document.querySelector('.chat-assistant-button').addEventListener('click', () => {
  chatFollowup.textContent = 'Great, I am here to help! Choose one of the options above, or browse our little finds in the shop. Our WhatsApp team can also confirm stock and delivery.';
  chatFollowup.hidden = false;
  chatOptions.hidden = false;
});

document.querySelector('.chat-whatsapp-button').addEventListener('click', () => {
  const store = document.querySelector('#chat-store').value;
  const phone = store === 'ruiru' ? '254110662301' : '254141848233';
  const storeName = store === 'ruiru' ? 'Ruiru' : 'Westlands';
  const message = `Hi Kish Kids ${storeName}! I would like to ask about your products, store or delivery. Can you help me please?`;
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

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && cartDrawer.classList.contains('is-open')) closeCart();
  if (event.key === 'Escape' && chatModal.classList.contains('is-visible')) closeChat();
  if (event.key === 'Tab' && chatModal.classList.contains('is-visible')) {
    const focusable = [...chatModal.querySelectorAll('button:not([disabled]), select')].filter((element) => !element.closest('[hidden]'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

document.querySelectorAll('.brand-avatar').forEach((avatar) => {
  avatar.addEventListener('error', () => avatar.remove());
});

document.getElementById('year').textContent = new Date().getFullYear();
document.querySelectorAll('.category-tab').forEach((tab) => tab.setAttribute('aria-pressed', String(tab.classList.contains('is-active'))));
renderProducts();
renderCart();

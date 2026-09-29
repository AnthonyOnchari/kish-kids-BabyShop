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
    ? products.slice(0, 5)
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
  document.querySelector('.cart-trigger').setAttribute('aria-label', `Open cart, ${totalQuantity} items`);
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
const reviewTrack = reviewViewport.querySelector('.review-cards');
const originalReviewCards = [...reviewTrack.querySelectorAll('.review-card')];
originalReviewCards.forEach((card) => {
  const clone = card.cloneNode(true);
  clone.classList.add('review-card-clone');
  clone.setAttribute('aria-hidden', 'true');
  reviewTrack.append(clone);
});
let reviewPauseUntil = 0;
let reviewLastFrame = 0;
let reviewPosition = reviewViewport.scrollLeft;
let reviewWasPaused = false;

function getReviewLoopWidth() {
  const firstClone = reviewTrack.querySelector('.review-card-clone');
  const firstCard = reviewTrack.querySelector('.review-card:not(.review-card-clone)');
  return firstClone && firstCard ? firstClone.offsetLeft - firstCard.offsetLeft : 0;
}

function scrollReviews(timestamp) {
  const isPaused = document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches || reviewViewport.matches(':hover') || reviewViewport.contains(document.activeElement) || timestamp <= reviewPauseUntil;
  if (isPaused) {
    reviewWasPaused = true;
  } else if (reviewLastFrame && timestamp - reviewLastFrame > 0) {
    if (reviewWasPaused) reviewPosition = reviewViewport.scrollLeft;
    reviewWasPaused = false;
    const elapsed = Math.min(timestamp - reviewLastFrame, 48);
    const loopWidth = getReviewLoopWidth();
    if (loopWidth > 0) {
      reviewPosition += elapsed * 0.035;
      if (reviewPosition >= loopWidth) reviewPosition -= loopWidth;
      reviewViewport.scrollLeft = reviewPosition;
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
    const gap = Number.parseFloat(getComputedStyle(reviewTrack).columnGap) || 16;
    const step = (firstCard.getBoundingClientRect().width + gap) * Number(button.dataset.reviewDirection);
    const loopWidth = getReviewLoopWidth();
    reviewViewport.scrollBy({ left: step, behavior: 'smooth' });
    if (step < 0 && reviewViewport.scrollLeft <= 0 && loopWidth > 0) reviewViewport.scrollLeft = loopWidth - 1;
    reviewPauseUntil = performance.now() + 3500;
  });
});

const chatModal = document.querySelector('.chat-modal');
const chatBackdrop = document.querySelector('.chat-backdrop');
const chatTrigger = document.querySelector('.floating-whatsapp');
const chatFollowup = document.querySelector('.chat-followup');
const chatOptions = document.querySelector('.chat-options');
const chatApp = document.querySelector('.chat-app');
const chatContent = document.querySelector('.chat-content');
const chatActions = document.querySelector('.chat-modal-actions');
const chatComposer = document.querySelector('.chat-composer');
const chatReplyInput = document.querySelector('#chat-reply');
const chatSendButton = chatComposer.querySelector('button[type="submit"]');
const chatAssistantNote = document.querySelector('.chat-assistant-note');
const whatsappHandoff = document.querySelector('.whatsapp-handoff');
const chatStatus = document.querySelector('.chat-brand-details small');
const chatOpenTimers = [];
let chatCloseTimer = 0;
let chatPendingField = '';
let chatProductInterest = '';
let chatCustomerSize = '';
let chatCustomerName = '';
let chatTranscript = [];
let chatNeedsHandoffConfirmation = false;

function setChatStatus(message) {
  chatStatus.lastChild.textContent = ` ${message}`;
}

function openChat() {
  window.clearTimeout(chatCloseTimer);
  chatCloseTimer = 0;
  chatOpenTimers.forEach(window.clearTimeout);
  chatOpenTimers.length = 0;
  chatApp.hidden = true;
  chatPendingField = '';
  chatProductInterest = '';
  chatCustomerSize = '';
  chatCustomerName = '';
  chatTranscript = [];
  chatNeedsHandoffConfirmation = false;
  chatContent.querySelectorAll('.user-chat-message, .assistant-chat-reply, .assistant-typing').forEach((message) => message.remove());
  chatFollowup.hidden = true;
  chatFollowup.textContent = '';
  document.querySelector('.chat-step-guide').hidden = false;
  document.querySelector('.chat-options-label').hidden = false;
  chatOptions.hidden = false;
  chatContent.scrollTop = 0;
  chatContent.hidden = false;
  chatActions.hidden = false;
  chatComposer.hidden = false;
  chatAssistantNote.hidden = false;
  whatsappHandoff.hidden = true;
  chatReplyInput.value = '';
  chatSendButton.disabled = true;
  document.querySelector('#chat-title').textContent = 'Kish Kids';
  setChatStatus('Here to help');
  chatModal.classList.remove('is-screen-on', 'is-chat-ready');
  chatModal.classList.add('is-powering-on');
  chatBackdrop.hidden = false;
  chatModal.hidden = false;
  requestAnimationFrame(() => {
    chatBackdrop.classList.add('is-visible');
    chatModal.classList.add('is-visible');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const logoDelay = reduceMotion ? 0 : 320;
    const chatDelay = 2500;
    chatOpenTimers.push(window.setTimeout(() => chatModal.classList.add('is-screen-on'), logoDelay));
    chatOpenTimers.push(window.setTimeout(() => {
      chatApp.hidden = false;
      requestAnimationFrame(() => {
        chatModal.classList.add('is-chat-ready');
        chatModal.querySelector('.chat-close').focus();
      });
    }, chatDelay));
  });
  chatModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('chat-open');
  chatModal.querySelector('.phone-frame').focus();
}

function closeChat() {
  chatOpenTimers.forEach(window.clearTimeout);
  chatOpenTimers.length = 0;
  chatBackdrop.classList.remove('is-visible');
  chatModal.classList.remove('is-visible');
  chatModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('chat-open');
  window.clearTimeout(chatCloseTimer);
  chatCloseTimer = window.setTimeout(() => {
    chatBackdrop.hidden = true;
    chatModal.hidden = true;
    chatApp.hidden = true;
    chatModal.classList.remove('is-powering-on', 'is-screen-on', 'is-chat-ready');
    chatCloseTimer = 0;
  }, 240);
  chatTrigger.focus();
}

chatTrigger.addEventListener('click', openChat);
chatModal.querySelector('.chat-close').addEventListener('click', closeChat);
chatBackdrop.addEventListener('click', closeChat);
function showAssistantChat() {
  if (!whatsappHandoff.hidden) {
    whatsappHandoff.hidden = true;
    chatContent.hidden = false;
    chatActions.hidden = false;
    chatComposer.hidden = false;
    chatAssistantNote.hidden = false;
    document.querySelector('#chat-title').textContent = 'Kish Kids';
    setChatStatus('Here to help');
  }
  const hasConversation = chatContent.querySelector('.user-chat-message');
  chatFollowup.hidden = true;
  document.querySelector('.chat-step-guide').hidden = Boolean(hasConversation);
  document.querySelector('.chat-options-label').hidden = false;
  chatOptions.hidden = false;
}

chatModal.querySelector('.chat-back').addEventListener('click', showAssistantChat);
chatModal.querySelector('.handoff-back').addEventListener('click', showAssistantChat);

const chatResponses = {
  products: 'What are you looking for: a romper, dress, or another little outfit? Tell me the item and size and I will add it to your message.',
  stores: 'You can visit us at Ambience Mall in Westlands or Gichero Mall in Ruiru. Choose your nearest branch below if you would like to chat on WhatsApp.',
  delivery: 'We can help with delivery enquiries. Tell us what you are looking for and where it needs to go, and our team will confirm the details on WhatsApp.'
};

function cleanProductInterest(message) {
  return message.trim()
    .replace(/^(do you have|have you got|can i get|i need|i want|looking for|show me|find me)\s+/i, '')
    .replace(/[?!.]+$/, '')
    .trim() || message.trim();
}

function getDemoReply(message) {
  const query = message.toLocaleLowerCase();
  if (chatPendingField === 'size') {
    chatCustomerSize = message.trim();
    chatPendingField = 'name';
    return `Got it — ${chatCustomerSize}. What name should I put on your enquiry?`;
  }
  if (chatPendingField === 'name') {
    chatCustomerName = message.trim().replace(/^(my name is|name is|i am|i'm)\s+/i, '').slice(0, 60);
    if (!chatCustomerName) return 'Please type the name you would like us to use for your enquiry.';
    chatPendingField = '';
    chatNeedsHandoffConfirmation = true;
    return `Thanks, ${chatCustomerName}! I have ${chatProductInterest || 'your item'} in size ${chatCustomerSize}. Would you like me to send this chat to our WhatsApp team?`;
  }
  if (chatPendingField === 'product') {
    chatProductInterest = cleanProductInterest(message);
    chatPendingField = 'size';
    const sizeMatch = query.match(/\b(?:size\s*)?(newborn|\d{1,2}(?:\s*[-/]\s*\d{1,2})?)\b/i);
    if (sizeMatch) {
      chatCustomerSize = sizeMatch[1];
      chatPendingField = 'name';
      return `I have noted ${chatProductInterest} in size ${chatCustomerSize}. What name should I put on your enquiry?`;
    }
    return `I can help with ${chatProductInterest}. What size or age are you looking for?`;
  }
  if (/dress|romper|onesie|clothes|clothing|outfit|size|age/.test(query)) {
    chatProductInterest = cleanProductInterest(message);
    const sizeMatch = query.match(/\b(?:size\s*)?(newborn|\d{1,2}(?:\s*[-/]\s*\d{1,2})?)\b/i);
    if (sizeMatch) {
      chatCustomerSize = sizeMatch[1];
      chatPendingField = 'name';
      return `I can help with that. I have ${chatProductInterest} in size ${chatCustomerSize}. What name should I put on your enquiry?`;
    }
    chatPendingField = 'size';
    return `I can help with little outfits. What size or age do you need for ${chatProductInterest}?`;
  }
  if (/blanket|swaddle|care|newborn|sleep/.test(query)) {
    return 'For baby-care essentials, we have cosy blanket and swaddle ideas. Tell me what you need, and the Westlands or Ruiru team can confirm current availability.';
  }
  if (/gift|present|hamper/.test(query)) {
    return 'We would love to help you find a gift. Are you shopping for a newborn, a birthday, or another special little moment?';
  }
  if (/delivery|deliver|send|shipping/.test(query)) {
    return 'For delivery, tell us your area and what you would like to order. The team will confirm delivery options and any charges on WhatsApp.';
  }
  if (/where|location|store|westlands|ruiru|mall|address/.test(query)) {
    return 'You can visit us at Ambience Mall in Westlands or Gichero Mall in Ruiru. Choose your nearest store below and continue on WhatsApp for directions or availability.';
  }
  return 'Thanks for your message! I can help with clothing, baby care, gifts, delivery or store locations. Choose a topic above, or continue on WhatsApp to speak with the Kish Kids team.';
}

function openWhatsAppHandoff() {
  const store = document.querySelector('#chat-store').value;
  const phone = store === 'ruiru' ? '254110662301' : '254141848233';
  const storeName = store === 'ruiru' ? 'Ruiru' : 'Westlands';
  const details = [
    chatCustomerName ? `Customer name: ${chatCustomerName}` : '',
    chatProductInterest ? `Looking for: ${chatProductInterest}` : '',
    chatCustomerSize ? `Size: ${chatCustomerSize}` : '',
  ].filter(Boolean);
  const conversation = chatTranscript.slice(-8).map((turn) => `${turn.role}: ${turn.text.slice(0, 180)}`);
  const message = [
    `Hi Kish Kids ${storeName}! Please help me with my enquiry.`,
    ...details,
    conversation.length ? `Chat so far:\n${conversation.join('\n')}` : '',
  ].filter(Boolean).join('\n\n');
  document.querySelector('.handoff-store-name').textContent = storeName;
  document.querySelector('.handoff-message').textContent = message;
  document.querySelector('.handoff-open-link').href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  chatContent.hidden = true;
  chatActions.hidden = true;
  chatComposer.hidden = true;
  chatAssistantNote.hidden = true;
  whatsappHandoff.hidden = false;
  setChatStatus('WhatsApp handoff');
  whatsappHandoff.querySelector('.handoff-open-link').focus();
}

chatReplyInput.addEventListener('input', () => {
  chatSendButton.disabled = !chatReplyInput.value.trim();
});

chatComposer.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = chatReplyInput.value.trim();
  if (!message) return;

  chatTranscript.push({ role: 'You', text: message });
  chatReplyInput.value = '';
  chatSendButton.disabled = true;
  document.querySelector('.chat-step-guide').hidden = true;
  document.querySelector('.chat-options-label').hidden = true;
  chatOptions.hidden = true;

  const userBubble = document.createElement('div');
  userBubble.className = 'chat-message user-chat-message';
  userBubble.textContent = message;
  chatContent.append(userBubble);

  const typing = document.createElement('div');
  typing.className = 'assistant-typing';
  typing.setAttribute('role', 'status');
  typing.setAttribute('aria-label', 'Kish Kids assistant is typing');
  typing.innerHTML = '<i></i><i></i><i></i>';
  chatContent.append(typing);
  chatContent.scrollTop = chatContent.scrollHeight;

  window.setTimeout(() => {
    typing.remove();
    const replyText = getDemoReply(message);
    chatTranscript.push({ role: 'Kish Kids', text: replyText });
    const reply = document.createElement('div');
    reply.className = 'chat-message bot-message assistant-chat-reply';
    reply.textContent = replyText;
    chatContent.append(reply);
    if (chatNeedsHandoffConfirmation) {
      const confirmation = document.createElement('button');
      confirmation.className = 'whatsapp-confirmation';
      confirmation.type = 'button';
      confirmation.textContent = 'Okay — send this chat to WhatsApp';
      confirmation.addEventListener('click', openWhatsAppHandoff);
      chatContent.append(confirmation);
      chatNeedsHandoffConfirmation = false;
    }
    chatContent.scrollTop = chatContent.scrollHeight;
  }, 650);
});

document.querySelectorAll('[data-chat-topic]').forEach((button) => {
  button.addEventListener('click', () => {
    chatFollowup.textContent = chatResponses[button.dataset.chatTopic];
    chatFollowup.hidden = false;
    chatOptions.hidden = true;
    chatTranscript.push({ role: 'Kish Kids', text: chatResponses[button.dataset.chatTopic] });
    if (button.dataset.chatTopic === 'products') chatPendingField = 'product';
  });
});

document.querySelector('.chat-assistant-button').addEventListener('click', () => {
  chatFollowup.textContent = 'Great, I am here to help! Choose one of the options above or type your question below. Our WhatsApp team can also confirm stock and delivery.';
  chatFollowup.hidden = false;
  chatOptions.hidden = false;
  chatTranscript.push({ role: 'Kish Kids', text: chatFollowup.textContent });
});

document.querySelector('.chat-whatsapp-button').addEventListener('click', openWhatsAppHandoff);

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
    const focusable = [...chatModal.querySelectorAll('button:not([disabled]), select, a[href]')].filter((element) => !element.closest('[hidden]'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      event.preventDefault();
      chatModal.querySelector('.phone-frame').focus();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

document.querySelectorAll('.brand-avatar, .chat-brand-logo').forEach((avatar) => {
  avatar.addEventListener('error', () => avatar.remove());
});

document.getElementById('year').textContent = new Date().getFullYear();
const phoneTime = document.getElementById('phone-time');
function updatePhoneTime() {
  phoneTime.textContent = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date());
}
updatePhoneTime();
window.setInterval(updatePhoneTime, 30000);
document.querySelectorAll('.category-tab').forEach((tab) => tab.setAttribute('aria-pressed', String(tab.classList.contains('is-active'))));
renderProducts();
renderCart();

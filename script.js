/* BarTab: alle data blijft lokaal in deze browser. Bedragen worden als centen bewaard. */
const STORAGE_KEY = 'bartab-state-v1';
const DEFAULT_DRINKS = [
  { id: 'beer', name: 'Bier', price: 300 }, { id: 'wine', name: 'Wijn', price: 450 },
  { id: 'soft', name: 'Frisdrank', price: 275 }, { id: 'water', name: 'Water', price: 200 },
  { id: 'coffee', name: 'Koffie', price: 250 }, { id: 'special', name: 'Speciaalbier', price: 500 }
];
let state = loadState();
let activeTabId = null;
let modalMode = null;
let modalDrinkId = null;
let toastTimer;

const $ = (selector) => document.querySelector(selector);
const formatMoney = (cents) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.tabs) && Array.isArray(saved.drinks)) return saved;
  } catch (error) { console.warn('Opgeslagen BarTab-data kon niet worden gelezen.', error); }
  return { tabs: [], drinks: DEFAULT_DRINKS };
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function showView(viewId) { document.querySelectorAll('.view').forEach((view) => view.classList.toggle('is-hidden', view.id !== viewId)); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400); }
function getActiveTab() { return state.tabs.find((tab) => tab.id === activeTabId); }
function tabTotal(tab) { return tab.items.reduce((total, item) => total + item.price * item.quantity, 0); }
function itemCount(tab) { return tab.items.reduce((total, item) => total + item.quantity, 0); }

function renderHome() {
  const list = $('#tabs-list'); list.innerHTML = '';
  $('#tab-count').textContent = state.tabs.length;
  $('#empty-state').classList.toggle('is-hidden', state.tabs.length > 0);
  state.tabs.forEach((tab) => {
    const card = document.createElement('button'); card.className = 'tab-card'; card.dataset.tabId = tab.id;
    card.innerHTML = `<div class="tab-card-top"><h3>${escapeHtml(tab.name)}</h3><span aria-hidden="true">›</span></div><div><div class="tab-card-total">${formatMoney(tabTotal(tab))}</div><div class="tab-card-meta">${itemCount(tab)} ${itemCount(tab) === 1 ? 'item' : 'items'}</div></div>`;
    list.appendChild(card);
  });
}
function renderTab() {
  const tab = getActiveTab(); if (!tab) return showView('home-view');
  $('#tab-title').textContent = tab.name; $('#tab-total').textContent = formatMoney(tabTotal(tab)); $('#order-count').textContent = `${itemCount(tab)} ${itemCount(tab) === 1 ? 'item' : 'items'}`;
  const drinks = $('#drinks-list'); drinks.innerHTML = '';
  state.drinks.forEach((drink) => { const button = document.createElement('button'); button.className = 'drink-button'; button.dataset.drinkId = drink.id; button.innerHTML = `<span class="drink-name">${escapeHtml(drink.name)}</span><span class="drink-price">${formatMoney(drink.price)}</span>`; drinks.appendChild(button); });
  const orders = $('#order-list'); orders.innerHTML = '';
  if (!tab.items.length) { orders.innerHTML = '<p class="empty-order">Nog niets besteld. Tik hierboven op een drank.</p>'; return; }
  tab.items.forEach((item) => { const row = document.createElement('div'); row.className = 'order-row'; row.innerHTML = `<div class="order-name">${escapeHtml(item.name)}</div><div class="order-price">${formatMoney(item.price * item.quantity)}</div><div class="quantity-controls"><button data-item-action="decrease" data-item-id="${item.id}" aria-label="Een ${escapeHtml(item.name)} minder">−</button><span>${item.quantity}</span><button data-item-action="increase" data-item-id="${item.id}" aria-label="Een ${escapeHtml(item.name)} meer">＋</button></div>`; orders.appendChild(row); });
}
function renderSettings() {
  const list = $('#settings-list'); list.innerHTML = '';
  state.drinks.forEach((drink) => { const row = document.createElement('div'); row.className = 'setting-row'; row.innerHTML = `<strong>${escapeHtml(drink.name)}</strong><span class="setting-price">${formatMoney(drink.price)}</span><button class="small-button" data-drink-action="edit" data-drink-id="${drink.id}" aria-label="${escapeHtml(drink.name)} bewerken">✎</button><button class="small-button danger" data-drink-action="delete" data-drink-id="${drink.id}" aria-label="${escapeHtml(drink.name)} verwijderen">×</button>`; list.appendChild(row); });
}
function renderAll() { renderHome(); renderTab(); renderSettings(); }
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }
function openModal(mode, drink = null) { modalMode = mode; modalDrinkId = drink?.id ?? null; $('#modal').classList.remove('is-hidden'); $('#modal-title').textContent = mode === 'new-tab' ? 'Nieuwe tab' : mode === 'custom-item' ? 'Eigen item' : drink ? 'Drank bewerken' : 'Drank toevoegen'; $('#name-label').textContent = mode === 'new-tab' ? 'Naam of tafelnummer' : 'Naam'; $('#modal-name').value = mode === 'edit-drink' ? drink.name : ''; $('#price-label').classList.toggle('is-hidden', mode === 'new-tab'); $('#modal-price').classList.toggle('is-hidden', mode === 'new-tab'); $('#modal-price').value = mode === 'edit-drink' ? (drink.price / 100).toFixed(2).replace('.', ',') : ''; $('#modal-name').focus(); }
function closeModal() { $('#modal').classList.add('is-hidden'); modalMode = null; modalDrinkId = null; }
function parsePrice(value) { const normalized = String(value).trim().replace(',', '.'); const number = Number.parseFloat(normalized); return Number.isFinite(number) && number > 0 ? Math.round(number * 100) : null; }
function addDrinkToTab(drink) { const tab = getActiveTab(); const existing = tab.items.find((item) => item.drinkId === drink.id && item.name === drink.name && item.price === drink.price); if (existing) existing.quantity += 1; else tab.items.push({ id: makeId('item'), drinkId: drink.id, name: drink.name, price: drink.price, quantity: 1 }); saveState(); renderTab(); }
function submitModal(event) { event.preventDefault(); const name = $('#modal-name').value.trim(); if (!name) return;
  if (modalMode === 'new-tab') { const tab = { id: makeId('tab'), name, items: [], createdAt: Date.now() }; state.tabs.push(tab); activeTabId = tab.id; saveState(); closeModal(); renderAll(); showView('tab-view'); return; }
  const price = parsePrice($('#modal-price').value); if (!price) return showToast('Vul een geldige prijs in.');
  if (modalMode === 'custom-item') { addDrinkToTab({ id: makeId('custom'), name, price }); closeModal(); showToast('Item toegevoegd.'); return; }
  if (modalMode === 'add-drink') { state.drinks.push({ id: makeId('drink'), name, price }); } else if (modalMode === 'edit-drink') { const drink = state.drinks.find((item) => item.id === modalDrinkId); if (drink) { drink.name = name; drink.price = price; } }
  saveState(); closeModal(); renderAll();
}
function updateQuantity(itemId, delta) { const tab = getActiveTab(); const item = tab.items.find((entry) => entry.id === itemId); if (!item) return; item.quantity += delta; if (item.quantity <= 0) tab.items = tab.items.filter((entry) => entry.id !== itemId); saveState(); renderTab(); }

document.addEventListener('click', (event) => {
  const actionElement = event.target.closest('[data-action]'); const tabCard = event.target.closest('[data-tab-id]'); const drinkButton = event.target.closest('[data-drink-id]'); const itemAction = event.target.closest('[data-item-action]'); const drinkAction = event.target.closest('[data-drink-action]');
  if (actionElement) { const action = actionElement.dataset.action; if (action === 'new-tab') openModal('new-tab'); if (action === 'custom-item') openModal('custom-item'); if (action === 'add-drink') openModal('add-drink'); if (action === 'close-modal') closeModal(); if (action === 'home') { renderHome(); showView('home-view'); } if (action === 'settings') { renderSettings(); showView('settings-view'); } if (action === 'rename-tab') openModal('rename-tab'); if (action === 'checkout') { if (confirm('Deze tab afrekenen en sluiten?')) { state.tabs = state.tabs.filter((tab) => tab.id !== activeTabId); activeTabId = null; saveState(); renderHome(); showView('home-view'); showToast('Tab afgesloten.'); } } }
  if (tabCard) { activeTabId = tabCard.dataset.tabId; renderTab(); showView('tab-view'); }
  if (drinkButton && !drinkButton.closest('.tab-card')) { const drink = state.drinks.find((item) => item.id === drinkButton.dataset.drinkId); if (drink) addDrinkToTab(drink); }
  if (itemAction) updateQuantity(itemAction.dataset.itemId, itemAction.dataset.itemAction === 'increase' ? 1 : -1);
  if (drinkAction) { const drink = state.drinks.find((item) => item.id === drinkAction.dataset.drinkId); if (!drink) return; if (drinkAction.dataset.drinkAction === 'edit') { openModal('edit-drink', drink); } else if (confirm(`'${drink.name}' verwijderen uit de vaste lijst?`)) { state.drinks = state.drinks.filter((item) => item.id !== drink.id); saveState(); renderAll(); } }
});
$('#modal-form').addEventListener('submit', (event) => { if (modalMode === 'rename-tab') { event.preventDefault(); const name = $('#modal-name').value.trim(); const tab = getActiveTab(); if (name && tab) { tab.name = name; saveState(); renderAll(); closeModal(); } return; } submitModal(event); });
$('#modal').addEventListener('click', (event) => { if (event.target.id === 'modal') closeModal(); });
renderAll();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch((error) => console.warn('Offline-modus kon niet worden geactiveerd.', error)));

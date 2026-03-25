/**
 * Header Component
 * Price info, timeframe selection, exchange switching
 */

export class Header {
  constructor({ onTimeframeChange, onExchangeChange }) {
    this.onTimeframeChange = onTimeframeChange;
    this.onExchangeChange = onExchangeChange;
    this.currentTimeframe = '1h';
    this.currentExchange = 'binance';

    this._bindElements();
    this._bindEvents();
  }

  _bindElements() {
    this.pairEl = document.getElementById('current-pair');
    this.exchangeBadge = document.getElementById('current-exchange-badge');
    this.priceEl = document.getElementById('current-price');
    this.changeEl = document.getElementById('price-change');
    this.tfButtons = document.getElementById('timeframe-buttons');
    this.exchangeSwitcher = document.getElementById('exchange-switcher');
  }

  _bindEvents() {
    // Timeframe buttons
    this.tfButtons.addEventListener('click', (e) => {
      const btn = e.target.closest('.tf-btn');
      if (!btn || btn.classList.contains('active')) return;

      this.tfButtons.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.currentTimeframe = btn.dataset.tf;

      if (this.onTimeframeChange) {
        this.onTimeframeChange(this.currentTimeframe);
      }
    });

    // Exchange switcher
    this.exchangeSwitcher.addEventListener('click', (e) => {
      const btn = e.target.closest('.exchange-btn');
      if (!btn || btn.classList.contains('active')) return;

      this.exchangeSwitcher.querySelectorAll('.exchange-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.currentExchange = btn.dataset.exchange;

      if (this.onExchangeChange) {
        this.onExchangeChange(this.currentExchange);
      }
    });
  }

  /**
   * Update pair info in header
   */
  setPair(displayName, exchange) {
    this.pairEl.textContent = displayName;
    this.exchangeBadge.textContent = exchange === 'binance' ? 'Binance' : 'OKX';
    this.exchangeBadge.style.background = exchange === 'binance' ? '#f0b90b' : '#fff';
    this.exchangeBadge.style.color = exchange === 'binance' ? '#131722' : '#131722';
  }

  /**
   * Update current price & 24h change
   */
  updatePrice(price, changePercent) {
    if (price === null || price === undefined) {
      this.priceEl.textContent = '—';
      this.changeEl.textContent = '0.00%';
      this.changeEl.className = 'price-change neutral';
      return;
    }

    // Format price
    const priceStr = price >= 1
      ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : price.toPrecision(6);
    this.priceEl.textContent = priceStr;

    // Color based on change
    if (changePercent !== undefined && changePercent !== null) {
      const sign = changePercent >= 0 ? '+' : '';
      this.changeEl.textContent = `${sign}${changePercent.toFixed(2)}%`;
      this.changeEl.className = `price-change ${changePercent >= 0 ? 'positive' : 'negative'}`;
      this.priceEl.style.color = changePercent >= 0 ? '#26a69a' : '#ef5350';
    }
  }

  getTimeframe() {
    return this.currentTimeframe;
  }

  getExchange() {
    return this.currentExchange;
  }
}

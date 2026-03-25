/**
 * Sidebar Component
 * Pair search, filtering, and watchlist management
 */

import { getSymbolForExchange } from '../api/exchanges.js';

const WATCHLIST_KEY = 'cryptoview_watchlist';

export class Sidebar {
  constructor({ onPairSelect, getExchange }) {
    this.onPairSelect = onPairSelect;
    this.getExchange = getExchange;
    this.pairs = [];
    this.filteredPairs = [];
    this.watchlist = this._loadWatchlist();
    this.currentTab = 'watchlist';
    this.currentQuote = 'USDT';
    this.currentSymbol = null;
    this.searchQuery = '';

    this._bindElements();
    this._bindEvents();
  }

  _bindElements() {
    this.pairsList = document.getElementById('pairs-list');
    this.searchInput = document.getElementById('search-input');
    this.tabWatchlist = document.getElementById('tab-watchlist');
    this.tabAllPairs = document.getElementById('tab-all-pairs');
    this.quoteFilters = document.getElementById('quote-filters');
    this.sidebarEl = document.getElementById('sidebar');
    this.sidebarToggle = document.getElementById('sidebar-toggle');
  }

  _bindEvents() {
    // Tab switching
    this.tabWatchlist.addEventListener('click', () => this._setTab('watchlist'));
    this.tabAllPairs.addEventListener('click', () => this._setTab('all-pairs'));

    // Search
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toUpperCase();
      this._renderPairs();
    });

    // Quote filter
    this.quoteFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      this.quoteFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.currentQuote = btn.dataset.quote;
      this._renderPairs();
    });

    // Sidebar toggle
    this.sidebarToggle.addEventListener('click', () => {
      this.sidebarEl.classList.toggle('collapsed');
    });
  }

  _setTab(tab) {
    this.currentTab = tab;
    this.tabWatchlist.classList.toggle('active', tab === 'watchlist');
    this.tabAllPairs.classList.toggle('active', tab === 'all-pairs');
    this._renderPairs();
  }

  /**
   * Set pairs data from exchange API
   */
  setPairs(pairs) {
    this.pairs = pairs;
    this._renderPairs();
  }

  /**
   * Set the active pair
   */
  setActive(symbol) {
    this.currentSymbol = symbol;
    // Update active state in DOM
    this.pairsList.querySelectorAll('.pair-item').forEach(el => {
      el.classList.toggle('active', el.dataset.symbol === symbol);
    });
  }

  _getFilteredPairs() {
    let list = this.pairs;

    // Tab filter
    if (this.currentTab === 'watchlist') {
      list = list.filter(p => this.watchlist.has(this._watchlistKey(p)));
    }

    // Quote filter
    list = list.filter(p => p.quote === this.currentQuote);

    // Search filter
    if (this.searchQuery) {
      list = list.filter(p =>
        p.base.includes(this.searchQuery) ||
        p.quote.includes(this.searchQuery) ||
        p.symbol.includes(this.searchQuery)
      );
    }

    return list;
  }

  _watchlistKey(pair) {
    return `${pair.base}_${pair.quote}`;
  }

  _renderPairs() {
    const filtered = this._getFilteredPairs();

    if (filtered.length === 0) {
      if (this.currentTab === 'watchlist' && this.watchlist.size === 0) {
        this.pairsList.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <p>Watchlist пуст</p>
            <p>Перейдите во "Все пары" и добавьте нужные пары</p>
          </div>
        `;
      } else {
        this.pairsList.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <p>Ничего не найдено</p>
          </div>
        `;
      }
      return;
    }

    // Render up to 200 pairs for performance
    const toRender = filtered.slice(0, 200);

    this.pairsList.innerHTML = toRender.map((pair, i) => {
      const key = this._watchlistKey(pair);
      const isStarred = this.watchlist.has(key);
      const isActive = pair.symbol === this.currentSymbol;
      return `
        <div class="pair-item ${isActive ? 'active' : ''}"
             data-symbol="${pair.symbol}"
             data-base="${pair.base}"
             data-quote="${pair.quote}"
             style="animation-delay: ${Math.min(i * 15, 300)}ms">
          <div class="pair-item-left">
            <button class="star-btn ${isStarred ? 'starred' : ''}" data-key="${key}" title="Добавить в watchlist">
              <svg viewBox="0 0 24 24" fill="${isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
            <div>
              <span class="pair-symbol">${pair.base}<span class="pair-base">/${pair.quote}</span></span>
            </div>
          </div>
          <div class="pair-item-right">
            <span class="pair-price" id="price-${pair.symbol}"></span>
          </div>
        </div>
      `;
    }).join('');

    // Event delegation for clicks
    this.pairsList.onclick = (e) => {
      // Star button click
      const starBtn = e.target.closest('.star-btn');
      if (starBtn) {
        e.stopPropagation();
        const key = starBtn.dataset.key;
        this._toggleWatchlist(key, starBtn);
        return;
      }

      // Pair item click
      const item = e.target.closest('.pair-item');
      if (item) {
        const { symbol, base, quote } = item.dataset;
        this.currentSymbol = symbol;
        this.pairsList.querySelectorAll('.pair-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        if (this.onPairSelect) {
          this.onPairSelect({ symbol, base, quote, displayName: `${base}/${quote}` });
        }
      }
    };
  }

  _toggleWatchlist(key, btnEl) {
    if (this.watchlist.has(key)) {
      this.watchlist.delete(key);
      btnEl.classList.remove('starred');
      btnEl.querySelector('svg').setAttribute('fill', 'none');
    } else {
      this.watchlist.add(key);
      btnEl.classList.add('starred');
      btnEl.querySelector('svg').setAttribute('fill', 'currentColor');
    }
    this._saveWatchlist();

    // Re-render if on watchlist tab
    if (this.currentTab === 'watchlist') {
      this._renderPairs();
    }
  }

  _loadWatchlist() {
    try {
      const raw = localStorage.getItem(WATCHLIST_KEY);
      if (raw) return new Set(JSON.parse(raw));
    } catch (e) { /* ignore */ }
    // Default watchlist
    return new Set(['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 'XRP_USDT', 'DOGE_USDT']);
  }

  _saveWatchlist() {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...this.watchlist]));
  }
}

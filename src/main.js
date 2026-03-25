/**
 * CryptoView — Main Application
 * Orchestrates all components and manages state
 */

console.log('[MAIN.JS] Parsing started');
import './index.css';
import { fetchPairs, fetchCandles, getSymbolForExchange } from './api/exchanges.js';
import { WebSocketManager } from './api/websocket.js';
import { Sidebar } from './components/sidebar.js';
import { Header } from './components/header.js';
import { ChartComponent } from './components/chart.js';

class App {
  constructor() {
    // State
    this.exchange = 'binance';
    this.currentPair = { base: 'BTC', quote: 'USDT', displayName: 'BTC/USDT' };
    this.currentSymbol = null;
    this.timeframe = '1h';
    this.pairsCache = {}; // { binance: [...], okx: [...] }
    this.isLoading = false;

    // WebSocket
    this.wsManager = new WebSocketManager();

    // Components
    this.header = new Header({
      onTimeframeChange: (tf) => this._onTimeframeChange(tf),
      onExchangeChange: (ex) => this._onExchangeChange(ex),
    });

    this.sidebar = new Sidebar({
      onPairSelect: (pair) => this._onPairSelect(pair),
      getExchange: () => this.exchange,
    });

    this.chart = new ChartComponent('chart-container');

    // Loading element
    this.chartLoading = document.getElementById('chart-loading');

    // Init
    console.log('[App] Constructor finished, calling _init()');
    this._init();
  }

  async _init() {
    console.log('[App] _init() called, exchange:', this.exchange);
    // Load pairs for default exchange
    await this._loadPairs(this.exchange);
    console.log('[App] _loadPairs() finished');

    // Load chart for default pair
    this.currentSymbol = getSymbolForExchange(this.exchange, this.currentPair.base, this.currentPair.quote);
    this.sidebar.setActive(this.currentSymbol);
    this.header.setPair(this.currentPair.displayName, this.exchange);

    await this._loadChart();
  }

  async _loadPairs(exchange) {
    if (this.pairsCache[exchange]) {
      this.sidebar.setPairs(this.pairsCache[exchange]);
      return;
    }

    try {
      const pairs = await fetchPairs(exchange);
      this.pairsCache[exchange] = pairs;
      this.sidebar.setPairs(pairs);
    } catch (err) {
      console.error('Failed to load pairs:', err);
      this._showToast('Ошибка загрузки списка пар. Попробуйте обновить страницу.');
    }
  }

  async _loadChart() {
    if (this.isLoading) return;
    this.isLoading = true;
    this._showChartLoading(true);

    try {
      const candles = await fetchCandles(this.exchange, this.currentSymbol, this.timeframe);
      this.chart.setData(candles);

      // Update price info from last candle
      if (candles.length >= 2) {
        const last = candles[candles.length - 1];
        const first = candles[0];
        const changePercent = ((last.close - first.close) / first.close) * 100;
        this.header.updatePrice(last.close, changePercent);
      }

      // Subscribe to WebSocket for live updates
      this.wsManager.subscribe(this.exchange, this.currentSymbol, this.timeframe, (candle) => {
        this.chart.updateCandle(candle);
        // Update header price
        const change = this._calcChange(candle.close);
        this.header.updatePrice(candle.close, change);
      });

    } catch (err) {
      console.error('Failed to load chart data:', err);
      this._showToast('Ошибка загрузки данных графика');
    } finally {
      this.isLoading = false;
      this._showChartLoading(false);
    }
  }

  _calcChange(currentClose) {
    // Simple approximation — compare to session start
    try {
      const cached = this.pairsCache[this.exchange];
      // No pre-calculated change available, return null
      return null;
    } catch {
      return null;
    }
  }

  _onPairSelect(pair) {
    this.currentPair = pair;
    this.currentSymbol = getSymbolForExchange(this.exchange, pair.base, pair.quote);
    this.header.setPair(pair.displayName, this.exchange);
    this.sidebar.setActive(this.currentSymbol);
    this._loadChart();
  }

  async _onExchangeChange(exchange) {
    this.exchange = exchange;

    // Load pairs for new exchange
    await this._loadPairs(exchange);

    // Try to find the same pair on the new exchange
    const newSymbol = getSymbolForExchange(exchange, this.currentPair.base, this.currentPair.quote);
    const pairs = this.pairsCache[exchange] || [];
    const found = pairs.find(p => p.base === this.currentPair.base && p.quote === this.currentPair.quote);

    if (found) {
      this.currentSymbol = found.symbol;
      this.sidebar.setActive(found.symbol);
      this.header.setPair(found.displayName, exchange);
    } else {
      // Fallback to first USDT pair
      const fallback = pairs.find(p => p.quote === 'USDT') || pairs[0];
      if (fallback) {
        this.currentPair = fallback;
        this.currentSymbol = fallback.symbol;
        this.sidebar.setActive(fallback.symbol);
        this.header.setPair(fallback.displayName, exchange);
      }
    }

    await this._loadChart();
  }

  _onTimeframeChange(tf) {
    this.timeframe = tf;
    this._loadChart();
  }

  _showChartLoading(show) {
    if (this.chartLoading) {
      this.chartLoading.classList.toggle('hidden', !show);
    }
  }

  _showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Bootstrap — ES modules are deferred, DOM is already ready
new App();

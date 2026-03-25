/**
 * Exchange API Service
 * Unified interface for Binance and OKX
 */

const BINANCE_BASE = '/binance-api';
const OKX_BASE = '/okx-api';

// Timeframe mapping per exchange
const TIMEFRAME_MAP = {
  binance: {
    '1m': '1m', '5m': '5m', '15m': '15m',
    '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w',
  },
  okx: {
    '1m': '1m', '5m': '5m', '15m': '15m',
    '1h': '1H', '4h': '4H', '1d': '1D', '1w': '1W',
  },
};

/**
 * Fetch all available SPOT pairs from an exchange
 */
export async function fetchPairs(exchange) {
  if (exchange === 'binance') {
    return fetchBinancePairs();
  } else if (exchange === 'okx') {
    return fetchOkxPairs();
  }
  throw new Error(`Unknown exchange: ${exchange}`);
}

async function fetchBinancePairs() {
  const resp = await fetch(`${BINANCE_BASE}/api/v3/exchangeInfo`);
  if (!resp.ok) throw new Error(`Binance exchangeInfo error: ${resp.status}`);
  const data = await resp.json();

  return data.symbols
    .filter(s => s.status === 'TRADING' && s.isSpotTradingAllowed)
    .map(s => ({
      symbol: s.symbol,           // e.g. BTCUSDT
      base: s.baseAsset,          // e.g. BTC
      quote: s.quoteAsset,        // e.g. USDT
      displayName: `${s.baseAsset}/${s.quoteAsset}`,
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

async function fetchOkxPairs() {
  const resp = await fetch(`${OKX_BASE}/api/v5/public/instruments?instType=SPOT`);
  if (!resp.ok) throw new Error(`OKX instruments error: ${resp.status}`);
  const data = await resp.json();

  return data.data
    .filter(i => i.state === 'live')
    .map(i => {
      const parts = i.instId.split('-'); // e.g. BTC-USDT
      return {
        symbol: i.instId,
        base: parts[0],
        quote: parts[1],
        displayName: `${parts[0]}/${parts[1]}`,
      };
    })
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

/**
 * Fetch candlestick data
 * Returns array of { time, open, high, low, close, volume }
 */
export async function fetchCandles(exchange, symbol, timeframe, limit = 500) {
  if (exchange === 'binance') {
    return fetchBinanceCandles(symbol, timeframe, limit);
  } else if (exchange === 'okx') {
    return fetchOkxCandles(symbol, timeframe, limit);
  }
  throw new Error(`Unknown exchange: ${exchange}`);
}

async function fetchBinanceCandles(symbol, timeframe, limit) {
  const interval = TIMEFRAME_MAP.binance[timeframe] || '1h';
  const url = `${BINANCE_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Binance klines error: ${resp.status}`);
  const data = await resp.json();

  return data.map(k => ({
    time: k[0] / 1000, // Convert ms to seconds
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

async function fetchOkxCandles(symbol, timeframe, limit) {
  const bar = TIMEFRAME_MAP.okx[timeframe] || '1H';
  const url = `${OKX_BASE}/api/v5/market/candles?instId=${symbol}&bar=${bar}&limit=${limit}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`OKX candles error: ${resp.status}`);
  const data = await resp.json();

  // OKX returns newest first, need to reverse
  return data.data
    .map(k => ({
      time: parseInt(k[0]) / 1000,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))
    .reverse();
}

/**
 * Format symbol for display purposes
 */
export function formatSymbol(exchange, symbol) {
  if (exchange === 'binance') {
    // BTCUSDT → BTC/USDT (approximate — needs pair info)
    return symbol;
  }
  // OKX: BTC-USDT → BTC/USDT
  return symbol.replace('-', '/');
}

/**
 * Convert between exchange symbol formats
 * OKX uses "BTC-USDT", Binance uses "BTCUSDT"
 */
export function getSymbolForExchange(exchange, base, quote) {
  if (exchange === 'binance') {
    return `${base}${quote}`;
  }
  return `${base}-${quote}`;
}

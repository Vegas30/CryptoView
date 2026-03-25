/**
 * WebSocket Service for real-time candle updates
 */

const TIMEFRAME_MAP_BINANCE_WS = {
  '1m': '1m', '5m': '5m', '15m': '15m',
  '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w',
};

const TIMEFRAME_MAP_OKX_WS = {
  '1m': 'candle1m', '5m': 'candle5m', '15m': 'candle15m',
  '1h': 'candle1H', '4h': 'candle4H', '1d': 'candle1D', '1w': 'candle1W',
};

export class WebSocketManager {
  constructor() {
    this.ws = null;
    this.exchange = null;
    this.onCandle = null;
    this.reconnectTimer = null;
    this.symbol = null;
    this.timeframe = null;
  }

  /**
   * Subscribe to live candle updates
   */
  subscribe(exchange, symbol, timeframe, onCandle) {
    this.cleanup();
    this.exchange = exchange;
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.onCandle = onCandle;

    if (exchange === 'binance') {
      this._connectBinance(symbol, timeframe);
    } else if (exchange === 'okx') {
      this._connectOkx(symbol, timeframe);
    }
  }

  _connectBinance(symbol, timeframe) {
    const wsSymbol = symbol.toLowerCase();
    const interval = TIMEFRAME_MAP_BINANCE_WS[timeframe] || '1h';
    const url = `wss://stream.binance.com:9443/ws/${wsSymbol}@kline_${interval}`;

    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.e === 'kline' && msg.k) {
          const k = msg.k;
          const candle = {
            time: k.t / 1000,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
            isClosed: k.x,
          };
          if (this.onCandle) this.onCandle(candle);
        }
      } catch (e) {
        console.error('Binance WS parse error:', e);
      }
    };

    this.ws.onclose = () => this._scheduleReconnect();
    this.ws.onerror = (err) => console.error('Binance WS error:', err);
  }

  _connectOkx(symbol, timeframe) {
    const channel = TIMEFRAME_MAP_OKX_WS[timeframe] || 'candle1H';
    const url = 'wss://ws.okx.com:8443/ws/v5/public';

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      const sub = {
        op: 'subscribe',
        args: [{ channel, instId: symbol }],
      };
      this.ws.send(JSON.stringify(sub));
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.data && msg.data.length > 0) {
          const k = msg.data[0];
          const candle = {
            time: parseInt(k[0]) / 1000,
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            isClosed: false, // OKX doesn't provide this directly
          };
          if (this.onCandle) this.onCandle(candle);
        }
      } catch (e) {
        console.error('OKX WS parse error:', e);
      }
    };

    this.ws.onclose = () => this._scheduleReconnect();
    this.ws.onerror = (err) => console.error('OKX WS error:', err);
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.symbol && this.timeframe && this.onCandle) {
        console.log('WebSocket reconnecting...');
        this.subscribe(this.exchange, this.symbol, this.timeframe, this.onCandle);
      }
    }, 3000);
  }

  cleanup() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect
      this.ws.close();
      this.ws = null;
    }
  }
}

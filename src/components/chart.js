/**
 * Chart Component
 * Lightweight Charts wrapper for candlestick display
 */

import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';

export class ChartComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.chart = null;
    this.candleSeries = null;
    this.volumeSeries = null;
    this.resizeObserver = null;

    this._initChart();
    this._initResize();
  }

  _initChart() {
    this.chart = createChart(this.container, {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#0f1118' },
        textColor: '#787b86',
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(41, 98, 255, 0.4)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#2962ff',
        },
        horzLine: {
          color: 'rgba(41, 98, 255, 0.4)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#2962ff',
        },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
      },
      handleScroll: { vertTouchDrag: false },
    });

    // Candlestick series
    this.candleSeries = this.chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Volume series as histogram
    this.volumeSeries = this.chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    this.chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // Crosshair move → update OHLCV bar
    this.chart.subscribeCrosshairMove((param) => {
      this._updateOhlcvBar(param);
    });
  }

  _initResize() {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.chart.applyOptions({ width, height });
      }
    });
    this.resizeObserver.observe(this.container);
  }

  /**
   * Set candlestick data
   * @param {Array} candles - [{ time, open, high, low, close, volume }]
   */
  setData(candles) {
    if (!candles || candles.length === 0) return;

    this.candleSeries.setData(
      candles.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    this.volumeSeries.setData(
      candles.map(c => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open
          ? 'rgba(38, 166, 154, 0.3)'
          : 'rgba(239, 83, 80, 0.3)',
      }))
    );

    // Fit content
    this.chart.timeScale().fitContent();

    // Update OHLCV with last candle
    const last = candles[candles.length - 1];
    this._setOhlcv(last);
  }

  /**
   * Update the latest candle (real-time)
   */
  updateCandle(candle) {
    this.candleSeries.update({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    });

    this.volumeSeries.update({
      time: candle.time,
      value: candle.volume,
      color: candle.close >= candle.open
        ? 'rgba(38, 166, 154, 0.3)'
        : 'rgba(239, 83, 80, 0.3)',
    });
  }

  _updateOhlcvBar(param) {
    if (!param || !param.time) {
      return;
    }
    const candleData = param.seriesData.get(this.candleSeries);
    const volData = param.seriesData.get(this.volumeSeries);
    if (candleData) {
      this._setOhlcv({
        open: candleData.open,
        high: candleData.high,
        low: candleData.low,
        close: candleData.close,
        volume: volData ? volData.value : 0,
      });
    }
  }

  _setOhlcv(data) {
    if (!data) return;
    const fmt = (v) => {
      if (v === undefined || v === null) return '—';
      if (v >= 1) return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return v.toPrecision(6);
    };
    const fmtVol = (v) => {
      if (!v) return '—';
      if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
      if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
      if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
      return v.toFixed(2);
    };

    const openEl = document.getElementById('ohlcv-open');
    const highEl = document.getElementById('ohlcv-high');
    const lowEl = document.getElementById('ohlcv-low');
    const closeEl = document.getElementById('ohlcv-close');
    const volEl = document.getElementById('ohlcv-vol');

    if (openEl) openEl.textContent = fmt(data.open);
    if (highEl) highEl.textContent = fmt(data.high);
    if (lowEl) lowEl.textContent = fmt(data.low);
    if (closeEl) closeEl.textContent = fmt(data.close);
    if (volEl) volEl.textContent = fmtVol(data.volume);

    // Color the close value
    if (closeEl && data.open !== undefined) {
      closeEl.style.color = data.close >= data.open ? '#26a69a' : '#ef5350';
    }
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.chart) {
      this.chart.remove();
    }
  }
}

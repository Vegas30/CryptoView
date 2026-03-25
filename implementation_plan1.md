# Crypto Charts Website — TradingView-style

Веб-приложение для отображения свечных графиков криптовалютных пар с бирж **Binance** и **OKX**. Тёмная тема, поиск по парам, watchlist, переключение бирж и таймфреймов.

## Ключевые решения

> [!IMPORTANT]
> **API-ключи не нужны** — оба API (Binance `/api/v3/klines`, OKX `/api/v5/market/candles`) публичные и не требуют аутентификации для рыночных данных. Ключи понадобятся только для торговли/аккаунта.

> [!NOTE]
> **CORS-прокси**: Binance и OKX блокируют прямые запросы из браузера. Будет использован публичный прокси или простой Node.js-прокси в dev-mode через Vite.

## Стек технологий

| Компонент | Технология |
|---|---|
| Сборка | **Vite** (vanilla JS) |
| Графики | **TradingView Lightweight Charts v5** |
| Стили | Vanilla CSS, тёмная тема |
| API | Binance REST + OKX REST (публичные) |
| Реалтайм | Binance WebSocket + OKX WebSocket |

## Proposed Changes

### Vite Project Scaffolding

#### [NEW] [package.json](file:///g:/Develop/TradingView/package.json)
Vite vanilla-JS проект с зависимостью `lightweight-charts@^5.0.0`.

#### [NEW] [vite.config.js](file:///g:/Develop/TradingView/vite.config.js)
Конфигурация с proxy для `/binance-api` → `https://api.binance.com` и `/okx-api` → `https://www.okx.com`, чтобы обойти CORS.

---

### CSS Design System

#### [NEW] [src/index.css](file:///g:/Develop/TradingView/src/index.css)
Тёмная тема в стиле TradingView:
- CSS-переменные для цветов (фон `#131722`, панели `#1e222d`, акцент `#2962ff`)
- Типография (Inter / system-ui)
- Компоненты: sidebar, header, chart area, watchlist items
- Анимации hover, плавные переходы
- Адаптивная верстка

---

### Exchange API Service

#### [NEW] [src/api/exchanges.js](file:///g:/Develop/TradingView/src/api/exchanges.js)
Унифицированный интерфейс для обеих бирж:
- `fetchPairs(exchange)` — получить все доступные пары
  - Binance: `GET /api/v3/exchangeInfo`
  - OKX: `GET /api/v5/public/instruments?instType=SPOT`
- `fetchCandles(exchange, symbol, interval, limit)` — свечные данные
  - Binance: `GET /api/v3/klines`
  - OKX: `GET /api/v5/market/candles`
- Нормализация данных в единый формат `{ time, open, high, low, close, volume }`

#### [NEW] [src/api/websocket.js](file:///g:/Develop/TradingView/src/api/websocket.js)
WebSocket подключения для real-time обновлений:
- Binance: `wss://stream.binance.com:9443/ws/<symbol>@kline_<interval>`
- OKX: `wss://ws.okx.com:8443/ws/v5/public` с подпиской на `candle<interval>`

---

### UI Components

#### [NEW] [src/components/sidebar.js](file:///g:/Develop/TradingView/src/components/sidebar.js)
Боковая панель:
- Поиск пар с фильтрацией в реальном времени
- Список всех пар с группировкой (USDT, BTC, ETH и т.д.)
- Watchlist: добавление/удаление пар (хранение в localStorage)
- Переключение между "Все пары" и "Watchlist"

#### [NEW] [src/components/chart.js](file:///g:/Develop/TradingView/src/components/chart.js)
Основной компонент графика:
- Инициализация `createChart()` из Lightweight Charts
- Candlestick series с настроенными цветами
- Volume overlay (гистограмма объёмов)
- Crosshair с подсветкой цены и времени
- Автообновление через WebSocket

#### [NEW] [src/components/header.js](file:///g:/Develop/TradingView/src/components/header.js)
Верхняя панель:
- Текущая пара + цена + изменение за 24ч
- Переключатель биржи (Binance / OKX)
- Кнопки таймфреймов (1m, 5m, 15m, 1h, 4h, 1D, 1W)

---

### Main Application

#### [NEW] [index.html](file:///g:/Develop/TradingView/index.html)
HTML-каркас с layout: sidebar + main area (header + chart).

#### [NEW] [src/main.js](file:///g:/Develop/TradingView/src/main.js)
Точка входа: инициализация компонентов, роутинг состояния, обработка событий.

## Verification Plan

### Browser Test
1. Запустить `npm run dev`
2. Открыть в браузере — убедиться что загружается тёмная тема
3. Проверить что списки пар загружаются с обеих бирж
4. Кликнуть на пару — убедиться что свечной график отрисовывается
5. Переключить биржу — график должен обновиться
6. Переключить таймфрейм — данные должны перезагрузиться
7. Добавить пару в watchlist — проверить сохранение после перезагрузки

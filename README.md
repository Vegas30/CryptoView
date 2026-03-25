# Crypto Chart Dashboard

A web application that displays real-time candlestick charts for cryptocurrency pairs from Binance and OKX, aiming to provide a visualization experience similar to TradingView.

## Features
- **Real-Time Data**: Live candlestick charts updated dynamically via WebSockets or REST APIs from Binance and OKX.
- **Multiple Exchanges**: Compare and analyze trading pairs from different cryptocurrency exchanges.
- **Interactive Charts**: Powered by `lightweight-charts`, offering zooming, panning, and modern chart interactions.
- **Modern UI**: A sleek, responsive user interface styled with Vanilla CSS for a premium feel.

## Technologies Used
- **Frontend Framework**: Vanilla JavaScript with Vite as the build tool for blazing-fast development.
- **Charting Library**: [`lightweight-charts`](https://github.com/tradingview/lightweight-charts) for high-performance financial charts.
- **Styling**: Custom CSS (Vanilla).

## Project Structure
```text
src/
├── api/          # Exchange API integration logic (Binance, OKX)
├── components/   # UI components and modules
├── index.css     # Global styles and design system
└── main.js       # Main application entry point and chart logic
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd TradingView
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### Development
To start the development server:
```bash
npm run dev
```
This will start Vite's local dev server. Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173`).

### Building for Production
To build the app for production, run:
```bash
npm run build
```
This creates an optimized production build in the `dist` folder.

To preview the production build locally:
```bash
npm run preview
```

## License
ISC

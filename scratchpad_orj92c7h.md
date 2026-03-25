# Verification Checklist
- [x] Navigate to `http://localhost:3000`
- [x] Wait for 15 seconds for data loading
- [x] Verify pairs list in sidebar (crypto pair names visible) - **FAILED** (shows "Ничего не найдено")
- [x] Verify chart visibility (candlesticks visible) - **FAILED** (shows "Загрузка графика...")
- [x] Verify price in header (numerical price visible) - **FAILED** (shows "—")
- [x] Check console for errors - **FOUND**: `SyntaxError: Unexpected token '<', "<!DOCTYPE "...` (API proxy returning HTML)
- [x] Capture screenshot of final state - **CAPTURED**

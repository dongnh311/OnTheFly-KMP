// ═══════════════════════════════════════════════════════════
//  Chart Screen — StockPro (matching mockup)
// ═══════════════════════════════════════════════════════════

var selectedSymbol = "AAPL";
var selectedRange = "1M";
var selectedIndicator = "MA (7,25,99)";
var wsConnected = false;

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    StockCandleData.fetchReal(selectedSymbol, selectedRange);
    render();
    connectFinnhubWS("chart");
}

function onVisible() {
    render();
}

function onDestroy() {
    if (wsConnected) {
        unsubscribeTrades(selectedSymbol);
        disconnectFinnhubWS("chart");
        wsConnected = false;
    }
}

// ─── WebSocket Handlers ───────────────────────────────────

function onWSConnected(data) {
    wsConnected = true;
    subscribeTrades(selectedSymbol);
}

function onRealtimeData(data) {
    if (!data || !data.message) return;
    var trades = parseFinnhubWSMessage(data.message);
    if (trades) {
        for (var i = 0; i < trades.length; i++) {
            if (trades[i].symbol === selectedSymbol) {
                updateStockFromTrade(trades[i]);
                StockCandleData.updateLatestCandle(trades[i].symbol, trades[i].price, trades[i].volume);
            }
        }
        render();
    }
}

function onWSDisconnected(data) { wsConnected = false; }
function onWSError(data) { wsConnected = false; }

// ─── API Response Handler ─────────────────────────────────

function onDataReceived(data) {
    if (data.error) return;
    // Handle candle response
    if (data.requestId && data.requestId.indexOf("candle_") === 0) {
        var parts = data.requestId.split("_");
        var sym = parts[1];
        var res = parts[2];
        // Find which range this resolution maps to
        var range = selectedRange;
        var result = StockCandleData.parseRealCandles(sym, range, data.body);
        if (result) render();
    }
}

// ─── Navigation ────────────────────────────────────────────

function onNavTab_dashboard() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-dashboard" }); }
function onNavTab_chart()     { /* already here */ }
function onNavTab_watchlist() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-watchlist" }); }
function onNavTab_search()    { OnTheFly.sendToNative("navigateReplace", { screen: "stock-search" }); }
function onNavTab_news()      { OnTheFly.sendToNative("navigateReplace", { screen: "stock-news" }); }

// ─── Handlers ──────────────────────────────────────────────

function onClick(id, data) {
    if (id && id.indexOf("sym_") === 0) {
        if (wsConnected) unsubscribeTrades(selectedSymbol);
        selectedSymbol = id.substring(4);
        if (wsConnected) subscribeTrades(selectedSymbol);
        StockCandleData.fetchReal(selectedSymbol, selectedRange);
        render();
    }
    if (id && id.indexOf("range_") === 0) {
        selectedRange = id.substring(6);
        StockCandleData.fetchReal(selectedSymbol, selectedRange);
        render();
    }
    if (id && id.indexOf("ind_") === 0) {
        selectedIndicator = id.substring(4);
        render();
    }
}

function onIndicatorsClick() {
    toast("Indicators panel coming soon");
}

// ─── UI Builders ───────────────────────────────────────────

function buildSymbolChip(symbol, theme) {
    var isActive = (selectedSymbol === symbol);
    return Box({
        id: "sym_" + symbol,
        width: "wrap",
        background: isActive ? theme.accent : "transparent",
        borderRadius: 16,
        borderColor: isActive ? theme.accent : theme.border,
        borderWidth: 1,
        padding: { horizontal: 14, vertical: 6 },
        onClick: "onClick"
    }, [
        Text({ text: symbol, fontSize: 12, fontWeight: "700", color: isActive ? "#FFFFFF" : theme.textSecondary })
    ]);
}

function buildRangeButton(label, rangeId, theme) {
    var isActive = (selectedRange === rangeId);
    return Box({
        id: "range_" + rangeId,
        width: "wrap",
        background: isActive ? theme.accent : "transparent",
        borderRadius: 14,
        padding: { horizontal: 12, vertical: 5 },
        onClick: "onClick"
    }, [
        Text({ text: label, fontSize: 13, fontWeight: isActive ? "700" : "500", color: isActive ? "#FFFFFF" : theme.textTertiary })
    ]);
}

function buildIndicatorChip(label, theme) {
    var isActive = (selectedIndicator === label);
    return Box({
        id: "ind_" + label,
        width: "wrap",
        background: isActive ? theme.accent : "transparent",
        borderRadius: 16,
        borderColor: isActive ? theme.accent : theme.border,
        borderWidth: 1,
        padding: { horizontal: 12, vertical: 6 },
        onClick: "onClick"
    }, [
        Text({ text: label, fontSize: 11, fontWeight: "600", color: isActive ? "#FFFFFF" : theme.textSecondary })
    ]);
}

function buildStatCell(label, value, theme) {
    return Column({ weight: 1, alignment: "center" }, [
        Text({ text: label, fontSize: 10, color: theme.textTertiary }),
        Text({ text: value, fontSize: 13, fontWeight: "700", color: theme.textPrimary })
    ]);
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();
    var stock = findStock(selectedSymbol);
    if (!stock) stock = StockData.stocks[0];
    var up = stock.change >= 0;
    var chartData = StockCandleData.getRealCached(selectedSymbol, selectedRange) || StockCandleData.generate(selectedSymbol, selectedRange);

    OnTheFly.setUI(Column({ height: "fill", background: theme.primary }, [
        // ── Top bar: title + Indicators button ──
        Row({
            fillMaxWidth: true,
            padding: { start: 16, end: 16, top: 4, bottom: 8 },
            crossAlignment: "center",
            alignment: "spaceBetween"
        }, [
            Text({ text: St("chart_title"), fontSize: 22, fontWeight: "800", color: theme.textPrimary, width: "wrap" }),
            Box({
                width: "wrap",
                borderColor: theme.accent,
                borderWidth: 1,
                borderRadius: 16,
                padding: { horizontal: 12, vertical: 5 },
                onClick: "onIndicatorsClick"
            }, [
                Text({ text: "\u25C7 " + St("indicators"), fontSize: 11, fontWeight: "600", color: theme.accent })
            ])
        ]),

        // ── Content (chart fills remaining space) ──
        Column({ fillMaxWidth: true, weight: 1 }, [
            // Symbol chips row (horizontal scroll)
            Row({ scrollable: true, padding: { start: 16, end: 16, bottom: 12 }, spacing: 8 }, [
                buildSymbolChip("AAPL", theme),
                buildSymbolChip("TSLA", theme),
                buildSymbolChip("NVDA", theme),
                buildSymbolChip("MSFT", theme),
                buildSymbolChip("GOOGL", theme)
            ]),

            // Price display
            Row({ padding: { start: 16, end: 16, bottom: 8 }, crossAlignment: "end", spacing: 6 }, [
                Text({ text: stockPriceText(stock.price), fontSize: 28, fontWeight: "800", color: theme.textPrimary }),
                Text({ text: (up ? "+" : "") + stock.change.toFixed(2) + " (" + fmtPct(stock.pct) + ")", fontSize: 13, fontWeight: "600", color: stock.change > 0 ? theme.positive : (stock.change < 0 ? theme.negative : theme.warning), padding: { bottom: 3 } })
            ]),

            // Time range row
            Row({ padding: { start: 16, end: 16, bottom: 8 }, spacing: 4 }, [
                buildRangeButton("1D", "1D", theme),
                buildRangeButton("1W", "1W", theme),
                buildRangeButton("1M", "1M", theme),
                buildRangeButton("3M", "3M", theme),
                buildRangeButton("6M", "6M", theme),
                buildRangeButton("1Y", "1Y", theme),
                buildRangeButton("ALL", "ALL", theme)
            ]),

            // MA indicator values (computed)
            Row({ padding: { start: 16, end: 16, bottom: 8 }, spacing: 8 }, [
                Text({ text: "MA7", fontSize: 11, fontWeight: "600", color: theme.accent }),
                Text({ text: "" + StockCandleData.getLatestMA(chartData.ma7), fontSize: 11, color: theme.textSecondary }),
                Text({ text: "MA25", fontSize: 11, fontWeight: "600", color: "#E8B84B" }),
                Text({ text: "" + StockCandleData.getLatestMA(chartData.ma25), fontSize: 11, color: theme.textSecondary }),
                Text({ text: "MA99", fontSize: 11, fontWeight: "600", color: "#B84BE8" }),
                Text({ text: "" + StockCandleData.getLatestMA(chartData.ma99), fontSize: 11, color: theme.textSecondary })
            ]),

            // Candlestick Chart (fill remaining space)
            Box({ padding: { horizontal: 16, bottom: 4 }, weight: 1 }, [
                CandlestickChart({
                    fillHeight: true,
                    candles: chartData.candles,
                    ma7: chartData.ma7,
                    ma25: chartData.ma25,
                    ma99: chartData.ma99,
                    upColor: theme.positive,
                    downColor: theme.negative,
                    ma7Color: theme.accent,
                    ma25Color: "#E8B84B",
                    ma99Color: "#B84BE8",
                    gridColor: theme.border,
                    textColor: theme.textTertiary,
                    showGrid: true,
                    showVolume: true,
                    volumeHeightRatio: 0.18,
                    candleWidth: 12
                })
            ]),

            // Volume label
            Row({ padding: { start: 16, end: 16, top: 4, bottom: 12 }, crossAlignment: "center", spacing: 4 }, [
                Text({ text: "Vol", fontSize: 11, color: theme.textTertiary }),
                Text({ text: stock.vol, fontSize: 13, fontWeight: "600", color: theme.textPrimary })
            ]),

            // OHLCV stats row
            Box({ padding: { horizontal: 16, bottom: 16 } }, [
                Row({
                    fillMaxWidth: true,
                    padding: { horizontal: 8, vertical: 8 }
                }, [
                    buildStatCell(St("open_short"), stockPriceText(stock.open), theme),
                    buildStatCell(St("high_short"), stockPriceText(stock.high), theme),
                    buildStatCell(St("low_short"), stockPriceText(stock.low), theme),
                    buildStatCell(St("close_short"), stockPriceText(stock.price), theme),
                    buildStatCell(St("vol_short"), stock.vol, theme)
                ])
            ]),

            // Indicator chips row
            Row({ scrollable: true, padding: { start: 16, end: 16, bottom: 16 }, spacing: 8 }, [
                buildIndicatorChip("MA (7,25,99)", theme),
                buildIndicatorChip("RSI", theme),
                buildIndicatorChip("MACD", theme),
                buildIndicatorChip("Bollinger", theme),
                buildIndicatorChip("EMA", theme),
                buildIndicatorChip("VWAP", theme)
            ])
        ]),

        // Bottom nav
        buildStockBottomNav("chart", theme)
    ]));
}

render();

// ═══════════════════════════════════════════════════════════
//  Chart Screen — StockPro (matching mockup)
// ═══════════════════════════════════════════════════════════

var selectedSymbol = "AAPL";
var selectedRange = "1M";
var selectedIndicator = "MA (7,25,99)";

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render();
}

function onVisible() {
    render();
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
        selectedSymbol = id.substring(4);
        render();
    }
    if (id && id.indexOf("range_") === 0) {
        selectedRange = id.substring(6);
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
    return {
        type: "Box",
        props: {
            id: "sym_" + symbol,
            width: "wrap",
            background: isActive ? theme.accent : "transparent",
            borderRadius: 16,
            borderColor: isActive ? theme.accent : theme.border,
            borderWidth: 1,
            padding: { horizontal: 14, vertical: 6 },
            onClick: "onClick"
        },
        children: [
            { type: "Text", props: { text: symbol, fontSize: 12, fontWeight: "700", color: isActive ? "#FFFFFF" : theme.textSecondary } }
        ]
    };
}

function buildRangeButton(label, rangeId, theme) {
    var isActive = (selectedRange === rangeId);
    return {
        type: "Box",
        props: {
            id: "range_" + rangeId,
            width: "wrap",
            background: isActive ? theme.accent : "transparent",
            borderRadius: 14,
            padding: { horizontal: 12, vertical: 5 },
            onClick: "onClick"
        },
        children: [
            { type: "Text", props: { text: label, fontSize: 13, fontWeight: isActive ? "700" : "500", color: isActive ? "#FFFFFF" : theme.textTertiary } }
        ]
    };
}

function buildIndicatorChip(label, theme) {
    var isActive = (selectedIndicator === label);
    return {
        type: "Box",
        props: {
            id: "ind_" + label,
            width: "wrap",
            background: isActive ? theme.accent : "transparent",
            borderRadius: 16,
            borderColor: isActive ? theme.accent : theme.border,
            borderWidth: 1,
            padding: { horizontal: 12, vertical: 6 },
            onClick: "onClick"
        },
        children: [
            { type: "Text", props: { text: label, fontSize: 11, fontWeight: "600", color: isActive ? "#FFFFFF" : theme.textSecondary } }
        ]
    };
}

function buildStatCell(label, value, theme) {
    return {
        type: "Column",
        props: { weight: 1, alignment: "center" },
        children: [
            { type: "Text", props: { text: label, fontSize: 10, color: theme.textTertiary } },
            { type: "Text", props: { text: value, fontSize: 13, fontWeight: "700", color: theme.textPrimary } }
        ]
    };
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();
    var stock = findStock(selectedSymbol);
    if (!stock) stock = StockData.stocks[0];
    var up = stock.change >= 0;
    var chartData = StockCandleData.generate(selectedSymbol, selectedRange);

    OnTheFly.setUI({
        type: "Column",
        props: { height: "fill", background: theme.primary },
        children: [
            // ── Top bar: title + Indicators button ──
            {
                type: "Row",
                props: {
                    fillMaxWidth: true,
                    padding: { start: 16, end: 16, top: 4, bottom: 8 },
                    crossAlignment: "center",
                    alignment: "spaceBetween"
                },
                children: [
                    { type: "Text", props: { text: St("chart_title"), fontSize: 22, fontWeight: "800", color: theme.textPrimary, width: "wrap" } },
                    {
                        type: "Box",
                        props: {
                            width: "wrap",
                            background: theme.accent,
                            borderRadius: 16,
                            padding: { horizontal: 12, vertical: 6 },
                            onClick: "onIndicatorsClick"
                        },
                        children: [
                            { type: "Text", props: { text: "\u25C7 " + St("indicators"), fontSize: 11, fontWeight: "600", color: "#FFFFFF" } }
                        ]
                    }
                ]
            },

            // ── Content (chart fills remaining space) ──
            {
                type: "Column",
                props: { fillMaxWidth: true, weight: 1 },
                children: [
                    // Symbol chips row (horizontal scroll)
                    {
                        type: "Row",
                        props: { scrollable: true, padding: { start: 16, end: 16, bottom: 12 }, spacing: 8 },
                        children: [
                            buildSymbolChip("AAPL", theme),
                            buildSymbolChip("TSLA", theme),
                            buildSymbolChip("NVDA", theme),
                            buildSymbolChip("MSFT", theme),
                            buildSymbolChip("GOOGL", theme)
                        ]
                    },

                    // Price display
                    {
                        type: "Row",
                        props: { padding: { start: 16, end: 16, bottom: 8 }, crossAlignment: "end", spacing: 6 },
                        children: [
                            { type: "Text", props: { text: stockPriceText(stock.price), fontSize: 28, fontWeight: "800", color: theme.textPrimary } },
                            { type: "Text", props: { text: (up ? "+" : "") + stock.change.toFixed(2) + " (" + fmtPct(stock.pct) + ")", fontSize: 13, fontWeight: "600", color: up ? theme.positive : theme.negative, padding: { bottom: 3 } } }
                        ]
                    },

                    // Time range row
                    {
                        type: "Row",
                        props: { padding: { start: 16, end: 16, bottom: 8 }, spacing: 4 },
                        children: [
                            buildRangeButton("1D", "1D", theme),
                            buildRangeButton("1W", "1W", theme),
                            buildRangeButton("1M", "1M", theme),
                            buildRangeButton("3M", "3M", theme),
                            buildRangeButton("6M", "6M", theme),
                            buildRangeButton("1Y", "1Y", theme),
                            buildRangeButton("ALL", "ALL", theme)
                        ]
                    },

                    // MA indicator values (computed)
                    {
                        type: "Row",
                        props: { padding: { start: 16, end: 16, bottom: 8 }, spacing: 8 },
                        children: [
                            { type: "Text", props: { text: "MA7", fontSize: 11, fontWeight: "600", color: theme.accent } },
                            { type: "Text", props: { text: "" + StockCandleData.getLatestMA(chartData.ma7), fontSize: 11, color: theme.textSecondary } },
                            { type: "Text", props: { text: "MA25", fontSize: 11, fontWeight: "600", color: "#E8B84B" } },
                            { type: "Text", props: { text: "" + StockCandleData.getLatestMA(chartData.ma25), fontSize: 11, color: theme.textSecondary } },
                            { type: "Text", props: { text: "MA99", fontSize: 11, fontWeight: "600", color: "#B84BE8" } },
                            { type: "Text", props: { text: "" + StockCandleData.getLatestMA(chartData.ma99), fontSize: 11, color: theme.textSecondary } }
                        ]
                    },

                    // Candlestick Chart (fill remaining space)
                    {
                        type: "Box",
                        props: { padding: { horizontal: 16, bottom: 4 }, weight: 1 },
                        children: [
                            {
                                type: "CandlestickChart",
                                props: {
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
                                    background: theme.surfaceVariant,
                                    showGrid: true,
                                    showVolume: true,
                                    volumeHeightRatio: 0.18,
                                    borderRadius: 8
                                }
                            }
                        ]
                    },

                    // Volume label
                    {
                        type: "Row",
                        props: { padding: { start: 16, end: 16, top: 4, bottom: 12 }, crossAlignment: "center", spacing: 4 },
                        children: [
                            { type: "Text", props: { text: "Vol", fontSize: 11, color: theme.textTertiary } },
                            { type: "Text", props: { text: stock.vol, fontSize: 13, fontWeight: "600", color: theme.textPrimary } }
                        ]
                    },

                    // OHLCV stats row
                    {
                        type: "Box",
                        props: { padding: { horizontal: 16, bottom: 16 } },
                        children: [
                            {
                                type: "Row",
                                props: {
                                    fillMaxWidth: true,
                                    background: theme.card,
                                    borderRadius: 10,
                                    padding: { horizontal: 8, vertical: 12 }
                                },
                                children: [
                                    buildStatCell(St("open_short"), stockPriceText(stock.open), theme),
                                    buildStatCell(St("high_short"), stockPriceText(stock.high), theme),
                                    buildStatCell(St("low_short"), stockPriceText(stock.low), theme),
                                    buildStatCell(St("close_short"), stockPriceText(stock.price), theme),
                                    buildStatCell(St("vol_short"), stock.vol, theme)
                                ]
                            }
                        ]
                    },

                    // Indicator chips row
                    {
                        type: "Row",
                        props: { scrollable: true, padding: { start: 16, end: 16, bottom: 16 }, spacing: 8 },
                        children: [
                            buildIndicatorChip("MA (7,25,99)", theme),
                            buildIndicatorChip("RSI", theme),
                            buildIndicatorChip("MACD", theme),
                            buildIndicatorChip("Bollinger", theme),
                            buildIndicatorChip("EMA", theme),
                            buildIndicatorChip("VWAP", theme)
                        ]
                    }
                ]
            },

            // Bottom nav
            buildStockBottomNav("chart", theme)
        ]
    });
}

render();

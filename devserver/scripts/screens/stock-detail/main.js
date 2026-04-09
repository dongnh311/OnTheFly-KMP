// ═══════════════════════════════════════════════════════════
//  Stock Detail Screen — StockPro (matching mockup exactly)
// ═══════════════════════════════════════════════════════════

var stock = null;
var currentSymbol = "";
var bookmarked = false;
var selectedRange = "1D";
var wsConnected = false;

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    // Default — wait for onViewData
}

function onVisible() {
    if (currentSymbol) {
        resetWatchlistCache();
        bookmarked = isInWatchlist(currentSymbol);
        render();
    }
}

function onViewData(data) {
    OnTheFly.log("onViewData received: " + JSON.stringify(data));
    if (data && data.symbol) {
        currentSymbol = data.symbol;
        stock = findStock(data.symbol);
        if (!stock) {
            // Stock not in local data, create stub
            stock = { symbol: data.symbol, name: data.symbol, price: 0, change: 0, pct: 0, open: 0, high: 0, low: 0, vol: "-", cap: "-", pe: 0 };
        }
        loadWatchlistFromStorage();
        bookmarked = isInWatchlist(data.symbol);
        StockCandleData.fetchReal(data.symbol, selectedRange);
        render();

        fetchQuote(data.symbol);
        fetchProfile(data.symbol);
        fetchNewsForSymbol(data.symbol);
        connectFinnhubWS("detail");
    }
}

function onDestroy() {
    if (wsConnected && currentSymbol) {
        unsubscribeTrades(currentSymbol);
        disconnectFinnhubWS("detail");
        wsConnected = false;
    }
}

// ─── API Response Handler ─────────────────────────────────

function onDataReceived(data) {
    if (data.error) {
        OnTheFly.log("Detail API error: " + data.error);
        return;
    }

    // Handle watchlist storage response
    if (data.type === "storage" && data.key && data.key.indexOf("watchlist_") === 0) {
        if (handleWatchlistStorageResponse(data.value) && currentSymbol) {
            bookmarked = isInWatchlist(currentSymbol);
            render();
        }
        return;
    }

    if (data.requestId === "quote_" + currentSymbol) {
        var parsed = parseFinnhubQuote(currentSymbol, data.body);
        if (parsed) {
            upsertStock(parsed);
            stock = findStock(currentSymbol);
            render();
        }
    }

    if (data.requestId === "profile_" + currentSymbol) {
        parseFinnhubProfile(currentSymbol, data.body);
        stock = findStock(currentSymbol);
        render();
    }

    if (data.requestId && data.requestId.indexOf("candle_") === 0) {
        var result = StockCandleData.parseRealCandles(currentSymbol, selectedRange, data.body);
        if (result) render();
    }

    if (data.requestId === "news_" + currentSymbol) {
        stock = findStock(currentSymbol);
        render();
    }
}

// ─── WebSocket Handlers ───────────────────────────────────

function onWSConnected(data) {
    wsConnected = true;
    if (currentSymbol) {
        subscribeTrades(currentSymbol);
    }
}

function onRealtimeData(data) {
    if (!data || !data.message) return;
    var trades = parseFinnhubWSMessage(data.message);
    if (trades) {
        for (var i = 0; i < trades.length; i++) {
            if (trades[i].symbol === currentSymbol) {
                updateStockFromTrade(trades[i]);
                StockCandleData.updateLatestCandle(trades[i].symbol, trades[i].price, trades[i].volume);
                stock = findStock(currentSymbol);
                var up = stock.change >= 0;
                var theme = StockTheme.get();
                OnTheFly.update("priceText", { text: stockPriceText(stock.price) });
                OnTheFly.update("changeText", {
                    text: stockChangeArrow(stock),
                    color: stock.change > 0 ? theme.positive : (stock.change < 0 ? theme.negative : theme.warning)
                });
            }
        }
    }
}

function onWSDisconnected(data) {
    wsConnected = false;
}

function onWSError(data) {
    OnTheFly.log("WS error: " + (data.error || "unknown"));
    wsConnected = false;
}

// ─── Handlers ──────────────────────────────────────────────

function onBackClick() {
    if (wsConnected && currentSymbol) {
        unsubscribeTrades(currentSymbol);
        disconnectFinnhubWS("detail");
        wsConnected = false;
    }
    goBack();
}

function onBookmarkToggle() {
    if (!stock) return;
    if (bookmarked) {
        removeFromWatchlist(stock.symbol);
        bookmarked = false;
        toast(stock.symbol + " removed from watchlist");
    } else {
        addToWatchlist(stock.symbol);
        bookmarked = true;
        toast(stock.symbol + " added to watchlist");
    }
    render();
}

function onBuyClick() {
    if (stock) toast(St("buy_order_placed") + " " + stock.symbol);
}

function onSellClick() {
    if (stock) toast(St("sell_order_placed") + " " + stock.symbol);
}

// Time range handlers
function onRange_1D()  { selectedRange = "1D";  StockCandleData.fetchReal(currentSymbol, "1D");  render(); }
function onRange_1W()  { selectedRange = "1W";  StockCandleData.fetchReal(currentSymbol, "1W");  render(); }
function onRange_1M()  { selectedRange = "1M";  StockCandleData.fetchReal(currentSymbol, "1M");  render(); }
function onRange_3M()  { selectedRange = "3M";  StockCandleData.fetchReal(currentSymbol, "3M");  render(); }
function onRange_1Y()  { selectedRange = "1Y";  StockCandleData.fetchReal(currentSymbol, "1Y");  render(); }
function onRange_ALL() { selectedRange = "ALL"; StockCandleData.fetchReal(currentSymbol, "ALL"); render(); }

// ─── Line Chart Data ──────────────────────────────────────

function generateLinePoints(stock) {
    var data = StockCandleData.getRealCached(stock.symbol, selectedRange) || StockCandleData.generate(stock.symbol, selectedRange);
    var points = [];
    for (var i = 0; i < data.candles.length; i++) {
        points.push(data.candles[i].c);
    }
    return points;
}

// ─── UI Builders ───────────────────────────────────────────

function buildTimeButton(label, rangeId, theme) {
    var isActive = (selectedRange === rangeId);
    return {
        type: "Box",
        props: {
            width: "wrap",
            background: isActive ? theme.accent : "transparent",
            borderRadius: 16,
            padding: { horizontal: 14, vertical: 6 },
            onClick: "onRange_" + rangeId
        },
        children: [
            {
                type: "Text",
                props: {
                    text: label,
                    fontSize: 12,
                    fontWeight: "600",
                    color: isActive ? "#FFFFFF" : theme.textTertiary
                }
            }
        ]
    };
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();

    if (!stock) {
        OnTheFly.setUI({
            type: "Column",
            props: {
                height: "fill",
                background: theme.primary,
                alignment: "center"
            },
            children: [
                { type: "Spacer", props: { weight: 1 } },
                { type: "Text", props: { text: "Loading...", color: theme.textSecondary } },
                { type: "Spacer", props: { weight: 1 } }
            ]
        });
        return;
    }

    var up = stock.change >= 0;

    // Stats data
    var stats = [
        [St("detail_open"), stockPriceText(stock.open)],
        [St("detail_high"), stockPriceText(stock.high)],
        [St("detail_low"),  stockPriceText(stock.low)],
        [St("detail_vol"),  stock.vol],
        [St("detail_mkt_cap"), stock.cap],
        [St("detail_pe"),   stock.pe.toFixed(1)]
    ];

    // Build stats rows
    var statsRows = [];
    for (var i = 0; i < stats.length; i++) {
        if (i > 0) {
            statsRows.push({ type: "Divider", props: { color: theme.border } });
        }
        statsRows.push({
            type: "Column",
            props: {
                fillMaxWidth: true,
                padding: { horizontal: 16, top: 10, bottom: 10 }
            },
            children: [
                { type: "Text", props: { text: stats[i][0], fontSize: 11, color: theme.textTertiary, padding: { bottom: 2 } } },
                { type: "Text", props: { text: stats[i][1], fontSize: 16, fontWeight: "700", color: theme.textPrimary } }
            ]
        });
    }

    OnTheFly.setUI({
        type: "Column",
        props: { height: "fill", background: theme.primary },
        children: [
            // ── Top bar: back + symbol + bookmark ──
            {
                type: "Row",
                props: {
                    fillMaxWidth: true,
                    padding: { start: 16, end: 16, top: 4, bottom: 8 },
                    crossAlignment: "center"
                },
                children: [
                    {
                        type: "Icon",
                        props: {
                            name: "arrow_back",
                            size: 22,
                            color: theme.textPrimary,
                            onClick: "onBackClick"
                        }
                    },
                    {
                        type: "Text",
                        props: {
                            text: stock.symbol,
                            fontSize: 18,
                            fontWeight: "800",
                            color: theme.textPrimary,
                            weight: 1,
                            textAlign: "center"
                        }
                    },
                    {
                        type: "Box",
                        props: {
                            width: 32,
                            height: 32,
                            contentAlignment: "center",
                            onClick: "onBookmarkToggle"
                        },
                        children: [
                            {
                                type: "Text",
                                props: {
                                    text: bookmarked ? "\u2B50" : "\u2606",
                                    fontSize: 20,
                                    color: bookmarked ? theme.warning : theme.textTertiary
                                }
                            }
                        ]
                    }
                ]
            },

            // ── Scrollable content ──
            {
                type: "Column",
                props: { id: "detail_scroll", fillMaxWidth: true, weight: 1, scrollable: true },
                children: [
                    // Price centered
                    {
                        type: "Column",
                        props: {
                            fillMaxWidth: true,
                            alignment: "center",
                            padding: { top: 8, bottom: 16 }
                        },
                        children: [
                            {
                                type: "Text",
                                props: {
                                    id: "priceText",
                                    text: stockPriceText(stock.price),
                                    fontSize: 32,
                                    fontWeight: "800",
                                    color: theme.textPrimary,
                                    letterSpacing: -1
                                }
                            },
                            {
                                type: "Text",
                                props: {
                                    id: "changeText",
                                    text: stockChangeArrow(stock),
                                    fontSize: 15,
                                    fontWeight: "600",
                                    color: stock.change > 0 ? theme.positive : (stock.change < 0 ? theme.negative : theme.warning)
                                }
                            }
                        ]
                    },

                    // Line chart
                    {
                        type: "Box",
                        props: { padding: { horizontal: 16, bottom: 12 } },
                        children: [
                            {
                                type: "LineChart",
                                props: {
                                    height: 140,
                                    points: generateLinePoints(stock),
                                    lineColor: stock.change > 0 ? theme.positive : (stock.change < 0 ? theme.negative : theme.warning),
                                    background: theme.surfaceVariant,
                                    fillAlpha: 0.25,
                                    lineWidth: 2,
                                    borderRadius: 14
                                }
                            }
                        ]
                    },

                    // Time range buttons
                    {
                        type: "Row",
                        props: {
                            fillMaxWidth: true,
                            alignment: "center",
                            padding: { start: 16, end: 16, bottom: 16 },
                            spacing: 4
                        },
                        children: [
                            buildTimeButton("1D", "1D", theme),
                            buildTimeButton("1W", "1W", theme),
                            buildTimeButton("1M", "1M", theme),
                            buildTimeButton("3M", "3M", theme),
                            buildTimeButton("1Y", "1Y", theme),
                            buildTimeButton("ALL", "ALL", theme)
                        ]
                    },

                    // Stats card
                    {
                        type: "Box",
                        props: { padding: { horizontal: 16, bottom: 16 } },
                        children: [
                            {
                                type: "Column",
                                props: {
                                    fillMaxWidth: true,
                                    borderRadius: 12,
                                    background: theme.card
                                },
                                children: statsRows
                            }
                        ]
                    },

                ]
            },

            // Buy + Sell buttons (pinned to bottom)
            {
                type: "Row",
                props: {
                    fillMaxWidth: true,
                    spacing: 10,
                    padding: { start: 16, end: 16, top: 8, bottom: 16 }
                },
                children: [
                    {
                        type: "Box",
                        props: {
                            weight: 1,
                            background: theme.positive,
                            borderRadius: 10,
                            padding: { vertical: 14 },
                            contentAlignment: "center",
                            onClick: "onBuyClick"
                        },
                        children: [
                            { type: "Text", props: { text: St("buy"), fontSize: 15, fontWeight: "700", color: "#FFFFFF" } }
                        ]
                    },
                    {
                        type: "Box",
                        props: {
                            weight: 1,
                            background: theme.negative,
                            borderRadius: 10,
                            padding: { vertical: 14 },
                            contentAlignment: "center",
                            onClick: "onSellClick"
                        },
                        children: [
                            { type: "Text", props: { text: St("sell"), fontSize: 15, fontWeight: "700", color: "#FFFFFF" } }
                        ]
                    }
                ]
            }
        ]
    });
}

render();

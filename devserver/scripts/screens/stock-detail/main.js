// ═══════════════════════════════════════════════════════════
//  Stock Detail Screen — StockPro
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

function onViewData(data) {
    if (data && data.symbol) {
        currentSymbol = data.symbol;
        stock = findStock(data.symbol);
        bookmarked = isInWatchlist(data.symbol);
        render();

        fetchQuote(data.symbol);
        fetchProfile(data.symbol);
        fetchNewsForSymbol(data.symbol);
        connectFinnhubWS();
    }
}

function onDestroy() {
    if (wsConnected && currentSymbol) {
        unsubscribeTrades(currentSymbol);
        disconnectFinnhubWS();
        wsConnected = false;
    }
}

// ─── API Response Handler ─────────────────────────────────

function onDataReceived(data) {
    if (data.error) {
        OnTheFly.log("Detail API error: " + data.error);
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
                stock = findStock(currentSymbol);
                var up = stock.change >= 0;
                var theme = StockTheme.get();
                OnTheFly.update("priceText", { text: stockPriceText(stock.price) });
                OnTheFly.update("changeText", {
                    text: stockChangeArrow(stock),
                    color: up ? theme.positive : theme.negative
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
        disconnectFinnhubWS();
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
function onRange_1D()  { selectedRange = "1D";  render(); }
function onRange_1W()  { selectedRange = "1W";  render(); }
function onRange_1M()  { selectedRange = "1M";  render(); }
function onRange_3M()  { selectedRange = "3M";  render(); }
function onRange_1Y()  { selectedRange = "1Y";  render(); }
function onRange_ALL() { selectedRange = "ALL"; render(); }

// ─── UI Builders ───────────────────────────────────────────

function buildStatCell(label, value, theme) {
    return {
        type: "Column",
        props: {
            weight: 1,
            background: theme.card,
            padding: { horizontal: 14, vertical: 10 }
        },
        children: [
            {
                type: "Text",
                props: {
                    text: label,
                    fontSize: 11,
                    color: theme.textTertiary,
                    padding: { bottom: 2 }
                }
            },
            {
                type: "Text",
                props: {
                    text: value,
                    fontSize: 14,
                    fontWeight: "semibold",
                    color: theme.textPrimary
                }
            }
        ]
    };
}

function buildTimeButton(label, rangeId, theme) {
    var isActive = (selectedRange === rangeId);
    return {
        type: "Button",
        props: {
            text: label,
            style: isActive ? "filled" : "text",
            background: isActive ? theme.accent : "transparent",
            textColor: isActive ? "#FFFFFF" : theme.textTertiary,
            fontSize: 12,
            fontWeight: isActive ? "semibold" : "semibold",
            cornerRadius: 6,
            padding: { horizontal: 14, vertical: 6 },
            onClick: "onRange_" + rangeId
        }
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
                horizontalAlignment: "center",
                verticalArrangement: "center"
            },
            children: [
                { type: "Text", props: { text: "Loading...", color: theme.textSecondary } }
            ]
        });
        return;
    }

    var up = stock.change >= 0;

    // Stats data: 6 items, 2 per row = 3 rows
    var stats = [
        [St("detail_open"), stockPriceText(stock.open)],
        [St("detail_high"), stockPriceText(stock.high)],
        [St("detail_low"),  stockPriceText(stock.low)],
        [St("detail_vol"),  stock.vol],
        [St("detail_mkt_cap"), stock.cap],
        [St("detail_pe"),   stock.pe.toFixed(1)]
    ];

    // Build stats grid rows (2 columns per row)
    var statsRows = [];
    for (var i = 0; i < stats.length; i += 2) {
        var rowChildren = [buildStatCell(stats[i][0], stats[i][1], theme)];
        if (i + 1 < stats.length) {
            rowChildren.push(buildStatCell(stats[i + 1][0], stats[i + 1][1], theme));
        }
        statsRows.push({
            type: "Row",
            props: {
                fillMaxWidth: true,
                spacing: 1
            },
            children: rowChildren
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
                    verticalAlignment: "center"
                },
                children: [
                    {
                        type: "Button",
                        props: {
                            text: "\u2190",
                            variant: "text",
                            textColor: theme.textPrimary,
                            fontSize: 18,
                            padding: { end: 12 },
                            onClick: "onBackClick"
                        }
                    },
                    {
                        type: "Text",
                        props: {
                            text: stock.symbol,
                            fontSize: 18,
                            fontWeight: "extrabold",
                            color: theme.textPrimary,
                            weight: 1,
                            textAlign: "center"
                        }
                    },
                    {
                        type: "Button",
                        props: {
                            text: bookmarked ? "\u2B50" : "\u2606",
                            variant: "text",
                            textColor: bookmarked ? theme.warning : theme.textTertiary,
                            fontSize: 18,
                            onClick: "onBookmarkToggle"
                        }
                    }
                ]
            },

            // ── Scrollable content ──
            {
                type: "Column",
                props: { fillMaxWidth: true, weight: 1, scrollable: true },
                children: [
                    // Price centered
                    {
                        type: "Column",
                        props: {
                            fillMaxWidth: true,
                            horizontalAlignment: "center",
                            padding: { top: 8, bottom: 16 }
                        },
                        children: [
                            {
                                type: "Text",
                                props: {
                                    id: "priceText",
                                    text: stockPriceText(stock.price),
                                    fontSize: 32,
                                    fontWeight: "extrabold",
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
                                    fontWeight: "semibold",
                                    color: up ? theme.positive : theme.negative
                                }
                            }
                        ]
                    },

                    // Chart placeholder
                    {
                        type: "Box",
                        props: {
                            fillMaxWidth: true,
                            height: 100,
                            background: theme.surfaceVariant,
                            cornerRadius: 14,
                            contentAlignment: "center",
                            margin: { start: 16, end: 16, bottom: 12 },
                            borderColor: theme.border + "20",
                            borderWidth: 1
                        },
                        children: [
                            {
                                type: "Text",
                                props: {
                                    text: "\uD83D\uDCCA Chart",
                                    fontSize: 14,
                                    color: theme.textTertiary
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
                            padding: { start: 16, end: 16, bottom: 16 }
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

                    // Stats grid
                    {
                        type: "Column",
                        props: {
                            fillMaxWidth: true,
                            cornerRadius: 12,
                            background: theme.border + "30",
                            spacing: 1,
                            margin: { start: 16, end: 16, bottom: 16 },
                            clipToBounds: true
                        },
                        children: statsRows
                    },

                    // Buy + Sell buttons
                    {
                        type: "Row",
                        props: {
                            fillMaxWidth: true,
                            spacing: 10,
                            padding: { start: 16, end: 16, bottom: 24 }
                        },
                        children: [
                            {
                                type: "Button",
                                props: {
                                    text: St("buy"),
                                    variant: "filled",
                                    background: theme.positive,
                                    textColor: "#FFFFFF",
                                    fontSize: 15,
                                    fontWeight: "bold",
                                    cornerRadius: 10,
                                    weight: 1,
                                    padding: { vertical: 13 },
                                    onClick: "onBuyClick"
                                }
                            },
                            {
                                type: "Button",
                                props: {
                                    text: St("sell"),
                                    variant: "filled",
                                    background: theme.negative,
                                    textColor: "#FFFFFF",
                                    fontSize: 15,
                                    fontWeight: "bold",
                                    cornerRadius: 10,
                                    weight: 1,
                                    padding: { vertical: 13 },
                                    onClick: "onSellClick"
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    });
}

render();

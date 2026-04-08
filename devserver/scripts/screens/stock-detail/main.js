// ═══════════════════════════════════════════════════════════
//  Stock Detail Screen — StockPro
// ═══════════════════════════════════════════════════════════

var stock = null;
var currentSymbol = "";
var bookmarked = false;
var selectedRange = "1M";
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

        // Fetch real-time quote from Finnhub
        fetchQuote(data.symbol);
        fetchProfile(data.symbol);
        // Fetch related news from Marketaux
        fetchNewsForSymbol(data.symbol);
        // Connect WebSocket for live trades
        connectFinnhubWS();
    }
}

function onDestroy() {
    // Clean up WebSocket on leave
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

    // Finnhub quote
    if (data.requestId === "quote_" + currentSymbol) {
        var parsed = parseFinnhubQuote(currentSymbol, data.body);
        if (parsed) {
            upsertStock(parsed);
            stock = findStock(currentSymbol);
            render();
        }
    }

    // Finnhub company profile
    if (data.requestId === "profile_" + currentSymbol) {
        parseFinnhubProfile(currentSymbol, data.body);
        stock = findStock(currentSymbol);
        render();
    }

    // Marketaux related news
    if (data.requestId === "news_" + currentSymbol) {
        var newsData = parseMarketauxNews(data.body);
        if (newsData.length > 0) {
            // Store as related news for this symbol
            AppState.set("news_" + currentSymbol, newsData);
            render();
        }
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
                // Update price display without full re-render
                var up = stock.change >= 0;
                var theme = StockTheme.get();
                OnTheFly.update("priceText", { text: stockPriceText(stock.price) });
                OnTheFly.update("changeText", { text: stockChangeArrow(stock), color: up ? theme.positive : theme.negative });
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

function buildStatBox(label, value, theme) {
    return {
        type: "Column",
        props: {
            backgroundColor: theme.card,
            cornerRadius: 10,
            borderColor: theme.border,
            borderWidth: 1,
            padding: { horizontal: 11, vertical: 9 }
        },
        children: [
            { type: "Text", props: { text: label, fontSize: 10, color: theme.textTertiary } },
            { type: "Text", props: { text: value, fontSize: 13, fontWeight: "bold", color: theme.textPrimary } }
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
            backgroundColor: isActive ? theme.accent : "transparent",
            textColor: isActive ? theme.primary : theme.textTertiary,
            fontSize: 11,
            fontWeight: isActive ? "bold" : "normal",
            cornerRadius: 8,
            padding: { horizontal: 12, vertical: 6 },
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
            props: { fillMaxSize: true, backgroundColor: theme.primary, horizontalAlignment: "center", verticalArrangement: "center" },
            children: [
                { type: "Text", props: { text: "Loading...", color: theme.textSecondary } }
            ]
        });
        return;
    }

    var up = stock.change >= 0;
    // Check for API-fetched related news first, fallback to mock
    var apiNews = AppState.get("news_" + stock.symbol, null);
    var relatedNews = (apiNews && apiNews.length > 0) ? apiNews : getNewsForStock(stock.symbol);

    // Stats grid data
    var stats = [
        [St("detail_open"),     "$" + stock.open],
        [St("detail_high"),     "$" + stock.high],
        [St("detail_low"),      "$" + stock.low],
        [St("detail_vol"),      stock.vol],
        [St("detail_pe"),       stock.pe.toFixed(1)],
        [St("detail_mkt_cap"),  "$" + stock.cap],
        [St("detail_52w_high"), "$" + stock.w52h],
        [St("detail_52w_low"),  "$" + stock.w52l]
    ];

    // Build stats grid rows (2 columns)
    var statsRows = [];
    for (var i = 0; i < stats.length; i += 2) {
        var rowChildren = [buildStatBox(stats[i][0], stats[i][1], theme)];
        if (i + 1 < stats.length) {
            rowChildren.push(buildStatBox(stats[i + 1][0], stats[i + 1][1], theme));
        }
        statsRows.push({
            type: "Row",
            props: { fillMaxWidth: true, spacing: 7 },
            children: rowChildren
        });
    }

    // Build related news
    var newsChildren = [];
    if (relatedNews.length === 0) {
        newsChildren.push({ type: "Text", props: { text: St("no_related_news"), fontSize: 12, color: theme.textTertiary, textAlign: "center", padding: 16 } });
    } else {
        for (var j = 0; j < relatedNews.length; j++) {
            var n = relatedNews[j];
            newsChildren.push({
                type: "Column",
                props: {
                    fillMaxWidth: true,
                    backgroundColor: theme.card,
                    cornerRadius: 10,
                    borderColor: theme.border,
                    borderWidth: 1,
                    padding: { horizontal: 12, vertical: 10 }
                },
                children: [
                    { type: "Text", props: { text: n.title, fontSize: 12, fontWeight: "medium", color: theme.textPrimary, lineHeight: 1.4 } },
                    { type: "Text", props: { text: n.src + " · " + n.time, fontSize: 10, color: theme.textTertiary, padding: { top: 3 } } }
                ]
            });
            if (j < relatedNews.length - 1) {
                newsChildren.push({ type: "Spacer", props: { height: 7 } });
            }
        }
    }

    OnTheFly.setUI({
        type: "Column",
        props: { fillMaxSize: true, backgroundColor: theme.primary },
        children: [
            // Top bar
            {
                type: "Row",
                props: {
                    fillMaxWidth: true,
                    padding: { start: 20, end: 20, top: 8 },
                    verticalAlignment: "center"
                },
                children: [
                    {
                        type: "Button",
                        props: {
                            text: "‹",
                            style: "outlined",
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                            borderWidth: 1,
                            textColor: theme.textSecondary,
                            fontSize: 16,
                            cornerRadius: 10,
                            onClick: "onBackClick"
                        }
                    },
                    { type: "Text", props: { text: stock.symbol, fontSize: 16, fontWeight: "bold", color: theme.textPrimary, weight: 1, textAlign: "center" } },
                    {
                        type: "Button",
                        props: {
                            text: bookmarked ? "★" : "☆",
                            style: "outlined",
                            borderColor: bookmarked ? theme.warning + "33" : theme.border,
                            borderWidth: 1,
                            backgroundColor: bookmarked ? theme.warning + "15" : "transparent",
                            textColor: bookmarked ? theme.warning : theme.textTertiary,
                            fontSize: 14,
                            cornerRadius: 10,
                            onClick: "onBookmarkToggle"
                        }
                    }
                ]
            },

            // Scrollable content
            {
                type: "Column",
                props: { fillMaxWidth: true, weight: 1, scrollable: true },
                children: [
                    // Price section
                    {
                        type: "Column",
                        props: { fillMaxWidth: true, padding: { horizontal: 20, top: 14 } },
                        children: [
                            { type: "Text", props: { text: stock.name, fontSize: 11, color: theme.textTertiary } },
                            {
                                type: "Row",
                                props: { verticalAlignment: "baseline", padding: { top: 3 } },
                                children: [
                                    { type: "Text", props: { id: "priceText", text: stockPriceText(stock.price), fontSize: 32, fontWeight: "bold", color: theme.textPrimary, letterSpacing: -1.5 } },
                                    { type: "Spacer", props: { width: 10 } },
                                    { type: "Text", props: {
                                        id: "changeText",
                                        text: stockChangeArrow(stock),
                                        fontSize: 14,
                                        fontWeight: "bold",
                                        color: up ? theme.positive : theme.negative
                                    }}
                                ]
                            },
                            {
                                type: "Row",
                                props: { verticalAlignment: "center", padding: { top: 5 } },
                                children: [
                                    { type: "Text", props: { text: "● " + St("real_time") + " · WebSocket", fontSize: 10, color: theme.accent } }
                                ]
                            }
                        ]
                    },

                    { type: "Spacer", props: { height: 14 } },

                    // Chart card
                    {
                        type: "Column",
                        props: {
                            fillMaxWidth: true,
                            backgroundColor: theme.card,
                            cornerRadius: 16,
                            borderColor: theme.border,
                            borderWidth: 1,
                            padding: 14,
                            margin: { horizontal: 20 }
                        },
                        children: [
                            {
                                type: "Box",
                                props: {
                                    fillMaxWidth: true,
                                    height: 140,
                                    backgroundColor: theme.surfaceVariant,
                                    cornerRadius: 12,
                                    contentAlignment: "center"
                                },
                                children: [
                                    { type: "Text", props: { text: "📊 Chart — " + selectedRange, fontSize: 14, color: theme.textTertiary } }
                                ]
                            },
                            { type: "Spacer", props: { height: 10 } },
                            // Time range buttons inside chart card
                            {
                                type: "Row",
                                props: { fillMaxWidth: true, horizontalArrangement: "spaceEvenly" },
                                children: [
                                    buildTimeButton("1D", "1D", theme),
                                    buildTimeButton("1W", "1W", theme),
                                    buildTimeButton("1M", "1M", theme),
                                    buildTimeButton("3M", "3M", theme),
                                    buildTimeButton("1Y", "1Y", theme),
                                    buildTimeButton("ALL", "ALL", theme)
                                ]
                            }
                        ]
                    },

                    { type: "Spacer", props: { height: 14 } },

                    // Statistics
                    {
                        type: "Column",
                        props: { fillMaxWidth: true, padding: { horizontal: 20 } },
                        children: [
                            { type: "Text", props: { text: St("statistics"), fontSize: 16, fontWeight: "bold", color: theme.textPrimary, padding: { bottom: 8 } } },
                            {
                                type: "Column",
                                props: { fillMaxWidth: true, spacing: 7 },
                                children: statsRows
                            }
                        ]
                    },

                    { type: "Spacer", props: { height: 14 } },

                    // Related News
                    {
                        type: "Column",
                        props: { fillMaxWidth: true, padding: { horizontal: 20 } },
                        children: [
                            { type: "Text", props: { text: St("related_news"), fontSize: 16, fontWeight: "bold", color: theme.textPrimary, padding: { bottom: 8 } } }
                        ].concat(newsChildren)
                    },

                    { type: "Spacer", props: { height: 30 } }
                ]
            }
        ]
    });
}

render();

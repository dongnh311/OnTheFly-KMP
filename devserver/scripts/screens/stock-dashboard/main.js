// ═══════════════════════════════════════════════════════════
//  Dashboard Screen — StockPro
// ═══════════════════════════════════════════════════════════

var quotesLoaded = 0;
var quotesTotal = 0;
var dataReady = false;

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render();

    var symbols = [];
    for (var i = 0; i < StockData.stocks.length; i++) {
        symbols.push(StockData.stocks[i].symbol);
    }
    quotesTotal = symbols.length;
    quotesLoaded = 0;
    fetchQuotes(symbols);
    fetchNews();
}

function onVisible() {
    if (dataReady) {
        recalcPortfolio();
        render();
    }
}

// ─── API Response Handler ─────────────────────────────────

function onDataReceived(data) {
    if (data.error) {
        OnTheFly.log("Dashboard API error: " + data.error);
        return;
    }

    if (data.requestId && data.requestId.indexOf("quote_") === 0) {
        var symbol = data.requestId.substring(6);
        var parsed = parseFinnhubQuote(symbol, data.body);
        if (parsed) {
            upsertStock(parsed);
            quotesLoaded++;
            if (quotesLoaded >= quotesTotal) {
                dataReady = true;
                recalcPortfolio();
                render();
            }
        }
    }

    if (data.requestId === "news_all") {
        var newsResult = parseMarketauxNews(data.body);
        if (newsResult.length > 0) {
            StockData.news = newsResult;
            render();
        }
    }
}

// ─── Portfolio Recalculation ──────────────────────────────

function recalcPortfolio() {
    var totalChange = 0;
    var totalValue = 0;
    for (var i = 0; i < StockData.stocks.length; i++) {
        var s = StockData.stocks[i];
        totalValue += s.price;
        totalChange += s.change;
    }
    if (totalValue > 0) {
        StockData.portfolio.dayChange = totalChange;
        StockData.portfolio.dayChangePct = (totalChange / (totalValue - totalChange)) * 100;
    }
}

// ─── Navigation ────────────────────────────────────────────

function onAccountClick() {
    navigate("stock-account");
}

function onNavTab_dashboard() { /* already here */ }
function onNavTab_chart()     { OnTheFly.sendToNative("navigateReplace", { screen: "stock-chart" }); }
function onNavTab_watchlist() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-watchlist" }); }
function onNavTab_search()    { OnTheFly.sendToNative("navigateReplace", { screen: "stock-search" }); }
function onNavTab_news()      { OnTheFly.sendToNative("navigateReplace", { screen: "stock-news" }); }

function onSeeAllTrending() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-watchlist" }); }

// ─── Stock tap handlers ────────────────────────────────────

function onStockTap_AAPL()  { navigate("stock-detail", { symbol: "AAPL" }); }
function onStockTap_TSLA()  { navigate("stock-detail", { symbol: "TSLA" }); }
function onStockTap_MSFT()  { navigate("stock-detail", { symbol: "MSFT" }); }
function onStockTap_GOOGL() { navigate("stock-detail", { symbol: "GOOGL" }); }
function onStockTap_AMZN()  { navigate("stock-detail", { symbol: "AMZN" }); }
function onStockTap_NVDA()  { navigate("stock-detail", { symbol: "NVDA" }); }
function onStockTap_META()  { navigate("stock-detail", { symbol: "META" }); }
function onStockTap_NFLX()  { navigate("stock-detail", { symbol: "NFLX" }); }
function onStockTap_AMD()   { navigate("stock-detail", { symbol: "AMD" }); }

// ─── UI Builders ───────────────────────────────────────────

function buildTopBar(theme) {
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            padding: { start: 16, end: 16, top: 4, bottom: 12 },
            verticalAlignment: "center",
            alignment: "spaceBetween"
        },
        children: [
            {
                type: "Text",
                props: {
                    text: St("dashboard_title"),
                    fontSize: 22,
                    fontWeight: "800",
                    color: theme.textPrimary,
                    width: "wrap"
                }
            },
            {
                type: "Box",
                props: {
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    background: theme.accent,
                    contentAlignment: "center",
                    onClick: "onAccountClick"
                },
                children: [
                    { type: "Icon", props: { name: "person", size: 20, color: "#FFFFFF" } }
                ]
            }
        ]
    };
}

function buildPortfolioCard(theme) {
    var portfolio = StockData.portfolio;
    var up = portfolio.dayChange >= 0;
    var changeColor = up ? theme.positive : theme.negative;
    var changeSign = up ? "+" : "";
    var badgeBg = "#33" + changeColor.replace("#", "");

    return {
        type: "Column",
        props: {
            fillMaxWidth: true,
            padding: 20,
            borderRadius: 14,
            background: theme.card,
            borderColor: theme.border,
            borderWidth: 1
        },
        children: [
            {
                type: "Text",
                props: {
                    text: St("portfolio_value"),
                    fontSize: 12,
                    color: theme.textSecondary
                }
            },
            {
                type: "Text",
                props: {
                    text: "$" + formatNumber(formatDecimal(portfolio.totalValue, 2)),
                    fontSize: 28,
                    fontWeight: "800",
                    color: theme.textPrimary,
                    letterSpacing: -1
                }
            },
            {
                type: "Row",
                props: {
                    spacing: 8,
                    padding: { top: 6 }
                },
                children: [
                    {
                        type: "Text",
                        props: {
                            text: changeSign + "$" + formatDecimal(Math.abs(portfolio.dayChange), 2),
                            fontSize: 14,
                            fontWeight: "600",
                            color: changeColor
                        }
                    },
                    {
                        type: "Box",
                        props: {
                            width: "wrap",
                            background: badgeBg,
                            borderRadius: 4,
                            padding: { horizontal: 6, vertical: 2 }
                        },
                        children: [
                            {
                                type: "Text",
                                props: {
                                    text: fmtPct(portfolio.dayChangePct),
                                    fontSize: 12,
                                    color: changeColor
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    };
}

function buildSectionHeader(title, actionText, actionHandler, theme) {
    var children = [
        {
            type: "Text",
            props: {
                text: title,
                fontSize: 17,
                fontWeight: "700",
                color: theme.textPrimary,
                width: "wrap"
            }
        }
    ];
    if (actionText) {
        children.push({
            type: "Text",
            props: {
                text: actionText,
                fontSize: 12,
                color: theme.accent,
                width: "wrap",
                onClick: actionHandler
            }
        });
    }
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            padding: { start: 16, end: 16, top: 16, bottom: 8 },
            verticalAlignment: "center",
            alignment: "spaceBetween"
        },
        children: children
    };
}

function buildTrendingCards(theme) {
    var items = [];
    var count = Math.min(StockData.stocks.length, 5);
    for (var i = 0; i < count; i++) {
        var s = StockData.stocks[i];
        var up = s.change >= 0;
        items.push({
            type: "Column",
            props: {
                width: 130,
                padding: { start: 14, end: 14, top: 12, bottom: 12 },
                borderRadius: 12,
                background: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
                onClick: "onStockTap_" + s.symbol
            },
            children: [
                {
                    type: "Text",
                    props: {
                        text: s.symbol,
                        fontSize: 14,
                        fontWeight: "700",
                        color: theme.textPrimary
                    }
                },
                {
                    type: "Text",
                    props: {
                        text: s.name,
                        fontSize: 10,
                        color: theme.textSecondary
                    }
                },
                { type: "Spacer", props: { height: 10 } },
                {
                    type: "Text",
                    props: {
                        text: stockPriceText(s.price),
                        fontSize: 15,
                        fontWeight: "700",
                        color: theme.textPrimary
                    }
                },
                {
                    type: "Text",
                    props: {
                        text: fmtPct(s.pct),
                        fontSize: 11,
                        color: up ? theme.positive : theme.negative
                    }
                }
            ]
        });
    }
    return {
        type: "Row",
        props: { id: "trending_scroll", scrollable: true, padding: { start: 16, end: 16 }, spacing: 10 },
        children: items
    };
}

function buildStockRow(stock, theme) {
    var up = stock.change >= 0;
    var changeSign = up ? "+" : "";
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            padding: { start: 16, end: 16, top: 12, bottom: 12 },
            verticalAlignment: "center",
            onClick: "onStockTap_" + stock.symbol
        },
        children: [
            {
                type: "Column",
                props: { weight: 1 },
                children: [
                    {
                        type: "Text",
                        props: {
                            text: stock.symbol,
                            fontSize: 15,
                            fontWeight: "700",
                            color: theme.textPrimary
                        }
                    },
                    {
                        type: "Text",
                        props: {
                            text: stock.name,
                            fontSize: 12,
                            color: theme.textSecondary
                        }
                    }
                ]
            },
            {
                type: "Column",
                props: { alignment: "end", width: "wrap" },
                children: [
                    {
                        type: "Text",
                        props: {
                            text: stockPriceText(stock.price),
                            fontSize: 15,
                            fontWeight: "600",
                            color: theme.textPrimary
                        }
                    },
                    {
                        type: "Text",
                        props: {
                            text: changeSign + stock.change.toFixed(2) + " (" + fmtPct(stock.pct) + ")",
                            fontSize: 12,
                            color: up ? theme.positive : theme.negative
                        }
                    }
                ]
            }
        ]
    };
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();

    var scrollContent = [];

    // Portfolio card (wrapped with horizontal padding)
    scrollContent.push({
        type: "Box",
        props: { padding: { horizontal: 16, bottom: 16 } },
        children: [buildPortfolioCard(theme)]
    });

    // Trending header + See All
    scrollContent.push(buildSectionHeader(St("trending"), St("see_all"), "onSeeAllTrending", theme));

    // Horizontal scroll cards — first 5 stocks
    scrollContent.push(buildTrendingCards(theme));

    // Top Movers header
    scrollContent.push(buildSectionHeader(St("top_movers"), null, null, theme));

    // All 8 stock list rows
    for (var i = 0; i < StockData.stocks.length; i++) {
        if (i > 0) {
            scrollContent.push({ type: "Divider", props: { color: theme.border + "30" } });
        }
        scrollContent.push(buildStockRow(StockData.stocks[i], theme));
    }

    OnTheFly.setUI({
        type: "Column",
        props: { height: "fill", background: theme.primary },
        children: [
            buildTopBar(theme),
            {
                type: "Column",
                props: { id: "dashboard_scroll", fillMaxWidth: true, weight: 1, scrollable: true },
                children: scrollContent
            },
            buildStockBottomNav("dashboard", theme)
        ]
    });
}

render();

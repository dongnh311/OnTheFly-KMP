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
            verticalAlignment: "center"
        },
        children: [
            {
                type: "Text",
                props: {
                    text: St("dashboard_title"),
                    fontSize: 22,
                    fontWeight: "800",
                    color: theme.textPrimary,
                    weight: 1
                }
            },
            {
                type: "Column",
                props: {
                    width: 32,
                    height: 32,
                    cornerRadius: 16,
                    background: theme.accent,
                    horizontalAlignment: "center",
                    verticalArrangement: "center",
                    onClick: "onAccountClick"
                },
                children: [
                    { type: "Text", props: { text: "\uD83D\uDC64", fontSize: 14 } }
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
    var badgeBg = changeColor + "20";

    return {
        type: "Column",
        props: {
            fillMaxWidth: true,
            padding: 20,
            cornerRadius: 16,
            background: theme.card,
            borderColor: theme.border + "30",
            borderWidth: 1,
            margin: { start: 16, end: 16, bottom: 16 }
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
                            background: badgeBg,
                            cornerRadius: 4,
                            padding: { horizontal: 6, vertical: 1 }
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
                weight: 1
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
                onClick: actionHandler
            }
        });
    }
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            padding: { start: 16, end: 16, bottom: 8 },
            verticalAlignment: "center"
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
                cornerRadius: 12,
                background: theme.card,
                borderColor: theme.border + "30",
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
                        color: theme.textSecondary,
                        padding: { bottom: 8 }
                    }
                },
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
        type: "LazyRow",
        props: { padding: { horizontal: 16, bottom: 16 }, spacing: 10 },
        items: items
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
            onClick: "onStockTap_" + stock.symbol,
            borderColor: theme.border + "20",
            borderWidth: 1
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
                props: { horizontalAlignment: "end" },
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

function buildBottomNav(activeTab, theme) {
    var tabs = [
        { id: "dashboard", icon: "\uD83C\uDFE0", label: St("nav_home") },
        { id: "watchlist", icon: "\u2B50",         label: St("nav_watchlist") },
        { id: "search",    icon: "\uD83D\uDD0D",  label: St("nav_search") },
        { id: "news",      icon: "\uD83D\uDCF0",  label: St("nav_news") }
    ];
    var children = [];
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        var isActive = (tab.id === activeTab);
        children.push({
            type: "Column",
            props: {
                weight: 1,
                horizontalAlignment: "center",
                padding: { vertical: 8 },
                onClick: "onNavTab_" + tab.id
            },
            children: [
                {
                    type: "Text",
                    props: {
                        text: tab.icon,
                        fontSize: 20,
                        opacity: isActive ? 1.0 : 0.5
                    }
                },
                {
                    type: "Text",
                    props: {
                        text: tab.label,
                        fontSize: 10,
                        color: isActive ? theme.accent : theme.textTertiary,
                        fontWeight: isActive ? "bold" : "normal",
                        opacity: isActive ? 1.0 : 0.5
                    }
                }
            ]
        });
    }
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            background: theme.navBar,
            padding: { top: 4, bottom: 8 },
            borderColor: theme.border,
            borderWidth: 1
        },
        children: children
    };
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();

    var scrollContent = [];

    // Portfolio card
    scrollContent.push(buildPortfolioCard(theme));

    // Trending header + See All
    scrollContent.push(buildSectionHeader(St("trending"), St("see_all"), "onSeeAllTrending", theme));

    // Horizontal scroll cards — first 5 stocks
    scrollContent.push(buildTrendingCards(theme));

    // Top Movers header
    scrollContent.push(buildSectionHeader(St("top_movers"), null, null, theme));

    // All 8 stock list rows
    for (var i = 0; i < StockData.stocks.length; i++) {
        scrollContent.push(buildStockRow(StockData.stocks[i], theme));
    }

    OnTheFly.setUI({
        type: "Column",
        props: { height: "fill", background: theme.primary },
        children: [
            buildTopBar(theme),
            {
                type: "Column",
                props: { fillMaxWidth: true, weight: 1, scrollable: true },
                children: scrollContent
            },
            buildBottomNav("dashboard", theme)
        ]
    });
}

render();

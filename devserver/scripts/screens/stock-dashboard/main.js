// ═══════════════════════════════════════════════════════════
//  Dashboard Screen — StockPro
// ═══════════════════════════════════════════════════════════

var quotesLoaded = 0;
var quotesTotal = 0;
var dataReady = false;

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render(); // show with mock data first

    // Fetch real data from Finnhub
    var symbols = [];
    for (var i = 0; i < StockData.stocks.length; i++) {
        symbols.push(StockData.stocks[i].symbol);
    }
    quotesTotal = symbols.length;
    quotesLoaded = 0;
    fetchQuotes(symbols);
    fetchIndices();
    fetchNews(); // Marketaux for latest news
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

    // Finnhub stock quotes
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

    // Index ETF quotes
    if (data.requestId && data.requestId.indexOf("index_") === 0) {
        var etf = data.requestId.substring(6);
        updateIndexFromQuote(etf, data.body);
        render();
    }

    // Marketaux news
    if (data.requestId === "news_all") {
        var parsed = parseMarketauxNews(data.body);
        if (parsed.length > 0) {
            StockData.news = parsed;
            render();
        }
    }
}

// ─── Navigation ────────────────────────────────────────────

function onAccountClick() {
    navigate("stock-account");
}

function onNavTab_dashboard() { /* already here */ }
function onNavTab_watchlist() { navigate("stock-watchlist"); }
function onNavTab_search() { navigate("stock-search"); }
function onNavTab_news() { navigate("stock-news"); }

function onSeeAllWatchlist() { navigate("stock-watchlist"); }
function onSeeAllNews() { navigate("stock-news"); }

// ─── Stock tap handlers ────────────────────────────────────

function onStockTap_AAPL()  { navigate("stock-detail", { symbol: "AAPL" }); }
function onStockTap_TSLA()  { navigate("stock-detail", { symbol: "TSLA" }); }
function onStockTap_MSFT()  { navigate("stock-detail", { symbol: "MSFT" }); }
function onStockTap_GOOGL() { navigate("stock-detail", { symbol: "GOOGL" }); }
function onStockTap_AMZN()  { navigate("stock-detail", { symbol: "AMZN" }); }
function onStockTap_NVDA()  { navigate("stock-detail", { symbol: "NVDA" }); }
function onStockTap_META()  { navigate("stock-detail", { symbol: "META" }); }
function onStockTap_NFLX()  { navigate("stock-detail", { symbol: "NFLX" }); }

// ─── UI Builders ───────────────────────────────────────────

function buildTopBar(theme) {
    var user = AppState.getUserName();
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            padding: { start: 20, end: 20, top: 12 },
            verticalAlignment: "center"
        },
        children: [
            // Logo
            { type: "Text", props: { text: "\uD83D\uDCC8", fontSize: 28, padding: { end: 10 } } },
            {
                type: "Column",
                props: { weight: 1 },
                children: [
                    { type: "Text", props: { text: St("good_morning") + (user !== "Guest" ? ", " + user : ""), fontSize: 11, color: theme.textSecondary } },
                    { type: "Text", props: { text: St("dashboard_title"), fontSize: 18, fontWeight: "bold", color: theme.textPrimary, letterSpacing: -0.5 } }
                ]
            },
            {
                type: "Button",
                props: {
                    text: user !== "Guest" ? user.charAt(0).toUpperCase() : "U",
                    style: "outlined",
                    borderColor: theme.accent,
                    textColor: theme.accent,
                    fontSize: 13,
                    fontWeight: "bold",
                    cornerRadius: 17,
                    onClick: "onAccountClick"
                }
            }
        ]
    };
}

function buildIndices(theme) {
    var items = [];
    for (var i = 0; i < StockData.indices.length; i++) {
        var idx = StockData.indices[i];
        items.push({
            type: "Column",
            props: {
                backgroundColor: theme.card,
                cornerRadius: 12,
                padding: { horizontal: 12, vertical: 10 },
                width: 120,
                borderColor: theme.border,
                borderWidth: 1
            },
            children: [
                { type: "Text", props: { text: idx.name, fontSize: 10, color: theme.textTertiary, fontWeight: "medium" } },
                { type: "Text", props: { text: idx.val, fontSize: 15, fontWeight: "bold", color: theme.textPrimary } },
                { type: "Text", props: { text: idx.chg, fontSize: 11, fontWeight: "semibold", color: idx.up ? theme.positive : theme.negative } }
            ]
        });
    }
    return {
        type: "LazyRow",
        props: { padding: { horizontal: 20, vertical: 14 }, spacing: 8 },
        items: items
    };
}

function buildSectionHeader(title, actionText, actionHandler, theme) {
    var children = [
        { type: "Text", props: { text: title, fontSize: 16, fontWeight: "bold", color: theme.textPrimary, weight: 1 } }
    ];
    if (actionText) {
        children.push({
            type: "Button",
            props: { text: "See all \u2192", style: "text", textColor: theme.accent, fontSize: 12, fontWeight: "medium", onClick: actionHandler }
        });
    }
    return {
        type: "Row",
        props: { fillMaxWidth: true, padding: { horizontal: 20, vertical: 8 }, verticalAlignment: "center" },
        children: children
    };
}

function buildStockRow(stock, theme) {
    var up = stock.change >= 0;
    var badgeBg = up ? (theme.accent + "12") : (theme.negative + "12");
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            padding: { horizontal: 20, vertical: 13 },
            verticalAlignment: "center",
            onClick: "onStockTap_" + stock.symbol
        },
        children: [
            // Symbol badge
            {
                type: "Box",
                props: {
                    width: 42, height: 42, cornerRadius: 12,
                    backgroundColor: badgeBg,
                    contentAlignment: "center"
                },
                children: [
                    { type: "Text", props: { text: stock.symbol.substring(0, 2), fontSize: 12, fontWeight: "bold", color: up ? theme.positive : theme.negative } }
                ]
            },
            { type: "Spacer", props: { width: 12 } },
            // Name
            {
                type: "Column",
                props: { weight: 1 },
                children: [
                    { type: "Text", props: { text: stock.symbol, fontSize: 14, fontWeight: "semibold", color: theme.textPrimary } },
                    { type: "Text", props: { text: stock.name, fontSize: 11, color: theme.textTertiary, maxLines: 1 } }
                ]
            },
            // Price
            {
                type: "Column",
                props: { horizontalAlignment: "end" },
                children: [
                    { type: "Text", props: { text: stockPriceText(stock.price), fontSize: 14, fontWeight: "bold", color: theme.textPrimary } },
                    { type: "Text", props: { text: (up ? "+" : "") + stock.pct.toFixed(2) + "%", fontSize: 11, fontWeight: "semibold", color: up ? theme.positive : theme.negative } }
                ]
            }
        ]
    };
}

function buildTopMovers(theme) {
    var movers = getTopMovers();
    var items = [];
    for (var i = 0; i < movers.length; i++) {
        var s = movers[i];
        var up = s.change >= 0;
        items.push({
            type: "Column",
            props: {
                backgroundColor: theme.card,
                cornerRadius: 14,
                padding: 12,
                width: 115,
                borderColor: theme.border,
                borderWidth: 1,
                onClick: "onStockTap_" + s.symbol
            },
            children: [
                { type: "Text", props: { text: s.symbol, fontSize: 13, fontWeight: 800, color: theme.textPrimary } },
                { type: "Text", props: { text: stockPriceText(s.price), fontSize: 16, fontWeight: "bold", color: theme.textPrimary, margin: { vertical: 5 } } },
                {
                    type: "Box",
                    props: {
                        backgroundColor: up ? (theme.accent + "18") : (theme.negative + "18"),
                        cornerRadius: 6,
                        padding: { horizontal: 8, vertical: 3 }
                    },
                    children: [
                        { type: "Text", props: { text: (up ? "+" : "") + s.pct.toFixed(2) + "%", fontSize: 11, fontWeight: "bold", color: up ? theme.positive : theme.negative } }
                    ]
                }
            ]
        });
    }
    return {
        type: "LazyRow",
        props: { padding: { horizontal: 20 }, spacing: 8 },
        items: items
    };
}

function buildNewsItem(news, theme) {
    var children = [];
    // Tags row
    var tagChildren = [];
    if (news.sym) {
        tagChildren.push({
            type: "Box",
            props: { backgroundColor: theme.accentDim, cornerRadius: 4, padding: { horizontal: 6, vertical: 2 } },
            children: [
                { type: "Text", props: { text: news.sym, fontSize: 10, fontWeight: "bold", color: theme.accent } }
            ]
        });
    }
    tagChildren.push({
        type: "Text",
        props: {
            text: (news.bull ? "\u25B2 bullish" : "\u25BC bearish"),
            fontSize: 10,
            fontWeight: "semibold",
            color: news.bull ? theme.positive : theme.negative
        }
    });
    children.push({
        type: "Row",
        props: { spacing: 6, padding: { bottom: 4 } },
        children: tagChildren
    });
    children.push({ type: "Text", props: { text: news.title, fontSize: 13, fontWeight: "medium", color: theme.textPrimary, lineHeight: 1.4 } });
    children.push({ type: "Text", props: { text: news.src + " \u00B7 " + news.time, fontSize: 10, color: theme.textTertiary, padding: { top: 3 } } });

    return {
        type: "Column",
        props: { fillMaxWidth: true, padding: { horizontal: 20, vertical: 11 } },
        children: children
    };
}

function buildBottomNav(activeTab, theme) {
    var tabs = [
        { id: "dashboard", icon: "\uD83C\uDFE0", label: St("nav_home") },
        { id: "watchlist", icon: "\uD83D\uDCC8", label: St("nav_watchlist") },
        { id: "search",    icon: "\uD83D\uDD0D", label: St("nav_search") },
        { id: "news",      icon: "\uD83D\uDCF0", label: St("nav_news") }
    ];
    var children = [];
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        var isActive = (tab.id === activeTab);
        var tabChildren = [
            { type: "Text", props: { text: tab.icon, fontSize: 20 } },
            { type: "Text", props: {
                text: tab.label,
                fontSize: 9,
                color: isActive ? theme.accent : theme.textTertiary,
                fontWeight: isActive ? "bold" : "normal"
            }}
        ];
        // Active dot indicator below label
        if (isActive) {
            tabChildren.push({
                type: "Box",
                props: {
                    width: 4,
                    height: 4,
                    cornerRadius: 2,
                    backgroundColor: theme.accent,
                    margin: { top: 2 }
                }
            });
        }
        children.push({
            type: "Column",
            props: {
                weight: 1,
                horizontalAlignment: "center",
                padding: { vertical: 8 },
                onClick: "onNavTab_" + tab.id
            },
            children: tabChildren
        });
    }
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            backgroundColor: theme.navBar,
            horizontalArrangement: "spaceEvenly",
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
    var watchlistStocks = getWatchlistStocks();

    // Watchlist rows (max 4)
    var stockRows = [];
    var showCount = Math.min(watchlistStocks.length, 4);
    for (var i = 0; i < showCount; i++) {
        stockRows.push(buildStockRow(watchlistStocks[i], theme));
    }

    // News items (max 3)
    var newsItems = [];
    var newsData = StockData.news;
    var newsCount = Math.min(newsData.length, 3);
    for (var j = 0; j < newsCount; j++) {
        newsItems.push(buildNewsItem(newsData[j], theme));
    }

    var scrollContent = [];

    // Indices
    scrollContent.push(buildIndices(theme));

    // Watchlist section
    scrollContent.push({ type: "Spacer", props: { height: 12 } });
    scrollContent.push(buildSectionHeader(St("nav_watchlist"), St("see_all"), "onSeeAllWatchlist", theme));
    for (var k = 0; k < stockRows.length; k++) {
        scrollContent.push(stockRows[k]);
    }

    // Top Movers section
    scrollContent.push({ type: "Spacer", props: { height: 4 } });
    scrollContent.push(buildSectionHeader(St("top_movers"), null, null, theme));
    scrollContent.push(buildTopMovers(theme));

    // News section
    scrollContent.push({ type: "Spacer", props: { height: 4 } });
    scrollContent.push(buildSectionHeader(St("latest_news"), St("see_all"), "onSeeAllNews", theme));
    for (var m = 0; m < newsItems.length; m++) {
        scrollContent.push(newsItems[m]);
    }

    // Bottom padding for nav
    scrollContent.push({ type: "Spacer", props: { height: 70 } });

    OnTheFly.setUI({
        type: "Column",
        props: { fillMaxSize: true, backgroundColor: theme.primary },
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

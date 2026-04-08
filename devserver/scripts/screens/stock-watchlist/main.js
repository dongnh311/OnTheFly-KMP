// ═══════════════════════════════════════════════════════════
//  Watchlist Screen — StockPro
// ═══════════════════════════════════════════════════════════

var quotesLoaded = 0;
var quotesTotal = 0;

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render(); // render with cached/mock data first
    // Fetch real quotes for all stocks
    var symbols = [];
    for (var i = 0; i < StockData.stocks.length; i++) {
        symbols.push(StockData.stocks[i].symbol);
    }
    quotesTotal = symbols.length;
    quotesLoaded = 0;
    fetchQuotes(symbols);
}

function onVisible() {
    render();
}

// ─── API Response Handler ─────────────────────────────────

function onDataReceived(data) {
    if (data.error) {
        OnTheFly.log("Watchlist API error: " + data.error);
        return;
    }
    if (data.requestId && data.requestId.indexOf("quote_") === 0) {
        var symbol = data.requestId.substring(6);
        var parsed = parseFinnhubQuote(symbol, data.body);
        if (parsed) {
            upsertStock(parsed);
            quotesLoaded++;
            if (quotesLoaded >= quotesTotal) {
                render();
            }
        }
    }
}

// ─── Navigation ────────────────────────────────────────────

function onNavTab_dashboard() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-dashboard" }); }
function onNavTab_watchlist() { /* already here */ }
function onNavTab_search()    { OnTheFly.sendToNative("navigateReplace", { screen: "stock-search" }); }
function onNavTab_news()      { OnTheFly.sendToNative("navigateReplace", { screen: "stock-news" }); }

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

function buildStockRow(stock, theme) {
    var up = stock.change >= 0;
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
                    backgroundColor: up ? theme.accent + "12" : theme.negative + "12",
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

function buildBottomNav(activeTab, theme) {
    var tabs = [
        { id: "dashboard", icon: "🏠", label: St("nav_home") },
        { id: "watchlist", icon: "📈", label: St("nav_watchlist") },
        { id: "search",    icon: "🔍", label: St("nav_search") },
        { id: "news",      icon: "📰", label: St("nav_news") }
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
        if (isActive) {
            tabChildren.push({
                type: "Box",
                props: {
                    width: 4, height: 4, cornerRadius: 2,
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
            borderWidth: { top: 1 }
        },
        children: children
    };
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();
    var stocks = StockData.stocks;

    var scrollContent = [];

    for (var i = 0; i < stocks.length; i++) {
        scrollContent.push(buildStockRow(stocks[i], theme));
    }

    scrollContent.push({ type: "Spacer", props: { height: 70 } });

    OnTheFly.setUI({
        type: "Column",
        props: { fillMaxSize: true, backgroundColor: theme.primary },
        children: [
            // Header
            {
                type: "Column",
                props: { fillMaxWidth: true, padding: { start: 20, end: 20, top: 12 } },
                children: [
                    { type: "Text", props: { text: St("watchlist_title"), fontSize: 20, fontWeight: 800, color: theme.textPrimary } },
                    {
                        type: "Row",
                        props: { verticalAlignment: "center", padding: { top: 4 } },
                        children: [
                            { type: "Text", props: { text: "●", fontSize: 10, color: theme.accent } },
                            { type: "Spacer", props: { width: 4 } },
                            { type: "Text", props: { text: St("watchlist_live"), fontSize: 10, fontWeight: 600, color: theme.accent, fontFamily: "monospace" } },
                            { type: "Text", props: { text: " · " + stocks.length + " " + St("watchlist_symbols"), fontSize: 10, color: theme.textTertiary } }
                        ]
                    }
                ]
            },
            // Content
            {
                type: "Column",
                props: { fillMaxWidth: true, weight: 1, scrollable: true, padding: { top: 8 } },
                children: scrollContent
            },
            // Bottom nav
            buildBottomNav("watchlist", theme)
        ]
    });
}

render();

// ═══════════════════════════════════════════════════════════
//  Watchlist Screen — StockPro
// ═══════════════════════════════════════════════════════════

var quotesLoaded = 0;
var quotesTotal = 0;
var confirmSymbol = null;

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render();
    // Fetch real quotes for watchlist stocks
    var stocks = getWatchlistStocks();
    var symbols = [];
    for (var i = 0; i < stocks.length; i++) {
        symbols.push(stocks[i].symbol);
    }
    quotesTotal = symbols.length;
    quotesLoaded = 0;
    if (symbols.length > 0) {
        fetchQuotes(symbols);
    }
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

function onAddStock() {
    navigate("stock-search");
}

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

// ─── Remove flow handlers ─────────────────────────────────

function onRemoveStock_AAPL()  { confirmSymbol = "AAPL";  OnTheFly.update("removeDialog", { visible: true }); }
function onRemoveStock_TSLA()  { confirmSymbol = "TSLA";  OnTheFly.update("removeDialog", { visible: true }); }
function onRemoveStock_MSFT()  { confirmSymbol = "MSFT";  OnTheFly.update("removeDialog", { visible: true }); }
function onRemoveStock_GOOGL() { confirmSymbol = "GOOGL"; OnTheFly.update("removeDialog", { visible: true }); }
function onRemoveStock_AMZN()  { confirmSymbol = "AMZN";  OnTheFly.update("removeDialog", { visible: true }); }
function onRemoveStock_NVDA()  { confirmSymbol = "NVDA";  OnTheFly.update("removeDialog", { visible: true }); }
function onRemoveStock_META()  { confirmSymbol = "META";  OnTheFly.update("removeDialog", { visible: true }); }
function onRemoveStock_NFLX()  { confirmSymbol = "NFLX";  OnTheFly.update("removeDialog", { visible: true }); }
function onRemoveStock_AMD()   { confirmSymbol = "AMD";   OnTheFly.update("removeDialog", { visible: true }); }

function onConfirmRemove() {
    OnTheFly.update("removeDialog", { visible: false });
    if (confirmSymbol) {
        removeFromWatchlist(confirmSymbol);
        confirmSymbol = null;
        render();
    }
}

function onCancelRemove() {
    OnTheFly.update("removeDialog", { visible: false });
    confirmSymbol = null;
}

// ─── UI Builders ───────────────────────────────────────────

function buildStockRow(stock, theme) {
    var up = stock.change >= 0;
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            verticalAlignment: "center"
        },
        children: [
            // Stock info area (tappable, weight:1)
            {
                type: "Row",
                props: {
                    weight: 1,
                    padding: { start: 16, top: 12, bottom: 12 },
                    verticalAlignment: "center",
                    onClick: "onStockTap_" + stock.symbol
                },
                children: [
                    // Left: symbol + name
                    {
                        type: "Column",
                        props: { weight: 1 },
                        children: [
                            { type: "Text", props: { text: stock.symbol, fontSize: 15, fontWeight: 700, color: theme.textPrimary } },
                            { type: "Text", props: { text: stock.name, fontSize: 12, color: theme.textSecondary, maxLines: 1 } }
                        ]
                    },
                    // Right: price + change
                    {
                        type: "Column",
                        props: { horizontalAlignment: "end" },
                        children: [
                            { type: "Text", props: { text: stockPriceText(stock.price), fontSize: 15, fontWeight: 600, color: theme.textPrimary } },
                            { type: "Text", props: { text: (up ? "+" : "") + stock.change.toFixed(2) + " (" + fmtPct(stock.pct) + ")", fontSize: 12, color: up ? theme.positive : theme.negative } }
                        ]
                    }
                ]
            },
            // Remove button
            {
                type: "Button",
                props: {
                    text: "\u2715",
                    variant: "outlined",
                    textColor: theme.negative,
                    borderColor: theme.negative + "40",
                    fontSize: 11,
                    cornerRadius: 6,
                    padding: { horizontal: 10, vertical: 4 },
                    margin: { end: 12 },
                    onClick: "onRemoveStock_" + stock.symbol
                }
            }
        ]
    };
}

function buildEmptyState(theme) {
    return {
        type: "Column",
        props: {
            fillMaxWidth: true,
            horizontalAlignment: "center",
            padding: { vertical: 40 }
        },
        children: [
            { type: "Text", props: { text: "\u2B50", fontSize: 40, padding: { bottom: 8 } } },
            { type: "Text", props: { text: St("watchlist_empty"), fontSize: 14, color: theme.textSecondary } }
        ]
    };
}

function buildBottomNav(activeTab, theme) {
    var tabs = [
        { id: "dashboard", icon: "\uD83C\uDFE0", label: St("nav_home") },
        { id: "watchlist", icon: "\u2B50",         label: St("nav_watchlist") },
        { id: "search",    icon: "\uD83D\uDD0D",   label: St("nav_search") },
        { id: "news",      icon: "\uD83D\uDCF0",   label: St("nav_news") }
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
                    background: theme.accent,
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
            background: theme.navBar,
            alignment: "spaceEvenly",
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
    var stocks = getWatchlistStocks();

    // Build scrollable content
    var scrollContent = [];

    if (stocks.length === 0) {
        scrollContent.push(buildEmptyState(theme));
    } else {
        for (var i = 0; i < stocks.length; i++) {
            scrollContent.push(buildStockRow(stocks[i], theme));
        }
    }

    scrollContent.push({ type: "Spacer", props: { height: 70 } });

    OnTheFly.setUI({
        type: "Column",
        props: { height: "fill", background: theme.primary },
        children: [
            // Top bar: title + Add Stock button
            {
                type: "Row",
                props: {
                    fillMaxWidth: true,
                    verticalAlignment: "center",
                    padding: { start: 16, end: 16, top: 4, bottom: 12 }
                },
                children: [
                    { type: "Text", props: { text: St("watchlist_title"), fontSize: 22, fontWeight: 800, color: theme.textPrimary, weight: 1 } },
                    {
                        type: "Button",
                        props: {
                            text: "+ " + St("add_stock"),
                            variant: "filled",
                            background: theme.accent,
                            textColor: "#FFFFFF",
                            fontSize: 12,
                            fontWeight: 600,
                            cornerRadius: 8,
                            padding: { horizontal: 12, vertical: 6 },
                            onClick: "onAddStock"
                        }
                    }
                ]
            },

            // Scrollable stock list
            {
                type: "Column",
                props: { fillMaxWidth: true, weight: 1, scrollable: true },
                children: scrollContent
            },

            // Bottom navigation
            buildBottomNav("watchlist", theme),

            // Confirm remove dialog
            {
                type: "ConfirmDialog",
                props: {
                    id: "removeDialog",
                    visible: false,
                    title: St("confirm_remove"),
                    message: St("confirm_remove"),
                    confirmText: St("confirm"),
                    cancelText: St("cancel"),
                    onConfirm: "onConfirmRemove",
                    onCancel: "onCancelRemove"
                }
            }
        ]
    });
}

render();

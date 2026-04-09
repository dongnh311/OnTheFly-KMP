// ═══════════════════════════════════════════════════════════
//  Watchlist Screen — StockPro (matching mockup exactly)
// ═══════════════════════════════════════════════════════════

var quotesLoaded = 0;
var quotesTotal = 0;
var confirmSymbol = null;

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render();
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
function onNavTab_chart() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-chart" }); }

function onAddStock() {
    AppState.set("add_watchlist_mode", true);
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
            padding: { left: 16, right: 12, top: 12, bottom: 12 },
            crossAlignment: "center",
            onClick: "onStockTap_" + stock.symbol
        },
        children: [
            // Left: symbol + name
            {
                type: "Column",
                props: { weight: 1, spacing: 2 },
                children: [
                    { type: "Text", props: { text: stock.symbol, fontSize: 15, fontWeight: "700", color: theme.textPrimary } },
                    { type: "Text", props: { text: stock.name, fontSize: 12, color: theme.textSecondary, maxLines: 1 } }
                ]
            },
            // Right: price + change
            {
                type: "Column",
                props: { alignment: "end", width: "wrap", spacing: 2 },
                children: [
                    { type: "Text", props: { text: stockPriceText(stock.price), fontSize: 15, fontWeight: "700", color: theme.textPrimary } },
                    { type: "Text", props: { text: (up ? "+" : "") + stock.change.toFixed(2) + " (" + fmtPct(stock.pct) + ")", fontSize: 12, fontWeight: "600", color: up ? theme.positive : theme.negative } }
                ]
            },
            { type: "Spacer", props: { width: 10 } },
            // Remove button (small circular X)
            {
                type: "Box",
                props: {
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    background: "#33" + theme.negative.replace("#", ""),
                    contentAlignment: "center",
                    onClick: "onRemoveStock_" + stock.symbol
                },
                children: [
                    { type: "Icon", props: { name: "close", size: 12, color: theme.negative } }
                ]
            }
        ]
    };
}

function buildEmptyState(theme) {
    return {
        type: "Column",
        props: {
            fillMaxWidth: true,
            alignment: "center",
            padding: { top: 40, bottom: 40 }
        },
        children: [
            { type: "Text", props: { text: "\u2B50", fontSize: 40, padding: { bottom: 8 } } },
            { type: "Text", props: { text: St("watchlist_empty"), fontSize: 14, color: theme.textSecondary } }
        ]
    };
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();
    var stocks = getWatchlistStocks();

    var scrollContent = [];

    if (stocks.length === 0) {
        scrollContent.push(buildEmptyState(theme));
    } else {
        for (var i = 0; i < stocks.length; i++) {
            if (i > 0) {
                scrollContent.push({ type: "Divider", props: { color: theme.border } });
            }
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
                    crossAlignment: "center",
                    padding: { start: 16, end: 16, top: 4, bottom: 12 },
                    alignment: "spaceBetween"
                },
                children: [
                    { type: "Text", props: { text: St("watchlist_title"), fontSize: 22, fontWeight: "800", color: theme.textPrimary, width: "wrap" } },
                    {
                        type: "Box",
                        props: {
                            width: "wrap",
                            background: theme.accent,
                            borderRadius: 8,
                            padding: { horizontal: 14, vertical: 8 },
                            onClick: "onAddStock"
                        },
                        children: [
                            {
                                type: "Text",
                                props: {
                                    text: "+ " + St("add_stock"),
                                    fontSize: 12,
                                    fontWeight: "700",
                                    color: "#FFFFFF"
                                }
                            }
                        ]
                    }
                ]
            },

            // Scrollable stock list
            {
                type: "Column",
                props: { id: "watchlist_scroll", fillMaxWidth: true, weight: 1, scrollable: true },
                children: scrollContent
            },

            // Bottom navigation
            buildStockBottomNav("watchlist", theme),

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

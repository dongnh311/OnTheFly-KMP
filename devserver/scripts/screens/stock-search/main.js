// ═══════════════════════════════════════════════════════════
//  Search Screen — StockPro
// ═══════════════════════════════════════════════════════════

var query = "";
var recentSearches = ["AAPL", "TSLA", "NVDA"];
var apiResults = null;
var lastSearchQuery = "";

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render();
}

// ─── Navigation ────────────────────────────────────────────

function onNavTab_dashboard() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-dashboard" }); }
function onNavTab_watchlist() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-watchlist" }); }
function onNavTab_search()    { /* already here */ }
function onNavTab_news()      { OnTheFly.sendToNative("navigateReplace", { screen: "stock-news" }); }

// ─── Stock tap handlers ───────────────────────────────────

function onStockTap_AAPL()  { navigate("stock-detail", { symbol: "AAPL" }); }
function onStockTap_TSLA()  { navigate("stock-detail", { symbol: "TSLA" }); }
function onStockTap_MSFT()  { navigate("stock-detail", { symbol: "MSFT" }); }
function onStockTap_GOOGL() { navigate("stock-detail", { symbol: "GOOGL" }); }
function onStockTap_AMZN()  { navigate("stock-detail", { symbol: "AMZN" }); }
function onStockTap_NVDA()  { navigate("stock-detail", { symbol: "NVDA" }); }
function onStockTap_META()  { navigate("stock-detail", { symbol: "META" }); }
function onStockTap_NFLX()  { navigate("stock-detail", { symbol: "NFLX" }); }
function onStockTap_AMD()   { navigate("stock-detail", { symbol: "AMD" }); }

// Dynamic stock tap for API results
function onClick(id, data) {
    if (id && id.indexOf("stockRow_") === 0) {
        var symbol = id.substring(9);
        navigate("stock-detail", { symbol: symbol });
    }
}

// ─── Chip tap handlers ────────────────────────────────────

function onChipAAPL() { query = "AAPL"; lastSearchQuery = "AAPL"; fetchSearch("AAPL"); render(); }
function onChipTSLA() { query = "TSLA"; lastSearchQuery = "TSLA"; fetchSearch("TSLA"); render(); }
function onChipNVDA() { query = "NVDA"; lastSearchQuery = "NVDA"; fetchSearch("NVDA"); render(); }

// ─── Search handlers ──────────────────────────────────────

function onTextChanged(id, data) {
    if (id === "searchField") {
        query = data.value;
        render();
        if (query.length >= 2 && query !== lastSearchQuery) {
            lastSearchQuery = query;
            fetchSearch(query);
        }
        if (!query || query.length === 0) {
            apiResults = null;
            lastSearchQuery = "";
        }
    }
}

// ─── API Response Handler ─────────────────────────────────

function onDataReceived(data) {
    if (data.error) {
        OnTheFly.log("Search API error: " + data.error);
        return;
    }
    // Finnhub search response
    if (data.requestId && data.requestId.indexOf("search_") === 0) {
        if (data.body && data.body.result) {
            apiResults = [];
            var results = data.body.result;
            var count = Math.min(results.length, 15);
            for (var i = 0; i < count; i++) {
                var r = results[i];
                if (r.type === "Common Stock" || r.type === "ETP" || r.type === "ADR") {
                    apiResults.push({
                        symbol: r.symbol,
                        name: r.description || r.displaySymbol,
                        price: 0,
                        change: 0,
                        pct: 0
                    });
                }
            }
            render();
        }
    }
    // Quote updates for API results
    if (data.requestId && data.requestId.indexOf("quote_") === 0) {
        var symbol = data.requestId.substring(6);
        if (apiResults) {
            for (var j = 0; j < apiResults.length; j++) {
                if (apiResults[j].symbol === symbol && data.body) {
                    apiResults[j].price = data.body.c || 0;
                    apiResults[j].change = data.body.d || 0;
                    apiResults[j].pct = data.body.dp || 0;
                }
            }
            render();
        }
    }
}

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
            {
                type: "Column",
                props: { weight: 1 },
                children: [
                    { type: "Text", props: { text: stock.symbol, fontSize: 14, fontWeight: "semibold", color: theme.textPrimary } },
                    { type: "Text", props: { text: stock.name, fontSize: 11, color: theme.textTertiary, maxLines: 1 } }
                ]
            },
            {
                type: "Column",
                props: { horizontalAlignment: "end" },
                children: [
                    { type: "Text", props: { text: stockPriceText(stock.price), fontSize: 14, fontWeight: "bold", color: theme.textPrimary } },
                    { type: "Text", props: { text: fmtPct(stock.pct), fontSize: 11, fontWeight: "semibold", color: up ? theme.positive : theme.negative } }
                ]
            }
        ]
    };
}

function buildApiResultRow(item, theme) {
    return {
        type: "Row",
        props: {
            id: "stockRow_" + item.symbol,
            fillMaxWidth: true,
            padding: { horizontal: 20, vertical: 13 },
            verticalAlignment: "center",
            onClick: "onClick"
        },
        children: [
            {
                type: "Column",
                props: { weight: 1 },
                children: [
                    { type: "Text", props: { text: item.symbol, fontSize: 14, fontWeight: "semibold", color: theme.textPrimary } },
                    { type: "Text", props: { text: item.name, fontSize: 11, color: theme.textTertiary, maxLines: 1 } }
                ]
            },
            item.price > 0 ? {
                type: "Column",
                props: { horizontalAlignment: "end" },
                children: [
                    { type: "Text", props: { text: stockPriceText(item.price), fontSize: 14, fontWeight: "bold", color: theme.textPrimary } },
                    item.pct !== 0 ? { type: "Text", props: {
                        text: fmtPct(item.pct),
                        fontSize: 11, fontWeight: "semibold",
                        color: item.pct >= 0 ? theme.positive : theme.negative
                    }} : { type: "Spacer", props: { height: 1 } }
                ]
            } : { type: "Spacer", props: { width: 1 } }
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
                    margin: { top: 3 }
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
            borderColor: theme.border,
            borderWidth: 1,
            alignment: "spaceEvenly",
            padding: { top: 4, bottom: 8 }
        },
        children: children
    };
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();
    var trimmed = query.replace(/^\s+|\s+$/g, "");
    var hasQuery = trimmed.length > 0;
    var localResults = hasQuery ? searchStocks(query) : [];
    var showApiResults = (apiResults !== null && hasQuery && query.length >= 2);
    var displayResults = showApiResults ? apiResults : localResults;

    var scrollContent = [];

    if (!hasQuery) {
        // ── Recent Searches section ──
        scrollContent.push({
            type: "Text",
            props: {
                text: St("recent_search"),
                fontSize: 14,
                fontWeight: "600",
                color: theme.textSecondary,
                padding: { start: 16, end: 16, top: 8, bottom: 0 }
            }
        });

        // Chips row
        var chipChildren = [];
        for (var c = 0; c < recentSearches.length; c++) {
            var sym = recentSearches[c];
            chipChildren.push({
                type: "Box",
                props: {
                    background: theme.surfaceVariant,
                    borderColor: theme.border,
                    borderWidth: 1,
                    cornerRadius: 16,
                    padding: { horizontal: 12, vertical: 6 },
                    onClick: "onChip" + sym
                },
                children: [
                    { type: "Text", props: { text: sym, fontSize: 13, color: theme.textPrimary } }
                ]
            });
        }
        scrollContent.push({
            type: "FlowRow",
            props: {
                fillMaxWidth: true,
                spacing: 8,
                lineSpacing: 8,
                padding: { start: 16, end: 16, top: 8, bottom: 16 }
            },
            children: chipChildren
        });

        // ── Popular section ──
        scrollContent.push({
            type: "Text",
            props: {
                text: St("popular"),
                fontSize: 14,
                fontWeight: "600",
                color: theme.textSecondary,
                padding: { start: 16, end: 16, bottom: 8 }
            }
        });

        var popularStocks = StockData.stocks.slice(0, 5);
        for (var p = 0; p < popularStocks.length; p++) {
            scrollContent.push(buildStockRow(popularStocks[p], theme));
        }
    } else {
        // ── Search results ──
        if (displayResults.length > 0) {
            for (var r = 0; r < displayResults.length; r++) {
                if (showApiResults) {
                    scrollContent.push(buildApiResultRow(displayResults[r], theme));
                } else {
                    scrollContent.push(buildStockRow(displayResults[r], theme));
                }
            }
        } else {
            // No results
            scrollContent.push({
                type: "Column",
                props: {
                    fillMaxWidth: true,
                    horizontalAlignment: "center",
                    padding: { vertical: 40 }
                },
                children: [
                    { type: "Text", props: { text: "No results", fontSize: 14, color: theme.textSecondary } }
                ]
            });
        }
    }

    scrollContent.push({ type: "Spacer", props: { height: 70 } });

    // ── Search field: Row with magnifier icon + TextField ──
    var searchFieldRow = {
        type: "Row",
        props: {
            fillMaxWidth: true,
            verticalAlignment: "center",
            padding: { horizontal: 14, vertical: 10 },
            background: theme.inputBg,
            borderColor: theme.border,
            borderWidth: 1,
            cornerRadius: 10
        },
        children: [
            { type: "Text", props: { text: "\uD83D\uDD0D", fontSize: 16, padding: { end: 8 } } },
            {
                type: "TextField",
                props: {
                    id: "searchField",
                    value: query,
                    placeholder: St("search_placeholder"),
                    background: "transparent",
                    textColor: theme.textPrimary,
                    placeholderColor: theme.textTertiary,
                    fontSize: 14,
                    weight: 1
                }
            }
        ]
    };

    OnTheFly.setUI({
        type: "Column",
        props: { height: "fill", background: theme.primary },
        children: [
            // Header: title + search field
            {
                type: "Column",
                props: { fillMaxWidth: true, padding: { start: 16, end: 16, top: 4, bottom: 12 } },
                children: [
                    {
                        type: "Text",
                        props: {
                            text: St("search_title"),
                            fontSize: 22,
                            fontWeight: "800",
                            color: theme.textPrimary,
                            padding: { bottom: 12 }
                        }
                    },
                    searchFieldRow
                ]
            },
            // Scrollable content
            {
                type: "Column",
                props: { fillMaxWidth: true, weight: 1, scrollable: true },
                children: scrollContent
            },
            // Bottom nav
            buildBottomNav("search", theme)
        ]
    });
}

render();

// ═══════════════════════════════════════════════════════════
//  Search Screen — StockPro
// ═══════════════════════════════════════════════════════════

var query = "";
var trendingTags = ["NVDA", "TSLA", "AAPL", "PLTR", "SMCI", "ARM"];
var apiResults = null; // Results from Finnhub search API
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

// ─── Dynamic stock tap (works for any symbol) ─────────────

function onClick(id, data) {
    if (id && id.indexOf("stockRow_") === 0) {
        var symbol = id.substring(9);
        navigate("stock-detail", { symbol: symbol });
    }
}

// Also keep static ones for local results
function onStockTap_AAPL()  { navigate("stock-detail", { symbol: "AAPL" }); }
function onStockTap_TSLA()  { navigate("stock-detail", { symbol: "TSLA" }); }
function onStockTap_MSFT()  { navigate("stock-detail", { symbol: "MSFT" }); }
function onStockTap_GOOGL() { navigate("stock-detail", { symbol: "GOOGL" }); }
function onStockTap_AMZN()  { navigate("stock-detail", { symbol: "AMZN" }); }
function onStockTap_NVDA()  { navigate("stock-detail", { symbol: "NVDA" }); }
function onStockTap_META()  { navigate("stock-detail", { symbol: "META" }); }
function onStockTap_NFLX()  { navigate("stock-detail", { symbol: "NFLX" }); }

// ─── Search handlers ──────────────────────────────────────

function onTextChanged(id, data) {
    if (id === "searchField") {
        query = data.value;
        // Local search first
        render();
        // Fire Finnhub search if query is 2+ chars and different from last
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
    // Finnhub search response: { count, result: [{ description, displaySymbol, symbol, type }] }
    if (data.requestId && data.requestId.indexOf("search_") === 0) {
        if (data.body && data.body.result) {
            apiResults = [];
            var results = data.body.result;
            var count = Math.min(results.length, 15);
            for (var i = 0; i < count; i++) {
                var r = results[i];
                // Only show common stocks (not crypto, forex, etc.)
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

    // If we got a quote back for an API result, update it
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

function onClearSearch() {
    query = "";
    apiResults = null;
    lastSearchQuery = "";
    render();
}

function onTagNVDA()  { query = "NVDA"; lastSearchQuery = "NVDA"; fetchSearch("NVDA"); render(); }
function onTagTSLA()  { query = "TSLA"; lastSearchQuery = "TSLA"; fetchSearch("TSLA"); render(); }
function onTagAAPL()  { query = "AAPL"; lastSearchQuery = "AAPL"; fetchSearch("AAPL"); render(); }
function onTagPLTR()  { query = "PLTR"; lastSearchQuery = "PLTR"; fetchSearch("PLTR"); render(); }
function onTagSMCI()  { query = "SMCI"; lastSearchQuery = "SMCI"; fetchSearch("SMCI"); render(); }
function onTagARM()   { query = "ARM";  lastSearchQuery = "ARM";  fetchSearch("ARM");  render(); }

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
                    backgroundColor: up ? (theme.accent + "12") : (theme.negative + "12"),
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
        // Active dot indicator under the label
        if (isActive) {
            tabChildren.push({
                type: "Box",
                props: {
                    width: 4, height: 4, cornerRadius: 2,
                    backgroundColor: theme.accent,
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
            backgroundColor: theme.navBar,
            borderColor: theme.border,
            horizontalArrangement: "spaceEvenly",
            padding: { top: 4, bottom: 8 }
        },
        children: children
    };
}

// Build a row for API search result (may not have price)
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
                type: "Box",
                props: {
                    width: 42, height: 42, cornerRadius: 12,
                    backgroundColor: theme.accentDim,
                    contentAlignment: "center"
                },
                children: [
                    { type: "Text", props: { text: item.symbol.substring(0, 2), fontSize: 12, fontWeight: "bold", color: theme.accent } }
                ]
            },
            { type: "Spacer", props: { width: 12 } },
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
                    { type: "Text", props: { text: "$" + item.price.toFixed(2), fontSize: 14, fontWeight: "bold", color: theme.textPrimary } },
                    item.pct !== 0 ? { type: "Text", props: {
                        text: (item.pct >= 0 ? "+" : "") + item.pct.toFixed(2) + "%",
                        fontSize: 11, fontWeight: "semibold",
                        color: item.pct >= 0 ? theme.positive : theme.negative
                    }} : { type: "Spacer", props: { height: 1 } }
                ]
            } : { type: "Spacer", props: { width: 1 } }
        ]
    };
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();
    // Use API results if available, otherwise local search
    var localResults = searchStocks(query);
    var showApiResults = (apiResults !== null && query && query.length >= 2);
    var displayResults = showApiResults ? apiResults : localResults;

    var scrollContent = [];

    // Trending tags (when no query) — flexWrap layout with pill-style tags
    if (!query || query === "") {
        var tagChildren = [];
        for (var i = 0; i < trendingTags.length; i++) {
            tagChildren.push({
                type: "Box",
                props: {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    borderWidth: 1,
                    cornerRadius: 20,
                    padding: { horizontal: 14, vertical: 6 },
                    onClick: "onTag" + trendingTags[i]
                },
                children: [
                    { type: "Text", props: { text: trendingTags[i], fontSize: 12, fontWeight: "bold", color: theme.accent } }
                ]
            });
        }
        scrollContent.push({
            type: "Column",
            props: { fillMaxWidth: true, padding: { horizontal: 20, vertical: 14 } },
            children: [
                { type: "Text", props: { text: St("trending_label"), fontSize: 12, fontWeight: "semibold", color: theme.textSecondary, letterSpacing: 1 } },
                { type: "Spacer", props: { height: 8 } },
                {
                    type: "FlowRow",
                    props: { fillMaxWidth: true, spacing: 8, lineSpacing: 8 },
                    children: tagChildren
                }
            ]
        });
    }

    // Results count — "{N} result{s}" with plural
    if (query && query !== "") {
        var n = displayResults.length;
        var resultWord = n === 1 ? "result" : "results";
        var label = n + " " + resultWord;
        if (showApiResults) label = label + " (Finnhub)";
        scrollContent.push({
            type: "Text",
            props: {
                text: label,
                fontSize: 11,
                color: theme.textTertiary,
                padding: { start: 20, top: 6, bottom: 6 }
            }
        });
    }

    // Stock list
    for (var j = 0; j < displayResults.length; j++) {
        if (showApiResults) {
            scrollContent.push(buildApiResultRow(displayResults[j], theme));
        } else {
            scrollContent.push(buildStockRow(displayResults[j], theme));
        }
    }

    scrollContent.push({ type: "Spacer", props: { height: 70 } });

    // Build search field row with clear button
    var searchFieldChildren = [
        {
            type: "TextField",
            props: {
                id: "searchField",
                value: query,
                placeholder: "🔍 " + St("search_placeholder"),
                backgroundColor: theme.inputBg,
                borderColor: query ? theme.accent : theme.inputBorder,
                textColor: theme.textPrimary,
                placeholderColor: theme.textTertiary,
                cornerRadius: 12,
                padding: 12,
                weight: 1
            }
        }
    ];
    // Clear button when query exists
    if (query && query !== "") {
        searchFieldChildren.push({ type: "Spacer", props: { width: 8 } });
        searchFieldChildren.push({
            type: "Button",
            props: {
                text: "✕",
                style: "text",
                textColor: theme.textTertiary,
                fontSize: 16,
                onClick: "onClearSearch"
            }
        });
    }

    OnTheFly.setUI({
        type: "Column",
        props: { fillMaxSize: true, backgroundColor: theme.primary },
        children: [
            // Title + search field
            {
                type: "Column",
                props: { fillMaxWidth: true, padding: { start: 20, end: 20, top: 12 } },
                children: [
                    { type: "Text", props: { text: St("search_title"), fontSize: 20, fontWeight: "bold", color: theme.textPrimary, padding: { bottom: 12 } } },
                    {
                        type: "Row",
                        props: { fillMaxWidth: true, verticalAlignment: "center" },
                        children: searchFieldChildren
                    }
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

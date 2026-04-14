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

function onVisible() {
    render();
}

// ─── Navigation ────────────────────────────────────────────

function onNavTab_dashboard() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-dashboard" }); }
function onNavTab_watchlist() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-watchlist" }); }
function onNavTab_search()    { /* already here */ }
function onNavTab_news()      { OnTheFly.sendToNative("navigateReplace", { screen: "stock-news" }); }
function onNavTab_chart() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-chart" }); }

// ─── Stock tap handler (dynamic, no hardcode) ────────────

function onClick(id, data) {
    if (id && id.indexOf("stockRow_") === 0) {
        var symbol = id.substring(9);
        if (AppState.get("add_watchlist_mode", false)) {
            addToWatchlist(symbol);
            AppState.remove("add_watchlist_mode");
            toast(symbol + " added to watchlist");
            goBack();
        } else {
            navigate("stock-detail", { symbol: symbol });
        }
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
    return Row({
        fillMaxWidth: true,
        padding: { horizontal: 16, vertical: 13 },
        crossAlignment: "center",
        id: "stockRow_" + stock.symbol,
        onClick: "onClick"
    }, [
        Column({ weight: 1 }, [
            Text({ text: stock.symbol, fontSize: 15, fontWeight: "700", color: theme.textPrimary }),
            Text({ text: stock.name, fontSize: 12, color: theme.textSecondary, maxLines: 1 })
        ]),
        Column({ alignment: "end", width: "wrap" }, [
            Text({ text: stockPriceText(stock.price), fontSize: 15, fontWeight: "700", color: theme.textPrimary }),
            Text({ text: (stock.change >= 0 ? "+" : "") + stock.change.toFixed(2) + " (" + fmtPct(stock.pct) + ")", fontSize: 12, fontWeight: "600", color: stock.change > 0 ? theme.positive : (stock.change < 0 ? theme.negative : theme.warning) })
        ])
    ]);
}

function buildApiResultRow(item, theme) {
    return Row({
        id: "stockRow_" + item.symbol,
        fillMaxWidth: true,
        padding: { horizontal: 16, vertical: 13 },
        crossAlignment: "center",
        onClick: "onClick"
    }, [
        Column({ weight: 1 }, [
            Text({ text: item.symbol, fontSize: 15, fontWeight: "700", color: theme.textPrimary }),
            Text({ text: item.name, fontSize: 12, color: theme.textSecondary, maxLines: 1 })
        ]),
        item.price > 0 ? Column({ alignment: "end", width: "wrap" }, [
            Text({ text: stockPriceText(item.price), fontSize: 15, fontWeight: "700", color: theme.textPrimary }),
            item.pct !== 0 ? Text({
                text: fmtPct(item.pct),
                fontSize: 12, fontWeight: "600",
                color: item.pct >= 0 ? theme.positive : theme.negative
            }) : Spacer({ height: 1 })
        ]) : Spacer({ width: 1 })
    ]);
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
        scrollContent.push(Text({
            text: St("recent_search"),
            fontSize: 15,
            fontWeight: "700",
            color: theme.textSecondary,
            padding: { left: 16, right: 16, top: 12, bottom: 0 }
        }));

        // Chips row
        var chipChildren = [];
        for (var c = 0; c < recentSearches.length; c++) {
            var sym = recentSearches[c];
            chipChildren.push(Box({
                width: "wrap",
                background: theme.surfaceVariant,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 16,
                padding: { horizontal: 12, vertical: 6 },
                onClick: "onChip" + sym
            }, [
                Text({ text: sym, fontSize: 13, color: theme.textPrimary })
            ]));
        }
        scrollContent.push(Row({
            spacing: 8,
            padding: { left: 16, right: 16, top: 8, bottom: 16 }
        }, chipChildren));

        // ── Popular section ──
        scrollContent.push(Text({
            text: St("popular"),
            fontSize: 15,
            fontWeight: "700",
            color: theme.textSecondary,
            padding: { left: 16, right: 16, bottom: 8 }
        }));

        var popularStocks = StockData.stocks.slice(0, 5);
        for (var p = 0; p < popularStocks.length; p++) {
            if (p > 0) {
                scrollContent.push(Divider({ color: theme.border }));
            }
            scrollContent.push(buildStockRow(popularStocks[p], theme));
        }
    } else {
        // ── Search results ──
        if (displayResults.length > 0) {
            for (var r = 0; r < displayResults.length; r++) {
                if (r > 0) {
                    scrollContent.push(Divider({ color: theme.border }));
                }
                if (showApiResults) {
                    scrollContent.push(buildApiResultRow(displayResults[r], theme));
                } else {
                    scrollContent.push(buildStockRow(displayResults[r], theme));
                }
            }
        } else {
            // No results
            scrollContent.push(Column({
                fillMaxWidth: true,
                alignment: "center",
                padding: { vertical: 40 }
            }, [
                Text({ text: "No results", fontSize: 14, color: theme.textSecondary })
            ]));
        }
    }

    scrollContent.push(Spacer({ height: 70 }));

    var searchFieldRow = TextField({
        id: "searchField",
        value: query,
        placeholder: St("search_placeholder"),
        background: theme.inputBg,
        textColor: theme.textPrimary,
        placeholderColor: theme.textTertiary,
        fontSize: 14,
        cornerRadius: 10,
        leadingIcon: "search",
        padding: { horizontal: 12, vertical: 8 },
        contentPaddingVertical: 4,
        contentPaddingHorizontal: 12
    });

    OnTheFly.setUI(Column({ height: "fill", background: theme.primary }, [
        // Header: title + search field
        Column({ fillMaxWidth: true, padding: { start: 16, end: 16, top: 4, bottom: 16 } }, [
            Text({
                text: St("search_title"),
                fontSize: 22,
                fontWeight: "800",
                color: theme.textPrimary,
                padding: { bottom: 12 }
            }),
            searchFieldRow
        ]),
        // Scrollable content
        Column({ id: "search_scroll", fillMaxWidth: true, weight: 1, scrollable: true },
            scrollContent
        ),
        // Bottom nav
        buildStockBottomNav("search", theme)
    ]));
}

render();

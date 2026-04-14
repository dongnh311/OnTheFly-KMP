// ═══════════════════════════════════════════════════════════
//  Dashboard Screen — StockPro
// ═══════════════════════════════════════════════════════════

var quotesLoaded = 0;
var quotesTotal = 0;
var dataReady = false;
var wsConnected = false;

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
    connectFinnhubWS("dashboard");
}

function onVisible() {
    if (dataReady) {
        recalcPortfolio();
        render();
    }
}

function onDestroy() {
    if (wsConnected) {
        for (var i = 0; i < StockData.stocks.length; i++) {
            unsubscribeTrades(StockData.stocks[i].symbol);
        }
        disconnectFinnhubWS("dashboard");
        wsConnected = false;
    }
}

// ─── WebSocket Handlers ───────────────────────────────────

var _tradeCount = 0;

function onWSConnected(data) {
    wsConnected = true;
    OnTheFly.log("[Dashboard] WS Connected");
    for (var i = 0; i < StockData.stocks.length; i++) {
        subscribeTrades(StockData.stocks[i].symbol);
    }
}

function onRealtimeData(data) {
    if (!data || !data.message) return;
    var trades = parseFinnhubWSMessage(data.message);
    if (trades) {
        for (var i = 0; i < trades.length; i++) {
            updateStockFromTrade(trades[i]);
            _tradeCount++;
            if (_tradeCount % 20 === 1) {
                var s = findStock(trades[i].symbol);
                var chg = s ? s.change.toFixed(2) : "?";
                var pct = s ? s.pct.toFixed(2) + "%" : "?";
                OnTheFly.log("[RT] #" + _tradeCount + " " + trades[i].symbol + " $" + trades[i].price + " chg:" + chg + " " + pct);
            }
        }
        recalcPortfolio();
        render();
    }
}

function onWSDisconnected(data) { wsConnected = false; }
function onWSError(data) { wsConnected = false; }

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
    return Row({
        fillMaxWidth: true,
        padding: { start: 16, end: 16, top: 4, bottom: 12 },
        verticalAlignment: "center",
        alignment: "spaceBetween"
    }, [
        Text({
            text: St("dashboard_title"),
            fontSize: 22,
            fontWeight: "800",
            color: theme.textPrimary,
            width: "wrap"
        }),
        Box({
            width: 34,
            height: 34,
            borderRadius: 17,
            background: theme.accent,
            contentAlignment: "center",
            onClick: "onAccountClick"
        }, [
            Icon({ name: "person", size: 20, color: "#FFFFFF" })
        ])
    ]);
}

function buildPortfolioCard(theme) {
    var portfolio = StockData.portfolio;
    var up = portfolio.dayChange >= 0;
    var changeColor = portfolio.dayChange > 0 ? theme.positive : (portfolio.dayChange < 0 ? theme.negative : theme.warning);
    var changeSign = up ? "+" : "";
    var badgeBg = "#33" + changeColor.replace("#", "");

    return Column({
        fillMaxWidth: true,
        padding: 20,
        borderRadius: 14,
        background: theme.card,
        borderColor: theme.border,
        borderWidth: 1
    }, [
        Text({
            text: St("portfolio_value"),
            fontSize: 12,
            color: theme.textSecondary
        }),
        Text({
            text: "$" + formatNumber(formatDecimal(portfolio.totalValue, 2)),
            fontSize: 28,
            fontWeight: "800",
            color: theme.textPrimary,
            letterSpacing: -1
        }),
        Row({
            spacing: 8,
            padding: { top: 6 }
        }, [
            Text({
                text: changeSign + "$" + formatDecimal(Math.abs(portfolio.dayChange), 2),
                fontSize: 14,
                fontWeight: "600",
                color: changeColor
            }),
            Box({
                width: "wrap",
                background: badgeBg,
                borderRadius: 4,
                padding: { horizontal: 6, vertical: 2 }
            }, [
                Text({
                    text: fmtPct(portfolio.dayChangePct),
                    fontSize: 12,
                    color: changeColor
                })
            ])
        ])
    ]);
}

function buildSectionHeader(title, actionText, actionHandler, theme) {
    var children = [
        Text({
            text: title,
            fontSize: 17,
            fontWeight: "700",
            color: theme.textPrimary,
            width: "wrap"
        })
    ];
    if (actionText) {
        children.push(Text({
            text: actionText,
            fontSize: 12,
            color: theme.accent,
            width: "wrap",
            onClick: actionHandler
        }));
    }
    return Row({
        fillMaxWidth: true,
        padding: { start: 16, end: 16, top: 16, bottom: 8 },
        verticalAlignment: "center",
        alignment: "spaceBetween"
    }, children);
}

function buildTrendingCards(theme) {
    var items = [];
    var count = Math.min(StockData.stocks.length, 5);
    for (var i = 0; i < count; i++) {
        var s = StockData.stocks[i];
        var up = s.change >= 0;
        items.push(Column({
            width: 130,
            padding: { start: 14, end: 14, top: 12, bottom: 12 },
            borderRadius: 12,
            background: theme.card,
            borderColor: theme.border,
            borderWidth: 1,
            onClick: "onStockTap_" + s.symbol
        }, [
            Text({
                text: s.symbol,
                fontSize: 14,
                fontWeight: "700",
                color: theme.textPrimary
            }),
            Text({
                text: s.name,
                fontSize: 10,
                color: theme.textSecondary
            }),
            Spacer({ height: 10 }),
            Text({
                text: stockPriceText(s.price),
                fontSize: 15,
                fontWeight: "700",
                color: theme.textPrimary
            }),
            Text({
                text: fmtPct(s.pct),
                fontSize: 11,
                color: s.change > 0 ? theme.positive : (s.change < 0 ? theme.negative : theme.warning)
            })
        ]));
    }
    return Row(
        { id: "trending_scroll", scrollable: true, padding: { start: 16, end: 16 }, spacing: 10 },
        items
    );
}

function buildStockRow(stock, theme) {
    return Row({
        fillMaxWidth: true,
        padding: { start: 16, end: 16, top: 12, bottom: 12 },
        crossAlignment: "center",
        onClick: "onStockTap_" + stock.symbol
    }, [
        Column({ weight: 1 }, [
            Text({ text: stock.symbol, fontSize: 15, fontWeight: "700", color: theme.textPrimary }),
            Text({ text: stock.name, fontSize: 12, color: theme.textSecondary })
        ]),
        buildFlashPriceColumn(stock, theme)
    ]);
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();

    var scrollContent = [];

    // Portfolio card (wrapped with horizontal padding)
    scrollContent.push(Box({ padding: { horizontal: 16, bottom: 16 } }, [buildPortfolioCard(theme)]));

    // Trending header + See All
    scrollContent.push(buildSectionHeader(St("trending"), St("see_all"), "onSeeAllTrending", theme));

    // Horizontal scroll cards — first 5 stocks
    scrollContent.push(buildTrendingCards(theme));

    // Top Movers header
    scrollContent.push(buildSectionHeader(St("top_movers"), null, null, theme));

    // All 8 stock list rows
    for (var i = 0; i < StockData.stocks.length; i++) {
        if (i > 0) {
            scrollContent.push(Divider({ color: theme.border + "30" }));
        }
        scrollContent.push(buildStockRow(StockData.stocks[i], theme));
    }

    OnTheFly.setUI(Column({ height: "fill", background: theme.primary }, [
        buildTopBar(theme),
        Column({
            id: "dashboard_scroll", fillMaxWidth: true, weight: 1, scrollable: true
        }, scrollContent),
        buildStockBottomNav("dashboard", theme)
    ]));
}

render();

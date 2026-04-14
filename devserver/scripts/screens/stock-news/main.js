// ═══════════════════════════════════════════════════════════
//  News Screen — StockPro (matching mockup exactly)
// ═══════════════════════════════════════════════════════════

var activeTab = "all";
var newsLoaded = false;

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render();
    fetchNews();
}

function onVisible() {
    render();
}

// ─── API Response Handler ─────────────────────────────────

function onDataReceived(data) {
    if (data.error) {
        OnTheFly.log("News API error: " + data.error);
        return;
    }
    if (data.requestId === "news_all") {
        var parsed = parseMarketauxNews(data.body);
        if (parsed.length > 0) {
            StockData.news = parsed;
            newsLoaded = true;
            render();
        }
    }
}

// ─── Navigation ────────────────────────────────────────────

function onNavTab_dashboard() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-dashboard" }); }
function onNavTab_watchlist() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-watchlist" }); }
function onNavTab_search()    { OnTheFly.sendToNative("navigateReplace", { screen: "stock-search" }); }
function onNavTab_news()      { /* already here */ }
function onNavTab_chart() { OnTheFly.sendToNative("navigateReplace", { screen: "stock-chart" }); }

// ─── Tab handlers ─────────────────────────────────────────

function onTabAll() {
    activeTab = "all";
    render();
}

function onTabBreaking() {
    activeTab = "breaking";
    render();
}

function onTabLatest() {
    activeTab = "latest";
    render();
}

// ─── News click ───────────────────────────────────────────

function onNewsClick() {
    toast("Opening article...");
}

// ─── UI Builders ───────────────────────────────────────────

function buildTab(label, tabId, theme) {
    var isActive = (activeTab === tabId);
    var handlerName = "onTab" + capitalize(tabId);
    return Column({
        width: "wrap",
        alignment: "center",
        padding: { end: 20, top: 6, bottom: 6 },
        onClick: handlerName
    }, [
        Text({
            text: label,
            fontSize: 14,
            fontWeight: isActive ? "700" : "500",
            color: isActive ? theme.accent : theme.textTertiary
        }),
        isActive ? Box({
            height: 2,
            width: 30,
            background: theme.accent,
            borderRadius: 1
        }) : Spacer({ height: 2 })
    ]);
}

function buildTabRow(theme) {
    var tabs = [
        { id: "all",      label: St("news_title") },
        { id: "breaking", label: St("breaking") },
        { id: "latest",   label: St("latest") }
    ];
    var children = [];
    for (var i = 0; i < tabs.length; i++) {
        children.push(buildTab(tabs[i].label, tabs[i].id, theme));
    }
    return Row({
        fillMaxWidth: true,
        padding: { start: 16, end: 16, top: 8, bottom: 12 }
    }, children);
}

function buildTagBadge(news, theme) {
    var isBreaking = (news.tag === "breaking");
    var badgeBg = isBreaking ? "#33" + theme.negative.replace("#", "") : "#33" + theme.accent.replace("#", "");
    var badgeColor = isBreaking ? theme.negative : theme.accent;
    var badgeText = isBreaking ? St("breaking") : St("latest");
    return Box({
        width: "wrap",
        background: badgeBg,
        borderRadius: 4,
        padding: { horizontal: 8, vertical: 3 }
    }, [
        Text({ text: badgeText, fontSize: 10, fontWeight: "700", color: badgeColor })
    ]);
}

function buildNewsCard(news, theme) {
    return Column({
        fillMaxWidth: true,
        background: theme.card,
        borderRadius: 12,
        padding: 16,
        onClick: "onNewsClick"
    }, [
        // Tag badge
        buildTagBadge(news, theme),
        Spacer({ height: 8 }),
        // Title
        Text({
            text: news.title,
            fontSize: 15,
            fontWeight: "600",
            color: theme.textPrimary,
            maxLines: 3
        }),
        Spacer({ height: 10 }),
        // Source + time + Read More
        Row({
            fillMaxWidth: true,
            alignment: "spaceBetween",
            crossAlignment: "center"
        }, [
            Text({
                text: news.src + " \u00B7 " + news.time,
                fontSize: 12,
                color: theme.textTertiary,
                width: "wrap"
            }),
            Text({
                text: St("read_more"),
                fontSize: 12,
                fontWeight: "600",
                color: theme.accent,
                width: "wrap"
            })
        ])
    ]);
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();
    var newsList = getNewsByTag(activeTab);

    var newsCards = [];
    for (var i = 0; i < newsList.length; i++) {
        newsCards.push(buildNewsCard(newsList[i], theme));
        if (i < newsList.length - 1) {
            newsCards.push(Spacer({ height: 12 }));
        }
    }
    newsCards.push(Spacer({ height: 16 }));

    OnTheFly.setUI(Column({ height: "fill", background: theme.primary }, [
        // Title
        Text({
            text: St("news_title"),
            fontSize: 22,
            fontWeight: "800",
            color: theme.textPrimary,
            padding: { start: 16, end: 16, top: 4 }
        }),
        // Tab row
        buildTabRow(theme),
        // Scrollable news list
        Column({
            id: "news_scroll",
            fillMaxWidth: true,
            weight: 1,
            scrollable: true,
            padding: { start: 16, end: 16 }
        }, newsCards),
        // Bottom nav
        buildStockBottomNav("news", theme)
    ]));
}

render();

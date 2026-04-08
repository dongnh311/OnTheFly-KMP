// ═══════════════════════════════════════════════════════════
//  News Screen — StockPro
// ═══════════════════════════════════════════════════════════

var activeFilter = "all";
var newsLoaded = false;

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render(); // render with mock data first
    fetchNews(); // fetch real news from Marketaux
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

// ─── Filter handlers ──────────────────────────────────────

function onFilterAll() {
    activeFilter = "all";
    render();
}

function onFilterBullish() {
    activeFilter = "bullish";
    render();
}

function onFilterBearish() {
    activeFilter = "bearish";
    render();
}

// ─── News click ───────────────────────────────────────────

function onNewsClick() {
    toast("Opening article...");
}

// ─── UI Builders ───────────────────────────────────────────

function buildFilterTab(label, filterId, theme) {
    var isActive = (activeFilter === filterId);
    var bgColor;
    var textCol;
    var borderCol;
    if (isActive) {
        if (filterId === "bearish") {
            bgColor = theme.negativeDim;
            textCol = theme.negative;
            borderCol = theme.negative + "33";
        } else {
            bgColor = theme.accentDim;
            textCol = theme.accent;
            borderCol = theme.accent + "33";
        }
    } else {
        bgColor = theme.card;
        textCol = theme.textTertiary;
        borderCol = theme.border;
    }
    return {
        type: "Button",
        props: {
            text: capitalize(label),
            style: "outlined",
            backgroundColor: bgColor,
            borderColor: borderCol,
            textColor: textCol,
            fontSize: 12,
            fontWeight: "semibold",
            cornerRadius: 20,
            padding: { horizontal: 14, vertical: 6 },
            onClick: "onFilter" + capitalize(filterId)
        }
    };
}

function buildNewsCard(news, theme) {
    var tagChildren = [];
    if (news.sym) {
        tagChildren.push({
            type: "Box",
            props: { backgroundColor: theme.accentDim, cornerRadius: 5, padding: { horizontal: 8, vertical: 2 } },
            children: [
                { type: "Text", props: { text: news.sym, fontSize: 10, fontWeight: "bold", color: theme.accent } }
            ]
        });
    }
    tagChildren.push({
        type: "Box",
        props: {
            backgroundColor: news.bull ? theme.accentDim : theme.negativeDim,
            cornerRadius: 5,
            padding: { horizontal: 8, vertical: 2 }
        },
        children: [
            { type: "Text", props: { text: news.bull ? "BULLISH" : "BEARISH", fontSize: 10, fontWeight: "semibold", color: news.bull ? theme.positive : theme.negative } }
        ]
    });

    return {
        type: "Column",
        props: {
            fillMaxWidth: true,
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderWidth: 1,
            cornerRadius: 14,
            padding: { horizontal: 14, vertical: 13 },
            onClick: "onNewsClick"
        },
        children: [
            {
                type: "Row",
                props: { spacing: 6, padding: { bottom: 7 } },
                children: tagChildren
            },
            { type: "Text", props: { text: news.title, fontSize: 14, fontWeight: "semibold", color: theme.textPrimary, lineHeight: 1.45 } },
            { type: "Spacer", props: { height: 6 } },
            { type: "Text", props: { text: news.src + " · " + news.time + " ago", fontSize: 10, color: theme.textTertiary } }
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
                    width: 4,
                    height: 4,
                    cornerRadius: 2,
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
            borderWidth: { top: 1 },
            horizontalArrangement: "spaceEvenly",
            padding: { top: 4, bottom: 8 }
        },
        children: children
    };
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();
    var newsList = getNewsByFilter(activeFilter);

    var newsCards = [];
    for (var i = 0; i < newsList.length; i++) {
        newsCards.push(buildNewsCard(newsList[i], theme));
        if (i < newsList.length - 1) {
            newsCards.push({ type: "Spacer", props: { height: 8 } });
        }
    }
    newsCards.push({ type: "Spacer", props: { height: 70 } });

    OnTheFly.setUI({
        type: "Column",
        props: { fillMaxSize: true, backgroundColor: theme.primary },
        children: [
            // Title + filters
            {
                type: "Column",
                props: { fillMaxWidth: true, padding: { start: 20, end: 20, top: 12 } },
                children: [
                    { type: "Text", props: { text: St("news_title"), fontSize: 20, fontWeight: "bold", color: theme.textPrimary } },
                    { type: "Spacer", props: { height: 10 } },
                    {
                        type: "Row",
                        props: { spacing: 7 },
                        children: [
                            buildFilterTab(St("all"), "all", theme),
                            buildFilterTab(St("bullish"), "bullish", theme),
                            buildFilterTab(St("bearish"), "bearish", theme)
                        ]
                    }
                ]
            },
            // News list
            {
                type: "Column",
                props: { fillMaxWidth: true, weight: 1, scrollable: true, padding: { horizontal: 20, top: 14 } },
                children: newsCards
            },
            // Bottom nav
            buildBottomNav("news", theme)
        ]
    });
}

render();

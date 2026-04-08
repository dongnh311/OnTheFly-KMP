// ═══════════════════════════════════════════════════════════
//  News Screen — StockPro
// ═══════════════════════════════════════════════════════════

var activeTab = "all";
var newsLoaded = false;

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render();
    fetchNews();
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
    return {
        type: "Column",
        props: {
            horizontalAlignment: "center",
            padding: { horizontal: 14, vertical: 6 },
            onClick: handlerName
        },
        children: [
            {
                type: "Text",
                props: {
                    text: label,
                    fontSize: 13,
                    fontWeight: 600,
                    color: isActive ? theme.accent : theme.textTertiary
                }
            },
            {
                type: "Box",
                props: {
                    height: 2,
                    fillMaxWidth: true,
                    background: isActive ? theme.accent : "transparent",
                    margin: { top: 4 }
                }
            }
        ]
    };
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
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            padding: { start: 16, end: 16, top: 12, bottom: 8 }
        },
        children: children
    };
}

function buildTagBadge(news, theme) {
    var isBreaking = (news.tag === "breaking");
    var badgeBg = isBreaking ? theme.negative + "30" : theme.accent + "30";
    var badgeColor = isBreaking ? theme.negative : theme.accent;
    var badgeText = isBreaking ? St("breaking") : St("latest");
    return {
        type: "Box",
        props: {
            background: badgeBg,
            cornerRadius: 4,
            padding: { horizontal: 6, vertical: 2 }
        },
        children: [
            { type: "Text", props: { text: badgeText, fontSize: 10, fontWeight: 700, color: badgeColor } }
        ]
    };
}

function buildNewsCard(news, theme) {
    return {
        type: "Column",
        props: {
            fillMaxWidth: true,
            background: theme.card,
            borderColor: theme.border + "20",
            borderWidth: 1,
            cornerRadius: 12,
            padding: 14,
            onClick: "onNewsClick"
        },
        children: [
            // Tag badge row
            {
                type: "Row",
                props: { spacing: 6, padding: { bottom: 6 } },
                children: [
                    buildTagBadge(news, theme)
                ]
            },
            // Title
            {
                type: "Text",
                props: {
                    text: news.title,
                    fontSize: 14,
                    fontWeight: 600,
                    color: theme.textPrimary,
                    lineHeight: 1.3,
                    padding: { bottom: 6 }
                }
            },
            // Source + time + Read More
            {
                type: "Row",
                props: {
                    fillMaxWidth: true,
                    alignment: "spaceBetween",
                    verticalAlignment: "center"
                },
                children: [
                    {
                        type: "Text",
                        props: {
                            text: news.src + " \u00B7 " + news.time,
                            fontSize: 11,
                            color: theme.textTertiary
                        }
                    },
                    {
                        type: "Text",
                        props: {
                            text: St("read_more"),
                            fontSize: 11,
                            color: theme.accent
                        }
                    }
                ]
            }
        ]
    };
}

function buildBottomNav(activeNavTab, theme) {
    var tabs = [
        { id: "dashboard", icon: "\uD83C\uDFE0", label: St("nav_home") },
        { id: "watchlist", icon: "\u2B50",         label: St("nav_watchlist") },
        { id: "search",    icon: "\uD83D\uDD0D",   label: St("nav_search") },
        { id: "news",      icon: "\uD83D\uDCF0",   label: St("nav_news") }
    ];
    var children = [];
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        var isActive = (tab.id === activeNavTab);
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
            borderColor: theme.border,
            borderWidth: { top: 1 },
            alignment: "spaceEvenly",
            padding: { top: 4, bottom: 8 }
        },
        children: children
    };
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();
    var newsList = getNewsByTag(activeTab);

    var newsCards = [];
    for (var i = 0; i < newsList.length; i++) {
        newsCards.push(buildNewsCard(newsList[i], theme));
        if (i < newsList.length - 1) {
            newsCards.push({ type: "Spacer", props: { height: 10 } });
        }
    }
    newsCards.push({ type: "Spacer", props: { height: 70 } });

    OnTheFly.setUI({
        type: "Column",
        props: { height: "fill", background: theme.primary },
        children: [
            // Title
            {
                type: "Text",
                props: {
                    text: St("news_title"),
                    fontSize: 22,
                    fontWeight: 800,
                    color: theme.textPrimary,
                    padding: { start: 16, end: 16, top: 4 }
                }
            },
            // Tab row
            buildTabRow(theme),
            // Scrollable news list
            {
                type: "Column",
                props: {
                    fillMaxWidth: true,
                    weight: 1,
                    scrollable: true,
                    padding: { horizontal: 16 }
                },
                children: newsCards
            },
            // Bottom nav
            buildBottomNav("news", theme)
        ]
    });
}

render();

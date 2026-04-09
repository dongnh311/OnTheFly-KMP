// ═══════════════════════════════════════════════════════════
//  StockBottomNav — Shared bottom navigation for Stock App
//  Usage: buildStockBottomNav("dashboard", theme)
// ═══════════════════════════════════════════════════════════

function buildStockBottomNav(activeTab, theme) {
    var tabs = [
        { id: "dashboard", icon: "home",        label: St("nav_home") },
        { id: "chart",     icon: "play_arrow",  label: St("nav_chart") },
        { id: "watchlist", icon: "star",        label: St("nav_watchlist") },
        { id: "search",    icon: "search",      label: St("nav_search") },
        { id: "news",      icon: "menu",        label: St("nav_news") }
    ];
    var children = [];
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        var isActive = (tab.id === activeTab);
        var tabColor = isActive ? theme.accent : theme.textTertiary;
        children.push({
            type: "Column",
            props: {
                weight: 1,
                alignment: "center",
                padding: { top: 10, bottom: 6 },
                onClick: "onNavTab_" + tab.id
            },
            children: [
                {
                    type: "Icon",
                    props: { name: tab.icon, size: 20, color: tabColor }
                },
                { type: "Spacer", props: { height: 2 } },
                {
                    type: "Text",
                    props: {
                        text: tab.label,
                        fontSize: 9,
                        color: tabColor,
                        fontWeight: isActive ? "600" : "normal"
                    }
                }
            ]
        });
    }
    return {
        type: "Column",
        props: { fillMaxWidth: true },
        children: [
            { type: "Divider", props: { color: theme.border, thickness: 1 } },
            {
                type: "Row",
                props: { fillMaxWidth: true, background: theme.navBar },
                children: children
            }
        ]
    };
}

// Standard nav handlers — each screen overrides its own tab
function _navTo(screen) {
    OnTheFly.sendToNative("navigateReplace", { screen: screen });
}

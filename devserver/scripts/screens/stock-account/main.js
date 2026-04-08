// ═══════════════════════════════════════════════════════════
//  Account Screen — StockPro
// ═══════════════════════════════════════════════════════════

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render();
}

// ─── Handlers ──────────────────────────────────────────────

function onBackClick() {
    goBack();
}

function onToggle(id, data) {
    if (id === "darkModeToggle") {
        StockTheme.toggle();
        render();
    }
}

function onMenuTap_profile()      { toast(St("edit_profile")); }
function onMenuTap_notifications() { toast(St("notifications")); }
function onMenuTap_security()     { toast(St("security")); }
function onMenuTap_appearance()   { toast(St("appearance")); }
function onMenuTap_api()          { toast(St("api_settings")); }
function onMenuTap_subscription() { toast(St("subscription")); }
function onMenuTap_help()         { toast(St("help_support")); }
function onMenuTap_terms()        { toast(St("terms_privacy")); }

function onSignOut() {
    OnTheFly.update("logoutDialog", { visible: true });
}

function onConfirmLogout() {
    OnTheFly.update("logoutDialog", { visible: false });
    AppState.logout();
    AppState.remove("stock_user_email");
    AppState.remove("stock_watchlist");
    OnTheFly.sendToNative("navigateClearStack", { screen: "stock-login" });
}

function onCancelLogout() {
    OnTheFly.update("logoutDialog", { visible: false });
}

// ─── UI Builders ───────────────────────────────────────────

function buildMenuItem(icon, label, sub, handlerSuffix, theme) {
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            padding: { horizontal: 16, vertical: 14 },
            verticalAlignment: "center",
            onClick: "onMenuTap_" + handlerSuffix
        },
        children: [
            { type: "Text", props: { text: icon, fontSize: 18, padding: { end: 14 } } },
            {
                type: "Column",
                props: { weight: 1 },
                children: [
                    { type: "Text", props: { text: label, fontSize: 14, fontWeight: "medium", color: theme.textPrimary } },
                    { type: "Text", props: { text: sub, fontSize: 11, color: theme.textTertiary } }
                ]
            },
            { type: "Text", props: { text: "›", fontSize: 14, color: theme.textTertiary } }
        ]
    };
}

function buildDarkModeItem(theme) {
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            padding: { horizontal: 16, vertical: 14 },
            verticalAlignment: "center"
        },
        children: [
            { type: "Text", props: { text: StockTheme.isDark() ? "🌙" : "☀️", fontSize: 18, padding: { end: 14 } } },
            {
                type: "Column",
                props: { weight: 1 },
                children: [
                    { type: "Text", props: { text: St("dark_mode"), fontSize: 14, fontWeight: "medium", color: theme.textPrimary } },
                    { type: "Text", props: { text: St("appearance_sub"), fontSize: 11, color: theme.textTertiary } }
                ]
            },
            { type: "Toggle", props: { id: "darkModeToggle", checked: StockTheme.isDark(), onColor: theme.accent } }
        ]
    };
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();
    var user = AppState.getUserName();
    var email = AppState.get("stock_user_email", "demo@onthefly.app");
    var initial = user !== "Guest" ? user.charAt(0).toUpperCase() : "U";
    var mockData = StockData.mockUser;

    // Build menu items list including dark mode toggle as one of the items
    var menuItems = [
        buildMenuItem("👤", St("edit_profile"), St("edit_profile_sub"), "profile", theme),
        buildMenuItem("🔔", St("notifications"), St("notifications_sub"), "notifications", theme),
        buildMenuItem("🔒", St("security"), St("security_sub"), "security", theme),
        buildDarkModeItem(theme),
        buildMenuItem("📊", St("api_settings"), St("api_settings_sub"), "api", theme),
        buildMenuItem("💳", St("subscription"), St("subscription_sub"), "subscription", theme),
        buildMenuItem("❓", St("help_support"), St("help_support_sub"), "help", theme),
        buildMenuItem("📄", St("terms_privacy"), St("terms_privacy_sub"), "terms", theme)
    ];

    // Add dividers between items
    var menuWithDividers = [];
    for (var i = 0; i < menuItems.length; i++) {
        menuWithDividers.push(menuItems[i]);
        if (i < menuItems.length - 1) {
            menuWithDividers.push({ type: "Divider", props: { color: theme.border, padding: { start: 52 } } });
        }
    }

    OnTheFly.setUI({
        type: "Column",
        props: { fillMaxSize: true, backgroundColor: theme.primary },
        children: [
            // Top bar
            {
                type: "Row",
                props: {
                    fillMaxWidth: true,
                    padding: { start: 20, end: 20, top: 8 },
                    verticalAlignment: "center"
                },
                children: [
                    {
                        type: "Button",
                        props: {
                            text: "‹",
                            style: "outlined",
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                            borderWidth: 1,
                            textColor: theme.textSecondary,
                            fontSize: 16,
                            cornerRadius: 10,
                            onClick: "onBackClick"
                        }
                    },
                    { type: "Text", props: { text: St("account_title"), fontSize: 16, fontWeight: "bold", color: theme.textPrimary, weight: 1, textAlign: "center" } },
                    { type: "Spacer", props: { width: 32 } }
                ]
            },

            // Scrollable content
            {
                type: "Column",
                props: { fillMaxWidth: true, weight: 1, scrollable: true },
                children: [
                    // Profile card
                    {
                        type: "Column",
                        props: { fillMaxWidth: true, horizontalAlignment: "center", padding: { top: 20 } },
                        children: [
                            {
                                type: "Box",
                                props: {
                                    width: 72, height: 72, cornerRadius: 36,
                                    backgroundColor: theme.accent,
                                    contentAlignment: "center"
                                },
                                children: [
                                    { type: "Text", props: { text: initial, fontSize: 28, fontWeight: "bold", color: theme.primary } }
                                ]
                            },
                            { type: "Spacer", props: { height: 10 } },
                            { type: "Text", props: { text: user !== "Guest" ? user : "User", fontSize: 18, fontWeight: "bold", color: theme.textPrimary } },
                            { type: "Text", props: { text: email, fontSize: 12, color: theme.textSecondary, padding: { top: 2 } } },
                            // Stats row
                            { type: "Spacer", props: { height: 16 } },
                            {
                                type: "Row",
                                props: { horizontalArrangement: "spaceEvenly", fillMaxWidth: true, padding: { horizontal: 40 } },
                                children: [
                                    {
                                        type: "Column",
                                        props: { horizontalAlignment: "center" },
                                        children: [
                                            { type: "Text", props: { text: "" + mockData.watchlistCount, fontSize: 16, fontWeight: "bold", color: theme.textPrimary } },
                                            { type: "Text", props: { text: St("watchlist_count"), fontSize: 10, color: theme.textTertiary } }
                                        ]
                                    },
                                    {
                                        type: "Column",
                                        props: { horizontalAlignment: "center" },
                                        children: [
                                            { type: "Text", props: { text: mockData.alertsCount, fontSize: 16, fontWeight: "bold", color: theme.textPrimary } },
                                            { type: "Text", props: { text: St("alerts_count"), fontSize: 10, color: theme.textTertiary } }
                                        ]
                                    },
                                    {
                                        type: "Column",
                                        props: { horizontalAlignment: "center" },
                                        children: [
                                            { type: "Text", props: { text: "" + mockData.tradesCount, fontSize: 16, fontWeight: "bold", color: theme.textPrimary } },
                                            { type: "Text", props: { text: St("trades_count"), fontSize: 10, color: theme.textTertiary } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },

                    { type: "Spacer", props: { height: 20 } },

                    // Menu card — single card wrapping all items including dark mode toggle
                    {
                        type: "Column",
                        props: {
                            fillMaxWidth: true,
                            backgroundColor: theme.card,
                            cornerRadius: 16,
                            borderColor: theme.border,
                            borderWidth: 1,
                            margin: { horizontal: 20 }
                        },
                        children: menuWithDividers
                    },

                    { type: "Spacer", props: { height: 20 } },

                    // Sign out button
                    {
                        type: "Button",
                        props: {
                            text: St("sign_out"),
                            fillMaxWidth: true,
                            style: "outlined",
                            borderColor: theme.negative + "33",
                            backgroundColor: theme.negativeDim,
                            textColor: theme.negative,
                            fontSize: 14,
                            fontWeight: "semibold",
                            cornerRadius: 14,
                            padding: 14,
                            margin: { horizontal: 20 },
                            onClick: "onSignOut"
                        }
                    },

                    { type: "Spacer", props: { height: 14 } },

                    // Footer
                    {
                        type: "Row",
                        props: { fillMaxWidth: true, horizontalArrangement: "center" },
                        children: [
                            { type: "Text", props: { text: "On The Fly v2.0 \u00b7 OnTheFly Engine", fontSize: 10, color: theme.textTertiary } }
                        ]
                    },

                    { type: "Spacer", props: { height: 30 } }
                ]
            },

            // Logout dialog
            {
                type: "ConfirmDialog",
                props: {
                    id: "logoutDialog",
                    visible: false,
                    title: St("sign_out"),
                    message: St("confirm_logout"),
                    confirmText: St("sign_out"),
                    cancelText: St("cancel"),
                    onConfirm: "onConfirmLogout",
                    onCancel: "onCancelLogout"
                }
            }
        ]
    });
}

render();

// ═══════════════════════════════════════════════════════════
//  Account Screen — StockPro
// ═══════════════════════════════════════════════════════════

var pushOn = true;
var alertOn = true;
var bioOn = false;

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
    if (id === "pushToggle") {
        pushOn = !pushOn;
        render();
    }
    if (id === "alertToggle") {
        alertOn = !alertOn;
        render();
    }
    if (id === "bioToggle") {
        bioOn = !bioOn;
        render();
    }
}

function onLangEN() {
    StockI18n.setLang("en");
    render();
}

function onLangVI() {
    StockI18n.setLang("vi");
    render();
}

function onChangePass() {
    toast("Coming soon");
}

function onTwoFactor() {
    toast("Coming soon");
}

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

function buildSection(title, rows, theme) {
    var children = [];
    for (var i = 0; i < rows.length; i++) {
        children.push(rows[i]);
        if (i < rows.length - 1) {
            children.push({
                type: "Divider",
                props: { color: theme.border + "15" }
            });
        }
    }
    return {
        type: "Column",
        props: { fillMaxWidth: true, padding: { bottom: 16 } },
        children: [
            {
                type: "Text",
                props: {
                    text: title,
                    fontSize: 12,
                    fontWeight: "600",
                    color: theme.textTertiary,
                    padding: { start: 16, end: 16, bottom: 8 },
                    letterSpacing: 0.5
                }
            },
            {
                type: "Column",
                props: {
                    fillMaxWidth: true,
                    background: theme.card,
                    cornerRadius: 12,
                    borderColor: theme.border + "20",
                    borderWidth: 1,
                    margin: { start: 16, end: 16 }
                },
                children: children
            }
        ]
    };
}

function buildSettingRow(label, rightWidget, theme) {
    return {
        type: "Row",
        props: {
            fillMaxWidth: true,
            padding: { start: 14, end: 14, top: 13, bottom: 13 },
            verticalAlignment: "center"
        },
        children: [
            {
                type: "Text",
                props: {
                    text: label,
                    fontSize: 14,
                    color: theme.textPrimary,
                    weight: 1
                }
            },
            rightWidget
        ]
    };
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    var theme = StockTheme.get();
    var user = AppState.getUserName();
    var email = AppState.get("stock_user_email", "demo@onthefly.app");
    var initial = user !== "Guest" ? user.charAt(0).toUpperCase() : "U";
    var lang = StockI18n.getLang();

    // Language picker buttons
    var langEnBg = lang === "en" ? theme.accent : "transparent";
    var langEnColor = lang === "en" ? "#FFFFFF" : theme.textSecondary;
    var langViBg = lang === "vi" ? theme.accent : "transparent";
    var langViColor = lang === "vi" ? "#FFFFFF" : theme.textSecondary;

    var langPicker = {
        type: "Row",
        props: {
            cornerRadius: 6,
            borderColor: theme.border,
            borderWidth: 1
        },
        children: [
            {
                type: "Box",
                props: {
                    background: langEnBg,
                    padding: { horizontal: 10, vertical: 4 },
                    onClick: "onLangEN"
                },
                children: [
                    {
                        type: "Text",
                        props: {
                            text: "EN",
                            fontSize: 12,
                            fontWeight: "600",
                            color: langEnColor
                        }
                    }
                ]
            },
            {
                type: "Box",
                props: {
                    background: langViBg,
                    padding: { horizontal: 10, vertical: 4 },
                    onClick: "onLangVI"
                },
                children: [
                    {
                        type: "Text",
                        props: {
                            text: "VI",
                            fontSize: 12,
                            fontWeight: "600",
                            color: langViColor
                        }
                    }
                ]
            }
        ]
    };

    // Arrow indicator for navigation rows
    var arrowRight = {
        type: "Text",
        props: { text: "\u2192", color: theme.textTertiary }
    };

    // Build sections
    var appearanceSection = buildSection(St("appearance"), [
        buildSettingRow(St("dark_mode"), {
            type: "Toggle",
            props: { id: "darkModeToggle", checked: StockTheme.isDark(), onColor: theme.accent }
        }, theme),
        buildSettingRow(St("language"), langPicker, theme)
    ], theme);

    var notificationsSection = buildSection(St("notifications"), [
        buildSettingRow(St("push_notif"), {
            type: "Toggle",
            props: { id: "pushToggle", checked: pushOn, onColor: theme.accent }
        }, theme),
        buildSettingRow(St("price_alerts"), {
            type: "Toggle",
            props: { id: "alertToggle", checked: alertOn, onColor: theme.accent }
        }, theme)
    ], theme);

    var securitySection = buildSection(St("security"), [
        buildSettingRow(St("change_pass"), {
            type: "Text",
            props: { text: "\u2192", color: theme.textTertiary, onClick: "onChangePass" }
        }, theme),
        buildSettingRow(St("two_factor"), {
            type: "Text",
            props: { text: "\u2192", color: theme.textTertiary, onClick: "onTwoFactor" }
        }, theme),
        buildSettingRow(St("biometric"), {
            type: "Toggle",
            props: { id: "bioToggle", checked: bioOn, onColor: theme.accent }
        }, theme)
    ], theme);

    var aboutSection = buildSection(St("about"), [
        buildSettingRow(St("version"), {
            type: "Text",
            props: { text: "1.0.0", fontSize: 13, color: theme.textSecondary }
        }, theme),
        buildSettingRow(St("powered_by"), {
            type: "Text",
            props: { text: "\u26A1", fontSize: 11, color: theme.accent }
        }, theme)
    ], theme);

    OnTheFly.setUI({
        type: "Column",
        props: { height: "fill", background: theme.primary },
        children: [
            // Top bar: back + title
            {
                type: "Row",
                props: {
                    fillMaxWidth: true,
                    padding: { start: 16, end: 16, top: 4, bottom: 12 },
                    verticalAlignment: "center"
                },
                children: [
                    {
                        type: "Text",
                        props: {
                            text: "\u2190",
                            fontSize: 18,
                            padding: { end: 12 },
                            onClick: "onBackClick"
                        }
                    },
                    {
                        type: "Text",
                        props: {
                            text: St("account_title"),
                            fontSize: 22,
                            fontWeight: "800",
                            color: theme.textPrimary,
                            weight: 1
                        }
                    }
                ]
            },

            // Scrollable content
            {
                type: "Column",
                props: { fillMaxWidth: true, weight: 1, scrollable: true },
                children: [
                    // Profile card
                    {
                        type: "Row",
                        props: {
                            fillMaxWidth: true,
                            padding: 20,
                            cornerRadius: 16,
                            background: theme.card,
                            borderColor: theme.border + "20",
                            borderWidth: 1,
                            margin: { start: 16, end: 16, bottom: 20 },
                            verticalAlignment: "center",
                            spacing: 14
                        },
                        children: [
                            // Avatar circle
                            {
                                type: "Box",
                                props: {
                                    width: 48,
                                    height: 48,
                                    cornerRadius: 24,
                                    background: theme.accent,
                                    contentAlignment: "center"
                                },
                                children: [
                                    {
                                        type: "Text",
                                        props: {
                                            text: initial,
                                            fontSize: 20,
                                            fontWeight: "700",
                                            color: "#FFFFFF"
                                        }
                                    }
                                ]
                            },
                            // User info
                            {
                                type: "Column",
                                props: {},
                                children: [
                                    {
                                        type: "Text",
                                        props: {
                                            text: user !== "Guest" ? user : "User",
                                            fontSize: 16,
                                            fontWeight: "700",
                                            color: theme.textPrimary
                                        }
                                    },
                                    {
                                        type: "Text",
                                        props: {
                                            text: email,
                                            fontSize: 12,
                                            color: theme.textSecondary
                                        }
                                    },
                                    {
                                        type: "Box",
                                        props: {
                                            background: theme.accentDim,
                                            cornerRadius: 4,
                                            padding: { horizontal: 6, vertical: 2 },
                                            margin: { top: 4 }
                                        },
                                        children: [
                                            {
                                                type: "Text",
                                                props: {
                                                    text: St("pro_member"),
                                                    fontSize: 10,
                                                    fontWeight: "600",
                                                    color: theme.accent
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },

                    // Sections
                    appearanceSection,
                    notificationsSection,
                    securitySection,
                    aboutSection,

                    // Sign out button
                    {
                        type: "Button",
                        props: {
                            text: St("sign_out"),
                            fillMaxWidth: true,
                            variant: "outlined",
                            background: theme.negative + "15",
                            textColor: theme.negative,
                            borderColor: theme.negative + "30",
                            fontSize: 14,
                            fontWeight: "700",
                            cornerRadius: 10,
                            padding: 13,
                            margin: { start: 16, end: 16, bottom: 24 },
                            onClick: "onSignOut"
                        }
                    }
                ]
            },

            // Logout confirm dialog
            {
                type: "ConfirmDialog",
                props: {
                    id: "logoutDialog",
                    visible: false,
                    title: St("confirm_logout"),
                    message: St("confirm_logout"),
                    confirmText: St("confirm"),
                    cancelText: St("cancel"),
                    onConfirm: "onConfirmLogout",
                    onCancel: "onCancelLogout"
                }
            }
        ]
    });
}

render();

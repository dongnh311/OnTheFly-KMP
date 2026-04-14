// ═══════════════════════════════════════════════════════════
//  Account Screen — StockPro (matching mockup exactly)
// ═══════════════════════════════════════════════════════════

var pushOn = true;
var alertOn = true;
var bioOn = false;
var twoFactorOn = false;
var showChangePass = false;
var currentPass = "";
var newPass = "";
var confirmPass = "";
var passError = "";

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render();
}

function onVisible() {
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
    showChangePass = true;
    currentPass = "";
    newPass = "";
    confirmPass = "";
    passError = "";
    render();
}

function onCloseChangePass() {
    showChangePass = false;
    render();
}

function onTextChanged(id, data) {
    if (id === "currentPassField") { currentPass = data.value; }
    if (id === "newPassField") { newPass = data.value; }
    if (id === "confirmPassField") { confirmPass = data.value; }
    if (passError) {
        passError = "";
        OnTheFly.update("passErrorText", { visible: false });
    }
}

function onSavePassword() {
    if (newPass.length < 6) {
        passError = St("password_too_short");
        OnTheFly.update("passErrorText", { visible: true, text: passError });
        return;
    }
    if (newPass !== confirmPass) {
        passError = St("password_mismatch");
        OnTheFly.update("passErrorText", { visible: true, text: passError });
        return;
    }
    showChangePass = false;
    toast(St("password_changed"));
    render();
}

function onTwoFactor() {
    OnTheFly.update("twoFactorDialog", { visible: true });
}

function onConfirmTwoFactor() {
    twoFactorOn = !twoFactorOn;
    OnTheFly.update("twoFactorDialog", { visible: false });
    toast(twoFactorOn ? St("two_factor_enabled") : St("two_factor_disabled"));
    render();
}

function onCancelTwoFactor() {
    OnTheFly.update("twoFactorDialog", { visible: false });
}

var pendingLogout = false;

function onSignOut() {
    OnTheFly.update("logoutDialog", { visible: true });
}

function onConfirmLogout() {
    OnTheFly.sendToNative("navigateClearStack", { screen: "stock-login" });
}

function onCancelLogout() {
    OnTheFly.update("logoutDialog", { visible: false });
}

function checkPendingLogout() {
    if (pendingLogout) {
        pendingLogout = false;
        OnTheFly.sendToNative("navigateClearStack", { screen: "stock-login" });
        return true;
    }
    return false;
}

// ─── UI Builders ───────────────────────────────────────────

function buildSection(title, rows, theme) {
    var children = [];
    for (var i = 0; i < rows.length; i++) {
        children.push(rows[i]);
        if (i < rows.length - 1) {
            children.push(Divider({ color: theme.border }));
        }
    }
    return Column({ fillMaxWidth: true, padding: { start: 16, end: 16, top: 20, bottom: 8 } }, [
        Text({
            text: title.toUpperCase(),
            fontSize: 15,
            fontWeight: "700",
            color: theme.textTertiary,
            letterSpacing: 1
        }),
        Spacer({ height: 12 }),
        Column({
            fillMaxWidth: true,
            background: theme.card,
            borderRadius: 12,
            padding: { start: 16, end: 16, top: 14, bottom: 14 }
        }, children)
    ]);
}

function buildSettingRow(label, rightWidget, theme) {
    if (rightWidget && rightWidget.props && !rightWidget.props.width) {
        rightWidget.props.width = "wrap";
    }
    return Row({
        fillMaxWidth: true,
        height: 48,
        crossAlignment: "center",
        alignment: "spaceBetween"
    }, [
        Text({
            text: label,
            fontSize: 15,
            color: theme.textPrimary,
            width: "wrap"
        }),
        rightWidget
    ]);
}

// ─── Main Render ───────────────────────────────────────────

function render() {
    if (checkPendingLogout()) return;
    var theme = StockTheme.get();
    var user = AppState.getUserName();
    var email = AppState.get("stock_user_email", "demo@onthefly.app");
    if (typeof user === "string" && user.charAt(0) === '"') user = user.replace(/^"|"$/g, "");
    if (typeof email === "string" && email.charAt(0) === '"') email = email.replace(/^"|"$/g, "");
    var initial = user !== "Guest" ? user.charAt(0).toUpperCase() : "U";
    var lang = StockI18n.getLang();

    // Language picker
    var langEnBg = lang === "en" ? theme.accent : "transparent";
    var langEnColor = lang === "en" ? "#FFFFFF" : theme.textSecondary;
    var langViBg = lang === "vi" ? theme.accent : "transparent";
    var langViColor = lang === "vi" ? "#FFFFFF" : theme.textSecondary;

    var langPicker = Row({
        width: "wrap",
        borderRadius: 6,
        background: theme.surfaceVariant,
    }, [
        Box({
            background: langEnBg,
            width: "wrap",
            borderRadiusTopLeft: 6,
            borderRadiusBottomLeft: 6,
            borderRadiusTopRight: 0,
            borderRadiusBottomRight: 0,
            padding: { horizontal: 14, vertical: 6 },
            onClick: "onLangEN"
        }, [
            Text({
                text: "EN",
                fontSize: 12,
                fontWeight: "700",
                color: langEnColor
            })
        ]),
        Box({
            background: langViBg,
            width: "wrap",
            borderRadiusTopLeft: 0,
            borderRadiusBottomLeft: 0,
            borderRadiusTopRight: 6,
            borderRadiusBottomRight: 6,
            padding: { horizontal: 14, vertical: 6 },
            onClick: "onLangVI"
        }, [
            Text({
                text: "VI",
                fontSize: 12,
                fontWeight: "700",
                color: langViColor
            })
        ])
    ]);

    // Arrow icon for navigation rows
    var arrowRight = Icon({ name: "arrow_forward", size: 18, color: theme.textTertiary, width: "wrap" });

    // Build sections
    var appearanceSection = buildSection(St("appearance"), [
        buildSettingRow(St("dark_mode"),
            Toggle({ id: "darkModeToggle", checked: StockTheme.isDark(), activeColor: theme.accent, inactiveColor: theme.surfaceVariant, thumbColor: "#FFFFFF" }),
        theme),
        buildSettingRow(St("language"), langPicker, theme)
    ], theme);

    var notificationsSection = buildSection(St("notifications"), [
        buildSettingRow(St("push_notif"),
            Toggle({ id: "pushToggle", checked: pushOn, activeColor: theme.accent, inactiveColor: theme.surfaceVariant, thumbColor: "#FFFFFF" }),
        theme),
        buildSettingRow(St("price_alerts"),
            Toggle({ id: "alertToggle", checked: alertOn, activeColor: theme.accent, inactiveColor: theme.surfaceVariant, thumbColor: "#FFFFFF" }),
        theme)
    ], theme);

    var twoFactorStatus = twoFactorOn
        ? Text({ text: "ON", fontSize: 12, fontWeight: "700", color: theme.positive, width: "wrap" })
        : Icon({ name: "arrow_forward", size: 18, color: theme.textTertiary, width: "wrap", onClick: "onTwoFactor" });

    var securitySection = buildSection(St("security"), [
        buildSettingRow(St("change_pass"),
            Icon({ name: "arrow_forward", size: 18, color: theme.textTertiary, width: "wrap", onClick: "onChangePass" }),
        theme),
        buildSettingRow(St("two_factor"),
            twoFactorOn
                ? Row({ width: "wrap", crossAlignment: "center", spacing: 8 }, [
                    Text({ text: "ON", fontSize: 12, fontWeight: "700", color: theme.positive, width: "wrap" }),
                    Icon({ name: "arrow_forward", size: 18, color: theme.textTertiary, width: "wrap", onClick: "onTwoFactor" })
                ])
                : Icon({ name: "arrow_forward", size: 18, color: theme.textTertiary, width: "wrap", onClick: "onTwoFactor" }),
        theme),
        buildSettingRow(St("biometric"),
            Toggle({ id: "bioToggle", checked: bioOn, activeColor: theme.accent, inactiveColor: theme.surfaceVariant, thumbColor: "#FFFFFF" }),
        theme)
    ], theme);

    var aboutSection = buildSection(St("about"), [
        buildSettingRow(St("version"),
            Text({ text: "1.0.0", fontSize: 13, color: theme.textSecondary }),
        theme),
        buildSettingRow(St("powered_by"),
            Text({ text: "\u26A1", fontSize: 13, color: theme.accent }),
        theme)
    ], theme);

    OnTheFly.setUI(Column({ height: "fill", background: theme.primary }, [
        // Top bar: back + title
        Row({
            fillMaxWidth: true,
            padding: { start: 16, end: 16, top: 4, bottom: 12 },
            verticalAlignment: "center",
            spacing: 12
        }, [
            Icon({
                name: "arrow_back",
                size: 22,
                color: theme.textPrimary,
                onClick: "onBackClick"
            }),
            Text({
                text: St("account_title"),
                fontSize: 22,
                fontWeight: "800",
                color: theme.textPrimary
            })
        ]),

        // Scrollable content
        Column({ id: "account_scroll", fillMaxWidth: true, weight: 1, scrollable: true }, [
            // Profile card (wrapped in padding Box)
            Box({ padding: { horizontal: 16, bottom: 20 } }, [
                Row({
                    fillMaxWidth: true,
                    padding: 20,
                    borderRadius: 14,
                    background: theme.card,
                    crossAlignment: "center",
                    spacing: 14
                }, [
                    // Avatar circle
                    Box({
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        background: theme.accent,
                        contentAlignment: "center"
                    }, [
                        Text({
                            text: initial,
                            fontSize: 20,
                            fontWeight: "700",
                            color: "#FFFFFF"
                        })
                    ]),
                    // User info
                    Column({ width: "wrap" }, [
                        Text({
                            text: user !== "Guest" ? user : "User",
                            fontSize: 16,
                            fontWeight: "700",
                            color: theme.textPrimary
                        }),
                        Text({
                            text: email,
                            fontSize: 12,
                            color: theme.textSecondary
                        }),
                        Spacer({ height: 4 }),
                        Box({
                            width: "wrap",
                            background: "#33" + theme.accent.replace("#", ""),
                            borderRadius: 4,
                            padding: { horizontal: 8, vertical: 2 }
                        }, [
                            Text({
                                text: St("pro_member"),
                                fontSize: 10,
                                fontWeight: "700",
                                color: theme.accent
                            })
                        ])
                    ])
                ])
            ]),

            // Sections
            appearanceSection,
            notificationsSection,
            securitySection,
            aboutSection,

            // Sign out button
            Box({
                padding: { horizontal: 16, bottom: 24, top: 4 }
            }, [
                Box({
                    fillMaxWidth: true,
                    background: StockTheme.isDark() ? "#2A1520" : "#FDE8E8",
                    borderRadius: 10,
                    borderColor: theme.negative,
                    borderWidth: 1,
                    padding: { vertical: 14 },
                    contentAlignment: "center",
                    onClick: "onSignOut"
                }, [
                    Text({
                        text: St("sign_out"),
                        fontSize: 15,
                        fontWeight: "700",
                        color: theme.negative
                    })
                ])
            ])
        ]),

        // Logout confirm dialog
        ConfirmDialog({
            id: "logoutDialog",
            visible: false,
            title: St("confirm_logout"),
            message: St("confirm_logout"),
            confirmText: St("confirm"),
            cancelText: St("cancel"),
            onConfirm: "onConfirmLogout",
            onCancel: "onCancelLogout"
        }),

        // 2FA confirm dialog
        ConfirmDialog({
            id: "twoFactorDialog",
            visible: false,
            title: St("two_factor"),
            message: St("two_factor_desc"),
            confirmText: twoFactorOn ? St("disable") : St("enable"),
            cancelText: St("cancel"),
            onConfirm: "onConfirmTwoFactor",
            onCancel: "onCancelTwoFactor"
        }),

        // Change Password popup
        Popup({
            id: "changePassPopup",
            visible: showChangePass,
            onDismiss: "onCloseChangePass",
            background: theme.primary,
            animation: "slideUp"
        }, [
            Text({
                text: St("change_pass"),
                fontSize: 22,
                fontWeight: "800",
                color: theme.textPrimary,
                padding: { bottom: 24 }
            }),
            // Current password
            Text({ text: St("current_password"), fontSize: 12, color: theme.textSecondary, padding: { bottom: 4 } }),
            TextField({
                id: "currentPassField",
                value: currentPass,
                placeholder: St("current_password"),
                type: "password",
                background: theme.inputBg,
                textColor: theme.textPrimary,
                placeholderColor: theme.textTertiary,
                borderColor: theme.border,
                focusedBorderColor: theme.accent,
                fontSize: 14,
                cornerRadius: 10,
                padding: { horizontal: 12, vertical: 8 }
            }),
            Spacer({ height: 16 }),
            // New password
            Text({ text: St("new_password"), fontSize: 12, color: theme.textSecondary, padding: { bottom: 4 } }),
            TextField({
                id: "newPassField",
                value: newPass,
                placeholder: St("new_password"),
                type: "password",
                background: theme.inputBg,
                textColor: theme.textPrimary,
                placeholderColor: theme.textTertiary,
                borderColor: theme.border,
                focusedBorderColor: theme.accent,
                fontSize: 14,
                cornerRadius: 10,
                padding: { horizontal: 12, vertical: 8 }
            }),
            Spacer({ height: 16 }),
            // Confirm password
            Text({ text: St("confirm_new_password"), fontSize: 12, color: theme.textSecondary, padding: { bottom: 4 } }),
            TextField({
                id: "confirmPassField",
                value: confirmPass,
                placeholder: St("confirm_new_password"),
                type: "password",
                background: theme.inputBg,
                textColor: theme.textPrimary,
                placeholderColor: theme.textTertiary,
                borderColor: theme.border,
                focusedBorderColor: theme.accent,
                fontSize: 14,
                cornerRadius: 10,
                padding: { horizontal: 12, vertical: 8 }
            }),
            // Error message
            Text({
                id: "passErrorText",
                text: passError,
                fontSize: 12,
                color: theme.negative,
                visible: !!passError,
                padding: { top: 8 }
            }),
            Spacer({ height: 24 }),
            // Save button
            Box({
                fillMaxWidth: true,
                background: theme.accent,
                borderRadius: 10,
                padding: { vertical: 14 },
                contentAlignment: "center",
                onClick: "onSavePassword"
            }, [
                Text({
                    text: St("save"),
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#FFFFFF"
                })
            ])
        ])
    ]));
}

render();

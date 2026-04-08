// ═══════════════════════════════════════════════════════════
//  Login Screen — StockPro (matching mockup exactly)
// ═══════════════════════════════════════════════════════════

var email = "";
var password = "";
var errorMsg = "";
var loading = false;

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render();
}

// ─── Event Handlers ────────────────────────────────────────

function onTextChanged(id, data) {
    if (id === "emailField") {
        email = data.value;
        if (errorMsg) { errorMsg = ""; OnTheFly.update("errorBanner", { visible: false }); }
    }
    if (id === "passwordField") {
        password = data.value;
        if (errorMsg) { errorMsg = ""; OnTheFly.update("errorBanner", { visible: false }); }
    }
}

function onLoginClick() {
    if (!email || email.trim() === "") {
        errorMsg = St("email_required");
        OnTheFly.update("errorBanner", { visible: true });
        OnTheFly.update("errorText", { text: errorMsg });
        return;
    }
    if (!password || password.trim() === "") {
        errorMsg = St("password_required");
        OnTheFly.update("errorBanner", { visible: true });
        OnTheFly.update("errorText", { text: errorMsg });
        return;
    }

    loading = true;
    OnTheFly.update("loginBtn", { text: St("signing_in"), enabled: false });

    var userName = email.split("@")[0];
    AppState.login(userName);
    AppState.set("stock_user_email", email);
    OnTheFly.sendToNative("navigateClearStack", { screen: "stock-dashboard" });
}

function onDemoClick() {
    loading = true;
    OnTheFly.update("demoBtn", { enabled: false });
    AppState.login("demo");
    AppState.set("stock_user_email", "demo@onthefly.app");
    OnTheFly.sendToNative("navigateClearStack", { screen: "stock-dashboard" });
}

function onThemeToggle() {
    StockTheme.toggle();
    render();
}

function onLangToggle() {
    var lang = StockI18n.getLang();
    StockI18n.setLang(lang === "en" ? "vi" : "en");
    render();
}

function onForgotPassword() {
    toast(St("forgot_password"));
}

function onSignUp() {
    toast(St("signup_link"));
}

function onGoogleLogin() {
    toast("Google Sign In");
}

function onAppleLogin() {
    toast("Apple Sign In");
}

// ─── UI ────────────────────────────────────────────────────

function render() {
    var theme = StockTheme.get();

    OnTheFly.setUI({
        type: "Column",
        props: {
            fillMaxSize: true,
            backgroundColor: theme.primary,
            scrollable: true
        },
        children: [
            // Top bar — theme + lang toggles
            {
                type: "Row",
                props: {
                    fillMaxWidth: true,
                    padding: { start: 16, end: 16, top: 12 },
                    horizontalArrangement: "end"
                },
                children: [
                    {
                        type: "Button",
                        props: {
                            text: StockTheme.isDark() ? "Light" : "Dark",
                            style: "text",
                            textColor: theme.textSecondary,
                            fontSize: 12,
                            onClick: "onThemeToggle"
                        }
                    },
                    {
                        type: "Button",
                        props: {
                            text: StockI18n.getLang() === "en" ? "VI" : "EN",
                            style: "text",
                            textColor: theme.textSecondary,
                            fontSize: 12,
                            onClick: "onLangToggle"
                        }
                    }
                ]
            },

            { type: "Spacer", props: { height: 40 } },

            // Logo + Title
            {
                type: "Column",
                props: {
                    fillMaxWidth: true,
                    horizontalAlignment: "center",
                    padding: { horizontal: 24 }
                },
                children: [
                    { type: "Text", props: { text: "📈", fontSize: 56 } },
                    { type: "Spacer", props: { height: 10 } },
                    { type: "Text", props: { text: "Welcome Back", fontSize: 22, fontWeight: "bold", color: theme.textPrimary } },
                    { type: "Spacer", props: { height: 2 } },
                    { type: "Text", props: { text: "Sign in to On The Fly", fontSize: 12, color: theme.textSecondary } }
                ]
            },

            { type: "Spacer", props: { height: 20 } },

            // Form
            {
                type: "Column",
                props: {
                    fillMaxWidth: true,
                    padding: { horizontal: 24 }
                },
                children: [
                    // Error banner (single banner, like mockup)
                    {
                        type: "Box",
                        props: {
                            id: "errorBanner",
                            visible: errorMsg !== "",
                            fillMaxWidth: true,
                            backgroundColor: theme.negativeDim,
                            cornerRadius: 10,
                            padding: { horizontal: 12, vertical: 10 },
                            margin: { bottom: 14 }
                        },
                        children: [
                            { type: "Text", props: { id: "errorText", text: errorMsg, fontSize: 12, color: theme.negative } }
                        ]
                    },

                    // Email label
                    { type: "Text", props: { text: St("email_label"), fontSize: 11, fontWeight: "medium", color: theme.textSecondary, padding: { bottom: 5 } } },
                    {
                        type: "TextField",
                        props: {
                            id: "emailField",
                            value: email,
                            placeholder: St("email_placeholder"),
                            backgroundColor: theme.input,
                            borderColor: email ? theme.accentSoft : theme.border,
                            textColor: theme.textPrimary,
                            placeholderColor: theme.textTertiary,
                            cornerRadius: 12,
                            padding: 13,
                            keyboardType: "email"
                        }
                    },

                    { type: "Spacer", props: { height: 14 } },

                    // Password label
                    { type: "Text", props: { text: St("password_label"), fontSize: 11, fontWeight: "medium", color: theme.textSecondary, padding: { bottom: 5 } } },
                    {
                        type: "TextField",
                        props: {
                            id: "passwordField",
                            value: password,
                            placeholder: "••••••••",
                            isPassword: true,
                            backgroundColor: theme.input,
                            borderColor: password ? theme.accentSoft : theme.border,
                            textColor: theme.textPrimary,
                            placeholderColor: theme.textTertiary,
                            cornerRadius: 12,
                            padding: 13
                        }
                    },

                    // Forgot password
                    {
                        type: "Row",
                        props: { fillMaxWidth: true, horizontalArrangement: "end", padding: { top: 6, bottom: 20 } },
                        children: [
                            { type: "Button", props: { text: St("forgot_password"), style: "text", textColor: theme.accent, fontSize: 12, onClick: "onForgotPassword" } }
                        ]
                    },

                    // Sign In button
                    {
                        type: "Button",
                        props: {
                            id: "loginBtn",
                            text: St("sign_in"),
                            fillMaxWidth: true,
                            backgroundColor: theme.accent,
                            textColor: theme.primary,
                            fontSize: 14,
                            fontWeight: "bold",
                            cornerRadius: 14,
                            padding: 14,
                            onClick: "onLoginClick"
                        }
                    },

                    { type: "Spacer", props: { height: 18 } },

                    // Divider "or"
                    {
                        type: "Row",
                        props: { fillMaxWidth: true, verticalAlignment: "center" },
                        children: [
                            { type: "Divider", props: { color: theme.border, weight: 1 } },
                            { type: "Text", props: { text: "  or  ", fontSize: 11, color: theme.textTertiary } },
                            { type: "Divider", props: { color: theme.border, weight: 1 } }
                        ]
                    },

                    { type: "Spacer", props: { height: 18 } },

                    // Demo mode button
                    {
                        type: "Button",
                        props: {
                            id: "demoBtn",
                            text: "▶ " + St("try_demo"),
                            fillMaxWidth: true,
                            style: "outlined",
                            borderColor: theme.accent + "33",
                            backgroundColor: theme.accentDim,
                            textColor: theme.accent,
                            fontSize: 13,
                            fontWeight: "semibold",
                            cornerRadius: 14,
                            padding: 13,
                            onClick: "onDemoClick"
                        }
                    },

                    { type: "Spacer", props: { height: 12 } },

                    // Social login buttons (Google + Apple)
                    {
                        type: "Row",
                        props: { fillMaxWidth: true, spacing: 10 },
                        children: [
                            {
                                type: "Button",
                                props: {
                                    text: "G  Google",
                                    weight: 1,
                                    style: "outlined",
                                    borderColor: theme.border,
                                    backgroundColor: theme.card,
                                    textColor: theme.textPrimary,
                                    fontSize: 12,
                                    fontWeight: "medium",
                                    cornerRadius: 12,
                                    padding: 12,
                                    onClick: "onGoogleLogin"
                                }
                            },
                            {
                                type: "Button",
                                props: {
                                    text: "  Apple",
                                    weight: 1,
                                    style: "outlined",
                                    borderColor: theme.border,
                                    backgroundColor: theme.card,
                                    textColor: theme.textPrimary,
                                    fontSize: 12,
                                    fontWeight: "medium",
                                    cornerRadius: 12,
                                    padding: 12,
                                    onClick: "onAppleLogin"
                                }
                            }
                        ]
                    },

                    { type: "Spacer", props: { height: 22 } },

                    // Sign up link
                    {
                        type: "Row",
                        props: { fillMaxWidth: true, horizontalArrangement: "center" },
                        children: [
                            { type: "Button", props: { text: St("signup_link"), style: "text", textColor: theme.accent, fontSize: 13, fontWeight: "semibold", onClick: "onSignUp" } }
                        ]
                    },

                    { type: "Spacer", props: { height: 20 } }
                ]
            }
        ]
    });
}

render();

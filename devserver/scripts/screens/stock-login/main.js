// ═══════════════════════════════════════════════════════════
//  Login Screen — StockPro (matching mockup exactly)
// ═══════════════════════════════════════════════════════════

var email = "";
var password = "";
var emailError = "";
var passwordError = "";

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render();
}

// ─── Event Handlers ────────────────────────────────────────

function onTextChanged(id, data) {
    if (id === "emailField") {
        email = data.value;
        if (emailError) {
            emailError = "";
            render();
        }
    }
    if (id === "passwordField") {
        password = data.value;
        if (passwordError) {
            passwordError = "";
            render();
        }
    }
}

function onLoginClick() {
    var theme = StockTheme.get();
    var hasError = false;

    if (!email || email.trim() === "") {
        emailError = St("email_required");
        OnTheFly.update("emailError", { visible: true, text: emailError });
        OnTheFly.update("emailField", { borderColor: theme.negative });
        hasError = true;
    }
    if (!password || password.trim() === "") {
        passwordError = St("password_required");
        OnTheFly.update("passwordError", { visible: true, text: passwordError });
        OnTheFly.update("passwordField", { borderColor: theme.negative });
        hasError = true;
    }

    if (hasError) return;

    var userName = email.split("@")[0];
    AppState.login(userName);
    AppState.set("stock_user_email", email);
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

function onSignUp() {
    toast(St("signup_link"));
}

// ─── UI ────────────────────────────────────────────────────

function render() {
    var theme = StockTheme.get();
    var lang = StockI18n.getLang();

    OnTheFly.setUI({
        type: "Column",
        props: {
            height: "fill",
            background: theme.primary,
            padding: 16,
            paddingTop: 0,
            paddingBottom: 0
        },
        children: [
            // Top bar — theme + lang toggles (right-aligned, vertically centered)
            {
                type: "Row",
                props: {
                    fillMaxWidth: true,
                    alignment: "end",
                    crossAlignment: "center",
                    spacing: 8
                },
                children: [
                    {
                        type: "Text",
                        props: {
                            text: StockTheme.isDark() ? "\uD83C\uDF19" : "\u2600\uFE0F",
                            fontSize: 18,
                            onClick: "onThemeToggle"
                        }
                    },
                    {
                        type: "Button",
                        props: {
                            text: lang.toUpperCase(),
                            variant: "outlined",
                            fontSize: 11,
                            fontWeight: "bold",
                            textColor: theme.accent,
                            borderColor: theme.accent,
                            cornerRadius: 4,
                            padding: { horizontal: 6, vertical: 2 },
                            onClick: "onLangToggle"
                        }
                    }
                ]
            },

            // Center content area (weight: 1 takes remaining space, centers content)
            {
                type: "Box",
                props: {
                    weight: 1,
                    contentAlignment: "center"
                },
                children: [{
                    type: "Column",
                    props: {
                        alignment: "center",
                        padding: { horizontal: 16 }
                    },
                    children: [
                        // Logo emoji
                        { type: "Text", props: { text: "\uD83D\uDCC8", fontSize: 56 } },
                        { type: "Spacer", props: { height: 8 } },

                        // App title
                        {
                            type: "Text",
                            props: {
                                text: St("login_title"),
                                fontSize: 32,
                                fontWeight: "bold",
                                color: theme.accent
                            }
                        },

                        // Subtitle
                        {
                            type: "Text",
                            props: {
                                text: St("login_subtitle"),
                                fontSize: 13,
                                color: theme.textSecondary
                            }
                        },

                        { type: "Spacer", props: { height: 40 } },

                        // Form section (left-aligned labels)
                        {
                            type: "Column",
                            props: { fillMaxWidth: true },
                            children: [
                                // Email label
                                { type: "Text", props: { text: St("email_label"), fontSize: 12, color: theme.textSecondary, padding: { bottom: 4 } } },
                                // Email input
                                {
                                    type: "TextField",
                                    props: {
                                        id: "emailField",
                                        value: email,
                                        placeholder: St("email_placeholder"),
                                        background: theme.inputBg,
                                        borderColor: emailError ? theme.negative : theme.border,
                                        textColor: theme.textPrimary,
                                        placeholderColor: theme.textTertiary,
                                        cornerRadius: 10,
                                        padding: { horizontal: 14, vertical: 12 },
                                        fontSize: 14,
                                        type: "email"
                                    }
                                },
                                // Email error
                                { type: "Text", props: { id: "emailError", text: emailError, fontSize: 11, color: theme.negative, visible: emailError !== "", padding: { top: 3 } } },

                                { type: "Spacer", props: { height: 14 } },

                                // Password label
                                { type: "Text", props: { text: St("password_label"), fontSize: 12, color: theme.textSecondary, padding: { bottom: 4 } } },
                                // Password input
                                {
                                    type: "TextField",
                                    props: {
                                        id: "passwordField",
                                        value: password,
                                        placeholder: St("password_placeholder"),
                                        type: "password",
                                        background: theme.inputBg,
                                        borderColor: passwordError ? theme.negative : theme.border,
                                        textColor: theme.textPrimary,
                                        placeholderColor: theme.textTertiary,
                                        cornerRadius: 10,
                                        padding: { horizontal: 14, vertical: 12 },
                                        fontSize: 14
                                    }
                                },
                                // Password error
                                { type: "Text", props: { id: "passwordError", text: passwordError, fontSize: 11, color: theme.negative, visible: passwordError !== "", padding: { top: 3 } } },

                                { type: "Spacer", props: { height: 28 } },

                                // Sign In button
                                {
                                    type: "Button",
                                    props: {
                                        id: "loginBtn",
                                        text: St("sign_in"),
                                        width: "fill",
                                        background: theme.accent,
                                        textColor: "#FFFFFF",
                                        fontSize: 15,
                                        fontWeight: "bold",
                                        cornerRadius: 10,
                                        padding: { vertical: 13 },
                                        onClick: "onLoginClick"
                                    }
                                },

                                { type: "Spacer", props: { height: 14 } },

                                // Sign up link
                                {
                                    type: "Row",
                                    props: { fillMaxWidth: true, alignment: "center" },
                                    children: [
                                        { type: "Text", props: { text: St("signup_link"), fontSize: 12, color: theme.textSecondary, onClick: "onSignUp" } }
                                    ]
                                }
                            ]
                        }
                    ]
                }]
            },

            // Footer — powered by (at bottom, centered)
            {
                type: "Row",
                props: {
                    fillMaxWidth: true,
                    alignment: "center",
                    padding: { vertical: 8 }
                },
                children: [
                    { type: "Text", props: { text: St("powered_by"), fontSize: 10, color: theme.textTertiary } }
                ]
            }
        ]
    });
}

render();

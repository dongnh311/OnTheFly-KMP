// ═══════════════════════════════════════════════════════════
//  Login Screen — StockPro (matching mockup exactly)
// ═══════════════════════════════════════════════════════════

var email = "";
var password = "";
var emailError = false;
var passwordError = false;

// ─── Lifecycle ─────────────────────────────────────────────

function onCreateView() {
    render();
}

function onVisible() {
    render();
}

// ─── Event Handlers ────────────────────────────────────────

function onTextChanged(id, data) {
    if (id === "emailField") {
        email = data.value;
        if (emailError) {
            emailError = false;
            render();
        }
    }
    if (id === "passwordField") {
        password = data.value;
        if (passwordError) {
            passwordError = false;
            render();
        }
    }
}

function onLoginClick() {
    OnTheFly.sendToNative("hideKeyboard", {});
    var theme = StockTheme.get();
    var hasError = false;

    if (!email || email.trim() === "") {
        emailError = true;
        OnTheFly.update("emailError", { visible: true, text: St("email_required") });
        OnTheFly.update("emailField", { borderColor: theme.negative });
        hasError = true;
    }
    if (!password || password.trim() === "") {
        passwordError = true;
        OnTheFly.update("passwordError", { visible: true, text: St("password_required") });
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
    toast("Sign up coming soon!");
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
            // Top bar — dark mode + lang toggle (right-aligned)
            {
                type: "Row",
                props: {
                    fillMaxWidth: true,
                    alignment: "end",
                    crossAlignment: "center",
                    padding: { top: 4, right: 0 },
                    spacing: 12
                },
                children: [
                    {
                        type: "Text",
                        props: {
                            text: StockTheme.isDark() ? "\uD83C\uDF19" : "\u2600\uFE0F",
                            fontSize: 16,
                            onClick: "onThemeToggle"
                        }
                    },
                    { type: "Spacer", props: { width: 8 } },
                    {
                        type: "Box",
                        props: {
                            width: "wrap",
                            borderColor: theme.accent,
                            borderWidth: 1.5,
                            cornerRadius: 6,
                            padding: { horizontal: 8, vertical: 2 },
                            onClick: "onLangToggle"
                        },
                        children: [
                            {
                                type: "Text",
                                props: {
                                    text: lang.toUpperCase(),
                                    fontSize: 11,
                                    fontWeight: "bold",
                                    color: theme.accent
                                }
                            }
                        ]
                    }
                ]
            },

            // Space above logo
            { type: "Spacer", props: { weight: 2 } },

            // Logo + Title + Subtitle (centered)
            {
                type: "Column",
                props: {
                    fillMaxWidth: true,
                    alignment: "center",
                    padding: { horizontal: 32 }
                },
                children: [
                    { type: "Text", props: { text: "\uD83D\uDCC8", fontSize: 36 } },
                    { type: "Spacer", props: { height: 6 } },
                    {
                        type: "Text",
                        props: {
                            text: St("login_title"),
                            fontSize: 28,
                            fontWeight: "bold",
                            color: theme.accent
                        }
                    },
                    {
                        type: "Text",
                        props: {
                            text: St("login_subtitle"),
                            fontSize: 13,
                            color: theme.textSecondary
                        }
                    }
                ]
            },

            { type: "Spacer", props: { weight: 1 } },

            // Form section (compact, left-aligned labels)
            {
                type: "Column",
                props: { fillMaxWidth: true, padding: { horizontal: 32 } },
                children: [
                    // Email
                    { type: "Text", props: { text: St("email_label"), fontSize: 12, color: theme.textSecondary, padding: { bottom: 4 } } },
                    {
                        type: "TextField",
                        props: {
                            id: "emailField",
                            value: email,
                            placeholder: St("email_placeholder"),
                            background: theme.inputBg,
                            borderColor: emailError ? theme.negative : theme.border,
                            focusedBorderColor: emailError ? theme.negative : theme.accent,
                            textColor: theme.textPrimary,
                            placeholderColor: theme.textTertiary,
                            cornerRadius: 10,
                            padding: { horizontal: 14, vertical: 12 },
                            fontSize: 14,
                            type: "email"
                        }
                    },
                    { type: "Text", props: { id: "emailError", text: emailError ? St("email_required") : "", fontSize: 11, color: theme.negative, visible: emailError, padding: { top: 2 } } },

                    { type: "Spacer", props: { height: 16 } },

                    // Password
                    { type: "Text", props: { text: St("password_label"), fontSize: 12, color: theme.textSecondary, padding: { bottom: 4 } } },
                    {
                        type: "TextField",
                        props: {
                            id: "passwordField",
                            value: password,
                            placeholder: St("password_placeholder"),
                            type: "password",
                            background: theme.inputBg,
                            borderColor: passwordError ? theme.negative : theme.border,
                            focusedBorderColor: passwordError ? theme.negative : theme.accent,
                            textColor: theme.textPrimary,
                            placeholderColor: theme.textTertiary,
                            cornerRadius: 10,
                            padding: { horizontal: 14, vertical: 12 },
                            fontSize: 14
                        }
                    },
                    { type: "Text", props: { id: "passwordError", text: passwordError ? St("password_required") : "", fontSize: 11, color: theme.negative, visible: passwordError, padding: { top: 2 } } },

                    { type: "Spacer", props: { height: 16 } },

                    // Sign In button
                    {
                        type: "Button",
                        props: {
                            id: "loginBtn",
                            text: St("sign_in"),
                            width: "fill",
                            background: theme.accent,
                            textColor: "#FFFFFF",
                            fontSize: 16,
                            fontWeight: "bold",
                            borderRadius: 10,
                            padding: { vertical: 14 },
                            onClick: "onLoginClick"
                        }
                    },

                    { type: "Spacer", props: { height: 10 } },

                    // Sign up link
                    {
                        type: "Row",
                        props: { fillMaxWidth: true, alignment: "center" },
                        children: [
                            { type: "Text", props: { text: St("signup_link"), fontSize: 12, color: theme.textSecondary, onClick: "onSignUp" } }
                        ]
                    }
                ]
            },

            // Bottom spacer + footer
            { type: "Spacer", props: { weight: 3 } },

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

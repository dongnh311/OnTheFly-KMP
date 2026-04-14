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
    resetWatchlistCache(); // Reset cache so new user loads their own watchlist
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

    OnTheFly.setUI(
        Column({
            height: "fill",
            background: theme.primary,
            padding: 16,
            paddingTop: 0,
            paddingBottom: 0
        }, [
            // Top bar — dark mode + lang toggle (right-aligned)
            Row({
                fillMaxWidth: true,
                alignment: "end",
                crossAlignment: "center",
                padding: { top: 4, right: 0 },
                spacing: 12,
            }, [
                Text({
                    text: StockTheme.isDark() ? "\uD83C\uDF19" : "\u2600\uFE0F",
                    fontSize: 16,
                    onClick: "onThemeToggle"
                }),
                Spacer({ width: 8 }),
                Box({
                    width: "wrap",
                    borderColor: theme.accent,
                    borderWidth: 1.5,
                    cornerRadius: 6,
                    padding: { horizontal: 8, vertical: 2 },
                    onClick: "onLangToggle"
                }, [
                    Text({
                        text: lang.toUpperCase(),
                        fontSize: 11,
                        fontWeight: "bold",
                        color: theme.accent,
                    })
                ])
            ]),

            // Space above logo
            Spacer({ weight: 2 }),

            // Logo + Title + Subtitle (centered)
            Column({
                fillMaxWidth: true,
                alignment: "center",
                padding: { horizontal: 32 }
            }, [
                Text({ text: "\uD83D\uDCC8", fontSize: 36 }),
                Spacer({ height: 6 }),
                Text({
                    text: St("login_title"),
                    fontSize: 28,
                    fontWeight: "bold",
                    color: theme.accent
                }),
                Text({
                    text: St("login_subtitle"),
                    fontSize: 13,
                    color: theme.textSecondary
                })
            ]),

            Spacer({ weight: 1 }),

            // Form section (compact, left-aligned labels)
            Column({ fillMaxWidth: true, padding: { horizontal: 32 } }, [
                // Email
                Text({ text: St("email_label"), fontSize: 12, color: theme.textSecondary, padding: { bottom: 4 } }),
                TextField({
                    id: "emailField",
                    value: email,
                    placeholder: St("email_placeholder"),
                    background: theme.inputBg,
                    borderColor: emailError ? theme.negative : theme.border,
                    focusedBorderColor: emailError ? theme.negative : theme.accent,
                    textColor: theme.textPrimary,
                    placeholderColor: theme.textTertiary,
                    cornerRadius: 10,
                    padding: { horizontal: 14, vertical: 8 },
                    fontSize: 14,
                    type: "email"
                }),
                Text({ id: "emailError", text: emailError ? St("email_required") : "", fontSize: 11, color: theme.negative, visible: emailError, padding: { top: 2 } }),

                Spacer({ height: 16 }),

                // Password
                Text({ text: St("password_label"), fontSize: 12, color: theme.textSecondary, padding: { bottom: 4 } }),
                TextField({
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
                    padding: { horizontal: 14, vertical: 8 },
                    fontSize: 14
                }),
                Text({ id: "passwordError", text: passwordError ? St("password_required") : "", fontSize: 11, color: theme.negative, visible: passwordError, padding: { top: 2 } }),

                Spacer({ height: 16 }),

                // Sign In button
                Button({
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
                }),

                Spacer({ height: 10 }),

                // Sign up link
                Row({ fillMaxWidth: true, alignment: "center" }, [
                    Text({ text: St("signup_link"), fontSize: 12, color: theme.textSecondary, onClick: "onSignUp" })
                ])
            ]),

            // Bottom spacer + footer
            Spacer({ weight: 3 }),

            Row({
                fillMaxWidth: true,
                alignment: "center",
                padding: { vertical: 8 }
            }, [
                Text({ text: St("powered_by"), fontSize: 10, color: theme.textTertiary })
            ])
        ])
    );
}

render();

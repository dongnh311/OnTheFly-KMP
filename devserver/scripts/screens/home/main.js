// ═══════════════════════════════════════════════════════════
//  Home Screen — OnTheFly Demo
//  Uses: AppState (_libs), utils (_base)
// ═══════════════════════════════════════════════════════════

var count = 0;
var darkMode = false;
var showConfirmDialog = false;

// ─── Lifecycle ──────────────────────────────────────────────

function onCreateView() {
    // Track screen visit via shared library
    AppState.trackVisit("home");
    var visits = AppState.getVisitCount("home");
    OnTheFly.update("logText", { text: "Home visits: " + visits + " | User: " + AppState.getUserName() });

    // Restore dark mode from shared state
    darkMode = AppState.isDarkMode();
    OnTheFly.update("darkModeToggle", { checked: darkMode });
}

function onVisible() {
    var visits = AppState.getVisitCount("home");
    OnTheFly.update("logText", { text: "Home visits: " + visits + " | User: " + AppState.getUserName() });
}

function onViewData(data) {
    if (data && data.returnFrom === "detail") {
        toast(data.message || "Returned!");
    }
}

// ─── Counter ────────────────────────────────────────────────

function increase() {
    count++;
    OnTheFly.update("counter", { text: formatNumber(count) });
}

function decrease() {
    count--;
    OnTheFly.update("counter", { text: formatNumber(count) });
}

// ─── Toggle ─────────────────────────────────────────────────

function onToggle(id, data) {
    if (id === "darkModeToggle") {
        darkMode = data.checked;
        AppState.setDarkMode(darkMode);
        OnTheFly.update("darkModeToggle", { checked: darkMode });
        toast("Dark mode: " + (darkMode ? "ON" : "OFF"));
    }
}

// ─── Navigation (using base utils) ─────────────────────────

function gotoDetail() {
    navigate("detail-app", { stockCode: "SET", stockName: "SET Index", price: "1,423.56" });
}

function gotoApiDemo() {
    navigate("api-demo");
}

function gotoFullPopupDemo() {
    navigate("popup-fullscreen");
}

function gotoConfirmDemo() {
    navigate("popup-confirm");
}

function gotoComponentsDemo() {
    navigate("components-demo");
}

function gotoWebSocketDemo() {
    navigate("websocket-demo");
}

// ─── Confirm Dialog ─────────────────────────────────────────

function openConfirmDialog() {
    showConfirmDialog = true;
    OnTheFly.update("confirmDialog", { visible: true });
}

function onConfirmReset() {
    showConfirmDialog = false;
    OnTheFly.update("confirmDialog", { visible: false });
    count = 0;
    OnTheFly.update("counter", { text: "0" });
    toast("Counter reset!");
}

function onCancelDialog() {
    showConfirmDialog = false;
    OnTheFly.update("confirmDialog", { visible: false });
}

// ─── Login Demo ─────────────────────────────────────────────

function toggleLogin() {
    if (AppState.isLoggedIn()) {
        AppState.logout();
        toast("Logged out");
    } else {
        AppState.login("DongNH");
        toast("Welcome, " + AppState.getUserName() + "!");
    }
    var visits = AppState.getVisitCount("home");
    OnTheFly.update("logText", { text: "Home visits: " + visits + " | User: " + AppState.getUserName() });
    OnTheFly.update("loginBtn", { text: AppState.isLoggedIn() ? "Logout" : "Login" });
}

// ─── UI ─────────────────────────────────────────────────────

function render() {
    OnTheFly.setUI(Column({ style: "container" }, [
        // Header
        Text({ text: "OnTheFly", style: "title" }),
        Text({ text: "Dynamic UI Engine — KMP Demo", style: "caption" }),

        Spacer({ style: "sectionGap" }),

        // Counter
        Text({ text: "Counter", style: "subtitle" }),
        Text({ id: "counter", text: formatNumber(count), style: "counter" }),
        Row({ style: "buttonRow" }, [
            Button({ text: " − ", onClick: "decrease", style: "secondaryButton" }),
            Button({ text: " + ", onClick: "increase", style: "primaryButton" }),
            Button({ text: "Reset", onClick: "openConfirmDialog", style: "outlineButton" })
        ]),

        Spacer({ style: "sectionGap" }),

        // Navigation
        Text({ text: "Navigation", style: "subtitle" }),
        Button({ text: "Detail Screen (Data Passing) →", onClick: "gotoDetail", style: "primaryButton" }),
        Button({ text: "API Demo (HTTP Requests) →", onClick: "gotoApiDemo", style: "primaryButton" }),
        Button({ text: "Components Demo (Phase 1) →", onClick: "gotoComponentsDemo", style: "primaryButton" }),
        Button({ text: "WebSocket Demo (Realtime) →", onClick: "gotoWebSocketDemo", style: "primaryButton" }),
        Row({ style: "buttonRow" }, [
            Button({ text: "Popup →", onClick: "gotoFullPopupDemo", style: "outlineButton" }),
            Button({ text: "Confirm →", onClick: "gotoConfirmDemo", style: "outlineButton" })
        ]),

        Spacer({ style: "sectionGap" }),

        // Shared State Demo
        Text({ text: "Shared State", style: "subtitle" }),
        Row({ style: "buttonRow" }, [
            Button({ id: "loginBtn", text: AppState.isLoggedIn() ? "Logout" : "Login", onClick: "toggleLogin", style: "outlineButton" }),
            Toggle({ id: "darkModeToggle", label: "Dark Mode", checked: darkMode })
        ]),

        Spacer({ style: "smallGap" }),

        // Status log
        Text({ id: "logText", text: "Loading...", style: "caption" }),

        // Confirm Dialog
        ConfirmDialog({
            id: "confirmDialog",
            visible: false,
            title: "Reset Counter?",
            message: "This will reset the counter back to 0. Are you sure?",
            confirmText: "Reset",
            cancelText: "Cancel",
            onConfirm: "onConfirmReset",
            onCancel: "onCancelDialog",
            style: "dialogConfirm"
        })
    ]));
}

render();

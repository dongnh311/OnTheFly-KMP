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
    OnTheFly.setUI({
        type: "Column",
        props: { style: "container" },
        children: [
            // Header
            { type: "Text", props: { text: "OnTheFly", style: "title" } },
            { type: "Text", props: { text: "Dynamic UI Engine — KMP Demo", style: "caption" } },

            { type: "Spacer", props: { style: "sectionGap" } },

            // Counter
            { type: "Text", props: { text: "Counter", style: "subtitle" } },
            { type: "Text", props: { id: "counter", text: formatNumber(count), style: "counter" } },
            {
                type: "Row",
                props: { style: "buttonRow" },
                children: [
                    { type: "Button", props: { text: " − ", onClick: "decrease", style: "secondaryButton" } },
                    { type: "Button", props: { text: " + ", onClick: "increase", style: "primaryButton" } },
                    { type: "Button", props: { text: "Reset", onClick: "openConfirmDialog", style: "outlineButton" } }
                ]
            },

            { type: "Spacer", props: { style: "sectionGap" } },

            // Navigation
            { type: "Text", props: { text: "Navigation", style: "subtitle" } },
            { type: "Button", props: { text: "Detail Screen (Data Passing) →", onClick: "gotoDetail", style: "primaryButton" } },
            { type: "Button", props: { text: "API Demo (HTTP Requests) →", onClick: "gotoApiDemo", style: "primaryButton" } },
            { type: "Button", props: { text: "Components Demo (Phase 1) →", onClick: "gotoComponentsDemo", style: "primaryButton" } },
            {
                type: "Row",
                props: { style: "buttonRow" },
                children: [
                    { type: "Button", props: { text: "Popup →", onClick: "gotoFullPopupDemo", style: "outlineButton" } },
                    { type: "Button", props: { text: "Confirm →", onClick: "gotoConfirmDemo", style: "outlineButton" } }
                ]
            },

            { type: "Spacer", props: { style: "sectionGap" } },

            // Shared State Demo
            { type: "Text", props: { text: "Shared State", style: "subtitle" } },
            {
                type: "Row",
                props: { style: "buttonRow" },
                children: [
                    { type: "Button", props: { id: "loginBtn", text: AppState.isLoggedIn() ? "Logout" : "Login", onClick: "toggleLogin", style: "outlineButton" } },
                    { type: "Toggle", props: { id: "darkModeToggle", label: "Dark Mode", checked: darkMode } }
                ]
            },

            { type: "Spacer", props: { style: "smallGap" } },

            // Status log
            { type: "Text", props: { id: "logText", text: "Loading...", style: "caption" } },

            // Confirm Dialog
            {
                type: "ConfirmDialog",
                props: {
                    id: "confirmDialog",
                    visible: false,
                    title: "Reset Counter?",
                    message: "This will reset the counter back to 0. Are you sure?",
                    confirmText: "Reset",
                    cancelText: "Cancel",
                    onConfirm: "onConfirmReset",
                    onCancel: "onCancelDialog",
                    style: "dialogConfirm"
                }
            }
        ]
    });
}

render();

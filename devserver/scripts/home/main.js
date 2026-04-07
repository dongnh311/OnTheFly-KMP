// ═══════════════════════════════════════════════════════════
//  Home Screen — OnTheFly Demo
// ═══════════════════════════════════════════════════════════

var count = 0;
var darkMode = false;
var lifecycleLog = "Waiting...";
var showConfirmDialog = false;

// ─── Lifecycle ──────────────────────────────────────────────

function onCreateView() {
    lifecycleLog = "onCreateView";
    OnTheFly.update("logText", { text: "Lifecycle: " + lifecycleLog });
}

function onVisible() {
    lifecycleLog = "onVisible";
    OnTheFly.update("logText", { text: "Lifecycle: " + lifecycleLog });
}

function onViewData(data) {
    if (data && data.returnFrom === "detail") {
        OnTheFly.sendToNative("showToast", { message: data.message || "Returned!" });
    }
}

// ─── Counter ────────────────────────────────────────────────

function increase() {
    count++;
    OnTheFly.update("counter", { text: "" + count });
}

function decrease() {
    count--;
    OnTheFly.update("counter", { text: "" + count });
}

// ─── Toggle ─────────────────────────────────────────────────

function onToggle(id, data) {
    if (id === "darkModeToggle") {
        darkMode = data.checked;
        OnTheFly.update("darkModeToggle", { checked: darkMode });
        OnTheFly.sendToNative("showToast", {
            message: "Dark mode: " + (darkMode ? "ON" : "OFF")
        });
    }
}

// ─── Navigation ─────────────────────────────────────────────

function gotoDetail() {
    OnTheFly.sendToNative("navigate", {
        screen: "detail-app",
        data: { stockCode: "SET", stockName: "SET Index", price: "1,423.56" }
    });
}

function gotoApiDemo() {
    OnTheFly.sendToNative("navigate", { screen: "api-demo" });
}

function gotoFullPopupDemo() {
    OnTheFly.sendToNative("navigate", { screen: "popup-fullscreen" });
}

function gotoConfirmDemo() {
    OnTheFly.sendToNative("navigate", { screen: "popup-confirm" });
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
    OnTheFly.sendToNative("showToast", { message: "Counter reset!" });
}

function onCancelDialog() {
    showConfirmDialog = false;
    OnTheFly.update("confirmDialog", { visible: false });
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
            { type: "Text", props: { id: "counter", text: "" + count, style: "counter" } },
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
            {
                type: "Row",
                props: { style: "buttonRow" },
                children: [
                    { type: "Button", props: { text: "Popup →", onClick: "gotoFullPopupDemo", style: "outlineButton" } },
                    { type: "Button", props: { text: "Confirm →", onClick: "gotoConfirmDemo", style: "outlineButton" } }
                ]
            },

            { type: "Spacer", props: { style: "sectionGap" } },

            // Toggle
            { type: "Toggle", props: { id: "darkModeToggle", label: "Dark Mode", checked: darkMode } },

            { type: "Spacer", props: { style: "smallGap" } },

            // Lifecycle log
            { type: "Text", props: { id: "logText", text: "Lifecycle: " + lifecycleLog, style: "caption" } },

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

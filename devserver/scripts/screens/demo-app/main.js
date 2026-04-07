// ─── State ───────────────────────────────────────────────────
var count = 0;
var darkMode = false;
var lifecycleLog = "Waiting...";
var showFullPopup = false;
var showConfirmDialog = false;

// ─── Lifecycle Events (Native → JS) ─────────────────────────

function onCreateView() {
    lifecycleLog = "onCreateView";
    OnTheFly.update("logText", { text: "Lifecycle: " + lifecycleLog });
}

function onResume() {
    lifecycleLog = "onResume";
    OnTheFly.update("logText", { text: "Lifecycle: " + lifecycleLog });
}

function onPause() { OnTheFly.log("Home paused"); }
function onDestroy() { OnTheFly.log("Home destroyed"); }

function onVisible() {
    lifecycleLog = "onVisible";
    OnTheFly.update("logText", { text: "Lifecycle: " + lifecycleLog });
}

function onBackPressed() {
    // If popup is open, close it instead of going back
    if (showFullPopup) {
        closeFullPopup();
        return;
    }
    OnTheFly.sendToNative("showToast", { message: "Back pressed on Home" });
}

// ─── Data Events ────────────────────────────────────────────

function onViewData(data) {
    if (data && data.returnFrom === "detail") {
        OnTheFly.sendToNative("showToast", { message: data.message || "Returned!" });
    }
}

// ─── Component Events ───────────────────────────────────────

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

function gotoDetailPTT() {
    OnTheFly.sendToNative("navigate", {
        screen: "detail-app",
        data: { stockCode: "PTT", stockName: "PTT Public Company", price: "32.75" }
    });
}

function gotoFullPopupDemo() {
    OnTheFly.sendToNative("navigate", { screen: "popup-fullscreen" });
}

function gotoConfirmDemo() {
    OnTheFly.sendToNative("navigate", { screen: "popup-confirm" });
}

function gotoApiDemo() {
    OnTheFly.sendToNative("navigate", { screen: "api-demo" });
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

function reset() {
    count = 0;
    OnTheFly.update("counter", { text: "" + count });
}

// ─── Full Screen Popup ──────────────────────────────────────

function openFullPopup() {
    showFullPopup = true;
    OnTheFly.update("fullPopup", { visible: true });
}

function closeFullPopup() {
    showFullPopup = false;
    OnTheFly.update("fullPopup", { visible: false });
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
            { type: "Text", props: { text: "OnTheFly Home", style: "title" } },
            { type: "Text", props: { text: "Navigation + Popups + Events", style: "caption" } },

            { type: "Spacer", props: { style: "sectionGap" } },

            // Navigation
            { type: "Text", props: { text: "Navigation", style: "subtitle" } },
            {
                type: "Row",
                props: { style: "buttonRow" },
                children: [
                    { type: "Button", props: { text: "SET Index →", onClick: "gotoDetail", style: "primaryButton" } },
                    { type: "Button", props: { text: "PTT →", onClick: "gotoDetailPTT", style: "primaryButton" } }
                ]
            },

            { type: "Spacer", props: { style: "smallGap" } },

            // Counter
            { type: "Text", props: { id: "counter", text: "" + count, style: "counter" } },
            {
                type: "Row",
                props: { style: "buttonRow" },
                children: [
                    { type: "Button", props: { text: "−", onClick: "decrease", style: "secondaryButton" } },
                    { type: "Button", props: { text: "+", onClick: "increase", style: "primaryButton" } }
                ]
            },

            { type: "Spacer", props: { style: "smallGap" } },

            // Inline popup buttons
            { type: "Text", props: { text: "Inline Popups", style: "subtitle" } },
            {
                type: "Row",
                props: { style: "buttonRow" },
                children: [
                    { type: "Button", props: { text: "Full Popup", onClick: "openFullPopup", style: "secondaryButton" } },
                    { type: "Button", props: { text: "Confirm Reset", onClick: "openConfirmDialog", style: "outlineButton" } }
                ]
            },

            { type: "Spacer", props: { style: "smallGap" } },

            // Demo screens
            { type: "Text", props: { text: "Demo Screens", style: "subtitle" } },
            {
                type: "Row",
                props: { style: "buttonRow" },
                children: [
                    { type: "Button", props: { text: "FullScreen →", onClick: "gotoFullPopupDemo", style: "outlineButton" } },
                    { type: "Button", props: { text: "Confirm →", onClick: "gotoConfirmDemo", style: "outlineButton" } }
                ]
            },
            { type: "Button", props: { text: "API Demo →", onClick: "gotoApiDemo", style: "primaryButton" } },

            { type: "Spacer", props: { style: "smallGap" } },

            // Toggle
            { type: "Toggle", props: { id: "darkModeToggle", label: "Dark Mode", checked: darkMode } },

            { type: "Spacer", props: { style: "smallGap" } },

            // Log
            { type: "Text", props: { id: "logText", text: "Lifecycle: " + lifecycleLog, style: "caption" } },

            // ─── Full Screen Popup (hidden by default) ──────
            {
                type: "FullScreenPopup",
                props: { id: "fullPopup", visible: false, onDismiss: "closeFullPopup", style: "fullPopupBg" },
                children: [
                    { type: "Spacer", props: { height: 40 } },
                    { type: "Text", props: { text: "Full Screen Popup", style: "title" } },
                    { type: "Text", props: { text: "This popup covers the entire screen", style: "caption" } },
                    { type: "Spacer", props: { style: "sectionGap" } },
                    { type: "Text", props: { text: "You can put any content here:", style: "body" } },
                    { type: "Spacer", props: { style: "smallGap" } },
                    { type: "Text", props: { text: "• Charts", style: "body" } },
                    { type: "Text", props: { text: "• Forms", style: "body" } },
                    { type: "Text", props: { text: "• Detail views", style: "body" } },
                    { type: "Text", props: { text: "• Settings panels", style: "body" } },
                    { type: "Spacer", props: { style: "sectionGap" } },
                    {
                        type: "Row",
                        props: { style: "buttonRow" },
                        children: [
                            { type: "Button", props: { text: "Action 1", onClick: "popupAction1", style: "primaryButton" } },
                            { type: "Button", props: { text: "Action 2", onClick: "popupAction2", style: "secondaryButton" } }
                        ]
                    },
                    { type: "Spacer", props: { style: "sectionGap" } },
                    { type: "Button", props: { text: "Close Popup", onClick: "closeFullPopup", style: "outlineButton" } }
                ]
            },

            // ─── Confirm Dialog (hidden by default) ─────────
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

function popupAction1() {
    OnTheFly.sendToNative("showToast", { message: "Action 1 from popup!" });
}

function popupAction2() {
    OnTheFly.sendToNative("showToast", { message: "Action 2 from popup!" });
}

function noop() {}

render();

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
    OnTheFly.setUI(Column({ style: "container" }, [
        // Header
        Text({ text: "OnTheFly Home", style: "title" }),
        Text({ text: "Navigation + Popups + Events", style: "caption" }),

        Spacer({ style: "sectionGap" }),

        // Navigation
        Text({ text: "Navigation", style: "subtitle" }),
        Row({ style: "buttonRow" }, [
            Button({ text: "SET Index →", onClick: "gotoDetail", style: "primaryButton" }),
            Button({ text: "PTT →", onClick: "gotoDetailPTT", style: "primaryButton" })
        ]),

        Spacer({ style: "smallGap" }),

        // Counter
        Text({ id: "counter", text: "" + count, style: "counter" }),
        Row({ style: "buttonRow" }, [
            Button({ text: "−", onClick: "decrease", style: "secondaryButton" }),
            Button({ text: "+", onClick: "increase", style: "primaryButton" })
        ]),

        Spacer({ style: "smallGap" }),

        // Inline popup buttons
        Text({ text: "Inline Popups", style: "subtitle" }),
        Row({ style: "buttonRow" }, [
            Button({ text: "Full Popup", onClick: "openFullPopup", style: "secondaryButton" }),
            Button({ text: "Confirm Reset", onClick: "openConfirmDialog", style: "outlineButton" })
        ]),

        Spacer({ style: "smallGap" }),

        // Demo screens
        Text({ text: "Demo Screens", style: "subtitle" }),
        Row({ style: "buttonRow" }, [
            Button({ text: "FullScreen →", onClick: "gotoFullPopupDemo", style: "outlineButton" }),
            Button({ text: "Confirm →", onClick: "gotoConfirmDemo", style: "outlineButton" })
        ]),
        Button({ text: "API Demo →", onClick: "gotoApiDemo", style: "primaryButton" }),

        Spacer({ style: "smallGap" }),

        // Toggle
        Toggle({ id: "darkModeToggle", label: "Dark Mode", checked: darkMode }),

        Spacer({ style: "smallGap" }),

        // Log
        Text({ id: "logText", text: "Lifecycle: " + lifecycleLog, style: "caption" }),

        // ─── Full Screen Popup (hidden by default) ──────
        Popup({ id: "fullPopup", visible: false, onDismiss: "closeFullPopup", style: "fullPopupBg" }, [
            Spacer({ height: 40 }),
            Text({ text: "Full Screen Popup", style: "title" }),
            Text({ text: "This popup covers the entire screen", style: "caption" }),
            Spacer({ style: "sectionGap" }),
            Text({ text: "You can put any content here:", style: "body" }),
            Spacer({ style: "smallGap" }),
            Text({ text: "• Charts", style: "body" }),
            Text({ text: "• Forms", style: "body" }),
            Text({ text: "• Detail views", style: "body" }),
            Text({ text: "• Settings panels", style: "body" }),
            Spacer({ style: "sectionGap" }),
            Row({ style: "buttonRow" }, [
                Button({ text: "Action 1", onClick: "popupAction1", style: "primaryButton" }),
                Button({ text: "Action 2", onClick: "popupAction2", style: "secondaryButton" })
            ]),
            Spacer({ style: "sectionGap" }),
            Button({ text: "Close Popup", onClick: "closeFullPopup", style: "outlineButton" })
        ]),

        // ─── Confirm Dialog (hidden by default) ─────────
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

function popupAction1() {
    OnTheFly.sendToNative("showToast", { message: "Action 1 from popup!" });
}

function popupAction2() {
    OnTheFly.sendToNative("showToast", { message: "Action 2 from popup!" });
}

function noop() {}

render();

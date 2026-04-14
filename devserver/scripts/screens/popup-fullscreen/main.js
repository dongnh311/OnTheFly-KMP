// ─── State ───────────────────────────────────────────────────
var showInfoPopup = false;
var showFormPopup = false;
var selectedItem = "None";
var formName = "";

// ─── Lifecycle ──────────────────────────────────────────────

function onCreateView() {
    OnTheFly.log("FullScreen Popup demo created");
}

function onBackPressed() {
    if (showInfoPopup) { closeInfoPopup(); return; }
    if (showFormPopup) { closeFormPopup(); return; }
    OnTheFly.sendToNative("goBack");
}

// ─── Info Popup (read-only content) ─────────────────────────

function openInfoPopup() {
    showInfoPopup = true;
    OnTheFly.update("infoPopup", { visible: true });
}

function closeInfoPopup() {
    showInfoPopup = false;
    OnTheFly.update("infoPopup", { visible: false });
}

// ─── Form Popup (interactive content) ───────────────────────

function openFormPopup() {
    showFormPopup = true;
    OnTheFly.update("formPopup", { visible: true });
}

function closeFormPopup() {
    showFormPopup = false;
    OnTheFly.update("formPopup", { visible: false });
}

// ─── Popup actions ──────────────────────────────────────────

function selectSET() {
    selectedItem = "SET Index";
    OnTheFly.update("selectedText", { text: "Selected: " + selectedItem });
    OnTheFly.sendToNative("showToast", { message: "Selected SET Index" });
    closeInfoPopup();
}

function selectPTT() {
    selectedItem = "PTT";
    OnTheFly.update("selectedText", { text: "Selected: " + selectedItem });
    OnTheFly.sendToNative("showToast", { message: "Selected PTT" });
    closeInfoPopup();
}

function selectBANPU() {
    selectedItem = "BANPU";
    OnTheFly.update("selectedText", { text: "Selected: " + selectedItem });
    OnTheFly.sendToNative("showToast", { message: "Selected BANPU" });
    closeInfoPopup();
}

function submitForm() {
    OnTheFly.sendToNative("showToast", { message: "Form submitted! Name: " + formName });
    closeFormPopup();
}

function goBack() {
    OnTheFly.sendToNative("goBack");
}

// ─── UI ─────────────────────────────────────────────────────

function render() {
    OnTheFly.setUI(
        Column({ style: "container" }, [
            // Header
            Text({ text: "Full Screen Popups", style: "title" }),
            Text({ text: "Different popup patterns", style: "caption" }),

            Spacer({ style: "gap" }),

            // Current selection
            Column({ style: "card" }, [
                Text({ text: "Stock Picker", style: "subtitle" }),
                Text({ id: "selectedText", text: "Selected: " + selectedItem, style: "value" }),
                Spacer({ style: "smallGap" }),
                Button({ text: "Open Stock List", onClick: "openInfoPopup", style: "primaryBtn" })
            ]),

            Spacer({ style: "smallGap" }),

            // Form popup trigger
            Column({ style: "card" }, [
                Text({ text: "Settings Panel", style: "subtitle" }),
                Text({ text: "Full screen form overlay", style: "caption" }),
                Spacer({ style: "smallGap" }),
                Button({ text: "Open Settings", onClick: "openFormPopup", style: "primaryBtn" })
            ]),

            Spacer({ style: "gap" }),

            Button({ text: "← Back to Home", onClick: "goBack", style: "backBtn" }),

            // ─── Info Popup: Stock list ─────────────────────
            Popup({ id: "infoPopup", visible: false, onDismiss: "closeInfoPopup", style: "popupLight" }, [
                Text({ text: "Select a Stock", style: "title" }),
                Text({ text: "Tap to select and close", style: "caption" }),
                Spacer({ style: "gap" }),
                Column({ style: "card" }, [
                    Row({ style: "row" }, [
                        Text({ text: "SET Index", style: "subtitle" }),
                        Text({ text: "1,423.56", style: "value" })
                    ]),
                    Button({ text: "Select SET", onClick: "selectSET", style: "primaryBtn" })
                ]),
                Spacer({ style: "smallGap" }),
                Column({ style: "card" }, [
                    Row({ style: "row" }, [
                        Text({ text: "PTT", style: "subtitle" }),
                        Text({ text: "32.75", style: "value" })
                    ]),
                    Button({ text: "Select PTT", onClick: "selectPTT", style: "primaryBtn" })
                ]),
                Spacer({ style: "smallGap" }),
                Column({ style: "card" }, [
                    Row({ style: "row" }, [
                        Text({ text: "BANPU", style: "subtitle" }),
                        Text({ text: "8.90", style: "value" })
                    ]),
                    Button({ text: "Select BANPU", onClick: "selectBANPU", style: "primaryBtn" })
                ])
            ]),

            // ─── Form Popup: Settings panel ─────────────────
            Popup({ id: "formPopup", visible: false, onDismiss: "closeFormPopup", style: "popupDark" }, [
                Text({ text: "Settings", style: "popupTitleDark" }),
                Text({ text: "Configure your preferences", style: "popupBodyDark" }),
                Spacer({ style: "gap" }),

                Text({ text: "Notifications", style: "popupAccent" }),
                Toggle({ id: "notifToggle", label: "Price Alerts", checked: true }),
                Toggle({ id: "newsToggle", label: "News Updates", checked: false }),
                Toggle({ id: "reportToggle", label: "Daily Report", checked: true }),

                Spacer({ style: "gap" }),

                Text({ text: "Display", style: "popupAccent" }),
                Toggle({ id: "darkToggle", label: "Dark Mode", checked: false }),
                Toggle({ id: "compactToggle", label: "Compact View", checked: false }),

                Spacer({ style: "gap" }),

                Row({ style: "row" }, [
                    Button({ text: "Save", onClick: "submitForm", style: "primaryBtn" }),
                    Button({ text: "Cancel", onClick: "closeFormPopup", style: "dangerBtn" })
                ])
            ])
        ])
    );
}

render();

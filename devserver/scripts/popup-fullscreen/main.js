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
    OnTheFly.setUI({
        type: "Column",
        props: { style: "container" },
        children: [
            // Header
            { type: "Text", props: { text: "Full Screen Popups", style: "title" } },
            { type: "Text", props: { text: "Different popup patterns", style: "caption" } },

            { type: "Spacer", props: { style: "gap" } },

            // Current selection
            {
                type: "Column",
                props: { style: "card" },
                children: [
                    { type: "Text", props: { text: "Stock Picker", style: "subtitle" } },
                    { type: "Text", props: { id: "selectedText", text: "Selected: " + selectedItem, style: "value" } },
                    { type: "Spacer", props: { style: "smallGap" } },
                    { type: "Button", props: { text: "Open Stock List", onClick: "openInfoPopup", style: "primaryBtn" } }
                ]
            },

            { type: "Spacer", props: { style: "smallGap" } },

            // Form popup trigger
            {
                type: "Column",
                props: { style: "card" },
                children: [
                    { type: "Text", props: { text: "Settings Panel", style: "subtitle" } },
                    { type: "Text", props: { text: "Full screen form overlay", style: "caption" } },
                    { type: "Spacer", props: { style: "smallGap" } },
                    { type: "Button", props: { text: "Open Settings", onClick: "openFormPopup", style: "primaryBtn" } }
                ]
            },

            { type: "Spacer", props: { style: "gap" } },

            { type: "Button", props: { text: "← Back to Home", onClick: "goBack", style: "backBtn" } },

            // ─── Info Popup: Stock list ─────────────────────
            {
                type: "FullScreenPopup",
                props: { id: "infoPopup", visible: false, onDismiss: "closeInfoPopup", style: "popupLight" },
                children: [
                    { type: "Text", props: { text: "Select a Stock", style: "title" } },
                    { type: "Text", props: { text: "Tap to select and close", style: "caption" } },
                    { type: "Spacer", props: { style: "gap" } },
                    {
                        type: "Column",
                        props: { style: "card" },
                        children: [
                            {
                                type: "Row", props: { style: "row" },
                                children: [
                                    { type: "Text", props: { text: "SET Index", style: "subtitle" } },
                                    { type: "Text", props: { text: "1,423.56", style: "value" } }
                                ]
                            },
                            { type: "Button", props: { text: "Select SET", onClick: "selectSET", style: "primaryBtn" } }
                        ]
                    },
                    { type: "Spacer", props: { style: "smallGap" } },
                    {
                        type: "Column",
                        props: { style: "card" },
                        children: [
                            {
                                type: "Row", props: { style: "row" },
                                children: [
                                    { type: "Text", props: { text: "PTT", style: "subtitle" } },
                                    { type: "Text", props: { text: "32.75", style: "value" } }
                                ]
                            },
                            { type: "Button", props: { text: "Select PTT", onClick: "selectPTT", style: "primaryBtn" } }
                        ]
                    },
                    { type: "Spacer", props: { style: "smallGap" } },
                    {
                        type: "Column",
                        props: { style: "card" },
                        children: [
                            {
                                type: "Row", props: { style: "row" },
                                children: [
                                    { type: "Text", props: { text: "BANPU", style: "subtitle" } },
                                    { type: "Text", props: { text: "8.90", style: "value" } }
                                ]
                            },
                            { type: "Button", props: { text: "Select BANPU", onClick: "selectBANPU", style: "primaryBtn" } }
                        ]
                    }
                ]
            },

            // ─── Form Popup: Settings panel ─────────────────
            {
                type: "FullScreenPopup",
                props: { id: "formPopup", visible: false, onDismiss: "closeFormPopup", style: "popupDark" },
                children: [
                    { type: "Text", props: { text: "Settings", style: "popupTitleDark" } },
                    { type: "Text", props: { text: "Configure your preferences", style: "popupBodyDark" } },
                    { type: "Spacer", props: { style: "gap" } },

                    { type: "Text", props: { text: "Notifications", style: "popupAccent" } },
                    { type: "Toggle", props: { id: "notifToggle", label: "Price Alerts", checked: true } },
                    { type: "Toggle", props: { id: "newsToggle", label: "News Updates", checked: false } },
                    { type: "Toggle", props: { id: "reportToggle", label: "Daily Report", checked: true } },

                    { type: "Spacer", props: { style: "gap" } },

                    { type: "Text", props: { text: "Display", style: "popupAccent" } },
                    { type: "Toggle", props: { id: "darkToggle", label: "Dark Mode", checked: false } },
                    { type: "Toggle", props: { id: "compactToggle", label: "Compact View", checked: false } },

                    { type: "Spacer", props: { style: "gap" } },

                    {
                        type: "Row", props: { style: "row" },
                        children: [
                            { type: "Button", props: { text: "Save", onClick: "submitForm", style: "primaryBtn" } },
                            { type: "Button", props: { text: "Cancel", onClick: "closeFormPopup", style: "dangerBtn" } }
                        ]
                    }
                ]
            }
        ]
    });
}

render();

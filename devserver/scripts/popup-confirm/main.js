// ─── State ───────────────────────────────────────────────────
var items = ["Item A", "Item B", "Item C"];
var actionLog = "No actions yet";
var pendingDeleteIndex = -1;

// ─── Lifecycle ──────────────────────────────────────────────

function onCreateView() {
    OnTheFly.log("Confirm Dialog demo created");
}

function onBackPressed() {
    OnTheFly.sendToNative("goBack");
}

function goBack() {
    OnTheFly.sendToNative("goBack");
}

// ─── Delete confirmation ────────────────────────────────────

function askDeleteA() { askDelete(0); }
function askDeleteB() { askDelete(1); }
function askDeleteC() { askDelete(2); }

function askDelete(index) {
    if (index >= items.length) return;
    pendingDeleteIndex = index;
    OnTheFly.update("deleteDialog", {
        visible: true,
        title: "Delete " + items[index] + "?",
        message: "This action cannot be undone. The item will be permanently removed."
    });
}

function confirmDelete() {
    if (pendingDeleteIndex >= 0 && pendingDeleteIndex < items.length) {
        var name = items[pendingDeleteIndex];
        items.splice(pendingDeleteIndex, 1);
        actionLog = "Deleted: " + name;
        OnTheFly.sendToNative("showToast", { message: name + " deleted!" });
    }
    pendingDeleteIndex = -1;
    OnTheFly.update("deleteDialog", { visible: false });
    fullRender();
}

function cancelDelete() {
    pendingDeleteIndex = -1;
    actionLog = "Delete cancelled";
    OnTheFly.update("deleteDialog", { visible: false });
    OnTheFly.update("logText", { text: actionLog });
}

// ─── Logout confirmation ────────────────────────────────────

function askLogout() {
    OnTheFly.update("logoutDialog", { visible: true });
}

function confirmLogout() {
    OnTheFly.update("logoutDialog", { visible: false });
    actionLog = "Logged out!";
    OnTheFly.update("logText", { text: actionLog });
    OnTheFly.sendToNative("showToast", { message: "You have been logged out" });
}

function cancelLogout() {
    OnTheFly.update("logoutDialog", { visible: false });
    actionLog = "Logout cancelled";
    OnTheFly.update("logText", { text: actionLog });
}

// ─── Save confirmation ──────────────────────────────────────

function askSave() {
    OnTheFly.update("saveDialog", { visible: true });
}

function confirmSave() {
    OnTheFly.update("saveDialog", { visible: false });
    actionLog = "Changes saved!";
    OnTheFly.update("logText", { text: actionLog });
    OnTheFly.sendToNative("showToast", { message: "Saved successfully" });
}

function cancelSave() {
    OnTheFly.update("saveDialog", { visible: false });
    actionLog = "Save cancelled";
    OnTheFly.update("logText", { text: actionLog });
}

// ─── Render ─────────────────────────────────────────────────

function fullRender() {
    var itemChildren = [];
    for (var i = 0; i < items.length; i++) {
        (function(idx) {
            itemChildren.push({
                type: "Row",
                props: { style: "row" },
                children: [
                    { type: "Text", props: { text: items[idx], style: "body" } },
                    { type: "Button", props: { text: "Delete", onClick: "askDelete" + items[idx].charAt(items[idx].length - 1), style: "dangerBtn" } }
                ]
            });
        })(i);
    }

    if (items.length === 0) {
        itemChildren.push({ type: "Text", props: { text: "All items deleted!", style: "statusDanger" } });
    }

    OnTheFly.setUI({
        type: "Column",
        props: { style: "container" },
        children: [
            // Header
            { type: "Text", props: { text: "Confirm Dialogs", style: "title" } },
            { type: "Text", props: { text: "Different confirmation patterns", style: "caption" } },

            { type: "Spacer", props: { style: "gap" } },

            // Delete items section
            {
                type: "Column",
                props: { style: "card" },
                children: [
                    { type: "Text", props: { text: "Delete Items", style: "subtitle" } },
                    { type: "Text", props: { text: "Tap delete to show danger confirm", style: "caption" } },
                    { type: "Spacer", props: { style: "smallGap" } }
                ].concat(itemChildren)
            },

            { type: "Spacer", props: { style: "smallGap" } },

            // Other confirm patterns
            {
                type: "Row",
                props: { style: "row" },
                children: [
                    { type: "Button", props: { text: "Logout", onClick: "askLogout", style: "warnBtn" } },
                    { type: "Button", props: { text: "Save Changes", onClick: "askSave", style: "primaryBtn" } }
                ]
            },

            { type: "Spacer", props: { style: "gap" } },

            // Action log
            { type: "Text", props: { id: "logText", text: actionLog, style: "caption" } },

            { type: "Spacer", props: { style: "smallGap" } },

            { type: "Button", props: { text: "← Back to Home", onClick: "goBack", style: "backBtn" } },

            // ─── Delete Confirm Dialog ──────────────────────
            {
                type: "ConfirmDialog",
                props: {
                    id: "deleteDialog",
                    visible: false,
                    title: "Delete Item?",
                    message: "This action cannot be undone.",
                    confirmText: "Delete",
                    cancelText: "Keep",
                    onConfirm: "confirmDelete",
                    onCancel: "cancelDelete",
                    style: "dangerDialogBtn"
                }
            },

            // ─── Logout Confirm Dialog ──────────────────────
            {
                type: "ConfirmDialog",
                props: {
                    id: "logoutDialog",
                    visible: false,
                    title: "Logout?",
                    message: "You will need to sign in again to access your account.",
                    confirmText: "Logout",
                    cancelText: "Stay",
                    onConfirm: "confirmLogout",
                    onCancel: "cancelLogout",
                    style: "warnDialogBtn"
                }
            },

            // ─── Save Confirm Dialog ────────────────────────
            {
                type: "ConfirmDialog",
                props: {
                    id: "saveDialog",
                    visible: false,
                    title: "Save Changes?",
                    message: "Your changes will be applied immediately.",
                    confirmText: "Save",
                    cancelText: "Discard",
                    onConfirm: "confirmSave",
                    onCancel: "cancelSave",
                    style: "successDialogBtn"
                }
            }
        ]
    });
}

fullRender();

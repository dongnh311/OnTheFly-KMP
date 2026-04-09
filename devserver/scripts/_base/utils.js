// ═══════════════════════════════════════════════════════════
//  Utils — Base functions shared across all screens
// ═══════════════════════════════════════════════════════════

// ─── Number formatting ─────────────────────────────────────

function formatNumber(num) {
    if (num === null || num === undefined) return "0";
    return ("" + num).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDecimal(num, decimals) {
    if (num === null || num === undefined) return "0.00";
    return Number(num).toFixed(decimals || 2);
}

function formatPercent(num) {
    if (num === null || num === undefined) return "0%";
    return formatDecimal(num, 2) + "%";
}

function formatPrice(num) {
    return formatNumber(formatDecimal(num, 2));
}

// ─── String helpers ────────────────────────────────────────

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncate(str, maxLen) {
    if (!str || str.length <= maxLen) return str || "";
    return str.substring(0, maxLen) + "...";
}

function isEmpty(val) {
    return val === null || val === undefined || val === "";
}

// ─── Date/Time helpers ─────────────────────────────────────

function formatTime(date) {
    if (!date) date = new Date();
    if (typeof date === "string") date = new Date(date);
    var h = date.getHours();
    var m = date.getMinutes();
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
}

function formatDate(date) {
    if (!date) date = new Date();
    if (typeof date === "string") date = new Date(date);
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    return y + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
}

function timeAgo(dateStr) {
    var now = new Date();
    var past = new Date(dateStr);
    var seconds = Math.floor((now - past) / 1000);
    if (seconds < 60) return seconds + "s ago";
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "m ago";
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h ago";
    var days = Math.floor(hours / 24);
    return days + "d ago";
}

// ─── UI helpers ────────────────────────────────────────────

function toast(message) {
    OnTheFly.sendToNative("showToast", { message: message });
}

function navigate(screen, data) {
    var payload = { screen: screen };
    if (data) payload.data = data;
    OnTheFly.sendToNative("navigate", payload);
}

function goBack() {
    OnTheFly.sendToNative("goBack");
}

// ─── Price Flash Helpers ──────────────────────────────────

function getFlashColors(symbol, theme) {
    var flash = getPriceFlash(symbol);
    if (!flash) return { textColor: null, bgColor: null };
    if (flash === "up") return { textColor: theme.positive, bgColor: "#1A" + theme.positive.replace("#", "") };
    if (flash === "down") return { textColor: theme.negative, bgColor: "#1A" + theme.negative.replace("#", "") };
    if (flash === "same") return { textColor: theme.warning, bgColor: "#1A" + theme.warning.replace("#", "") };
    return { textColor: null, bgColor: null };
}

function buildFlashPriceColumn(stock, theme) {
    var up = stock.change >= 0;
    var changeSign = up ? "+" : "";
    var flash = getFlashColors(stock.symbol, theme);
    var priceColor = flash.textColor || theme.textPrimary;
    var changeColor = flash.textColor || (up ? theme.positive : theme.negative);

    if (flash.bgColor) clearPriceFlash(stock.symbol);

    return {
        type: "Column",
        props: {
            alignment: "end",
            width: "wrap",
            flashBackground: flash.bgColor || undefined,
            flashDuration: 500,
            borderRadius: 4,
            padding: { horizontal: 4, vertical: 2 }
        },
        children: [
            { type: "Text", props: { text: stockPriceText(stock.price), fontSize: 15, fontWeight: "700", color: priceColor } },
            { type: "Text", props: { text: changeSign + stock.change.toFixed(2) + " (" + fmtPct(stock.pct) + ")", fontSize: 12, fontWeight: "600", color: changeColor } }
        ]
    };
}

// ─── Color helpers ─────────────────────────────────────────

function changeColor(num) {
    if (num > 0) return "#27AE60";
    if (num < 0) return "#E74C3C";
    return "#999999";
}

function changeSign(num) {
    if (num > 0) return "+";
    return "";
}

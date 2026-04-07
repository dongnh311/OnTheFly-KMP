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

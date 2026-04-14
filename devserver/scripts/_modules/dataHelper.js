// ═══════════════════════════════════════════════════════════
//  dataHelper — ES module for data formatting utilities
//  Usage: import { formatPrice, formatPercent } from "dataHelper";
// ═══════════════════════════════════════════════════════════

export function formatPrice(value, decimals) {
    if (decimals === undefined) decimals = 2;
    return "$" + Number(value).toFixed(decimals);
}

export function formatPercent(value) {
    var sign = value >= 0 ? "+" : "";
    return sign + Number(value).toFixed(2) + "%";
}

export function formatVolume(value) {
    if (value >= 1e9) return (value / 1e9).toFixed(1) + "B";
    if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
    if (value >= 1e3) return (value / 1e3).toFixed(1) + "K";
    return String(value);
}

export function formatMarketCap(value) {
    if (value >= 1e12) return "$" + (value / 1e12).toFixed(2) + "T";
    if (value >= 1e9) return "$" + (value / 1e9).toFixed(2) + "B";
    if (value >= 1e6) return "$" + (value / 1e6).toFixed(2) + "M";
    return "$" + value;
}

export function calcChangePercent(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// ═══════════════════════════════════════════════════════════
//  StockTheme — Dark/Light theme for Stock App
//  Colors matched to mockup exactly
// ═══════════════════════════════════════════════════════════

var StockTheme = (function() {

    var dark = {
        primary: "#0A0E17",
        surface: "#111827",
        surfaceVariant: "#1F2937",
        card: "#162032",
        accent: "#00D4AA",
        accentDim: "#00D4AA50",
        textPrimary: "#FFFFFF",
        textSecondary: "#9CA3AF",
        textTertiary: "#6B7280",
        positive: "#10B981",
        negative: "#EF4444",
        warning: "#F59E0B",
        border: "#374151",
        inputBg: "#1F2937",
        navBar: "#111827",
        chartLine: "#00D4AA",
        overlay: "#00000080"
    };

    var light = {
        primary: "#F8FAFC",
        surface: "#FFFFFF",
        surfaceVariant: "#F1F5F9",
        card: "#FFFFFF",
        accent: "#00B894",
        accentDim: "#00B89430",
        textPrimary: "#1E293B",
        textSecondary: "#64748B",
        textTertiary: "#94A3B8",
        positive: "#059669",
        negative: "#DC2626",
        warning: "#D97706",
        border: "#E2E8F0",
        inputBg: "#F1F5F9",
        navBar: "#FFFFFF",
        chartLine: "#00B894",
        overlay: "#00000040"
    };

    function isDark() {
        var val = AppState.get("dark_mode", true);
        return val === true || val === "true";
    }

    function get() {
        return isDark() ? dark : light;
    }

    function toggle() {
        var newMode = !isDark();
        AppState.setDarkMode(newMode);
        return get();
    }

    return {
        get: get,
        isDark: isDark,
        toggle: toggle,
        dark: dark,
        light: light
    };
})();

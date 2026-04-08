// ═══════════════════════════════════════════════════════════
//  StockTheme — Dark/Light theme for Stock App
//  Colors matched to mockup exactly
// ═══════════════════════════════════════════════════════════

var StockTheme = (function() {

    var dark = {
        primary: "#0B0F19",
        surface: "#111827",
        surfaceVariant: "#1A2338",
        card: "#141B2D",
        cardHover: "#1A2338",
        input: "#1A2338",
        accent: "#00D4AA",
        accentDim: "#00D4AA22",
        accentSoft: "#00D4AA44",
        blue: "#3B82F6",
        textPrimary: "#F1F5F9",
        textSecondary: "#8B98B0",
        textTertiary: "#4A5568",
        positive: "#00D4AA",
        negative: "#FF4D5A",
        negativeDim: "#FF4D5A22",
        warning: "#FFAA2B",
        border: "#1E2A3A",
        divider: "#1E2A3A",
        inputBg: "#1A2338",
        inputBorder: "#1E2A3A",
        navBar: "#0B0F19",
        overlay: "#00000080"
    };

    var light = {
        primary: "#F8FAFC",
        surface: "#FFFFFF",
        surfaceVariant: "#F1F5F9",
        card: "#FFFFFF",
        cardHover: "#F1F5F9",
        input: "#F1F5F9",
        accent: "#00B894",
        accentDim: "#00B89422",
        accentSoft: "#00B89444",
        blue: "#3B82F6",
        textPrimary: "#1E293B",
        textSecondary: "#64748B",
        textTertiary: "#94A3B8",
        positive: "#00B894",
        negative: "#DC2626",
        negativeDim: "#DC262622",
        warning: "#D97706",
        border: "#E2E8F0",
        divider: "#E2E8F0",
        inputBg: "#F1F5F9",
        inputBorder: "#E2E8F0",
        navBar: "#FFFFFF",
        overlay: "#00000040"
    };

    function isDark() {
        // Default to dark mode (matching mockup)
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

// ═══════════════════════════════════════════════════════════
//  AppState — Singleton library
//  Shared data across all screens via OnTheFly.shared
// ═══════════════════════════════════════════════════════════

var AppState = (function() {

    function get(key, defaultValue) {
        var val = OnTheFly.shared.get(key);
        return (val !== undefined && val !== null) ? val : defaultValue;
    }

    function set(key, value) {
        OnTheFly.shared.set(key, value);
    }

    function remove(key) {
        OnTheFly.shared.remove(key);
    }

    // ─── User session ──────────────────────────────────
    function isLoggedIn() {
        return get("user_logged_in", false);
    }

    function login(username) {
        set("user_logged_in", true);
        set("user_name", username);
        set("login_time", new Date().toISOString());
    }

    function logout() {
        remove("user_logged_in");
        remove("user_name");
        remove("login_time");
    }

    function getUserName() {
        return get("user_name", "Guest");
    }

    // ─── Screen visit tracking ─────────────────────────
    function trackVisit(screenName) {
        var count = get("visits_" + screenName, 0);
        set("visits_" + screenName, count + 1);
    }

    function getVisitCount(screenName) {
        return get("visits_" + screenName, 0);
    }

    // ─── Theme preference ──────────────────────────────
    function isDarkMode() {
        return get("dark_mode", false);
    }

    function setDarkMode(enabled) {
        set("dark_mode", enabled);
    }

    // ─── Public API ────────────────────────────────────
    return {
        get: get,
        set: set,
        remove: remove,
        isLoggedIn: isLoggedIn,
        login: login,
        logout: logout,
        getUserName: getUserName,
        trackVisit: trackVisit,
        getVisitCount: getVisitCount,
        isDarkMode: isDarkMode,
        setDarkMode: setDarkMode
    };
})();

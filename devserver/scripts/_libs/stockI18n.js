// ═══════════════════════════════════════════════════════════
//  StockI18n — i18n for Stock App (EN/VI)
//  Usage: St("login_title")
// ═══════════════════════════════════════════════════════════

var StockI18n = (function() {

    var strings = {
        en: {
            // Login
            login_title: "StockPro",
            login_subtitle: "Smart Investing Starts Here",
            email_label: "Email",
            email_placeholder: "Enter your email",
            password_label: "Password",
            password_placeholder: "Enter your password",
            sign_in: "Sign In",
            signup_link: "Don't have an account? Sign Up",
            email_required: "Email is required",
            password_required: "Password is required",
            powered_by: "Powered by OnTheFly Engine",

            // Navigation
            nav_home: "Home",
            nav_watchlist: "Watchlist",
            nav_search: "Search",
            nav_news: "News",

            // Dashboard
            dashboard_title: "Dashboard",
            portfolio_value: "Portfolio Value",
            today_change: "Today's Change",
            trending: "Trending Stocks",
            top_movers: "Top Movers",
            see_all: "See All",

            // Watchlist
            watchlist_title: "Watchlist",
            watchlist_empty: "No stocks in watchlist",
            add_stock: "Add Stock",
            confirm_remove: "Remove from watchlist?",

            // Search
            search_title: "Search",
            search_placeholder: "Search stocks, ETFs...",
            recent_search: "Recent Searches",
            popular: "Popular",

            // News
            news_title: "News",
            breaking: "Breaking",
            latest: "Latest",
            read_more: "Read More",

            // Account
            account_title: "Account",
            appearance: "Appearance",
            dark_mode: "Dark Mode",
            language: "Language",
            notifications: "Notifications",
            push_notif: "Push Notifications",
            price_alerts: "Price Alerts",
            security: "Security",
            change_pass: "Change Password",
            current_password: "Current Password",
            new_password: "New Password",
            confirm_new_password: "Confirm New Password",
            password_changed: "Password changed successfully",
            password_mismatch: "Passwords do not match",
            password_too_short: "Password must be at least 6 characters",
            save: "Save",
            two_factor: "Two-Factor Auth",
            two_factor_desc: "Add an extra layer of security to your account by requiring a verification code when signing in.",
            two_factor_enabled: "2FA has been enabled",
            two_factor_disabled: "2FA has been disabled",
            enable: "Enable",
            disable: "Disable",
            biometric: "Biometric Login",
            about: "About",
            version: "Version",
            pro_member: "PRO Member",
            sign_out: "Log Out",
            confirm_logout: "Are you sure you want to log out?",

            // Stock Detail
            detail_open: "Open",
            detail_high: "High",
            detail_low: "Low",
            detail_vol: "Volume",
            detail_mkt_cap: "Mkt Cap",
            detail_pe: "P/E",
            buy: "Buy",
            sell: "Sell",
            buy_order_placed: "Buy order placed for",
            sell_order_placed: "Sell order placed for",

            // Common
            cancel: "Cancel",
            confirm: "Confirm",

            // Chart
            chart_title: "Chart",
            indicators: "Indicators",
            open_short: "OPEN",
            high_short: "HIGH",
            low_short: "LOW",
            close_short: "CLOSE",
            vol_short: "VOL",
            nav_chart: "Chart"
        },

        vi: {
            login_title: "StockPro",
            login_subtitle: "Đầu Tư Thông Minh Bắt Đầu Từ Đây",
            email_label: "Email",
            email_placeholder: "Nhập email của bạn",
            password_label: "Mật khẩu",
            password_placeholder: "Nhập mật khẩu",
            sign_in: "Đăng Nhập",
            signup_link: "Chưa có tài khoản? Đăng Ký",
            email_required: "Vui lòng nhập email",
            password_required: "Vui lòng nhập mật khẩu",
            powered_by: "Được hỗ trợ bởi OnTheFly Engine",

            nav_home: "Trang chủ",
            nav_watchlist: "Danh mục",
            nav_search: "Tìm kiếm",
            nav_news: "Tin tức",

            dashboard_title: "Bảng điều khiển",
            portfolio_value: "Giá trị danh mục",
            today_change: "Thay đổi hôm nay",
            trending: "Cổ phiếu nổi bật",
            top_movers: "Biến động lớn",
            see_all: "Xem tất cả",

            watchlist_title: "Danh mục theo dõi",
            watchlist_empty: "Chưa có cổ phiếu nào",
            add_stock: "Thêm cổ phiếu",
            confirm_remove: "Xoá khỏi danh mục?",

            search_title: "Tìm kiếm",
            search_placeholder: "Tìm cổ phiếu, ETF...",
            recent_search: "Tìm kiếm gần đây",
            popular: "Phổ biến",

            news_title: "Tin tức",
            breaking: "Nóng",
            latest: "Mới nhất",
            read_more: "Đọc thêm",

            account_title: "Tài khoản",
            appearance: "Giao diện",
            dark_mode: "Chế độ tối",
            language: "Ngôn ngữ",
            notifications: "Thông báo",
            push_notif: "Thông báo đẩy",
            price_alerts: "Cảnh báo giá",
            security: "Bảo mật",
            change_pass: "Đổi mật khẩu",
            current_password: "Mật khẩu hiện tại",
            new_password: "Mật khẩu mới",
            confirm_new_password: "Xác nhận mật khẩu mới",
            password_changed: "Đổi mật khẩu thành công",
            password_mismatch: "Mật khẩu không khớp",
            password_too_short: "Mật khẩu phải có ít nhất 6 ký tự",
            save: "Lưu",
            two_factor: "Xác thực 2 lớp",
            two_factor_desc: "Thêm lớp bảo mật cho tài khoản bằng mã xác thực khi đăng nhập.",
            two_factor_enabled: "Đã bật xác thực 2 lớp",
            two_factor_disabled: "Đã tắt xác thực 2 lớp",
            enable: "Bật",
            disable: "Tắt",
            biometric: "Đăng nhập sinh trắc",
            about: "Giới thiệu",
            version: "Phiên bản",
            pro_member: "Thành viên PRO",
            sign_out: "Đăng Xuất",
            confirm_logout: "Bạn có chắc muốn đăng xuất?",

            detail_open: "Mở cửa",
            detail_high: "Cao nhất",
            detail_low: "Thấp nhất",
            detail_vol: "Khối lượng",
            detail_mkt_cap: "Vốn hoá",
            detail_pe: "P/E",
            buy: "Mua",
            sell: "Bán",
            buy_order_placed: "Đặt lệnh mua",
            sell_order_placed: "Đặt lệnh bán",

            cancel: "Huỷ",
            confirm: "Xác nhận",

            // Chart
            chart_title: "Biểu đồ",
            indicators: "Chỉ báo",
            open_short: "MỞ CỬA",
            high_short: "CAO NHẤT",
            low_short: "THẤP NHẤT",
            close_short: "ĐÓNG CỬA",
            vol_short: "KL",
            nav_chart: "Biểu đồ"
        }
    };

    function getLang() {
        return AppState.get("stock_lang", "en");
    }

    function setLang(lang) {
        AppState.set("stock_lang", lang);
        // Persist to native storage so it survives app restart
        OnTheFly.sendToNative("setStorage", { key: "stock_lang", value: lang });
    }

    function t(key) {
        var lang = getLang();
        var dict = strings[lang] || strings.en;
        return dict[key] || strings.en[key] || key;
    }

    return {
        t: t,
        getLang: getLang,
        setLang: setLang
    };
})();

// Shorthand
function St(key) {
    return StockI18n.t(key);
}

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
            news_title: "Market News",
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
            two_factor: "Two-Factor Auth",
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
            confirm: "Confirm"
        },

        vi: {
            login_title: "StockPro",
            login_subtitle: "Dau Tu Thong Minh Bat Dau Tu Day",
            email_label: "Email",
            email_placeholder: "Nhap email cua ban",
            password_label: "Mat khau",
            password_placeholder: "Nhap mat khau",
            sign_in: "Dang Nhap",
            signup_link: "Chua co tai khoan? Dang Ky",
            email_required: "Vui long nhap email",
            password_required: "Vui long nhap mat khau",
            powered_by: "Duoc ho tro boi OnTheFly Engine",

            nav_home: "Trang chu",
            nav_watchlist: "Danh muc",
            nav_search: "Tim kiem",
            nav_news: "Tin tuc",

            dashboard_title: "Bang dieu khien",
            portfolio_value: "Gia tri danh muc",
            today_change: "Thay doi hom nay",
            trending: "Co phieu noi bat",
            top_movers: "Bien dong lon",
            see_all: "Xem tat ca",

            watchlist_title: "Danh muc theo doi",
            watchlist_empty: "Chua co co phieu nao",
            add_stock: "Them co phieu",
            confirm_remove: "Xoa khoi danh muc?",

            search_title: "Tim kiem",
            search_placeholder: "Tim co phieu, ETF...",
            recent_search: "Tim kiem gan day",
            popular: "Pho bien",

            news_title: "Tin thi truong",
            breaking: "Nong",
            latest: "Moi nhat",
            read_more: "Doc them",

            account_title: "Tai khoan",
            appearance: "Giao dien",
            dark_mode: "Che do toi",
            language: "Ngon ngu",
            notifications: "Thong bao",
            push_notif: "Thong bao day",
            price_alerts: "Canh bao gia",
            security: "Bao mat",
            change_pass: "Doi mat khau",
            two_factor: "Xac thuc 2 lop",
            biometric: "Dang nhap sinh trac",
            about: "Gioi thieu",
            version: "Phien ban",
            pro_member: "Thanh vien PRO",
            sign_out: "Dang Xuat",
            confirm_logout: "Ban co chac muon dang xuat?",

            detail_open: "Mo cua",
            detail_high: "Cao nhat",
            detail_low: "Thap nhat",
            detail_vol: "Khoi luong",
            detail_mkt_cap: "Von hoa",
            detail_pe: "P/E",
            buy: "Mua",
            sell: "Ban",
            buy_order_placed: "Dat lenh mua",
            sell_order_placed: "Dat lenh ban",

            cancel: "Huy",
            confirm: "Xac nhan"
        }
    };

    function getLang() {
        return AppState.get("stock_lang", "en");
    }

    function setLang(lang) {
        AppState.set("stock_lang", lang);
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

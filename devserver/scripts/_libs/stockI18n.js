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
            email_placeholder: "your@email.com",
            password_label: "Password",
            password_placeholder: "Enter your password",
            sign_in: "Sign In",
            signing_in: "Signing in...",
            try_demo: "Try Demo Mode",
            signup_link: "No account? Sign Up",
            forgot_password: "Forgot password?",
            email_required: "Email is required",
            password_required: "Password is required",

            // Navigation
            nav_home: "Home",
            nav_watchlist: "Watchlist",
            nav_search: "Search",
            nav_news: "News",

            // Dashboard
            dashboard_title: "Dashboard",
            good_morning: "Good morning",
            portfolio_value: "Portfolio Value",
            today_change: "Today's Change",
            trending: "Trending Stocks",
            top_movers: "Top Movers",
            latest_news: "Latest News",
            see_all: "See all",

            // Watchlist
            watchlist_title: "Watchlist",
            watchlist_live: "LIVE",
            watchlist_symbols: "symbols",
            watchlist_empty: "No stocks in watchlist",
            add_stock: "Add Stock",
            confirm_remove: "Remove from watchlist?",
            confirm_remove_msg: "Are you sure you want to remove {symbol} from your watchlist?",

            // Search
            search_title: "Search",
            search_placeholder: "Symbol or company name...",
            trending_label: "TRENDING",
            results: "results",

            // News
            news_title: "Market News",
            all: "All",
            bullish: "Bullish",
            bearish: "Bearish",
            read_more: "Read More",

            // Account
            account_title: "Account",
            edit_profile: "Edit Profile",
            edit_profile_sub: "Name, photo, bio",
            notifications: "Notifications",
            notifications_sub: "Push, email, alerts",
            security: "Security",
            security_sub: "Password, 2FA, biometrics",
            appearance: "Appearance",
            appearance_sub: "Dark mode, language",
            api_settings: "API Settings",
            api_settings_sub: "Finnhub key, WebSocket",
            subscription: "Subscription",
            subscription_sub: "Free plan",
            help_support: "Help & Support",
            help_support_sub: "FAQ, contact us",
            terms_privacy: "Terms & Privacy",
            terms_privacy_sub: "Legal documents",
            sign_out: "Sign Out",
            confirm_logout: "Are you sure you want to sign out?",
            powered_by: "On The Fly v2.0",
            watchlist_count: "Watchlist",
            alerts_count: "Alerts",
            trades_count: "Trades",

            // Stock Detail
            real_time: "REAL-TIME",
            statistics: "Statistics",
            related_news: "Related News",
            no_related_news: "No related news",
            detail_open: "Open",
            detail_high: "High",
            detail_low: "Low",
            detail_vol: "Volume",
            detail_pe: "P/E",
            detail_mkt_cap: "Mkt Cap",
            detail_52w_high: "52W High",
            detail_52w_low: "52W Low",
            buy: "Buy",
            sell: "Sell",
            buy_order_placed: "Buy order placed for",
            sell_order_placed: "Sell order placed for",

            // Common
            cancel: "Cancel",
            confirm: "Confirm",
            remove: "Remove"
        },

        vi: {
            login_title: "StockPro",
            login_subtitle: "Dau Tu Thong Minh Bat Dau Tu Day",
            email_label: "Email",
            email_placeholder: "email@cuaban.com",
            password_label: "Mat khau",
            password_placeholder: "Nhap mat khau",
            sign_in: "Dang Nhap",
            signing_in: "Dang dang nhap...",
            try_demo: "Thu Demo",
            signup_link: "Chua co tai khoan? Dang Ky",
            forgot_password: "Quen mat khau?",
            email_required: "Vui long nhap email",
            password_required: "Vui long nhap mat khau",

            nav_home: "Trang chu",
            nav_watchlist: "Danh muc",
            nav_search: "Tim kiem",
            nav_news: "Tin tuc",

            dashboard_title: "Bang dieu khien",
            good_morning: "Chao buoi sang",
            portfolio_value: "Gia tri danh muc",
            today_change: "Thay doi hom nay",
            trending: "Co phieu noi bat",
            top_movers: "Bien dong lon",
            latest_news: "Tin moi nhat",
            see_all: "Xem tat ca",

            watchlist_title: "Danh muc theo doi",
            watchlist_live: "TRUC TIEP",
            watchlist_symbols: "ma",
            watchlist_empty: "Chua co co phieu nao",
            add_stock: "Them co phieu",
            confirm_remove: "Xoa khoi danh muc?",
            confirm_remove_msg: "Ban co chac muon xoa {symbol} khoi danh muc?",

            search_title: "Tim kiem",
            search_placeholder: "Ma hoac ten cong ty...",
            trending_label: "XU HUONG",
            results: "ket qua",

            news_title: "Tin thi truong",
            all: "Tat ca",
            bullish: "Tang",
            bearish: "Giam",
            read_more: "Doc them",

            account_title: "Tai khoan",
            edit_profile: "Sua ho so",
            edit_profile_sub: "Ten, anh, tieu su",
            notifications: "Thong bao",
            notifications_sub: "Push, email, canh bao",
            security: "Bao mat",
            security_sub: "Mat khau, 2FA, sinh trac",
            appearance: "Giao dien",
            appearance_sub: "Che do toi, ngon ngu",
            api_settings: "Cai dat API",
            api_settings_sub: "Finnhub key, WebSocket",
            subscription: "Goi dich vu",
            subscription_sub: "Goi mien phi",
            help_support: "Ho tro",
            help_support_sub: "FAQ, lien he",
            terms_privacy: "Dieu khoan",
            terms_privacy_sub: "Tai lieu phap ly",
            sign_out: "Dang Xuat",
            confirm_logout: "Ban co chac muon dang xuat?",
            powered_by: "On The Fly v2.0",
            watchlist_count: "Danh muc",
            alerts_count: "Canh bao",
            trades_count: "Giao dich",

            real_time: "THOI GIAN THUC",
            statistics: "Thong ke",
            related_news: "Tin lien quan",
            no_related_news: "Khong co tin lien quan",
            detail_open: "Mo cua",
            detail_high: "Cao nhat",
            detail_low: "Thap nhat",
            detail_vol: "Khoi luong",
            detail_pe: "P/E",
            detail_mkt_cap: "Von hoa",
            detail_52w_high: "Cao 52T",
            detail_52w_low: "Thap 52T",
            buy: "Mua",
            sell: "Ban",
            buy_order_placed: "Dat lenh mua",
            sell_order_placed: "Dat lenh ban",

            cancel: "Huy",
            confirm: "Xac nhan",
            remove: "Xoa"
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

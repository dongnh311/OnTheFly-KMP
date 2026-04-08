// ═══════════════════════════════════════════════════════════
//  StockData — API integration + mock fallback for Stock App
//  Finnhub: stock quotes, search, WebSocket realtime
//  Marketaux: market news
// ═══════════════════════════════════════════════════════════

// ─── API Configuration ────────────────────────────────────

var StockAPI = {
    finnhub: {
        key: "d7at2fpr01qtpbh9nqsgd7at2fpr01qtpbh9nqt0",
        base: "https://finnhub.io/api/v1",
        ws: "wss://ws.finnhub.io"
    },
    marketaux: {
        key: "g5drxHJM2F1fS8A8KPO7vD22vSDb60Hx9UR9cCyB",
        base: "https://api.marketaux.com/v1"
    }
};

// ─── Finnhub API Helpers ──────────────────────────────────

// Fetch quote for a single symbol
// Callback: onDataReceived with requestId = "quote_SYMBOL"
function fetchQuote(symbol) {
    OnTheFly.sendToNative("sendRequest", {
        id: "quote_" + symbol,
        url: StockAPI.finnhub.base + "/quote?symbol=" + symbol + "&token=" + StockAPI.finnhub.key,
        method: "GET"
    });
}

// Fetch quotes for multiple symbols (fires one request per symbol)
function fetchQuotes(symbols) {
    for (var i = 0; i < symbols.length; i++) {
        fetchQuote(symbols[i]);
    }
}

// Fetch company profile for a symbol
// Callback: onDataReceived with requestId = "profile_SYMBOL"
function fetchProfile(symbol) {
    OnTheFly.sendToNative("sendRequest", {
        id: "profile_" + symbol,
        url: StockAPI.finnhub.base + "/stock/profile2?symbol=" + symbol + "&token=" + StockAPI.finnhub.key,
        method: "GET"
    });
}

// Search symbols via Finnhub
// Callback: onDataReceived with requestId = "search_QUERY"
function fetchSearch(query) {
    OnTheFly.sendToNative("sendRequest", {
        id: "search_" + query,
        url: StockAPI.finnhub.base + "/search?q=" + encodeURIComponent(query) + "&token=" + StockAPI.finnhub.key,
        method: "GET"
    });
}

// Fetch market indices (uses quote endpoint for index ETFs)
function fetchIndices() {
    var indexSymbols = ["SPY", "QQQ", "DIA"]; // S&P 500, NASDAQ, DOW proxies
    for (var i = 0; i < indexSymbols.length; i++) {
        OnTheFly.sendToNative("sendRequest", {
            id: "index_" + indexSymbols[i],
            url: StockAPI.finnhub.base + "/quote?symbol=" + indexSymbols[i] + "&token=" + StockAPI.finnhub.key,
            method: "GET"
        });
    }
}

// ─── Finnhub WebSocket ────────────────────────────────────

// Connect to Finnhub realtime WebSocket
function connectFinnhubWS() {
    OnTheFly.connectWS(
        StockAPI.finnhub.ws + "?token=" + StockAPI.finnhub.key,
        { id: "finnhub", autoReconnect: true, maxReconnectAttempts: 5, reconnectDelay: 2000 }
    );
}

// Subscribe to realtime trades for a symbol
function subscribeTrades(symbol) {
    OnTheFly.sendWS(JSON.stringify({ type: "subscribe", symbol: symbol }), "finnhub");
}

// Unsubscribe from a symbol
function unsubscribeTrades(symbol) {
    OnTheFly.sendWS(JSON.stringify({ type: "unsubscribe", symbol: symbol }), "finnhub");
}

// Disconnect Finnhub WebSocket
function disconnectFinnhubWS() {
    OnTheFly.closeWS("finnhub");
}

// ─── Marketaux API Helpers ────────────────────────────────

// Fetch general market news
// Callback: onDataReceived with requestId = "news_all"
function fetchNews() {
    OnTheFly.sendToNative("sendRequest", {
        id: "news_all",
        url: StockAPI.marketaux.base + "/news/all?api_token=" + StockAPI.marketaux.key
            + "&countries=us&filter_entities=true&language=en&limit=20",
        method: "GET"
    });
}

// Fetch news for specific symbols
// Callback: onDataReceived with requestId = "news_SYMBOL"
function fetchNewsForSymbol(symbol) {
    OnTheFly.sendToNative("sendRequest", {
        id: "news_" + symbol,
        url: StockAPI.marketaux.base + "/news/all?api_token=" + StockAPI.marketaux.key
            + "&symbols=" + symbol + "&filter_entities=true&language=en&limit=10",
        method: "GET"
    });
}

// ─── Quote Response Parser ────────────────────────────────
// Finnhub quote response: { c, d, dp, h, l, o, pc, t }
// c = current price, d = change, dp = percent change
// h = high, l = low, o = open, pc = previous close, t = timestamp

function parseFinnhubQuote(symbol, body) {
    if (!body || body.c === 0) return null;
    // Find existing stock data to merge with
    var existing = findStock(symbol);
    return {
        symbol: symbol,
        name: existing ? existing.name : symbol,
        price: body.c || 0,
        change: body.d || 0,
        pct: body.dp || 0,
        high: body.h || 0,
        low: body.l || 0,
        open: body.o || 0,
        vol: existing ? existing.vol : "N/A",
        cap: existing ? existing.cap : "N/A",
        pe: existing ? existing.pe : 0,
        w52h: existing ? existing.w52h : 0,
        w52l: existing ? existing.w52l : 0
    };
}

// Parse Finnhub profile response and merge into stock
function parseFinnhubProfile(symbol, body) {
    if (!body || !body.name) return;
    var stock = findStock(symbol);
    if (stock) {
        stock.name = body.name;
        if (body.marketCapitalization) {
            var mc = body.marketCapitalization;
            if (mc >= 1000) stock.cap = (mc / 1000).toFixed(2) + "T";
            else stock.cap = mc.toFixed(0) + "B";
        }
    }
}

// Update or insert stock into StockData.stocks
function upsertStock(stockObj) {
    if (!stockObj) return;
    for (var i = 0; i < StockData.stocks.length; i++) {
        if (StockData.stocks[i].symbol === stockObj.symbol) {
            StockData.stocks[i] = stockObj;
            return;
        }
    }
    StockData.stocks.push(stockObj);
}

// Parse Finnhub WebSocket trade message
// Message format: { "data": [{ "p": price, "s": symbol, "t": timestamp, "v": volume }], "type": "trade" }
function parseFinnhubWSMessage(messageStr) {
    var msg = JSON.parse(messageStr);
    if (msg && msg.type === "trade" && msg.data && msg.data.length > 0) {
        var trades = [];
        for (var i = 0; i < msg.data.length; i++) {
            trades.push({
                symbol: msg.data[i].s,
                price: msg.data[i].p,
                volume: msg.data[i].v,
                timestamp: msg.data[i].t
            });
        }
        return trades;
    }
    return null;
}

// Update stock price from WebSocket trade data
function updateStockFromTrade(trade) {
    var stock = findStock(trade.symbol);
    if (stock) {
        var prevPrice = stock.price;
        stock.price = trade.price;
        stock.change = trade.price - stock.open;
        if (stock.open > 0) {
            stock.pct = ((trade.price - stock.open) / stock.open) * 100;
        }
        if (trade.price > stock.high) stock.high = trade.price;
        if (trade.price < stock.low) stock.low = trade.price;
    }
}

// ─── Marketaux Response Parser ────────────────────────────
// Response: { data: [{ title, description, url, source, published_at, entities: [{ symbol, sentiment_score }] }] }

function parseMarketauxNews(body) {
    if (!body || !body.data) return [];
    var result = [];
    for (var i = 0; i < body.data.length; i++) {
        var article = body.data[i];
        var sym = null;
        var bull = true;
        // Extract first entity symbol and sentiment
        if (article.entities && article.entities.length > 0) {
            sym = article.entities[0].symbol || null;
            if (article.entities[0].sentiment_score !== undefined) {
                bull = article.entities[0].sentiment_score >= 0;
            }
        }
        result.push({
            id: i + 1,
            title: article.title || "",
            src: article.source || "Unknown",
            time: timeAgo(article.published_at),
            url: article.url || "",
            sym: sym,
            bull: bull
        });
    }
    return result;
}

// ─── Index Mapping ────────────────────────────────────────

var INDEX_MAP = {
    SPY: { name: "S&P 500", idx: 0 },
    QQQ: { name: "NASDAQ",  idx: 1 },
    DIA: { name: "DOW 30",  idx: 2 }
};

function updateIndexFromQuote(etfSymbol, body) {
    var info = INDEX_MAP[etfSymbol];
    if (!info || !body || body.c === 0) return;
    var up = (body.d || 0) >= 0;
    var sign = up ? "+" : "";
    StockData.indices[info.idx] = {
        name: info.name,
        val: formatPrice(body.c),
        chg: sign + formatDecimal(body.dp, 2) + "%",
        up: up
    };
}

// ─── Mock Data (fallback) ─────────────────────────────────

var StockData = {
    stocks: [
        { symbol: "AAPL",  name: "Apple Inc.",       price: 213.25, change: 2.34,   pct: 1.11,  vol: "52.3M", cap: "3.28T", high: 214.8,  low: 210.5,  open: 211,   pe: 33.2, w52h: 237.23, w52l: 164.08 },
        { symbol: "TSLA",  name: "Tesla, Inc.",      price: 342.18, change: -5.62,  pct: -1.62, vol: "89.1M", cap: "1.10T", high: 350,    low: 339.2,  open: 348,   pe: 65.8, w52h: 488.54, w52l: 138.8  },
        { symbol: "MSFT",  name: "Microsoft Corp.",  price: 467.12, change: 3.87,   pct: 0.84,  vol: "21.7M", cap: "3.47T", high: 469.5,  low: 462.3,  open: 463,   pe: 37.1, w52h: 471.66, w52l: 384.23 },
        { symbol: "GOOGL", name: "Alphabet Inc.",    price: 181.43, change: -1.23,  pct: -0.67, vol: "18.4M", cap: "2.24T", high: 183.9,  low: 180.1,  open: 182.5, pe: 24.5, w52h: 192.57, w52l: 145.02 },
        { symbol: "AMZN",  name: "Amazon.com",       price: 218.94, change: 4.12,   pct: 1.92,  vol: "34.6M", cap: "2.30T", high: 220.1,  low: 215.3,  open: 214.8, pe: 42.8, w52h: 228.68, w52l: 166.21 },
        { symbol: "NVDA",  name: "NVIDIA Corp.",     price: 145.67, change: 6.78,   pct: 4.88,  vol: "312M",  cap: "3.58T", high: 147.2,  low: 139.5,  open: 139,   pe: 55.3, w52h: 153.13, w52l: 75.61  },
        { symbol: "META",  name: "Meta Platforms",   price: 632.50, change: -8.30,  pct: -1.30, vol: "15.2M", cap: "1.60T", high: 641,    low: 628.7,  open: 640,   pe: 28.9, w52h: 656.31, w52l: 432.77 },
        { symbol: "NFLX",  name: "Netflix, Inc.",    price: 1045.8, change: 12.45,  pct: 1.20,  vol: "8.3M",  cap: "448B",  high: 1052,   low: 1030,   open: 1033,  pe: 51.2, w52h: 1064.75, w52l: 564.2 }
    ],

    indices: [
        { name: "S&P 500", val: "5,842.31", chg: "+0.86%", up: true },
        { name: "NASDAQ",  val: "18,923.45", chg: "+1.24%", up: true },
        { name: "DOW 30",  val: "42,156.78", chg: "-0.12%", up: false }
    ],

    news: [
        { id: 1, title: "NVIDIA tops $3.5T market cap as AI demand surges",     src: "Reuters",    time: "2h ago",  sym: "NVDA", bull: true },
        { id: 2, title: "Apple unveils new AI features at WWDC 2025",           src: "Bloomberg",  time: "4h ago",  sym: "AAPL", bull: true },
        { id: 3, title: "Tesla recalls 125K vehicles over steering issue",      src: "CNBC",       time: "5h ago",  sym: "TSLA", bull: false },
        { id: 4, title: "Microsoft Azure revenue grows 35% YoY",               src: "WSJ",        time: "6h ago",  sym: "MSFT", bull: true },
        { id: 5, title: "Fed signals potential rate cut in September",          src: "AP News",    time: "8h ago",  sym: null,   bull: true },
        { id: 6, title: "Meta faces EU antitrust investigation",               src: "FT",         time: "10h ago", sym: "META", bull: false },
        { id: 7, title: "Amazon expands same-day delivery to 20 cities",       src: "TechCrunch", time: "12h ago", sym: "AMZN", bull: true },
        { id: 8, title: "Netflix subscriber growth beats expectations",        src: "Variety",    time: "1d ago",  sym: "NFLX", bull: true }
    ],

    portfolio: {
        totalValue: 125847.32,
        dayChange: 1284.56,
        dayChangePct: 1.03
    },

    mockUser: {
        name: "demo",
        email: "demo@onthefly.app",
        watchlistCount: 8,
        alertsCount: "3.2K",
        tradesCount: 12
    }
};

// ─── Helpers ──────────────────────────────────────────────

function findStock(symbol) {
    for (var i = 0; i < StockData.stocks.length; i++) {
        if (StockData.stocks[i].symbol === symbol) return StockData.stocks[i];
    }
    return null;
}

function getWatchlist() {
    var saved = AppState.get("stock_watchlist", null);
    if (saved) return saved;
    var defaults = ["AAPL", "NVDA", "MSFT", "AMZN"];
    AppState.set("stock_watchlist", defaults);
    return defaults;
}

function addToWatchlist(symbol) {
    var list = getWatchlist();
    for (var i = 0; i < list.length; i++) {
        if (list[i] === symbol) return;
    }
    list.push(symbol);
    AppState.set("stock_watchlist", list);
}

function removeFromWatchlist(symbol) {
    var list = getWatchlist();
    var newList = [];
    for (var i = 0; i < list.length; i++) {
        if (list[i] !== symbol) newList.push(list[i]);
    }
    AppState.set("stock_watchlist", newList);
}

function isInWatchlist(symbol) {
    var list = getWatchlist();
    for (var i = 0; i < list.length; i++) {
        if (list[i] === symbol) return true;
    }
    return false;
}

function getWatchlistStocks() {
    var list = getWatchlist();
    var result = [];
    for (var i = 0; i < list.length; i++) {
        var s = findStock(list[i]);
        if (s) result.push(s);
    }
    return result;
}

function getTopMovers() {
    var sorted = StockData.stocks.slice();
    sorted.sort(function(a, b) { return Math.abs(b.pct) - Math.abs(a.pct); });
    return sorted.slice(0, 5);
}

function searchStocks(query) {
    if (!query || query.length === 0) return StockData.stocks;
    var q = query.toLowerCase();
    var result = [];
    for (var i = 0; i < StockData.stocks.length; i++) {
        var s = StockData.stocks[i];
        if (s.symbol.toLowerCase().indexOf(q) >= 0 || s.name.toLowerCase().indexOf(q) >= 0) {
            result.push(s);
        }
    }
    return result;
}

function getNewsByFilter(filter) {
    if (!filter || filter === "all") return StockData.news;
    var result = [];
    for (var i = 0; i < StockData.news.length; i++) {
        var n = StockData.news[i];
        if (filter === "bullish" && n.bull) result.push(n);
        if (filter === "bearish" && !n.bull) result.push(n);
    }
    return result;
}

function getNewsForStock(symbol) {
    var result = [];
    for (var i = 0; i < StockData.news.length; i++) {
        if (StockData.news[i].sym === symbol) result.push(StockData.news[i]);
    }
    return result;
}

function stockPriceText(price) {
    return "$" + price.toFixed(2);
}

function stockChangeText(stock) {
    var sign = stock.change >= 0 ? "+" : "";
    return sign + stock.change.toFixed(2) + " (" + sign + stock.pct.toFixed(2) + "%)";
}

function stockChangeArrow(stock) {
    var sign = stock.change >= 0 ? "+" : "";
    var arrow = stock.change >= 0 ? "▲" : "▼";
    return arrow + " " + Math.abs(stock.change).toFixed(2) + " (" + sign + stock.pct.toFixed(2) + "%)";
}

// Recalculate portfolio value from watchlist stocks
function recalcPortfolio() {
    var stocks = getWatchlistStocks();
    var totalVal = 0;
    var totalChange = 0;
    for (var i = 0; i < stocks.length; i++) {
        // Assume ~100 shares each for demo
        totalVal += stocks[i].price * 100;
        totalChange += stocks[i].change * 100;
    }
    if (totalVal > 0) {
        StockData.portfolio.totalValue = totalVal;
        StockData.portfolio.dayChange = totalChange;
        StockData.portfolio.dayChangePct = (totalChange / (totalVal - totalChange)) * 100;
    }
}

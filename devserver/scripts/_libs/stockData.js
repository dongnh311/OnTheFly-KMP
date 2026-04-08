// ═══════════════════════════════════════════════════════════
//  StockData — Mock data + API integration for Stock App
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

function fetchQuote(symbol) {
    OnTheFly.sendToNative("sendRequest", {
        id: "quote_" + symbol,
        url: StockAPI.finnhub.base + "/quote?symbol=" + symbol + "&token=" + StockAPI.finnhub.key,
        method: "GET"
    });
}

function fetchQuotes(symbols) {
    for (var i = 0; i < symbols.length; i++) {
        fetchQuote(symbols[i]);
    }
}

function fetchProfile(symbol) {
    OnTheFly.sendToNative("sendRequest", {
        id: "profile_" + symbol,
        url: StockAPI.finnhub.base + "/stock/profile2?symbol=" + symbol + "&token=" + StockAPI.finnhub.key,
        method: "GET"
    });
}

function fetchSearch(query) {
    OnTheFly.sendToNative("sendRequest", {
        id: "search_" + query,
        url: StockAPI.finnhub.base + "/search?q=" + encodeURIComponent(query) + "&token=" + StockAPI.finnhub.key,
        method: "GET"
    });
}

function fetchIndices() {
    var indexSymbols = ["SPY", "QQQ", "DIA"];
    for (var i = 0; i < indexSymbols.length; i++) {
        OnTheFly.sendToNative("sendRequest", {
            id: "index_" + indexSymbols[i],
            url: StockAPI.finnhub.base + "/quote?symbol=" + indexSymbols[i] + "&token=" + StockAPI.finnhub.key,
            method: "GET"
        });
    }
}

// ─── Finnhub WebSocket ────────────────────────────────────

function connectFinnhubWS() {
    OnTheFly.connectWS(
        StockAPI.finnhub.ws + "?token=" + StockAPI.finnhub.key,
        { id: "finnhub", autoReconnect: true, maxReconnectAttempts: 5, reconnectDelay: 2000 }
    );
}

function subscribeTrades(symbol) {
    OnTheFly.sendWS(JSON.stringify({ type: "subscribe", symbol: symbol }), "finnhub");
}

function unsubscribeTrades(symbol) {
    OnTheFly.sendWS(JSON.stringify({ type: "unsubscribe", symbol: symbol }), "finnhub");
}

function disconnectFinnhubWS() {
    OnTheFly.closeWS("finnhub");
}

// ─── Marketaux API Helpers ────────────────────────────────

function fetchNews() {
    OnTheFly.sendToNative("sendRequest", {
        id: "news_all",
        url: StockAPI.marketaux.base + "/news/all?api_token=" + StockAPI.marketaux.key
            + "&countries=us&filter_entities=true&language=en&limit=20",
        method: "GET"
    });
}

function fetchNewsForSymbol(symbol) {
    OnTheFly.sendToNative("sendRequest", {
        id: "news_" + symbol,
        url: StockAPI.marketaux.base + "/news/all?api_token=" + StockAPI.marketaux.key
            + "&symbols=" + symbol + "&filter_entities=true&language=en&limit=10",
        method: "GET"
    });
}

// ─── Response Parsers ─────────────────────────────────────

function parseFinnhubQuote(symbol, body) {
    if (!body || body.c === 0) return null;
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
        pe: existing ? existing.pe : 0
    };
}

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

function updateStockFromTrade(trade) {
    var stock = findStock(trade.symbol);
    if (stock) {
        stock.price = trade.price;
        stock.change = trade.price - stock.open;
        if (stock.open > 0) {
            stock.pct = ((trade.price - stock.open) / stock.open) * 100;
        }
        if (trade.price > stock.high) stock.high = trade.price;
        if (trade.price < stock.low) stock.low = trade.price;
    }
}

function parseMarketauxNews(body) {
    if (!body || !body.data) return [];
    var result = [];
    for (var i = 0; i < body.data.length; i++) {
        var article = body.data[i];
        var sym = null;
        var bull = true;
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
            tag: (i % 3 === 0) ? "breaking" : "latest",
            bull: bull
        });
    }
    return result;
}

// ─── Mock Data (matching mockup exactly) ──────────────────

var StockData = {
    stocks: [
        { symbol: "AAPL",  name: "Apple Inc.",       price: 189.84, change: 2.35,   pct: 1.25,  open: 187.49, high: 190.21, low: 186.80, vol: "52.3M", cap: "2.95T", pe: 31.2 },
        { symbol: "TSLA",  name: "Tesla, Inc.",      price: 248.42, change: -5.18,  pct: -2.04, open: 253.60, high: 255.10, low: 246.30, vol: "98.7M", cap: "790B",  pe: 62.8 },
        { symbol: "NVDA",  name: "NVIDIA Corp.",     price: 875.28, change: 12.45,  pct: 1.44,  open: 862.83, high: 880.50, low: 860.15, vol: "41.2M", cap: "2.16T", pe: 72.5 },
        { symbol: "MSFT",  name: "Microsoft Corp.",  price: 415.56, change: 3.22,   pct: 0.78,  open: 412.34, high: 417.80, low: 411.50, vol: "22.1M", cap: "3.09T", pe: 37.1 },
        { symbol: "GOOGL", name: "Alphabet Inc.",    price: 155.72, change: -1.38,  pct: -0.88, open: 157.10, high: 158.40, low: 154.20, vol: "28.5M", cap: "1.93T", pe: 25.3 },
        { symbol: "AMZN",  name: "Amazon.com Inc.",  price: 185.07, change: 4.52,   pct: 2.50,  open: 180.55, high: 186.30, low: 179.90, vol: "55.8M", cap: "1.93T", pe: 58.4 },
        { symbol: "META",  name: "Meta Platforms",   price: 505.95, change: 8.30,   pct: 1.67,  open: 497.65, high: 508.20, low: 495.80, vol: "18.3M", cap: "1.30T", pe: 33.7 },
        { symbol: "AMD",   name: "Advanced Micro",   price: 178.32, change: -2.14,  pct: -1.19, open: 180.46, high: 181.90, low: 176.50, vol: "62.4M", cap: "288B",  pe: 46.2 }
    ],

    news: [
        { id: 1, title: "Fed Holds Rates Steady, Signals Patience",    src: "Reuters",     time: "2h ago",  tag: "breaking" },
        { id: 2, title: "NVIDIA Beats Q4 Expectations on AI Demand",   src: "Bloomberg",   time: "4h ago",  tag: "latest" },
        { id: 3, title: "Apple Vision Pro Sales Exceed Forecasts",     src: "CNBC",        time: "5h ago",  tag: "latest" },
        { id: 4, title: "Tesla Announces New Gigafactory in India",    src: "TechCrunch",  time: "6h ago",  tag: "latest" },
        { id: 5, title: "S&P 500 Hits New All-Time High",             src: "MarketWatch", time: "8h ago",  tag: "breaking" },
        { id: 6, title: "Bitcoin Surges Past $70K Milestone",         src: "CoinDesk",    time: "10h ago", tag: "latest" }
    ],

    portfolio: {
        totalValue: 125847.32,
        dayChange: 1284.56,
        dayChangePct: 1.03
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
    var defaults = ["AAPL", "TSLA", "NVDA", "MSFT"];
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

function getNewsByTag(tag) {
    if (!tag || tag === "all") return StockData.news;
    var result = [];
    for (var i = 0; i < StockData.news.length; i++) {
        if (StockData.news[i].tag === tag) result.push(StockData.news[i]);
    }
    return result;
}

function getNewsByFilter(filter) {
    return getNewsByTag(filter);
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
    return sign + stock.change.toFixed(2) + " (" + sign + stock.pct.toFixed(2) + "%)";
}

function fmtPct(n) {
    return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

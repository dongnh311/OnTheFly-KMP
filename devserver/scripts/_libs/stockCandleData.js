// ═══════════════════════════════════════════════════════════
//  StockCandleData — Candlestick data (Finnhub API + mock fallback)
//  Usage: StockCandleData.generate("AAPL", "1M") for mock
//         StockCandleData.fetchReal("AAPL", "1M") to request from API
// ═══════════════════════════════════════════════════════════

var StockCandleData = (function() {

    var _realCandleCache = {}; // { "AAPL_1M": { candles: [...], ma7: [...], ... } }

    function resolutionForRange(range) {
        switch (range) {
            case "1D":  return { res: "5",  days: 1 };
            case "1W":  return { res: "15", days: 7 };
            case "1M":  return { res: "D",  days: 30 };
            case "3M":  return { res: "D",  days: 90 };
            case "6M":  return { res: "D",  days: 180 };
            case "1Y":  return { res: "W",  days: 365 };
            case "ALL": return { res: "W",  days: 730 };
            default:    return { res: "D",  days: 30 };
        }
    }

    function fetchReal(symbol, range) {
        var cfg = resolutionForRange(range);
        var now = Math.floor(Date.now() / 1000);
        var from = now - cfg.days * 86400;
        fetchCandles(symbol, cfg.res, from, now);
    }

    function parseRealCandles(symbol, range, body) {
        if (!body || body.s !== "ok" || !body.c) return null;
        var candles = [];
        for (var i = 0; i < body.c.length; i++) {
            candles.push({
                o: Math.round(body.o[i] * 100) / 100,
                h: Math.round(body.h[i] * 100) / 100,
                l: Math.round(body.l[i] * 100) / 100,
                c: Math.round(body.c[i] * 100) / 100,
                v: Math.round(body.v[i]),
                t: body.t[i]
            });
        }
        var ma7 = calculateMA(candles, 7);
        var ma25 = calculateMA(candles, Math.min(25, candles.length));
        var ma99 = calculateMA(candles, Math.min(99, Math.floor(candles.length * 0.8)));
        var result = { candles: candles, ma7: ma7, ma25: ma25, ma99: ma99 };
        _realCandleCache[symbol + "_" + range] = result;
        return result;
    }

    function getRealCached(symbol, range) {
        return _realCandleCache[symbol + "_" + range] || null;
    }

    function updateLatestCandle(symbol, price, volume) {
        // Update the last candle in all cached ranges for this symbol
        for (var key in _realCandleCache) {
            if (key.indexOf(symbol + "_") === 0) {
                var data = _realCandleCache[key];
                if (data && data.candles && data.candles.length > 0) {
                    var last = data.candles[data.candles.length - 1];
                    last.c = Math.round(price * 100) / 100;
                    if (price > last.h) last.h = Math.round(price * 100) / 100;
                    if (price < last.l) last.l = Math.round(price * 100) / 100;
                    if (volume) last.v = last.v + volume;
                    // Recalculate MAs
                    data.ma7 = calculateMA(data.candles, 7);
                    data.ma25 = calculateMA(data.candles, Math.min(25, data.candles.length));
                    data.ma99 = calculateMA(data.candles, Math.min(99, Math.floor(data.candles.length * 0.8)));
                }
            }
        }
        // Also update mock data cache
        var mockKey = symbol + "_mock";
        // Not cached by key - mock data regenerates each time, so update generate's output
    }

    // Seeded random for stable chart per symbol+range
    function seededRandom(seed) {
        var s = seed;
        return function() {
            s = (s * 1103515245 + 12345) & 0x7fffffff;
            return s / 0x7fffffff;
        };
    }

    function hashCode(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    function rangeConfig(range) {
        switch (range) {
            case "1D":  return { count: 78,  stepSec: 300,    volatility: 0.003 };
            case "1W":  return { count: 35,  stepSec: 3600,   volatility: 0.008 };
            case "1M":  return { count: 30,  stepSec: 86400,  volatility: 0.015 };
            case "3M":  return { count: 60,  stepSec: 86400,  volatility: 0.018 };
            case "6M":  return { count: 90,  stepSec: 172800, volatility: 0.020 };
            case "1Y":  return { count: 52,  stepSec: 604800, volatility: 0.025 };
            case "ALL": return { count: 100, stepSec: 604800, volatility: 0.030 };
            default:    return { count: 30,  stepSec: 86400,  volatility: 0.015 };
        }
    }

    function generate(symbol, range) {
        // Return cached if available (so realtime updates persist)
        var cached = _realCandleCache[symbol + "_" + range];
        if (cached) return cached;

        var stock = findStock(symbol);
        if (!stock) return { candles: [], ma7: [], ma25: [], ma99: [] };

        var cfg = rangeConfig(range);
        var seed = hashCode(symbol + range);
        var rng = seededRandom(seed);

        var currentPrice = stock.price;
        var baseVolume = 50000000;

        // Walk backward from current price to generate candles
        var candles = [];
        var now = Math.floor(Date.now() / 1000);
        var price = currentPrice;

        // First generate prices going back in time
        var prices = [price];
        for (var i = 1; i < cfg.count; i++) {
            var change = (rng() - 0.48) * cfg.volatility * 2; // slight upward bias
            price = price / (1 + change);
            prices.unshift(price);
        }

        // Now create candles from prices
        for (var j = 0; j < prices.length; j++) {
            var closePrice = prices[j];
            var openPrice = j > 0 ? prices[j - 1] : closePrice * (1 + (rng() - 0.5) * cfg.volatility);
            var spread = Math.abs(closePrice - openPrice) + closePrice * cfg.volatility * rng() * 0.5;
            var high = Math.max(openPrice, closePrice) + spread * rng();
            var low = Math.min(openPrice, closePrice) - spread * rng();
            var volume = baseVolume * (0.5 + rng() * 1.5);
            var timestamp = now - (prices.length - 1 - j) * cfg.stepSec;

            candles.push({
                o: Math.round(openPrice * 100) / 100,
                h: Math.round(high * 100) / 100,
                l: Math.round(low * 100) / 100,
                c: Math.round(closePrice * 100) / 100,
                v: Math.round(volume),
                t: timestamp
            });
        }

        // Calculate MAs
        var ma7 = calculateMA(candles, 7);
        var ma25 = calculateMA(candles, 25);
        var ma99 = calculateMA(candles, Math.min(99, Math.floor(candles.length * 0.8)));

        var result = { candles: candles, ma7: ma7, ma25: ma25, ma99: ma99 };
        _realCandleCache[symbol + "_" + range] = result; // Cache for realtime updates
        return result;
    }

    function calculateMA(candles, period) {
        var result = [];
        for (var i = period - 1; i < candles.length; i++) {
            var sum = 0;
            for (var j = i - period + 1; j <= i; j++) {
                sum += candles[j].c;
            }
            result.push({
                t: candles[i].t,
                value: Math.round(sum / period * 100) / 100
            });
        }
        return result;
    }

    function getLatestMA(maData) {
        if (maData.length === 0) return 0;
        return maData[maData.length - 1].value;
    }

    return {
        generate: generate,
        fetchReal: fetchReal,
        parseRealCandles: parseRealCandles,
        getRealCached: getRealCached,
        updateLatestCandle: updateLatestCandle,
        calculateMA: calculateMA,
        getLatestMA: getLatestMA
    };
})();

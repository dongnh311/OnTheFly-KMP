// ═══════════════════════════════════════════════════════════
//  StockCandleData — Mock candlestick data generator
//  Usage: generateCandleData("AAPL", "1M")
// ═══════════════════════════════════════════════════════════

var StockCandleData = (function() {

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

        return {
            candles: candles,
            ma7: ma7,
            ma25: ma25,
            ma99: ma99
        };
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
        calculateMA: calculateMA,
        getLatestMA: getLatestMA
    };
})();

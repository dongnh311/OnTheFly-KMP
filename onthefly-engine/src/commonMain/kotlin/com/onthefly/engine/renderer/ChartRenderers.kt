package com.onthefly.engine.renderer

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onthefly.engine.model.UIComponent
import kotlin.math.max
import kotlin.math.min

// ─── Data classes ──────────────────────────────────────────

private data class CandleData(
    val open: Float, val high: Float, val low: Float,
    val close: Float, val volume: Float, val timestamp: Long
)

private data class MAPoint(val timestamp: Long, val value: Float)

// ─── Prop parsing ──────────────────────────────────────────

@Suppress("UNCHECKED_CAST")
private fun parseCandles(raw: Any?): List<CandleData> {
    val list = raw as? List<Map<String, Any>> ?: return emptyList()
    return list.map { m ->
        CandleData(
            open = (m["o"] as? Number)?.toFloat() ?: 0f,
            high = (m["h"] as? Number)?.toFloat() ?: 0f,
            low = (m["l"] as? Number)?.toFloat() ?: 0f,
            close = (m["c"] as? Number)?.toFloat() ?: 0f,
            volume = (m["v"] as? Number)?.toFloat() ?: 0f,
            timestamp = (m["t"] as? Number)?.toLong() ?: 0L
        )
    }
}

@Suppress("UNCHECKED_CAST")
private fun parseMA(raw: Any?): List<MAPoint> {
    val list = raw as? List<Map<String, Any>> ?: return emptyList()
    return list.map { m ->
        MAPoint(
            timestamp = (m["t"] as? Number)?.toLong() ?: 0L,
            value = (m["value"] as? Number)?.toFloat() ?: 0f
        )
    }
}

// ─── Main Composable ───────────────────────────────────────

@Composable
fun RenderCandlestickChart(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val visible = c.propBool("visible", true)
    if (!visible) return

    val chartHeight = c.propInt("height", 250)
    val bgColor = c.propColor("background") ?: Color(0xFF1F2937)
    val upColor = c.propColor("upColor") ?: Color(0xFF10B981)
    val downColor = c.propColor("downColor") ?: Color(0xFFEF4444)
    val ma7Color = c.propColor("ma7Color") ?: Color(0xFF00D4AA)
    val ma25Color = c.propColor("ma25Color") ?: Color(0xFFE8B84B)
    val ma99Color = c.propColor("ma99Color") ?: Color(0xFFB84BE8)
    val gridColor = c.propColor("gridColor") ?: Color(0xFF374151)
    val textColor = c.propColor("textColor") ?: Color(0xFF6B7280)
    val showGrid = c.propBool("showGrid", true)
    val showVolume = c.propBool("showVolume", true)
    val volumeRatio = c.propFloat("volumeHeightRatio", 0.2f)
    val borderRadius = c.propInt("borderRadius", 8)

    val candles = remember(c.props["candles"]) { parseCandles(c.props["candles"]) }
    val ma7 = remember(c.props["ma7"]) { parseMA(c.props["ma7"]) }
    val ma25 = remember(c.props["ma25"]) { parseMA(c.props["ma25"]) }
    val ma99 = remember(c.props["ma99"]) { parseMA(c.props["ma99"]) }

    val shape = RoundedCornerShape(borderRadius.dp)
    val textMeasurer = rememberTextMeasurer()

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(chartHeight.dp)
            .clip(shape)
            .background(bgColor, shape)
    ) {
        if (candles.isEmpty()) return@Box

        Canvas(modifier = Modifier.fillMaxSize()) {
            drawChart(
                candles = candles,
                ma7 = ma7, ma25 = ma25, ma99 = ma99,
                upColor = upColor, downColor = downColor,
                ma7Color = ma7Color, ma25Color = ma25Color, ma99Color = ma99Color,
                gridColor = gridColor, textColor = textColor,
                showGrid = showGrid, showVolume = showVolume,
                volumeRatio = volumeRatio, textMeasurer = textMeasurer
            )
        }
    }
}

// ─── Drawing Logic ─────────────────────────────────────────

private fun DrawScope.drawChart(
    candles: List<CandleData>,
    ma7: List<MAPoint>, ma25: List<MAPoint>, ma99: List<MAPoint>,
    upColor: Color, downColor: Color,
    ma7Color: Color, ma25Color: Color, ma99Color: Color,
    gridColor: Color, textColor: Color,
    showGrid: Boolean, showVolume: Boolean,
    volumeRatio: Float, textMeasurer: TextMeasurer
) {
    val w = size.width
    val h = size.height
    val rightMargin = 55.dp.toPx()
    val bottomMargin = 18.dp.toPx()
    val topMargin = 4.dp.toPx()
    val chartWidth = w - rightMargin
    val availableHeight = h - topMargin - bottomMargin

    val priceChartHeight = if (showVolume) availableHeight * (1f - volumeRatio) else availableHeight
    val volumeChartTop = topMargin + priceChartHeight
    val volumeChartHeight = if (showVolume) availableHeight * volumeRatio else 0f

    // Price range
    var priceMin = Float.MAX_VALUE
    var priceMax = Float.MIN_VALUE
    for (c in candles) {
        if (c.low < priceMin) priceMin = c.low
        if (c.high > priceMax) priceMax = c.high
    }
    val pricePad = (priceMax - priceMin) * 0.05f
    priceMin -= pricePad
    priceMax += pricePad
    val priceRange = priceMax - priceMin

    // Volume range
    var volumeMax = 0f
    for (c in candles) {
        if (c.volume > volumeMax) volumeMax = c.volume
    }

    val candleStep = chartWidth / candles.size
    val candleBodyWidth = candleStep * 0.65f
    val wickWidth = 1.2.dp.toPx()

    fun priceToY(price: Float): Float =
        topMargin + priceChartHeight * (1f - (price - priceMin) / priceRange)

    fun indexToX(index: Int): Float =
        index * candleStep + candleStep / 2f

    // ── 1. Grid lines ──
    if (showGrid) {
        val gridLines = 5
        val dashEffect = PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 4.dp.toPx()))

        for (i in 0..gridLines) {
            val y = topMargin + priceChartHeight * i / gridLines
            drawLine(
                color = gridColor.copy(alpha = 0.25f),
                start = Offset(0f, y),
                end = Offset(chartWidth, y),
                strokeWidth = 0.5.dp.toPx(),
                pathEffect = dashEffect
            )

            // Price label on Y axis
            val price = priceMax - (priceMax - priceMin) * i / gridLines
            val label = formatPrice(price)
            val textResult = textMeasurer.measure(
                text = label,
                style = TextStyle(fontSize = 9.sp, color = textColor)
            )
            drawText(
                textResult,
                topLeft = Offset(chartWidth + 4.dp.toPx(), y - textResult.size.height / 2f)
            )
        }

        // Vertical grid lines
        val vLines = min(6, candles.size)
        for (i in 1 until vLines) {
            val idx = candles.size * i / vLines
            val x = indexToX(idx)
            drawLine(
                color = gridColor.copy(alpha = 0.15f),
                start = Offset(x, topMargin),
                end = Offset(x, topMargin + priceChartHeight),
                strokeWidth = 0.5.dp.toPx(),
                pathEffect = dashEffect
            )
        }
    }

    // ── 2. Volume bars ──
    if (showVolume && volumeMax > 0f) {
        for (i in candles.indices) {
            val candle = candles[i]
            val x = indexToX(i)
            val isUp = candle.close >= candle.open
            val barHeight = (candle.volume / volumeMax) * volumeChartHeight * 0.85f
            val color = if (isUp) upColor.copy(alpha = 0.4f) else downColor.copy(alpha = 0.4f)

            drawRect(
                color = color,
                topLeft = Offset(x - candleBodyWidth / 2f, volumeChartTop + volumeChartHeight - barHeight),
                size = Size(candleBodyWidth, barHeight)
            )
        }
    }

    // ── 3. Candlestick wicks ──
    for (i in candles.indices) {
        val candle = candles[i]
        val x = indexToX(i)
        val isUp = candle.close >= candle.open
        val color = if (isUp) upColor else downColor

        // Wick (high to low)
        drawLine(
            color = color,
            start = Offset(x, priceToY(candle.high)),
            end = Offset(x, priceToY(candle.low)),
            strokeWidth = wickWidth,
            cap = StrokeCap.Round
        )
    }

    // ── 4. Candlestick bodies ──
    for (i in candles.indices) {
        val candle = candles[i]
        val x = indexToX(i)
        val isUp = candle.close >= candle.open
        val color = if (isUp) upColor else downColor

        val bodyTop = priceToY(max(candle.open, candle.close))
        val bodyBottom = priceToY(min(candle.open, candle.close))
        val bodyHeight = max(bodyBottom - bodyTop, 1.dp.toPx())

        drawRect(
            color = color,
            topLeft = Offset(x - candleBodyWidth / 2f, bodyTop),
            size = Size(candleBodyWidth, bodyHeight)
        )
    }

    // ── 5. MA lines ──
    drawMALine(ma7, candles, ma7Color, priceToY = ::priceToY, indexToX = ::indexToX)
    drawMALine(ma25, candles, ma25Color, priceToY = ::priceToY, indexToX = ::indexToX)
    drawMALine(ma99, candles, ma99Color, priceToY = ::priceToY, indexToX = ::indexToX)

    // ── 6. X-axis date labels ──
    val labelCount = min(5, candles.size)
    for (i in 0 until labelCount) {
        val idx = if (labelCount <= 1) 0 else candles.size * i / (labelCount - 1)
        val safeIdx = min(idx, candles.size - 1)
        val x = indexToX(safeIdx)
        val label = formatDate(candles[safeIdx].timestamp)
        val textResult = textMeasurer.measure(
            text = label,
            style = TextStyle(fontSize = 8.sp, color = textColor)
        )
        drawText(
            textResult,
            topLeft = Offset(x - textResult.size.width / 2f, h - bottomMargin + 2.dp.toPx())
        )
    }
}

private fun DrawScope.drawMALine(
    maPoints: List<MAPoint>,
    candles: List<CandleData>,
    color: Color,
    priceToY: (Float) -> Float,
    indexToX: (Int) -> Float
) {
    if (maPoints.size < 2) return

    val path = Path()
    var started = false

    // MA points correspond to candles starting from (period-1)
    val offset = candles.size - maPoints.size

    for (i in maPoints.indices) {
        val x = indexToX(i + offset)
        val y = priceToY(maPoints[i].value)
        if (!started) {
            path.moveTo(x, y)
            started = true
        } else {
            path.lineTo(x, y)
        }
    }

    drawPath(
        path = path,
        color = color,
        style = Stroke(width = 1.2.dp.toPx(), cap = StrokeCap.Round)
    )
}

private fun formatPrice(price: Float): String {
    val rounded = (price * 100).toLong() / 100.0
    return rounded.toString()
}

private fun formatDate(timestamp: Long): String {
    // Simple date formatting without external deps
    val totalDays = timestamp / 86400
    val year = 1970 + (totalDays / 365.25).toInt()
    val dayOfYear = (totalDays % 365.25).toInt()
    val months = intArrayOf(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
    var month = 0
    var remaining = dayOfYear
    while (month < 12 && remaining >= months[month]) {
        remaining -= months[month]
        month++
    }
    val monthNames = arrayOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
    val mName = if (month < 12) monthNames[month] else "Dec"
    val day = remaining + 1
    return "$mName $day"
}

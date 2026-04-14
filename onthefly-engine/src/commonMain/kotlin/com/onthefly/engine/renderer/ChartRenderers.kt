package com.onthefly.engine.renderer

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onthefly.engine.model.UIComponent
import kotlinx.coroutines.flow.first
import androidx.compose.runtime.snapshotFlow
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

    val chartHeight = c.propInt("height", 0)
    val fillHeight = c.propBool("fillHeight")
    val bgColor = c.propColor("background")
    val upColor = c.propColor("upColor") ?: Color(0xFF10B981)
    val downColor = c.propColor("downColor") ?: Color(0xFFEF4444)
    val ma7Color = c.propColor("ma7Color") ?: Color(0xFF00D4AA)
    val ma25Color = c.propColor("ma25Color") ?: Color(0xFFE8B84B)
    val ma99Color = c.propColor("ma99Color") ?: Color(0xFFB84BE8)
    val gridColor = c.propColor("gridColor") ?: Color(0xFF374151)
    val textColor = c.propColor("textColor") ?: Color(0xFF6B7280)
    val accentColor = c.propColor("upColor") ?: Color(0xFF10B981)
    val showGrid = c.propBool("showGrid", true)
    val showVolume = c.propBool("showVolume", true)
    val volumeRatio = c.propFloat("volumeHeightRatio", 0.2f)
    val candleWidthDp = c.propInt("candleWidth", 10)

    val candles = remember(c.props["candles"]) { parseCandles(c.props["candles"]) }
    val ma7 = remember(c.props["ma7"]) { parseMA(c.props["ma7"]) }
    val ma25 = remember(c.props["ma25"]) { parseMA(c.props["ma25"]) }
    val ma99 = remember(c.props["ma99"]) { parseMA(c.props["ma99"]) }

    val textMeasurer = rememberTextMeasurer()
    val density = androidx.compose.ui.platform.LocalDensity.current.density

    var outerMod = modifier.fillMaxWidth()
    outerMod = if (fillHeight) outerMod.fillMaxSize() else outerMod.height(if (chartHeight > 0) chartHeight.dp else 250.dp)
    if (bgColor != null) outerMod = outerMod.background(bgColor)

    if (candles.isEmpty()) {
        Box(modifier = outerMod)
        return
    }

    // Price range for Y axis
    var priceMin = Float.MAX_VALUE
    var priceMax = Float.MIN_VALUE
    for (cd in candles) {
        if (cd.low < priceMin) priceMin = cd.low
        if (cd.high > priceMax) priceMax = cd.high
    }
    val pricePad = (priceMax - priceMin) * 0.05f
    priceMin -= pricePad
    priceMax += pricePad

    // Scrollable chart width
    val rightMarginDp = 58
    val chartContentWidthDp = candles.size * candleWidthDp

    // Scroll state - scroll to end (latest candles on the right)
    val scrollState = rememberScrollState()
    LaunchedEffect(candles.size) {
        // Wait until layout measures content so maxValue > 0
        snapshotFlow { scrollState.maxValue }.first { it > 0 }
        scrollState.scrollTo(scrollState.maxValue)
    }

    // Calculate last visible candle based on scroll position
    val scrollOffset = scrollState.value
    val totalContentPx = chartContentWidthDp * density // approx
    val candleStepPx = if (candles.isNotEmpty()) totalContentPx / candles.size else 1f
    val lastVisibleIndex = min(
        candles.size - 1,
        ((scrollOffset + scrollState.viewportSize) / max(candleStepPx, 1f)).toInt()
    ).coerceIn(0, candles.size - 1)
    val visibleCandle = candles[lastVisibleIndex]
    val visiblePrice = visibleCandle.close
    val visibleIsUp = visibleCandle.close >= visibleCandle.open

    Box(modifier = outerMod) {
        Row(modifier = Modifier.fillMaxSize()) {
            // Scrollable chart area
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .horizontalScroll(scrollState)
            ) {
                Canvas(
                    modifier = Modifier
                        .width(chartContentWidthDp.dp)
                        .fillMaxHeight()
                ) {
                    drawChartContent(
                        candles = candles,
                        ma7 = ma7, ma25 = ma25, ma99 = ma99,
                        upColor = upColor, downColor = downColor,
                        ma7Color = ma7Color, ma25Color = ma25Color, ma99Color = ma99Color,
                        gridColor = gridColor, textColor = textColor,
                        showGrid = showGrid, showVolume = showVolume,
                        volumeRatio = volumeRatio,
                        priceMin = priceMin, priceMax = priceMax,
                        textMeasurer = textMeasurer
                    )
                }
            }

            // Fixed Y-axis + price highlight
            Canvas(
                modifier = Modifier
                    .width(rightMarginDp.dp)
                    .fillMaxHeight()
            ) {
                drawYAxis(
                    priceMin = priceMin, priceMax = priceMax,
                    lastPrice = visiblePrice, lastIsUp = visibleIsUp,
                    gridColor = gridColor, textColor = textColor,
                    accentColor = if (visibleIsUp) upColor else downColor,
                    showGrid = showGrid, showVolume = showVolume,
                    volumeRatio = volumeRatio, textMeasurer = textMeasurer
                )
            }
        }
    }
}

// ─── Chart Content (scrollable area) ───────────────────────

private fun DrawScope.drawChartContent(
    candles: List<CandleData>,
    ma7: List<MAPoint>, ma25: List<MAPoint>, ma99: List<MAPoint>,
    upColor: Color, downColor: Color,
    ma7Color: Color, ma25Color: Color, ma99Color: Color,
    gridColor: Color, textColor: Color,
    showGrid: Boolean, showVolume: Boolean,
    volumeRatio: Float, priceMin: Float, priceMax: Float,
    textMeasurer: TextMeasurer
) {
    val w = size.width
    val h = size.height
    val bottomMargin = 18.dp.toPx()
    val topMargin = 4.dp.toPx()
    val availableHeight = h - topMargin - bottomMargin
    val priceChartHeight = if (showVolume) availableHeight * (1f - volumeRatio) else availableHeight
    val volumeChartTop = topMargin + priceChartHeight
    val volumeChartHeight = if (showVolume) availableHeight * volumeRatio else 0f
    val priceRange = priceMax - priceMin

    var volumeMax = 0f
    for (cd in candles) { if (cd.volume > volumeMax) volumeMax = cd.volume }

    val candleStep = w / candles.size
    val candleBodyWidth = candleStep * 0.65f
    val wickWidth = 1.2.dp.toPx()

    fun priceToY(price: Float): Float =
        topMargin + priceChartHeight * (1f - (price - priceMin) / priceRange)

    fun indexToX(index: Int): Float =
        index * candleStep + candleStep / 2f

    // Grid
    if (showGrid) {
        val dashEffect = PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 4.dp.toPx()))
        for (i in 0..5) {
            val y = topMargin + priceChartHeight * i / 5
            drawLine(gridColor.copy(alpha = 0.2f), Offset(0f, y), Offset(w, y), 0.5.dp.toPx(), pathEffect = dashEffect)
        }
        val vLines = min(6, candles.size)
        for (i in 1 until vLines) {
            val idx = candles.size * i / vLines
            val x = indexToX(idx)
            drawLine(gridColor.copy(alpha = 0.12f), Offset(x, topMargin), Offset(x, topMargin + priceChartHeight), 0.5.dp.toPx(), pathEffect = dashEffect)
        }
    }

    // Volume bars
    if (showVolume && volumeMax > 0f) {
        for (i in candles.indices) {
            val cd = candles[i]
            val x = indexToX(i)
            val isUp = cd.close >= cd.open
            val barH = (cd.volume / volumeMax) * volumeChartHeight * 0.85f
            drawRect(
                color = if (isUp) upColor.copy(alpha = 0.7f) else downColor.copy(alpha = 0.7f),
                topLeft = Offset(x - candleBodyWidth / 2f, volumeChartTop + volumeChartHeight - barH),
                size = Size(candleBodyWidth, barH)
            )
        }
    }

    // Wicks
    for (i in candles.indices) {
        val cd = candles[i]
        val x = indexToX(i)
        val color = if (cd.close >= cd.open) upColor else downColor
        drawLine(color, Offset(x, priceToY(cd.high)), Offset(x, priceToY(cd.low)), wickWidth, cap = StrokeCap.Round)
    }

    // Bodies
    for (i in candles.indices) {
        val cd = candles[i]
        val x = indexToX(i)
        val color = if (cd.close >= cd.open) upColor else downColor
        val bodyTop = priceToY(max(cd.open, cd.close))
        val bodyBottom = priceToY(min(cd.open, cd.close))
        drawRect(color, Offset(x - candleBodyWidth / 2f, bodyTop), Size(candleBodyWidth, max(bodyBottom - bodyTop, 1.dp.toPx())))
    }

    // MA lines
    drawMALine(ma7, candles, ma7Color, ::priceToY, ::indexToX)
    drawMALine(ma25, candles, ma25Color, ::priceToY, ::indexToX)
    drawMALine(ma99, candles, ma99Color, ::priceToY, ::indexToX)

    // X-axis date labels
    val labelCount = min(5, candles.size)
    for (i in 0 until labelCount) {
        val idx = if (labelCount <= 1) 0 else candles.size * i / (labelCount - 1)
        val safeIdx = min(idx, candles.size - 1)
        val x = indexToX(safeIdx)
        val label = formatDate(candles[safeIdx].timestamp)
        val tr = textMeasurer.measure(label, TextStyle(fontSize = 8.sp, color = textColor))
        drawText(tr, topLeft = Offset(x - tr.size.width / 2f, h - bottomMargin + 2.dp.toPx()))
    }
}

// ─── Y-Axis (fixed right panel) ────────────────────────────

private fun DrawScope.drawYAxis(
    priceMin: Float, priceMax: Float,
    lastPrice: Float, lastIsUp: Boolean,
    gridColor: Color, textColor: Color, accentColor: Color,
    showGrid: Boolean, showVolume: Boolean,
    volumeRatio: Float, textMeasurer: TextMeasurer
) {
    val h = size.height
    val w = size.width
    val topMargin = 4.dp.toPx()
    val bottomMargin = 18.dp.toPx()
    val availableHeight = h - topMargin - bottomMargin
    val priceChartHeight = if (showVolume) availableHeight * (1f - volumeRatio) else availableHeight
    val priceRange = priceMax - priceMin

    fun priceToY(price: Float): Float =
        topMargin + priceChartHeight * (1f - (price - priceMin) / priceRange)

    // Price labels at grid lines
    for (i in 0..5) {
        val price = priceMax - (priceMax - priceMin) * i / 5
        val y = topMargin + priceChartHeight * i / 5
        val label = formatPrice(price)
        val tr = textMeasurer.measure(label, TextStyle(fontSize = 9.sp, color = textColor))
        drawText(tr, topLeft = Offset(4.dp.toPx(), y - tr.size.height / 2f))
    }

    // Price highlight box for last candle
    val lastY = priceToY(lastPrice)
    val boxH = 18.dp.toPx()
    val boxW = w - 2.dp.toPx()

    // Dashed line across
    drawLine(
        color = accentColor.copy(alpha = 0.6f),
        start = Offset(0f, lastY),
        end = Offset(0f, lastY),
        strokeWidth = 0.5.dp.toPx()
    )

    // Price box
    drawRect(
        color = accentColor,
        topLeft = Offset(1.dp.toPx(), lastY - boxH / 2f),
        size = Size(boxW, boxH)
    )

    // Price text in box
    val priceLabel = formatPrice(lastPrice)
    val priceTr = textMeasurer.measure(priceLabel, TextStyle(fontSize = 9.sp, color = Color.White))
    drawText(priceTr, topLeft = Offset((w - priceTr.size.width) / 2f, lastY - priceTr.size.height / 2f))
}

// ─── Helpers ───────────────────────────────────────────────

private fun DrawScope.drawMALine(
    maPoints: List<MAPoint>, candles: List<CandleData>, color: Color,
    priceToY: (Float) -> Float, indexToX: (Int) -> Float
) {
    if (maPoints.size < 2) return
    val path = Path()
    val offset = candles.size - maPoints.size
    for (i in maPoints.indices) {
        val x = indexToX(i + offset)
        val y = priceToY(maPoints[i].value)
        if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
    }
    drawPath(path, color, style = Stroke(width = 1.2.dp.toPx(), cap = StrokeCap.Round))
}

private fun formatPrice(price: Float): String {
    val rounded = (price * 100).toLong() / 100.0
    return rounded.toString()
}

private fun formatDate(timestamp: Long): String {
    val totalDays = timestamp / 86400
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
    return "$mName ${remaining + 1}"
}

// ═══════════════════════════════════════════════════════════
//  LineChart — Simple line chart with gradient fill
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderLineChart(
    c: UIComponent,
    modifier: Modifier
) {
    val visible = c.propBool("visible", true)
    if (!visible) return

    val chartHeight = c.propInt("height", 120)
    val bgColor = c.propColor("background") ?: Color(0xFF1F2937)
    val lineColor = c.propColor("lineColor") ?: Color(0xFF00D4AA)
    val fillAlpha = c.propFloat("fillAlpha", 0.3f)
    val lineWidth = c.propFloat("lineWidth", 2f)
    val borderRadius = c.propInt("borderRadius", 14)

    @Suppress("UNCHECKED_CAST")
    val rawPoints = c.props["points"] as? List<Number> ?: emptyList()
    val points = remember(rawPoints) { rawPoints.map { it.toFloat() } }

    val shape = RoundedCornerShape(borderRadius.dp)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(chartHeight.dp)
            .clip(shape)
            .background(bgColor, shape)
    ) {
        if (points.size < 2) return@Box

        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val padding = 8.dp.toPx()

            val minVal = points.min()
            val maxVal = points.max()
            val range = if (maxVal > minVal) maxVal - minVal else 1f

            fun xAt(i: Int) = padding + (w - padding * 2) * i / (points.size - 1)
            fun yAt(v: Float) = padding + (h - padding * 2) * (1f - (v - minVal) / range)

            // Gradient fill path
            val fillPath = Path().apply {
                moveTo(xAt(0), yAt(points[0]))
                for (i in 1 until points.size) lineTo(xAt(i), yAt(points[i]))
                lineTo(xAt(points.size - 1), h)
                lineTo(xAt(0), h)
                close()
            }

            drawPath(
                path = fillPath,
                brush = androidx.compose.ui.graphics.Brush.verticalGradient(
                    colors = listOf(lineColor.copy(alpha = fillAlpha), lineColor.copy(alpha = 0.02f)),
                    startY = 0f,
                    endY = h
                )
            )

            // Line
            val linePath = Path().apply {
                moveTo(xAt(0), yAt(points[0]))
                for (i in 1 until points.size) lineTo(xAt(i), yAt(points[i]))
            }

            drawPath(
                path = linePath,
                color = lineColor,
                style = Stroke(width = lineWidth.dp.toPx(), cap = StrokeCap.Round)
            )
        }
    }
}

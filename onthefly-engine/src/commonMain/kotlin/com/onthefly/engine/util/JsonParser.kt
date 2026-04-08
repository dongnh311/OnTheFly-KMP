package com.onthefly.engine.util

/**
 * Minimal cross-platform JSON parser.
 * Handles the subset of JSON used by OnTheFly engine communication.
 */
object JsonParser {

    fun parseObject(json: String): Map<String, Any?> {
        val trimmed = json.trim()
        if (trimmed.isEmpty() || trimmed == "null") return emptyMap()
        return parseValue(trimmed, 0).first as? Map<String, Any?> ?: emptyMap()
    }

    fun parseArray(json: String): List<Any?> {
        val trimmed = json.trim()
        if (trimmed.isEmpty() || trimmed == "[]") return emptyList()
        return parseValue(trimmed, 0).first as? List<Any?> ?: emptyList()
    }

    fun toJsonString(map: Map<String, Any?>): String {
        return buildString { writeValue(map) }
    }

    private fun StringBuilder.writeValue(value: Any?) {
        when (value) {
            null -> append("null")
            is String -> {
                append('"')
                for (c in value) {
                    when (c) {
                        '"' -> append("\\\"")
                        '\\' -> append("\\\\")
                        '\n' -> append("\\n")
                        '\r' -> append("\\r")
                        '\t' -> append("\\t")
                        else -> append(c)
                    }
                }
                append('"')
            }
            is Number -> append(value)
            is Boolean -> append(value)
            is Map<*, *> -> {
                append('{')
                var first = true
                for ((k, v) in value) {
                    if (!first) append(',')
                    first = false
                    writeValue(k.toString())
                    append(':')
                    writeValue(v)
                }
                append('}')
            }
            is List<*> -> {
                append('[')
                var first = true
                for (item in value) {
                    if (!first) append(',')
                    first = false
                    writeValue(item)
                }
                append(']')
            }
            else -> writeValue(value.toString())
        }
    }

    // Returns (parsedValue, nextIndex)
    private fun parseValue(json: String, start: Int): Pair<Any?, Int> {
        var i = skipWhitespace(json, start)
        if (i >= json.length) return Pair(null, i)

        return when (json[i]) {
            '{' -> parseObjectInternal(json, i)
            '[' -> parseArrayInternal(json, i)
            '"' -> parseString(json, i)
            't', 'f' -> parseBoolean(json, i)
            'n' -> parseNull(json, i)
            else -> parseNumber(json, i)
        }
    }

    private fun parseObjectInternal(json: String, start: Int): Pair<Map<String, Any?>, Int> {
        val map = mutableMapOf<String, Any?>()
        var i = start + 1 // skip '{'
        i = skipWhitespace(json, i)

        if (i < json.length && json[i] == '}') return Pair(map, i + 1)

        while (i < json.length) {
            i = skipWhitespace(json, i)
            if (i >= json.length || json[i] == '}') break

            val (key, afterKey) = parseString(json, i)
            i = skipWhitespace(json, afterKey)
            if (i < json.length && json[i] == ':') i++
            val (value, afterValue) = parseValue(json, i)
            map[key as String] = value
            i = skipWhitespace(json, afterValue)
            if (i < json.length && json[i] == ',') i++
        }

        return Pair(map, if (i < json.length) i + 1 else i)
    }

    private fun parseArrayInternal(json: String, start: Int): Pair<List<Any?>, Int> {
        val list = mutableListOf<Any?>()
        var i = start + 1 // skip '['
        i = skipWhitespace(json, i)

        if (i < json.length && json[i] == ']') return Pair(list, i + 1)

        while (i < json.length) {
            i = skipWhitespace(json, i)
            if (i >= json.length || json[i] == ']') break

            val (value, afterValue) = parseValue(json, i)
            list.add(value)
            i = skipWhitespace(json, afterValue)
            if (i < json.length && json[i] == ',') i++
        }

        return Pair(list, if (i < json.length) i + 1 else i)
    }

    private fun parseString(json: String, start: Int): Pair<String, Int> {
        val sb = StringBuilder()
        var i = start + 1 // skip opening quote
        while (i < json.length) {
            val c = json[i]
            if (c == '\\' && i + 1 < json.length) {
                when (json[i + 1]) {
                    '"' -> { sb.append('"'); i += 2 }
                    '\\' -> { sb.append('\\'); i += 2 }
                    '/' -> { sb.append('/'); i += 2 }
                    'n' -> { sb.append('\n'); i += 2 }
                    'r' -> { sb.append('\r'); i += 2 }
                    't' -> { sb.append('\t'); i += 2 }
                    'u' -> {
                        if (i + 5 < json.length) {
                            val hex = json.substring(i + 2, i + 6)
                            sb.append(hex.toInt(16).toChar())
                            i += 6
                        } else {
                            sb.append(c); i++
                        }
                    }
                    else -> { sb.append(json[i + 1]); i += 2 }
                }
            } else if (c == '"') {
                return Pair(sb.toString(), i + 1)
            } else {
                sb.append(c); i++
            }
        }
        return Pair(sb.toString(), i)
    }

    private fun parseNumber(json: String, start: Int): Pair<Number, Int> {
        var i = start
        val sb = StringBuilder()
        var isFloat = false
        if (i < json.length && json[i] == '-') { sb.append('-'); i++ }
        while (i < json.length && (json[i].isDigit() || json[i] == '.' || json[i] == 'e' || json[i] == 'E' || json[i] == '+' || json[i] == '-')) {
            if (json[i] == '.' || json[i] == 'e' || json[i] == 'E') isFloat = true
            sb.append(json[i]); i++
        }
        val numStr = sb.toString()
        val number: Number = if (isFloat) numStr.toDouble() else {
            val long = numStr.toLong()
            if (long in Int.MIN_VALUE..Int.MAX_VALUE) long.toInt() else long
        }
        return Pair(number, i)
    }

    private fun parseBoolean(json: String, start: Int): Pair<Boolean, Int> {
        return if (json.startsWith("true", start)) Pair(true, start + 4)
        else Pair(false, start + 5)
    }

    private fun parseNull(json: String, start: Int): Pair<Any?, Int> {
        return Pair(null, start + 4)
    }

    private fun skipWhitespace(json: String, start: Int): Int {
        var i = start
        while (i < json.length && json[i].isWhitespace()) i++
        return i
    }
}

fun String.escapeJson(): String = this
    .replace("\\", "\\\\")
    .replace("\"", "\\\"")
    .replace("\n", "\\n")
    .replace("\r", "\\r")
    .replace("\t", "\\t")

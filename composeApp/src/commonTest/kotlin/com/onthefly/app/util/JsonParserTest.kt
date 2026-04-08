package com.onthefly.app.util

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class JsonParserTest {

    @Test
    fun parseObject_empty() {
        val result = JsonParser.parseObject("{}")
        assertTrue(result.isEmpty())
    }

    @Test
    fun parseObject_nullString() {
        val result = JsonParser.parseObject("null")
        assertTrue(result.isEmpty())
    }

    @Test
    fun parseObject_emptyString() {
        val result = JsonParser.parseObject("")
        assertTrue(result.isEmpty())
    }

    @Test
    fun parseObject_simpleStrings() {
        val result = JsonParser.parseObject("""{"name":"test","key":"value"}""")
        assertEquals("test", result["name"])
        assertEquals("value", result["key"])
    }

    @Test
    fun parseObject_numbers() {
        val result = JsonParser.parseObject("""{"int":42,"float":3.14}""")
        assertEquals(42.0, (result["int"] as Number).toDouble())
        assertEquals(3.14, (result["float"] as Number).toDouble())
    }

    @Test
    fun parseObject_booleans() {
        val result = JsonParser.parseObject("""{"a":true,"b":false}""")
        assertEquals(true, result["a"])
        assertEquals(false, result["b"])
    }

    @Test
    fun parseObject_nullValue() {
        val result = JsonParser.parseObject("""{"key":null}""")
        assertNull(result["key"])
    }

    @Test
    fun parseObject_nested() {
        val result = JsonParser.parseObject("""{"outer":{"inner":"value"}}""")
        val outer = result["outer"] as Map<*, *>
        assertEquals("value", outer["inner"])
    }

    @Test
    fun parseObject_withArray() {
        val result = JsonParser.parseObject("""{"items":[1,2,3]}""")
        val items = result["items"] as List<*>
        assertEquals(3, items.size)
    }

    @Test
    fun parseArray_basic() {
        val result = JsonParser.parseArray("""["a","b","c"]""")
        assertEquals(3, result.size)
        assertEquals("a", result[0])
        assertEquals("c", result[2])
    }

    @Test
    fun parseArray_empty() {
        val result = JsonParser.parseArray("[]")
        assertTrue(result.isEmpty())
    }

    @Test
    fun toJsonString_simpleMap() {
        val map = mapOf<String, Any?>("name" to "test", "count" to 42)
        val json = JsonParser.toJsonString(map)
        assertTrue(json.contains("\"name\":\"test\""))
        assertTrue(json.contains("\"count\":42"))
    }

    @Test
    fun toJsonString_nullValues() {
        val map = mapOf<String, Any?>("key" to null)
        val json = JsonParser.toJsonString(map)
        assertTrue(json.contains("\"key\":null"))
    }

    @Test
    fun toJsonString_escapesStrings() {
        val map = mapOf<String, Any?>("text" to "hello \"world\"\nnewline")
        val json = JsonParser.toJsonString(map)
        assertTrue(json.contains("\\\"world\\\""))
        assertTrue(json.contains("\\n"))
    }

    @Test
    fun toJsonString_booleans() {
        val map = mapOf<String, Any?>("flag" to true, "other" to false)
        val json = JsonParser.toJsonString(map)
        assertTrue(json.contains("\"flag\":true"))
        assertTrue(json.contains("\"other\":false"))
    }

    @Test
    fun roundtrip_simple() {
        val original = mapOf<String, Any?>("name" to "test", "active" to true)
        val json = JsonParser.toJsonString(original)
        val parsed = JsonParser.parseObject(json)
        assertEquals("test", parsed["name"])
        assertEquals(true, parsed["active"])
    }
}

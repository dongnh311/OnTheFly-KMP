package com.onthefly.engine.core

import kotlinx.cinterop.CPointer
import kotlinx.cinterop.COpaque
import kotlinx.cinterop.ByteVar
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.NativePtr
import kotlinx.cinterop.interpretCPointer
import kotlinx.cinterop.toKString
import platform.posix.free
import quickjs.*

@OptIn(ExperimentalForeignApi::class)
actual class QuickJSBridge actual constructor() {

    actual fun createRuntime(): Long {
        val rt = otf_create_runtime() ?: return 0L
        return rt.rawValue.toLong()
    }

    actual fun createContext(runtimePtr: Long): Long {
        val rt = longToPtr(runtimePtr) ?: return 0L
        val ctx = otf_create_context(rt) ?: return 0L
        return ctx.rawValue.toLong()
    }

    actual fun eval(contextPtr: Long, script: String, fileName: String): String {
        val ctx = longToPtr(contextPtr) ?: return "Error: null context"
        val result: CPointer<ByteVar> = otf_eval(ctx, script, fileName) ?: return "Error: null result"
        val str = result.toKString()
        free(result)
        return str
    }

    actual fun registerModule(contextPtr: Long, name: String, source: String) {
        val ctx = longToPtr(contextPtr) ?: return
        otf_register_module(ctx, name, source)
    }

    actual fun evalModule(contextPtr: Long, script: String, fileName: String): String {
        val ctx = longToPtr(contextPtr) ?: return "Error: null context"
        val result: CPointer<ByteVar> = otf_eval_module(ctx, script, fileName) ?: return "Error: null result"
        val str = result.toKString()
        free(result)
        return str
    }

    actual fun getUI(contextPtr: Long): String = callAndFree(contextPtr) { otf_get_ui(it) } ?: ""
    actual fun getStyles(contextPtr: Long): String = callAndFree(contextPtr) { otf_get_styles(it) } ?: ""
    actual fun getPendingUpdates(contextPtr: Long): String = callAndFree(contextPtr) { otf_get_pending_updates(it) } ?: "[]"
    actual fun getPendingActions(contextPtr: Long): String = callAndFree(contextPtr) { otf_get_pending_actions(it) } ?: "[]"
    actual fun getPendingLogs(contextPtr: Long): String = callAndFree(contextPtr) { otf_get_pending_logs(it) } ?: "[]"

    actual fun destroyContext(contextPtr: Long) {
        longToPtr(contextPtr)?.let { otf_destroy_context(it) }
    }

    actual fun destroyRuntime(runtimePtr: Long) {
        longToPtr(runtimePtr)?.let { otf_destroy_runtime(it) }
    }

    private fun longToPtr(value: Long): CPointer<COpaque>? {
        if (value == 0L) return null
        return interpretCPointer(NativePtr.NULL + value)
    }

    private inline fun callAndFree(
        contextPtr: Long,
        call: (CPointer<COpaque>) -> CPointer<ByteVar>?
    ): String? {
        val ctx = longToPtr(contextPtr) ?: return null
        val result: CPointer<ByteVar> = call(ctx) ?: return null
        val str = result.toKString()
        free(result)
        return str
    }
}

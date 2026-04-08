package com.onthefly.engine.core

actual class QuickJSBridge actual constructor() {

    companion object {
        init {
            System.loadLibrary("onthefly-engine")
        }
    }

    actual fun createRuntime(): Long = nativeCreateRuntime()
    actual fun createContext(runtimePtr: Long): Long = nativeCreateContext(runtimePtr)
    actual fun eval(contextPtr: Long, script: String, fileName: String): String = nativeEval(contextPtr, script, fileName)
    actual fun getUI(contextPtr: Long): String = nativeGetUI(contextPtr)
    actual fun getStyles(contextPtr: Long): String = nativeGetStyles(contextPtr)
    actual fun getPendingUpdates(contextPtr: Long): String = nativeGetPendingUpdates(contextPtr)
    actual fun getPendingActions(contextPtr: Long): String = nativeGetPendingActions(contextPtr)
    actual fun getPendingLogs(contextPtr: Long): String = nativeGetPendingLogs(contextPtr)
    actual fun destroyContext(contextPtr: Long) = nativeDestroyContext(contextPtr)
    actual fun destroyRuntime(runtimePtr: Long) = nativeDestroyRuntime(runtimePtr)

    private external fun nativeCreateRuntime(): Long
    private external fun nativeCreateContext(runtimePtr: Long): Long
    private external fun nativeEval(contextPtr: Long, script: String, fileName: String): String
    private external fun nativeGetUI(contextPtr: Long): String
    private external fun nativeGetStyles(contextPtr: Long): String
    private external fun nativeGetPendingUpdates(contextPtr: Long): String
    private external fun nativeGetPendingActions(contextPtr: Long): String
    private external fun nativeGetPendingLogs(contextPtr: Long): String
    private external fun nativeDestroyContext(contextPtr: Long)
    private external fun nativeDestroyRuntime(runtimePtr: Long)
}

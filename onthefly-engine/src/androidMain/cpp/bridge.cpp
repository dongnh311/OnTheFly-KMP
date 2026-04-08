#include <jni.h>
#include <string>
#include <vector>
#include <android/log.h>
#include "quickjs.h"

#define LOG_TAG "OnTheFly.JS"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

// State
static std::string g_ui_json;
static std::string g_styles_json;
static std::vector<std::string> g_pending_updates;
static std::vector<std::string> g_native_actions;
static std::vector<std::string> g_pending_logs;

static std::string js_stringify(JSContext *ctx, JSValueConst val) {
    JSValue global = JS_GetGlobalObject(ctx);
    JSValue json_obj = JS_GetPropertyStr(ctx, global, "JSON");
    JSValue stringify = JS_GetPropertyStr(ctx, json_obj, "stringify");
    JSValue result = JS_Call(ctx, stringify, json_obj, 1, &val);

    std::string out;
    const char *str = JS_ToCString(ctx, result);
    if (str) { out = str; JS_FreeCString(ctx, str); }

    JS_FreeValue(ctx, result);
    JS_FreeValue(ctx, stringify);
    JS_FreeValue(ctx, json_obj);
    JS_FreeValue(ctx, global);
    return out;
}

static std::string js_concat_args(JSContext *ctx, int argc, JSValueConst *argv);
static void push_log(const char *level, const std::string &msg);

static JSValue js_console_log(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
    push_log("d", js_concat_args(ctx, argc, argv));
    return JS_UNDEFINED;
}

static JSValue js_onthefly_setUI(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
    if (argc < 1) return JS_UNDEFINED;
    g_ui_json = js_stringify(ctx, argv[0]);
    return JS_UNDEFINED;
}

static JSValue js_onthefly_registerStyles(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
    if (argc < 1) return JS_UNDEFINED;
    g_styles_json = js_stringify(ctx, argv[0]);
    return JS_UNDEFINED;
}

static JSValue js_onthefly_update(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
    if (argc < 2) return JS_UNDEFINED;
    JSValue update = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, update, "id", JS_DupValue(ctx, argv[0]));
    JS_SetPropertyStr(ctx, update, "props", JS_DupValue(ctx, argv[1]));
    g_pending_updates.push_back(js_stringify(ctx, update));
    JS_FreeValue(ctx, update);
    return JS_UNDEFINED;
}

static JSValue js_onthefly_sendToNative(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
    if (argc < 1) return JS_UNDEFINED;
    JSValue action = JS_NewObject(ctx);
    const char *actionName = JS_ToCString(ctx, argv[0]);
    if (actionName) {
        JS_SetPropertyStr(ctx, action, "action", JS_NewString(ctx, actionName));
        JS_FreeCString(ctx, actionName);
    }
    if (argc >= 2) JS_SetPropertyStr(ctx, action, "data", JS_DupValue(ctx, argv[1]));
    g_native_actions.push_back(js_stringify(ctx, action));
    JS_FreeValue(ctx, action);
    return JS_UNDEFINED;
}

static std::string js_concat_args(JSContext *ctx, int argc, JSValueConst *argv) {
    std::string msg;
    for (int i = 0; i < argc; i++) {
        if (i > 0) msg += " ";
        const char *str = JS_ToCString(ctx, argv[i]);
        if (str) { msg += str; JS_FreeCString(ctx, str); }
    }
    return msg;
}

static void push_log(const char *level, const std::string &msg) {
    std::string escaped;
    for (char c : msg) {
        if (c == '"') escaped += "\\\"";
        else if (c == '\\') escaped += "\\\\";
        else if (c == '\n') escaped += "\\n";
        else escaped += c;
    }
    g_pending_logs.push_back(
        std::string("{\"level\":\"") + level + "\",\"message\":\"" + escaped + "\"}"
    );
}

static JSValue js_onthefly_log(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
    push_log("i", js_concat_args(ctx, argc, argv)); return JS_UNDEFINED;
}
static JSValue js_log_v(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) { push_log("v", js_concat_args(ctx, argc, argv)); return JS_UNDEFINED; }
static JSValue js_log_d(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) { push_log("d", js_concat_args(ctx, argc, argv)); return JS_UNDEFINED; }
static JSValue js_log_i(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) { push_log("i", js_concat_args(ctx, argc, argv)); return JS_UNDEFINED; }
static JSValue js_log_w(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) { push_log("w", js_concat_args(ctx, argc, argv)); return JS_UNDEFINED; }
static JSValue js_log_e(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) { push_log("e", js_concat_args(ctx, argc, argv)); return JS_UNDEFINED; }

static void setup_globals(JSContext *ctx) {
    JSValue global = JS_GetGlobalObject(ctx);

    JSValue console = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, console, "log", JS_NewCFunction(ctx, js_console_log, "log", 1));
    JS_SetPropertyStr(ctx, global, "console", console);

    JSValue otf = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, otf, "setUI", JS_NewCFunction(ctx, js_onthefly_setUI, "setUI", 1));
    JS_SetPropertyStr(ctx, otf, "update", JS_NewCFunction(ctx, js_onthefly_update, "update", 2));
    JS_SetPropertyStr(ctx, otf, "registerStyles", JS_NewCFunction(ctx, js_onthefly_registerStyles, "registerStyles", 1));
    JS_SetPropertyStr(ctx, otf, "sendToNative", JS_NewCFunction(ctx, js_onthefly_sendToNative, "sendToNative", 2));

    JSValue logFn = JS_NewCFunction(ctx, js_onthefly_log, "log", 1);
    JS_SetPropertyStr(ctx, logFn, "v", JS_NewCFunction(ctx, js_log_v, "v", 1));
    JS_SetPropertyStr(ctx, logFn, "d", JS_NewCFunction(ctx, js_log_d, "d", 1));
    JS_SetPropertyStr(ctx, logFn, "i", JS_NewCFunction(ctx, js_log_i, "i", 1));
    JS_SetPropertyStr(ctx, logFn, "w", JS_NewCFunction(ctx, js_log_w, "w", 1));
    JS_SetPropertyStr(ctx, logFn, "e", JS_NewCFunction(ctx, js_log_e, "e", 1));
    JS_SetPropertyStr(ctx, otf, "log", logFn);

    JS_SetPropertyStr(ctx, global, "OnTheFly", otf);
    JS_FreeValue(ctx, global);
}

extern "C" {

JNIEXPORT jlong JNICALL
Java_com_onthefly_app_engine_QuickJSBridge_nativeCreateRuntime(JNIEnv *env, jobject thiz) {
    JSRuntime *rt = JS_NewRuntime();
    if (!rt) { LOGE("Failed to create JS runtime"); return 0; }
    JS_SetMemoryLimit(rt, 64 * 1024 * 1024);
    return reinterpret_cast<jlong>(rt);
}

JNIEXPORT jlong JNICALL
Java_com_onthefly_app_engine_QuickJSBridge_nativeCreateContext(JNIEnv *env, jobject thiz, jlong runtimePtr) {
    auto *rt = reinterpret_cast<JSRuntime *>(runtimePtr);
    if (!rt) return 0;
    JSContext *ctx = JS_NewContext(rt);
    if (!ctx) { LOGE("Failed to create JS context"); return 0; }
    setup_globals(ctx);
    return reinterpret_cast<jlong>(ctx);
}

JNIEXPORT jstring JNICALL
Java_com_onthefly_app_engine_QuickJSBridge_nativeEval(JNIEnv *env, jobject thiz, jlong contextPtr, jstring script, jstring fileName) {
    auto *ctx = reinterpret_cast<JSContext *>(contextPtr);
    if (!ctx) return env->NewStringUTF("Error: context is null");

    const char *scriptStr = env->GetStringUTFChars(script, nullptr);
    const char *fileStr = env->GetStringUTFChars(fileName, nullptr);
    JSValue result = JS_Eval(ctx, scriptStr, strlen(scriptStr), fileStr, JS_EVAL_TYPE_GLOBAL);
    env->ReleaseStringUTFChars(script, scriptStr);
    env->ReleaseStringUTFChars(fileName, fileStr);

    std::string resultStr;
    if (JS_IsException(result)) {
        JSValue exception = JS_GetException(ctx);
        const char *errStr = JS_ToCString(ctx, exception);
        resultStr = errStr ? std::string("Error: ") + errStr : "Error: unknown exception";
        if (errStr) JS_FreeCString(ctx, errStr);
        JS_FreeValue(ctx, exception);
    } else {
        const char *str = JS_ToCString(ctx, result);
        resultStr = str ? str : "undefined";
        if (str) JS_FreeCString(ctx, str);
    }
    JS_FreeValue(ctx, result);
    return env->NewStringUTF(resultStr.c_str());
}

JNIEXPORT jstring JNICALL Java_com_onthefly_app_engine_QuickJSBridge_nativeGetUI(JNIEnv *env, jobject thiz, jlong) { return env->NewStringUTF(g_ui_json.c_str()); }
JNIEXPORT jstring JNICALL Java_com_onthefly_app_engine_QuickJSBridge_nativeGetStyles(JNIEnv *env, jobject thiz, jlong) { return env->NewStringUTF(g_styles_json.c_str()); }

static jstring drain_queue(JNIEnv *env, std::vector<std::string> &queue) {
    std::string json = "[";
    for (size_t i = 0; i < queue.size(); i++) { if (i > 0) json += ","; json += queue[i]; }
    json += "]";
    queue.clear();
    return env->NewStringUTF(json.c_str());
}

JNIEXPORT jstring JNICALL Java_com_onthefly_app_engine_QuickJSBridge_nativeGetPendingUpdates(JNIEnv *env, jobject thiz, jlong) { return drain_queue(env, g_pending_updates); }
JNIEXPORT jstring JNICALL Java_com_onthefly_app_engine_QuickJSBridge_nativeGetPendingActions(JNIEnv *env, jobject thiz, jlong) { return drain_queue(env, g_native_actions); }
JNIEXPORT jstring JNICALL Java_com_onthefly_app_engine_QuickJSBridge_nativeGetPendingLogs(JNIEnv *env, jobject thiz, jlong) { return drain_queue(env, g_pending_logs); }

JNIEXPORT void JNICALL Java_com_onthefly_app_engine_QuickJSBridge_nativeDestroyContext(JNIEnv *env, jobject thiz, jlong contextPtr) {
    auto *ctx = reinterpret_cast<JSContext *>(contextPtr); if (ctx) JS_FreeContext(ctx);
}
JNIEXPORT void JNICALL Java_com_onthefly_app_engine_QuickJSBridge_nativeDestroyRuntime(JNIEnv *env, jobject thiz, jlong runtimePtr) {
    auto *rt = reinterpret_cast<JSRuntime *>(runtimePtr); if (rt) JS_FreeRuntime(rt);
}

} // extern "C"

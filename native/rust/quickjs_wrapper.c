/*
 * Wrappers for QuickJS static inline functions.
 * Rust FFI cannot link to static inline functions directly,
 * so we provide non-inline wrappers here.
 */
#include "../quickjs/quickjs.h"

int otf_js_is_exception(JSValue v) {
    return JS_IsException(v);
}

void otf_js_free_value(JSContext *ctx, JSValue v) {
    JS_FreeValue(ctx, v);
}

JSValue otf_js_dup_value(JSContext *ctx, JSValue v) {
    return JS_DupValue(ctx, v);
}

const char* otf_js_to_cstring(JSContext *ctx, JSValue val) {
    return JS_ToCString(ctx, val);
}

JSValue otf_js_new_string(JSContext *ctx, const char *str) {
    return JS_NewString(ctx, str);
}

JSValue otf_js_new_cfunction(JSContext *ctx, JSCFunction *func,
                             const char *name, int length) {
    return JS_NewCFunction(ctx, func, name, length);
}

JSValue otf_js_undefined(void) {
    return JS_UNDEFINED;
}

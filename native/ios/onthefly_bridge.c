#include "onthefly_bridge.h"
#include "../quickjs/quickjs.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* Simple dynamic string buffer */
typedef struct {
    char *data;
    size_t len;
    size_t cap;
} StrBuf;

static void sb_init(StrBuf *sb) { sb->data = NULL; sb->len = 0; sb->cap = 0; }
static void sb_ensure(StrBuf *sb, size_t extra) {
    if (sb->len + extra + 1 > sb->cap) {
        sb->cap = (sb->len + extra + 1) * 2;
        sb->data = realloc(sb->data, sb->cap);
    }
}
static void sb_append(StrBuf *sb, const char *s) {
    size_t n = strlen(s);
    sb_ensure(sb, n);
    memcpy(sb->data + sb->len, s, n);
    sb->len += n;
    sb->data[sb->len] = '\0';
}
static void sb_append_char(StrBuf *sb, char c) {
    sb_ensure(sb, 1);
    sb->data[sb->len++] = c;
    sb->data[sb->len] = '\0';
}
static char* sb_detach(StrBuf *sb) {
    if (!sb->data) { char *e = malloc(1); e[0] = '\0'; return e; }
    char *r = sb->data; sb->data = NULL; sb->len = 0; sb->cap = 0; return r;
}
static void sb_free(StrBuf *sb) { free(sb->data); sb->data = NULL; sb->len = 0; sb->cap = 0; }

/* Queues */
#define MAX_QUEUE 1024
static struct { char *items[MAX_QUEUE]; int count; } g_updates = {.count=0};
static struct { char *items[MAX_QUEUE]; int count; } g_actions = {.count=0};
static struct { char *items[MAX_QUEUE]; int count; } g_logs = {.count=0};
static char *g_ui_json = NULL;
static char *g_styles_json = NULL;

static void queue_push(void *q_ptr, const char *item) {
    struct { char *items[MAX_QUEUE]; int count; } *q = q_ptr;
    if (q->count < MAX_QUEUE) q->items[q->count++] = strdup(item);
}

static char* queue_drain(void *q_ptr) {
    struct { char *items[MAX_QUEUE]; int count; } *q = q_ptr;
    StrBuf sb; sb_init(&sb);
    sb_append(&sb, "[");
    for (int i = 0; i < q->count; i++) {
        if (i > 0) sb_append(&sb, ",");
        sb_append(&sb, q->items[i]);
        free(q->items[i]);
    }
    sb_append(&sb, "]");
    q->count = 0;
    return sb_detach(&sb);
}

/* JS helper: stringify */
static char* js_stringify(JSContext *ctx, JSValueConst val) {
    JSValue global = JS_GetGlobalObject(ctx);
    JSValue json = JS_GetPropertyStr(ctx, global, "JSON");
    JSValue fn = JS_GetPropertyStr(ctx, json, "stringify");
    JSValue res = JS_Call(ctx, fn, json, 1, &val);
    const char *s = JS_ToCString(ctx, res);
    char *out = s ? strdup(s) : strdup("");
    if (s) JS_FreeCString(ctx, s);
    JS_FreeValue(ctx, res); JS_FreeValue(ctx, fn);
    JS_FreeValue(ctx, json); JS_FreeValue(ctx, global);
    return out;
}

static char* js_concat_args(JSContext *ctx, int argc, JSValueConst *argv) {
    StrBuf sb; sb_init(&sb);
    for (int i = 0; i < argc; i++) {
        if (i > 0) sb_append(&sb, " ");
        const char *s = JS_ToCString(ctx, argv[i]);
        if (s) { sb_append(&sb, s); JS_FreeCString(ctx, s); }
    }
    return sb_detach(&sb);
}

static void push_log(const char *level, const char *msg) {
    StrBuf sb; sb_init(&sb);
    sb_append(&sb, "{\"level\":\""); sb_append(&sb, level);
    sb_append(&sb, "\",\"message\":\"");
    for (const char *p = msg; *p; p++) {
        if (*p == '"') sb_append(&sb, "\\\"");
        else if (*p == '\\') sb_append(&sb, "\\\\");
        else if (*p == '\n') sb_append(&sb, "\\n");
        else sb_append_char(&sb, *p);
    }
    sb_append(&sb, "\"}");
    queue_push(&g_logs, sb.data);
    sb_free(&sb);
}

/* JS callbacks */
static JSValue js_console_log(JSContext *ctx, JSValueConst t, int argc, JSValueConst *argv) {
    char *m = js_concat_args(ctx, argc, argv); push_log("d", m); free(m); return JS_UNDEFINED;
}
static JSValue js_setUI(JSContext *ctx, JSValueConst t, int argc, JSValueConst *argv) {
    if (argc >= 1) { free(g_ui_json); g_ui_json = js_stringify(ctx, argv[0]); } return JS_UNDEFINED;
}
static JSValue js_registerStyles(JSContext *ctx, JSValueConst t, int argc, JSValueConst *argv) {
    if (argc >= 1) { free(g_styles_json); g_styles_json = js_stringify(ctx, argv[0]); } return JS_UNDEFINED;
}
static JSValue js_update(JSContext *ctx, JSValueConst t, int argc, JSValueConst *argv) {
    if (argc < 2) return JS_UNDEFINED;
    JSValue u = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, u, "id", JS_DupValue(ctx, argv[0]));
    JS_SetPropertyStr(ctx, u, "props", JS_DupValue(ctx, argv[1]));
    char *s = js_stringify(ctx, u); queue_push(&g_updates, s); free(s);
    JS_FreeValue(ctx, u); return JS_UNDEFINED;
}
static JSValue js_sendToNative(JSContext *ctx, JSValueConst t, int argc, JSValueConst *argv) {
    if (argc < 1) return JS_UNDEFINED;
    JSValue a = JS_NewObject(ctx);
    const char *n = JS_ToCString(ctx, argv[0]);
    if (n) { JS_SetPropertyStr(ctx, a, "action", JS_NewString(ctx, n)); JS_FreeCString(ctx, n); }
    if (argc >= 2) JS_SetPropertyStr(ctx, a, "data", JS_DupValue(ctx, argv[1]));
    char *s = js_stringify(ctx, a); queue_push(&g_actions, s); free(s);
    JS_FreeValue(ctx, a); return JS_UNDEFINED;
}
static JSValue js_log_fn(JSContext *ctx, JSValueConst t, int argc, JSValueConst *argv) { char *m = js_concat_args(ctx, argc, argv); push_log("i", m); free(m); return JS_UNDEFINED; }
static JSValue js_log_v(JSContext *ctx, JSValueConst t, int argc, JSValueConst *argv) { char *m = js_concat_args(ctx, argc, argv); push_log("v", m); free(m); return JS_UNDEFINED; }
static JSValue js_log_d(JSContext *ctx, JSValueConst t, int argc, JSValueConst *argv) { char *m = js_concat_args(ctx, argc, argv); push_log("d", m); free(m); return JS_UNDEFINED; }
static JSValue js_log_i(JSContext *ctx, JSValueConst t, int argc, JSValueConst *argv) { char *m = js_concat_args(ctx, argc, argv); push_log("i", m); free(m); return JS_UNDEFINED; }
static JSValue js_log_w(JSContext *ctx, JSValueConst t, int argc, JSValueConst *argv) { char *m = js_concat_args(ctx, argc, argv); push_log("w", m); free(m); return JS_UNDEFINED; }
static JSValue js_log_e(JSContext *ctx, JSValueConst t, int argc, JSValueConst *argv) { char *m = js_concat_args(ctx, argc, argv); push_log("e", m); free(m); return JS_UNDEFINED; }

static void setup_globals(JSContext *ctx) {
    JSValue global = JS_GetGlobalObject(ctx);
    JSValue console = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, console, "log", JS_NewCFunction(ctx, js_console_log, "log", 1));
    JS_SetPropertyStr(ctx, global, "console", console);
    JSValue otf = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, otf, "setUI", JS_NewCFunction(ctx, js_setUI, "setUI", 1));
    JS_SetPropertyStr(ctx, otf, "update", JS_NewCFunction(ctx, js_update, "update", 2));
    JS_SetPropertyStr(ctx, otf, "registerStyles", JS_NewCFunction(ctx, js_registerStyles, "registerStyles", 1));
    JS_SetPropertyStr(ctx, otf, "sendToNative", JS_NewCFunction(ctx, js_sendToNative, "sendToNative", 2));
    JSValue logFn = JS_NewCFunction(ctx, js_log_fn, "log", 1);
    JS_SetPropertyStr(ctx, logFn, "v", JS_NewCFunction(ctx, js_log_v, "v", 1));
    JS_SetPropertyStr(ctx, logFn, "d", JS_NewCFunction(ctx, js_log_d, "d", 1));
    JS_SetPropertyStr(ctx, logFn, "i", JS_NewCFunction(ctx, js_log_i, "i", 1));
    JS_SetPropertyStr(ctx, logFn, "w", JS_NewCFunction(ctx, js_log_w, "w", 1));
    JS_SetPropertyStr(ctx, logFn, "e", JS_NewCFunction(ctx, js_log_e, "e", 1));
    JS_SetPropertyStr(ctx, otf, "log", logFn);
    JS_SetPropertyStr(ctx, global, "OnTheFly", otf);
    JS_FreeValue(ctx, global);
}

/* Public API */
OTFRuntime otf_create_runtime(void) {
    JSRuntime *rt = JS_NewRuntime();
    if (!rt) return NULL;
    JS_SetMemoryLimit(rt, 64 * 1024 * 1024);
    return (OTFRuntime)rt;
}

OTFContext otf_create_context(OTFRuntime runtime) {
    JSRuntime *rt = (JSRuntime*)runtime;
    if (!rt) return NULL;
    JSContext *ctx = JS_NewContext(rt);
    if (!ctx) return NULL;
    setup_globals(ctx);
    return (OTFContext)ctx;
}

const char* otf_eval(OTFContext context, const char* script, const char* fileName) {
    JSContext *ctx = (JSContext*)context;
    if (!ctx) return strdup("Error: context is null");
    JSValue result = JS_Eval(ctx, script, strlen(script), fileName, JS_EVAL_TYPE_GLOBAL);
    char *out;
    if (JS_IsException(result)) {
        JSValue ex = JS_GetException(ctx);
        const char *e = JS_ToCString(ctx, ex);
        size_t len = (e ? strlen(e) : 7) + 8;
        out = malloc(len);
        snprintf(out, len, "Error: %s", e ? e : "unknown");
        if (e) JS_FreeCString(ctx, e);
        JS_FreeValue(ctx, ex);
    } else {
        const char *r = JS_ToCString(ctx, result);
        out = strdup(r ? r : "undefined");
        if (r) JS_FreeCString(ctx, r);
    }
    JS_FreeValue(ctx, result);
    return out;
}

const char* otf_get_ui(OTFContext ctx) { return strdup(g_ui_json ? g_ui_json : ""); }
const char* otf_get_styles(OTFContext ctx) { return strdup(g_styles_json ? g_styles_json : ""); }
const char* otf_get_pending_updates(OTFContext ctx) { return queue_drain(&g_updates); }
const char* otf_get_pending_actions(OTFContext ctx) { return queue_drain(&g_actions); }
const char* otf_get_pending_logs(OTFContext ctx) { return queue_drain(&g_logs); }

void otf_destroy_context(OTFContext context) {
    JSContext *ctx = (JSContext*)context;
    if (ctx) JS_FreeContext(ctx);
}

void otf_destroy_runtime(OTFRuntime runtime) {
    JSRuntime *rt = (JSRuntime*)runtime;
    if (rt) JS_FreeRuntime(rt);
}

void otf_free_string(const char* str) {
    free((void*)str);
}

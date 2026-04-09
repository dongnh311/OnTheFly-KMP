//! Raw FFI bindings to QuickJS C library + inline function wrappers.

#[allow(unused_imports)]
use std::os::raw::{c_char, c_int, c_void};

// ── Opaque QuickJS types ──────────────────────────────────────

#[repr(C)]
pub struct JSRuntime {
    _opaque: [u8; 0],
}

#[repr(C)]
pub struct JSContext {
    _opaque: [u8; 0],
}

// ── JSValue ───────────────────────────────────────────────────
// On 64-bit: struct { union(8 bytes), tag(8 bytes) } = 16 bytes
// On 32-bit: NaN-boxed uint64_t = 8 bytes

#[cfg(target_pointer_width = "64")]
#[repr(C)]
#[derive(Copy, Clone)]
pub union JSValueUnion {
    pub int32: i32,
    pub float64: f64,
    pub ptr: *mut c_void,
    pub short_big_int: i64,
}

#[cfg(target_pointer_width = "64")]
#[repr(C)]
#[derive(Copy, Clone)]
pub struct JSValue {
    pub u: JSValueUnion,
    pub tag: i64,
}

#[cfg(target_pointer_width = "32")]
#[repr(transparent)]
#[derive(Copy, Clone)]
pub struct JSValue(pub u64);

#[allow(dead_code)]
pub type JSValueConst = JSValue;

// ── Constants ─────────────────────────────────────────────────

pub const JS_EVAL_TYPE_GLOBAL: c_int = 0;

// ── Callback type ─────────────────────────────────────────────

pub type JSCFunction = unsafe extern "C" fn(
    ctx: *mut JSContext,
    this_val: JSValue,
    argc: c_int,
    argv: *mut JSValue,
) -> JSValue;

// ── Non-inline QuickJS functions (linked from static lib) ─────

extern "C" {
    pub fn JS_NewRuntime() -> *mut JSRuntime;
    pub fn JS_SetMemoryLimit(rt: *mut JSRuntime, limit: usize);
    pub fn JS_FreeRuntime(rt: *mut JSRuntime);

    pub fn JS_NewContext(rt: *mut JSRuntime) -> *mut JSContext;
    pub fn JS_FreeContext(ctx: *mut JSContext);

    pub fn JS_Eval(
        ctx: *mut JSContext,
        input: *const c_char,
        input_len: usize,
        filename: *const c_char,
        eval_flags: c_int,
    ) -> JSValue;

    pub fn JS_GetException(ctx: *mut JSContext) -> JSValue;
    pub fn JS_FreeCString(ctx: *mut JSContext, ptr: *const c_char);

    pub fn JS_GetGlobalObject(ctx: *mut JSContext) -> JSValue;
    pub fn JS_NewObject(ctx: *mut JSContext) -> JSValue;

    pub fn JS_SetPropertyStr(
        ctx: *mut JSContext,
        this_obj: JSValue,
        prop: *const c_char,
        val: JSValue,
    ) -> c_int;

    pub fn JS_GetPropertyStr(
        ctx: *mut JSContext,
        this_obj: JSValue,
        prop: *const c_char,
    ) -> JSValue;

    pub fn JS_Call(
        ctx: *mut JSContext,
        func_obj: JSValue,
        this_obj: JSValue,
        argc: c_int,
        argv: *const JSValue,
    ) -> JSValue;
}

// ── Wrappers for static inline functions (from quickjs_wrapper.c) ──

extern "C" {
    pub fn otf_js_is_exception(v: JSValue) -> c_int;
    pub fn otf_js_free_value(ctx: *mut JSContext, v: JSValue);
    pub fn otf_js_dup_value(ctx: *mut JSContext, v: JSValue) -> JSValue;
    pub fn otf_js_to_cstring(ctx: *mut JSContext, val: JSValue) -> *const c_char;
    pub fn otf_js_new_string(ctx: *mut JSContext, s: *const c_char) -> JSValue;
    pub fn otf_js_new_cfunction(
        ctx: *mut JSContext,
        func: JSCFunction,
        name: *const c_char,
        length: c_int,
    ) -> JSValue;
    pub fn otf_js_undefined() -> JSValue;
}

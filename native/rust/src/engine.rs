//! Core bridge logic: per-context state, JS callbacks, and public API.

use std::collections::HashMap;
use std::ffi::{CStr, CString};
use std::os::raw::c_int;
use std::sync::{Mutex, OnceLock};

use crate::quickjs_sys::*;

// ── Per-context state ─────────────────────────────────────────

struct ContextState {
    ui_json: String,
    styles_json: String,
    pending_updates: Vec<String>,
    native_actions: Vec<String>,
    pending_logs: Vec<String>,
    module_cache: HashMap<String, String>,
}

impl ContextState {
    fn new() -> Self {
        Self {
            ui_json: String::new(),
            styles_json: String::new(),
            pending_updates: Vec::new(),
            native_actions: Vec::new(),
            pending_logs: Vec::new(),
            module_cache: HashMap::new(),
        }
    }
}

fn states() -> &'static Mutex<HashMap<usize, ContextState>> {
    static STATES: OnceLock<Mutex<HashMap<usize, ContextState>>> = OnceLock::new();
    STATES.get_or_init(|| Mutex::new(HashMap::new()))
}

#[inline]
fn ctx_key(ctx: *mut JSContext) -> usize {
    ctx as usize
}

// ── QuickJS helpers ───────────────────────────────────────────

unsafe fn js_stringify(ctx: *mut JSContext, val: JSValue) -> String {
    let global = JS_GetGlobalObject(ctx);
    let json_obj = JS_GetPropertyStr(ctx, global, c"JSON".as_ptr());
    let stringify_fn = JS_GetPropertyStr(ctx, json_obj, c"stringify".as_ptr());
    let result = JS_Call(ctx, stringify_fn, json_obj, 1, &val);
    let out = js_value_to_string(ctx, result);
    otf_js_free_value(ctx, result);
    otf_js_free_value(ctx, stringify_fn);
    otf_js_free_value(ctx, json_obj);
    otf_js_free_value(ctx, global);
    out
}

unsafe fn js_value_to_string(ctx: *mut JSContext, val: JSValue) -> String {
    let cstr = otf_js_to_cstring(ctx, val);
    if cstr.is_null() {
        return String::new();
    }
    let s = CStr::from_ptr(cstr).to_string_lossy().into_owned();
    JS_FreeCString(ctx, cstr);
    s
}

unsafe fn js_concat_args(ctx: *mut JSContext, argc: c_int, argv: *mut JSValue) -> String {
    let mut msg = String::new();
    for i in 0..argc {
        if i > 0 {
            msg.push(' ');
        }
        let cstr = otf_js_to_cstring(ctx, *argv.add(i as usize));
        if !cstr.is_null() {
            if let Ok(s) = CStr::from_ptr(cstr).to_str() {
                msg.push_str(s);
            } else {
                msg.push_str(&CStr::from_ptr(cstr).to_string_lossy());
            }
            JS_FreeCString(ctx, cstr);
        }
    }
    msg
}

fn escape_json_string(s: &str) -> String {
    let mut escaped = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '"' => escaped.push_str("\\\""),
            '\\' => escaped.push_str("\\\\"),
            '\n' => escaped.push_str("\\n"),
            _ => escaped.push(c),
        }
    }
    escaped
}

fn push_log(ctx: *mut JSContext, level: &str, msg: &str) {
    let escaped = escape_json_string(msg);
    let entry = format!("{{\"level\":\"{}\",\"message\":\"{}\"}}", level, escaped);
    if let Ok(mut map) = states().lock() {
        if let Some(state) = map.get_mut(&ctx_key(ctx)) {
            state.pending_logs.push(entry);
        }
    }
}

// ── JS Callback Functions ─────────────────────────────────────

unsafe extern "C" fn js_console_log(
    ctx: *mut JSContext, _this: JSValue, argc: c_int, argv: *mut JSValue,
) -> JSValue {
    let msg = js_concat_args(ctx, argc, argv);
    push_log(ctx, "d", &msg);
    otf_js_undefined()
}

unsafe extern "C" fn js_set_ui(
    ctx: *mut JSContext, _this: JSValue, argc: c_int, argv: *mut JSValue,
) -> JSValue {
    if argc >= 1 {
        let json = js_stringify(ctx, *argv);
        if let Ok(mut map) = states().lock() {
            if let Some(state) = map.get_mut(&ctx_key(ctx)) {
                state.ui_json = json;
            }
        }
    }
    otf_js_undefined()
}

unsafe extern "C" fn js_register_styles(
    ctx: *mut JSContext, _this: JSValue, argc: c_int, argv: *mut JSValue,
) -> JSValue {
    if argc >= 1 {
        let json = js_stringify(ctx, *argv);
        if let Ok(mut map) = states().lock() {
            if let Some(state) = map.get_mut(&ctx_key(ctx)) {
                state.styles_json = json;
            }
        }
    }
    otf_js_undefined()
}

unsafe extern "C" fn js_update(
    ctx: *mut JSContext, _this: JSValue, argc: c_int, argv: *mut JSValue,
) -> JSValue {
    if argc < 2 {
        return otf_js_undefined();
    }
    let update_obj = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, update_obj, c"id".as_ptr(), otf_js_dup_value(ctx, *argv));
    JS_SetPropertyStr(ctx, update_obj, c"props".as_ptr(), otf_js_dup_value(ctx, *argv.add(1)));
    let json = js_stringify(ctx, update_obj);
    otf_js_free_value(ctx, update_obj);
    if let Ok(mut map) = states().lock() {
        if let Some(state) = map.get_mut(&ctx_key(ctx)) {
            state.pending_updates.push(json);
        }
    }
    otf_js_undefined()
}

unsafe extern "C" fn js_send_to_native(
    ctx: *mut JSContext, _this: JSValue, argc: c_int, argv: *mut JSValue,
) -> JSValue {
    if argc < 1 {
        return otf_js_undefined();
    }
    let action_obj = JS_NewObject(ctx);
    let name = otf_js_to_cstring(ctx, *argv);
    if !name.is_null() {
        JS_SetPropertyStr(
            ctx, action_obj, c"action".as_ptr(),
            otf_js_new_string(ctx, name),
        );
        JS_FreeCString(ctx, name);
    }
    if argc >= 2 {
        JS_SetPropertyStr(
            ctx, action_obj, c"data".as_ptr(),
            otf_js_dup_value(ctx, *argv.add(1)),
        );
    }
    let json = js_stringify(ctx, action_obj);
    otf_js_free_value(ctx, action_obj);
    if let Ok(mut map) = states().lock() {
        if let Some(state) = map.get_mut(&ctx_key(ctx)) {
            state.native_actions.push(json);
        }
    }
    otf_js_undefined()
}

unsafe extern "C" fn js_log_fn(
    ctx: *mut JSContext, _this: JSValue, argc: c_int, argv: *mut JSValue,
) -> JSValue {
    push_log(ctx, "i", &js_concat_args(ctx, argc, argv));
    otf_js_undefined()
}

unsafe extern "C" fn js_log_v(
    ctx: *mut JSContext, _: JSValue, argc: c_int, argv: *mut JSValue,
) -> JSValue {
    push_log(ctx, "v", &js_concat_args(ctx, argc, argv));
    otf_js_undefined()
}

unsafe extern "C" fn js_log_d(
    ctx: *mut JSContext, _: JSValue, argc: c_int, argv: *mut JSValue,
) -> JSValue {
    push_log(ctx, "d", &js_concat_args(ctx, argc, argv));
    otf_js_undefined()
}

unsafe extern "C" fn js_log_i(
    ctx: *mut JSContext, _: JSValue, argc: c_int, argv: *mut JSValue,
) -> JSValue {
    push_log(ctx, "i", &js_concat_args(ctx, argc, argv));
    otf_js_undefined()
}

unsafe extern "C" fn js_log_w(
    ctx: *mut JSContext, _: JSValue, argc: c_int, argv: *mut JSValue,
) -> JSValue {
    push_log(ctx, "w", &js_concat_args(ctx, argc, argv));
    otf_js_undefined()
}

unsafe extern "C" fn js_log_e(
    ctx: *mut JSContext, _: JSValue, argc: c_int, argv: *mut JSValue,
) -> JSValue {
    push_log(ctx, "e", &js_concat_args(ctx, argc, argv));
    otf_js_undefined()
}

// ── ES Module loader callback ─────────────────────────────────

unsafe extern "C" fn module_loader(
    ctx: *mut JSContext,
    module_name: *const std::os::raw::c_char,
    _opaque: *mut std::os::raw::c_void,
) -> *mut JSModuleDef {
    if module_name.is_null() {
        return std::ptr::null_mut();
    }
    let name = match CStr::from_ptr(module_name).to_str() {
        Ok(s) => s,
        Err(_) => return std::ptr::null_mut(),
    };

    // Look up module source in per-context cache
    let source = {
        let map = match states().lock() {
            Ok(m) => m,
            Err(_) => return std::ptr::null_mut(),
        };
        match map.get(&ctx_key(ctx)) {
            Some(state) => state.module_cache.get(name).cloned(),
            None => None,
        }
    };

    let source = match source {
        Some(s) => s,
        None => {
            eprintln!("Module not found: {}", name);
            return std::ptr::null_mut();
        }
    };

    let c_source = match CString::new(source.as_str()) {
        Ok(s) => s,
        Err(_) => return std::ptr::null_mut(),
    };

    // Compile the module (JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY)
    let func_val = JS_Eval(
        ctx,
        c_source.as_ptr(),
        source.len(),
        module_name,
        JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY,
    );

    if otf_js_is_exception(func_val) != 0 {
        let ex = JS_GetException(ctx);
        let err = js_value_to_string(ctx, ex);
        otf_js_free_value(ctx, ex);
        eprintln!("Module compile error [{}]: {}", name, err);
        return std::ptr::null_mut();
    }

    // Extract JSModuleDef* from the compiled module value
    #[cfg(target_pointer_width = "64")]
    let module_def = func_val.u.ptr as *mut JSModuleDef;
    #[cfg(target_pointer_width = "32")]
    let module_def = std::ptr::null_mut::<JSModuleDef>(); // 32-bit not supported for modules

    module_def
}

// ── Setup JS globals ──────────────────────────────────────────

unsafe fn setup_globals(ctx: *mut JSContext) {
    let global = JS_GetGlobalObject(ctx);

    // console.log
    let console = JS_NewObject(ctx);
    JS_SetPropertyStr(
        ctx, console, c"log".as_ptr(),
        otf_js_new_cfunction(ctx, js_console_log, c"log".as_ptr(), 1),
    );
    JS_SetPropertyStr(ctx, global, c"console".as_ptr(), console);

    // OnTheFly namespace
    let otf = JS_NewObject(ctx);
    JS_SetPropertyStr(
        ctx, otf, c"setUI".as_ptr(),
        otf_js_new_cfunction(ctx, js_set_ui, c"setUI".as_ptr(), 1),
    );
    JS_SetPropertyStr(
        ctx, otf, c"update".as_ptr(),
        otf_js_new_cfunction(ctx, js_update, c"update".as_ptr(), 2),
    );
    JS_SetPropertyStr(
        ctx, otf, c"registerStyles".as_ptr(),
        otf_js_new_cfunction(ctx, js_register_styles, c"registerStyles".as_ptr(), 1),
    );
    JS_SetPropertyStr(
        ctx, otf, c"sendToNative".as_ptr(),
        otf_js_new_cfunction(ctx, js_send_to_native, c"sendToNative".as_ptr(), 2),
    );

    // OnTheFly.log (callable function with sub-methods v/d/i/w/e)
    let log_fn = otf_js_new_cfunction(ctx, js_log_fn, c"log".as_ptr(), 1);
    JS_SetPropertyStr(ctx, log_fn, c"v".as_ptr(), otf_js_new_cfunction(ctx, js_log_v, c"v".as_ptr(), 1));
    JS_SetPropertyStr(ctx, log_fn, c"d".as_ptr(), otf_js_new_cfunction(ctx, js_log_d, c"d".as_ptr(), 1));
    JS_SetPropertyStr(ctx, log_fn, c"i".as_ptr(), otf_js_new_cfunction(ctx, js_log_i, c"i".as_ptr(), 1));
    JS_SetPropertyStr(ctx, log_fn, c"w".as_ptr(), otf_js_new_cfunction(ctx, js_log_w, c"w".as_ptr(), 1));
    JS_SetPropertyStr(ctx, log_fn, c"e".as_ptr(), otf_js_new_cfunction(ctx, js_log_e, c"e".as_ptr(), 1));
    JS_SetPropertyStr(ctx, otf, c"log".as_ptr(), log_fn);

    JS_SetPropertyStr(ctx, global, c"OnTheFly".as_ptr(), otf);
    otf_js_free_value(ctx, global);
}

// ── Public API (called by JNI bridge / iOS bridge) ────────────

pub fn create_runtime() -> *mut JSRuntime {
    unsafe {
        let rt = JS_NewRuntime();
        if rt.is_null() {
            return std::ptr::null_mut();
        }
        JS_SetMemoryLimit(rt, 64 * 1024 * 1024);
        rt
    }
}

pub fn create_context(rt: *mut JSRuntime) -> *mut JSContext {
    if rt.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let ctx = JS_NewContext(rt);
        if ctx.is_null() {
            return std::ptr::null_mut();
        }
        // Register per-context state
        if let Ok(mut map) = states().lock() {
            map.insert(ctx_key(ctx), ContextState::new());
        }
        // Set up ES module loader
        JS_SetModuleLoaderFunc(
            rt,
            None, // use default normalizer
            Some(module_loader),
            std::ptr::null_mut(),
        );
        setup_globals(ctx);
        ctx
    }
}

pub fn eval_script(ctx: *mut JSContext, script: &str, filename: &str) -> String {
    if ctx.is_null() {
        return "Error: context is null".to_string();
    }
    let c_script = match CString::new(script) {
        Ok(s) => s,
        Err(_) => return "Error: script contains null bytes".to_string(),
    };
    let c_filename = CString::new(filename).unwrap_or_else(|_| CString::new("<eval>").unwrap());

    unsafe {
        let result = JS_Eval(
            ctx,
            c_script.as_ptr(),
            script.len(),
            c_filename.as_ptr(),
            JS_EVAL_TYPE_GLOBAL,
        );

        if otf_js_is_exception(result) != 0 {
            let ex = JS_GetException(ctx);
            let err_str = js_value_to_string(ctx, ex);
            otf_js_free_value(ctx, ex);
            if err_str.is_empty() {
                "Error: unknown".to_string()
            } else {
                format!("Error: {}", err_str)
            }
        } else {
            let s = js_value_to_string(ctx, result);
            otf_js_free_value(ctx, result);
            if s.is_empty() {
                "undefined".to_string()
            } else {
                s
            }
        }
    }
}

pub fn get_ui(ctx: *mut JSContext) -> String {
    if let Ok(map) = states().lock() {
        if let Some(state) = map.get(&ctx_key(ctx)) {
            return state.ui_json.clone();
        }
    }
    String::new()
}

pub fn get_styles(ctx: *mut JSContext) -> String {
    if let Ok(map) = states().lock() {
        if let Some(state) = map.get(&ctx_key(ctx)) {
            return state.styles_json.clone();
        }
    }
    String::new()
}

enum QueueType {
    Updates,
    Actions,
    Logs,
}

fn drain_queue(ctx: *mut JSContext, queue_type: QueueType) -> String {
    if let Ok(mut map) = states().lock() {
        if let Some(state) = map.get_mut(&ctx_key(ctx)) {
            let queue = match queue_type {
                QueueType::Updates => &mut state.pending_updates,
                QueueType::Actions => &mut state.native_actions,
                QueueType::Logs => &mut state.pending_logs,
            };
            if queue.is_empty() {
                return "[]".to_string();
            }
            let json = format!("[{}]", queue.join(","));
            queue.clear();
            return json;
        }
    }
    "[]".to_string()
}

pub fn get_pending_updates(ctx: *mut JSContext) -> String {
    drain_queue(ctx, QueueType::Updates)
}

pub fn get_pending_actions(ctx: *mut JSContext) -> String {
    drain_queue(ctx, QueueType::Actions)
}

pub fn get_pending_logs(ctx: *mut JSContext) -> String {
    drain_queue(ctx, QueueType::Logs)
}

pub fn register_module(ctx: *mut JSContext, name: &str, source: &str) {
    if let Ok(mut map) = states().lock() {
        if let Some(state) = map.get_mut(&ctx_key(ctx)) {
            state.module_cache.insert(name.to_string(), source.to_string());
        }
    }
}

pub fn eval_module(ctx: *mut JSContext, script: &str, filename: &str) -> String {
    if ctx.is_null() {
        return "Error: context is null".to_string();
    }
    let c_script = match CString::new(script) {
        Ok(s) => s,
        Err(_) => return "Error: script contains null bytes".to_string(),
    };
    let c_filename = CString::new(filename).unwrap_or_else(|_| CString::new("<module>").unwrap());

    unsafe {
        let result = JS_Eval(
            ctx,
            c_script.as_ptr(),
            script.len(),
            c_filename.as_ptr(),
            JS_EVAL_TYPE_MODULE,
        );

        if otf_js_is_exception(result) != 0 {
            let ex = JS_GetException(ctx);
            let err_str = js_value_to_string(ctx, ex);
            otf_js_free_value(ctx, ex);
            if err_str.is_empty() {
                "Error: unknown".to_string()
            } else {
                format!("Error: {}", err_str)
            }
        } else {
            let s = js_value_to_string(ctx, result);
            otf_js_free_value(ctx, result);
            if s.is_empty() {
                "undefined".to_string()
            } else {
                s
            }
        }
    }
}

pub fn destroy_context(ctx: *mut JSContext) {
    if ctx.is_null() {
        return;
    }
    if let Ok(mut map) = states().lock() {
        map.remove(&ctx_key(ctx));
    }
    unsafe {
        JS_FreeContext(ctx);
    }
}

pub fn destroy_runtime(rt: *mut JSRuntime) {
    if rt.is_null() {
        return;
    }
    unsafe {
        JS_FreeRuntime(rt);
    }
}

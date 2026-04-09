//! C FFI exports for iOS platform.
//! Matches the existing onthefly_bridge.h API so Kotlin/Native
//! cinterop works without changes.

#![cfg(target_os = "ios")]

use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_void};

use crate::engine;
use crate::quickjs_sys::{JSContext, JSRuntime};

extern "C" {
    fn strdup(s: *const c_char) -> *mut c_char;
    fn free(ptr: *mut c_void);
}

/// Allocate a C string via strdup so the caller can free() it.
fn to_c_string(s: &str) -> *const c_char {
    let cstr = CString::new(s).unwrap_or_default();
    unsafe { strdup(cstr.as_ptr()) }
}

#[no_mangle]
pub extern "C" fn otf_create_runtime() -> *mut c_void {
    engine::create_runtime() as *mut c_void
}

#[no_mangle]
pub extern "C" fn otf_create_context(runtime: *mut c_void) -> *mut c_void {
    engine::create_context(runtime as *mut JSRuntime) as *mut c_void
}

#[no_mangle]
pub extern "C" fn otf_eval(
    context: *mut c_void,
    script: *const c_char,
    file_name: *const c_char,
) -> *const c_char {
    let script_str = if script.is_null() {
        ""
    } else {
        unsafe { CStr::from_ptr(script) }.to_str().unwrap_or("")
    };
    let filename_str = if file_name.is_null() {
        "<eval>"
    } else {
        unsafe { CStr::from_ptr(file_name) }
            .to_str()
            .unwrap_or("<eval>")
    };
    let result = engine::eval_script(context as *mut JSContext, script_str, filename_str);
    to_c_string(&result)
}

#[no_mangle]
pub extern "C" fn otf_get_ui(_context: *mut c_void) -> *const c_char {
    to_c_string(&engine::get_ui(_context as *mut JSContext))
}

#[no_mangle]
pub extern "C" fn otf_get_styles(_context: *mut c_void) -> *const c_char {
    to_c_string(&engine::get_styles(_context as *mut JSContext))
}

#[no_mangle]
pub extern "C" fn otf_get_pending_updates(_context: *mut c_void) -> *const c_char {
    to_c_string(&engine::get_pending_updates(_context as *mut JSContext))
}

#[no_mangle]
pub extern "C" fn otf_get_pending_actions(_context: *mut c_void) -> *const c_char {
    to_c_string(&engine::get_pending_actions(_context as *mut JSContext))
}

#[no_mangle]
pub extern "C" fn otf_get_pending_logs(_context: *mut c_void) -> *const c_char {
    to_c_string(&engine::get_pending_logs(_context as *mut JSContext))
}

#[no_mangle]
pub extern "C" fn otf_destroy_context(context: *mut c_void) {
    engine::destroy_context(context as *mut JSContext);
}

#[no_mangle]
pub extern "C" fn otf_destroy_runtime(runtime: *mut c_void) {
    engine::destroy_runtime(runtime as *mut JSRuntime);
}

#[no_mangle]
pub extern "C" fn otf_free_string(s: *const c_char) {
    if !s.is_null() {
        unsafe {
            free(s as *mut c_void);
        }
    }
}

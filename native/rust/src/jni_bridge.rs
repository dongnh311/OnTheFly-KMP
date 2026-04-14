//! JNI exports for Android and Desktop platforms.
//! Exposes the bridge API as JNI functions matching
//! com.onthefly.engine.core.QuickJSBridge native methods.

#![cfg(not(target_os = "ios"))]

use jni::objects::{JClass, JString};
use jni::sys::{jlong, jstring};
use jni::JNIEnv;

use crate::engine;
use crate::quickjs_sys::{JSContext, JSRuntime};

fn to_jstring(env: &mut JNIEnv, s: &str) -> jstring {
    env.new_string(s)
        .map(|js| js.into_raw())
        .unwrap_or(std::ptr::null_mut())
}

#[no_mangle]
pub extern "system" fn Java_com_onthefly_engine_core_QuickJSBridge_nativeCreateRuntime<'local>(
    _env: JNIEnv<'local>,
    _class: JClass<'local>,
) -> jlong {
    engine::create_runtime() as jlong
}

#[no_mangle]
pub extern "system" fn Java_com_onthefly_engine_core_QuickJSBridge_nativeCreateContext<'local>(
    _env: JNIEnv<'local>,
    _class: JClass<'local>,
    runtime_ptr: jlong,
) -> jlong {
    engine::create_context(runtime_ptr as *mut JSRuntime) as jlong
}

#[no_mangle]
pub extern "system" fn Java_com_onthefly_engine_core_QuickJSBridge_nativeEval<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
    context_ptr: jlong,
    script: JString<'local>,
    file_name: JString<'local>,
) -> jstring {
    let ctx = context_ptr as *mut JSContext;
    let script_str: String = env
        .get_string(&script)
        .map(|s| s.into())
        .unwrap_or_default();
    let filename_str: String = env
        .get_string(&file_name)
        .map(|s| s.into())
        .unwrap_or_default();
    let result = engine::eval_script(ctx, &script_str, &filename_str);
    to_jstring(&mut env, &result)
}

#[no_mangle]
pub extern "system" fn Java_com_onthefly_engine_core_QuickJSBridge_nativeGetUI<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
    context_ptr: jlong,
) -> jstring {
    let json = engine::get_ui(context_ptr as *mut JSContext);
    to_jstring(&mut env, &json)
}

#[no_mangle]
pub extern "system" fn Java_com_onthefly_engine_core_QuickJSBridge_nativeGetStyles<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
    context_ptr: jlong,
) -> jstring {
    let json = engine::get_styles(context_ptr as *mut JSContext);
    to_jstring(&mut env, &json)
}

#[no_mangle]
pub extern "system" fn Java_com_onthefly_engine_core_QuickJSBridge_nativeGetPendingUpdates<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
    context_ptr: jlong,
) -> jstring {
    let json = engine::get_pending_updates(context_ptr as *mut JSContext);
    to_jstring(&mut env, &json)
}

#[no_mangle]
pub extern "system" fn Java_com_onthefly_engine_core_QuickJSBridge_nativeGetPendingActions<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
    context_ptr: jlong,
) -> jstring {
    let json = engine::get_pending_actions(context_ptr as *mut JSContext);
    to_jstring(&mut env, &json)
}

#[no_mangle]
pub extern "system" fn Java_com_onthefly_engine_core_QuickJSBridge_nativeGetPendingLogs<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
    context_ptr: jlong,
) -> jstring {
    let json = engine::get_pending_logs(context_ptr as *mut JSContext);
    to_jstring(&mut env, &json)
}

#[no_mangle]
pub extern "system" fn Java_com_onthefly_engine_core_QuickJSBridge_nativeRegisterModule<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
    context_ptr: jlong,
    name: JString<'local>,
    source: JString<'local>,
) {
    let ctx = context_ptr as *mut JSContext;
    let name_str: String = env.get_string(&name).map(|s| s.into()).unwrap_or_default();
    let source_str: String = env.get_string(&source).map(|s| s.into()).unwrap_or_default();
    engine::register_module(ctx, &name_str, &source_str);
}

#[no_mangle]
pub extern "system" fn Java_com_onthefly_engine_core_QuickJSBridge_nativeEvalModule<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
    context_ptr: jlong,
    script: JString<'local>,
    file_name: JString<'local>,
) -> jstring {
    let ctx = context_ptr as *mut JSContext;
    let script_str: String = env.get_string(&script).map(|s| s.into()).unwrap_or_default();
    let filename_str: String = env.get_string(&file_name).map(|s| s.into()).unwrap_or_default();
    let result = engine::eval_module(ctx, &script_str, &filename_str);
    to_jstring(&mut env, &result)
}

#[no_mangle]
pub extern "system" fn Java_com_onthefly_engine_core_QuickJSBridge_nativeDestroyContext<'local>(
    _env: JNIEnv<'local>,
    _class: JClass<'local>,
    context_ptr: jlong,
) {
    engine::destroy_context(context_ptr as *mut JSContext);
}

#[no_mangle]
pub extern "system" fn Java_com_onthefly_engine_core_QuickJSBridge_nativeDestroyRuntime<'local>(
    _env: JNIEnv<'local>,
    _class: JClass<'local>,
    runtime_ptr: jlong,
) {
    engine::destroy_runtime(runtime_ptr as *mut JSRuntime);
}

fn main() {
    let quickjs_dir = "../quickjs";
    let target = std::env::var("TARGET").unwrap_or_default();

    let mut build = cc::Build::new();
    build
        .file(format!("{}/quickjs.c", quickjs_dir))
        .file(format!("{}/cutils.c", quickjs_dir))
        .file(format!("{}/dtoa.c", quickjs_dir))
        .file(format!("{}/libregexp.c", quickjs_dir))
        .file(format!("{}/libunicode.c", quickjs_dir))
        .file(format!("{}/quickjs-libc.c", quickjs_dir))
        .file("quickjs_wrapper.c")
        .include(quickjs_dir)
        .define("CONFIG_VERSION", "\"2025-09-13\"")
        .define("CONFIG_BIGNUM", None)
        .define("_GNU_SOURCE", None)
        .warnings(false)
        .flag_if_supported("-Wno-implicit-function-declaration")
        .flag_if_supported("-Wno-int-conversion")
        .flag_if_supported("-Wno-sign-compare")
        .flag_if_supported("-Wno-unused-parameter")
        .flag_if_supported("-Wno-missing-field-initializers")
        .opt_level(2);

    // Set iOS deployment target to avoid __chkstk_darwin linker errors
    if target.contains("apple-ios") {
        build.flag("-miphoneos-version-min=16.0");
    }

    build.compile("quickjs");

    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=quickjs_wrapper.c");
}

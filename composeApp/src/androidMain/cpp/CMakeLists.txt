cmake_minimum_required(VERSION 3.22.1)
project("onthefly" LANGUAGES C CXX)

set(QUICKJS_SRC
    quickjs/quickjs.c
    quickjs/cutils.c
    quickjs/dtoa.c
    quickjs/libregexp.c
    quickjs/libunicode.c
    quickjs/quickjs-libc.c
)

add_library(quickjs STATIC ${QUICKJS_SRC})
target_include_directories(quickjs PUBLIC quickjs)
target_compile_definitions(quickjs PRIVATE CONFIG_VERSION="2025-09-13" CONFIG_BIGNUM _GNU_SOURCE)
target_compile_options(quickjs PRIVATE
    -Wno-implicit-function-declaration -Wno-int-conversion
    -Wno-sign-compare -Wno-unused-parameter -Wno-missing-field-initializers
)

add_library(onthefly-engine SHARED bridge.cpp)
target_include_directories(onthefly-engine PRIVATE quickjs)
target_link_libraries(onthefly-engine quickjs android log)
target_compile_features(onthefly-engine PRIVATE cxx_std_17)

cmake_minimum_required(VERSION 3.22)
project(onthefly-desktop LANGUAGES C CXX)

find_package(JNI REQUIRED)

set(QUICKJS_SRC
    quickjs/quickjs.c quickjs/cutils.c quickjs/dtoa.c
    quickjs/libregexp.c quickjs/libunicode.c quickjs/quickjs-libc.c
)

add_library(quickjs_static STATIC ${QUICKJS_SRC})
target_include_directories(quickjs_static PUBLIC quickjs)
target_compile_definitions(quickjs_static PRIVATE CONFIG_VERSION="2025-09-13" CONFIG_BIGNUM _GNU_SOURCE)
target_compile_options(quickjs_static PRIVATE
    -Wno-implicit-function-declaration -Wno-int-conversion
    -Wno-sign-compare -Wno-unused-parameter -Wno-missing-field-initializers
)

add_library(onthefly-engine SHARED bridge_desktop.cpp)
target_include_directories(onthefly-engine PRIVATE quickjs ${JNI_INCLUDE_DIRS})
target_link_libraries(onthefly-engine quickjs_static ${JNI_LIBRARIES})
target_compile_features(onthefly-engine PRIVATE cxx_std_17)

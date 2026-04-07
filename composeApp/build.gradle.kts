import org.jetbrains.compose.desktop.application.dsl.TargetFormat
import org.jetbrains.kotlin.gradle.ExperimentalKotlinGradlePluginApi
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.application)
    alias(libs.plugins.compose.multiplatform)
    alias(libs.plugins.kotlin.compose)
}

kotlin {
    androidTarget {
        @OptIn(ExperimentalKotlinGradlePluginApi::class)
        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_17)
        }
    }

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "ComposeApp"
            isStatic = true
        }
        // cinterop for QuickJS - requires pre-built static library
        // Build with: cd native/ios && ./build_ios.sh
        iosTarget.compilations.getByName("main") {
            cinterops {
                val quickjs by creating {
                    defFile(project.file("src/nativeInterop/cinterop/quickjs.def"))
                    val targetName = iosTarget.name
                    compilerOpts("-I${rootProject.projectDir}/native/ios", "-I${rootProject.projectDir}/native/quickjs", "-DCONFIG_VERSION=\"2025-09-13\"", "-DCONFIG_BIGNUM", "-D_GNU_SOURCE")
                    extraOpts("-libraryPath", "${rootProject.projectDir}/native/ios/build/$targetName")
                }
            }
        }
        iosTarget.binaries.all {
            val targetName = iosTarget.name
            linkerOpts("-L${rootProject.projectDir}/native/ios/build/$targetName", "-lonthefly_ios")
        }
    }

    jvm("desktop")

    sourceSets {
        val desktopMain by getting

        commonMain.dependencies {
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(compose.ui)
            implementation(compose.components.resources)
            implementation(compose.components.uiToolingPreview)
            implementation(libs.androidx.lifecycle.viewmodel.compose)
            implementation(libs.androidx.lifecycle.runtime.compose)
            implementation(libs.navigation.compose)
            implementation(libs.ktor.client.core)
            implementation(libs.kotlinx.datetime)
        }

        androidMain.dependencies {
            implementation(compose.preview)
            implementation(libs.androidx.activity.compose)
            implementation(libs.ktor.client.okhttp)
        }

        iosMain.dependencies {
            implementation(libs.ktor.client.darwin)
        }

        desktopMain.dependencies {
            implementation(compose.desktop.currentOs)
            implementation(libs.androidx.lifecycle.viewmodel.compose)
            implementation(libs.ktor.client.okhttp)
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-swing:1.8.1")
        }
    }
}

android {
    namespace = "com.onthefly.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.onthefly.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86_64")
        }
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    externalNativeBuild {
        cmake {
            path = file("src/androidMain/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    sourceSets["main"].assets.srcDirs("src/androidMain/assets")
}

// Copy scripts from devserver to Android assets
val copyScriptsToAssets by tasks.registering(Copy::class) {
    from(rootProject.file("devserver/scripts"))
    into(layout.projectDirectory.dir("src/androidMain/assets/scripts"))
    exclude("*.pyc", "__pycache__")
}

tasks.named("preBuild") {
    dependsOn(copyScriptsToAssets)
}

compose.desktop {
    application {
        mainClass = "com.onthefly.app.MainKt"

        jvmArgs += listOf(
            "-Donthefly.native.dir=${rootProject.projectDir}/native/build"
        )

        nativeDistributions {
            targetFormats(TargetFormat.Dmg, TargetFormat.Msi, TargetFormat.Deb)
            packageName = "OnTheFly"
            packageVersion = "1.0.0"
            appResourcesRootDir.set(project.layout.projectDirectory.dir("resources"))
        }
    }
}

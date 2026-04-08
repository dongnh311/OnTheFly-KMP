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
    }

    jvm("desktop")

    sourceSets {
        val desktopMain by getting

        commonMain.dependencies {
            implementation(projects.ontheflyEngine)
            implementation(compose.runtime)
            implementation(compose.material3)
            implementation(libs.navigation.compose)
        }

        androidMain.dependencies {
            implementation(compose.preview)
            implementation(libs.androidx.activity.compose)
        }

        desktopMain.dependencies {
            implementation(compose.desktop.currentOs)
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

    sourceSets["main"].assets.srcDirs("src/androidMain/assets")
}

// Copy scripts from devserver to Android assets (flatten screens/ into root)
// Note: Android AAPT ignores dirs starting with '_', so rename _base→base, _libs→libs
val copyScriptsToAssets by tasks.registering {
    doLast {
        val assetsDir = layout.projectDirectory.dir("src/androidMain/assets/scripts").asFile
        val scriptsDir = rootProject.file("devserver/scripts")

        // Rename _base/_libs to base/libs to avoid AAPT exclusion
        mapOf("_base" to "base", "_libs" to "libs", "languages" to "languages").forEach { (src, dst) ->
            val srcDir = File(scriptsDir, src)
            if (srcDir.exists()) srcDir.copyRecursively(File(assetsDir, dst), overwrite = true)
        }
        val versionJson = File(scriptsDir, "version.json")
        if (versionJson.exists()) versionJson.copyTo(File(assetsDir, "version.json"), overwrite = true)

        val screensDir = File(scriptsDir, "screens")
        if (screensDir.exists()) {
            screensDir.listFiles()?.filter { it.isDirectory }?.forEach { bundle ->
                bundle.copyRecursively(File(assetsDir, bundle.name), overwrite = true)
            }
        }
    }
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

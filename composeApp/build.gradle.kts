import org.jetbrains.compose.desktop.application.dsl.TargetFormat
import org.jetbrains.kotlin.gradle.ExperimentalKotlinGradlePluginApi
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.util.zip.ZipOutputStream
import java.util.zip.ZipEntry

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

// Zip scripts from devserver into a single scripts.zip in Android assets.
// At runtime, the app extracts this zip to local storage on first launch or version update.
val zipScriptsToAssets by tasks.registering {
    doLast {
        val assetsDir = layout.projectDirectory.dir("src/androidMain/assets").asFile
        assetsDir.mkdirs()
        val zipFile = File(assetsDir, "scripts.zip")
        val scriptsDir = rootProject.file("devserver/scripts")

        // Clean old individual-file assets if they exist (migration from old copy approach)
        val oldScriptsDir = File(assetsDir, "scripts")
        if (oldScriptsDir.exists()) oldScriptsDir.deleteRecursively()

        fun addFileToZip(zos: ZipOutputStream, file: File, entryName: String) {
            zos.putNextEntry(ZipEntry(entryName))
            file.inputStream().use { it.copyTo(zos) }
            zos.closeEntry()
        }

        fun addDirToZip(zos: ZipOutputStream, dir: File, prefix: String) {
            dir.walkTopDown().filter { it.isFile }.forEach { file ->
                val entryName = "$prefix/${file.relativeTo(dir).path}"
                addFileToZip(zos, file, entryName)
            }
        }

        var entryCount = 0
        ZipOutputStream(zipFile.outputStream().buffered()).use { zos ->
            // version.json at root
            val versionJson = File(scriptsDir, "version.json")
            if (versionJson.exists()) {
                addFileToZip(zos, versionJson, "version.json")
                entryCount++
            }

            // Special dirs: _base, _libs, languages (kept with original names, no AAPT issue in zip)
            listOf("_base", "_libs", "languages").forEach { dir ->
                val srcDir = File(scriptsDir, dir)
                if (srcDir.exists() && srcDir.isDirectory) {
                    val before = entryCount
                    srcDir.walkTopDown().filter { it.isFile }.forEach { file ->
                        val entryName = "$dir/${file.relativeTo(srcDir).path}"
                        addFileToZip(zos, file, entryName)
                        entryCount++
                    }
                }
            }

            // Screen bundles (flattened: screens/stock-login → stock-login)
            val screensDir = File(scriptsDir, "screens")
            if (screensDir.exists()) {
                screensDir.listFiles()?.filter { it.isDirectory }?.forEach { bundle ->
                    addDirToZip(zos, bundle, bundle.name)
                    entryCount += bundle.walkTopDown().filter { it.isFile }.count()
                }
            }
        }

        println("Created scripts.zip (${zipFile.length() / 1024}KB, $entryCount entries)")
    }
}

tasks.named("preBuild") {
    dependsOn(zipScriptsToAssets)
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

import com.vanniktech.maven.publish.SonatypeHost
import org.jetbrains.kotlin.gradle.ExperimentalKotlinGradlePluginApi
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
    alias(libs.plugins.compose.multiplatform)
    alias(libs.plugins.kotlin.compose)
    id("com.vanniktech.maven.publish") version "0.30.0"
}

group = "io.github.dongnh311"
version = project.findProperty("VERSION_NAME") as String? ?: "1.0.0"

// The Maven Central publish workflow runs on ubuntu-latest and skips the iOS
// targets because the QuickJS cinterop expects Rust-built static libraries
// under native/rust/ios_libs/ which are not committed. Pass -PskipIos for the
// publish to succeed; local dev leaves iOS enabled.
val skipIos = project.hasProperty("skipIos")

kotlin {
    androidTarget {
        @OptIn(ExperimentalKotlinGradlePluginApi::class)
        compilerOptions { jvmTarget.set(JvmTarget.JVM_17) }
        publishLibraryVariants("release")
    }

    if (!skipIos) {
        listOf(iosX64(), iosArm64(), iosSimulatorArm64()).forEach { iosTarget ->
            iosTarget.binaries.framework {
                baseName = "OnTheFlyEngine"
                isStatic = true
            }
            iosTarget.compilations.getByName("main") {
                cinterops {
                    val quickjs by creating {
                        defFile(project.file("src/nativeInterop/cinterop/quickjs.def"))
                        val targetName = iosTarget.name
                        compilerOpts(
                            "-I${rootProject.projectDir}/native/ios",
                        )
                        extraOpts("-libraryPath", "${rootProject.projectDir}/native/rust/ios_libs/$targetName")
                    }
                }
            }
            iosTarget.binaries.all {
                val targetName = iosTarget.name
                linkerOpts("-L${rootProject.projectDir}/native/rust/ios_libs/$targetName", "-lonthefly_engine")
            }
        }
    }

    jvm("desktop")

    sourceSets {
        val desktopMain by getting

        commonMain.dependencies {
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(compose.materialIconsExtended)
            implementation(compose.ui)
            implementation(compose.components.resources)
            implementation(libs.androidx.lifecycle.viewmodel.compose)
            implementation(libs.androidx.lifecycle.runtime.compose)
            implementation(libs.ktor.client.core)
            implementation(libs.ktor.client.websockets)
            implementation(libs.kotlinx.datetime)
            implementation(libs.coil.compose)
            implementation(libs.coil.network.ktor2)
        }

        commonTest.dependencies {
            implementation(kotlin("test"))
        }

        androidMain.dependencies {
            implementation(libs.ktor.client.okhttp)
        }

        if (!skipIos) {
            iosMain.dependencies {
                implementation(libs.ktor.client.darwin)
            }
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
    namespace = "com.onthefly.engine"
    compileSdk = 36
    defaultConfig {
        minSdk = 24
        ndk { abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86_64") }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    sourceSets["main"].jniLibs.srcDirs("src/androidMain/jniLibs")
}

mavenPublishing {
    publishToMavenCentral(SonatypeHost.CENTRAL_PORTAL, automaticRelease = true)
    signAllPublications()

    coordinates(
        groupId = project.group.toString(),
        artifactId = "onthefly-engine",
        version = project.version.toString(),
    )

    pom {
        name.set("OnTheFly Engine")
        description.set("Dynamic UI engine for Kotlin Multiplatform — renders native Compose widgets from JavaScript via QuickJS")
        inceptionYear.set("2026")
        url.set("https://github.com/dongnh311/OnTheFly-KMP")
        licenses {
            license {
                name.set("Apache-2.0")
                url.set("https://www.apache.org/licenses/LICENSE-2.0.txt")
                distribution.set("repo")
            }
        }
        developers {
            developer {
                id.set("dongnh311")
                name.set("DongNH")
                email.set("hoaidongit5@gmail.com")
                url.set("https://github.com/dongnh311")
            }
        }
        scm {
            url.set("https://github.com/dongnh311/OnTheFly-KMP")
            connection.set("scm:git:git://github.com/dongnh311/OnTheFly-KMP.git")
            developerConnection.set("scm:git:ssh://git@github.com/dongnh311/OnTheFly-KMP.git")
        }
    }
}

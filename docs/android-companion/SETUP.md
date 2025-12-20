# FamCal Android Development Setup

Guide for setting up the development environment and building the FamCal Android app.

## Prerequisites

### Required Software

| Software | Minimum Version | Download |
|----------|-----------------|----------|
| Android Studio | Hedgehog (2023.1.1) or later | [developer.android.com](https://developer.android.com/studio) |
| JDK | 17 | Bundled with Android Studio |
| Android SDK | 34 (Android 14) | Via Android Studio SDK Manager |
| Kotlin | 1.9.0+ | Bundled with Android Studio |

### Hardware Requirements

- **Development Machine**: macOS, Windows, or Linux
- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 10GB for Android Studio + SDKs
- **Android Device or Emulator**: API 26+ (Android 8.0+)

---

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/famcal-android.git
cd famcal-android
```

### 2. Open in Android Studio

1. Launch Android Studio
2. Select "Open an Existing Project"
3. Navigate to `famcal-android` folder
4. Click "Open"
5. Wait for Gradle sync to complete

### 3. SDK Configuration

If prompted, install required SDK components:
- Android SDK Platform 34
- Android SDK Build-Tools 34.0.0
- Android Emulator (if testing on emulator)

---

## Project Structure

```
famcal-android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/famcal/android/
│   │   │   ├── res/
│   │   │   └── AndroidManifest.xml
│   │   ├── test/           # Unit tests
│   │   └── androidTest/    # Instrumented tests
│   └── build.gradle.kts
├── build.gradle.kts        # Root build file
├── settings.gradle.kts
├── gradle.properties
└── docs/
```

---

## Build Configuration

### build.gradle.kts (Project Level)

```kotlin
plugins {
    id("com.android.application") version "8.2.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.21" apply false
    id("com.google.dagger.hilt.android") version "2.50" apply false
}
```

### build.gradle.kts (App Level)

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    id("kotlin-kapt")
}

android {
    namespace = "com.famcal.android"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.famcal.android"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            buildConfigField("String", "DEFAULT_SERVER_URL", "\"http://192.168.1.100:3000\"")
        }
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            buildConfigField("String", "DEFAULT_SERVER_URL", "\"\"")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.7"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Compose BOM
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.6")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.50")
    kapt("com.google.dagger:hilt-compiler:2.50")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.0")
    kapt("com.squareup.moshi:moshi-kotlin-codegen:1.15.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Image Loading
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Date/Time
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.5.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("app.cash.turbine:turbine:1.0.0")

    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2024.01.00"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}

kapt {
    correctErrorTypes = true
}
```

### settings.gradle.kts

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "FamCal"
include(":app")
```

### gradle.properties

```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
```

---

## Running the App

### On Emulator

1. Create an emulator in Android Studio:
   - Tools > Device Manager > Create Device
   - Choose Pixel 7 (or similar)
   - Select system image: API 34 (Android 14)
   - Finish setup

2. Start the emulator

3. Run the app:
   - Click the green "Run" button
   - Or use terminal: `./gradlew installDebug`

### On Physical Device

1. Enable Developer Options on your Android device:
   - Settings > About Phone > Tap "Build Number" 7 times

2. Enable USB Debugging:
   - Settings > Developer Options > USB Debugging

3. Connect device via USB

4. Accept the debugging prompt on your device

5. Run the app from Android Studio

### Network Configuration for Emulator

If testing with a local FamCal server:

```bash
# Forward port from emulator to host
adb reverse tcp:3000 tcp:3000
```

Then use `http://10.0.2.2:3000` as the server address (10.0.2.2 is the emulator's alias for the host machine).

---

## Building for Release

### 1. Create Signing Key

```bash
keytool -genkey -v -keystore famcal-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias famcal
```

### 2. Configure Signing in build.gradle.kts

```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file("famcal-release-key.jks")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = "famcal"
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            // ... other config
        }
    }
}
```

### 3. Build Release APK

```bash
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/release/app-release.apk`

### 4. Build Release Bundle (for Play Store)

```bash
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab`

---

## Testing

### Unit Tests

```bash
# Run all unit tests
./gradlew test

# Run specific test class
./gradlew test --tests "com.famcal.android.ChoresViewModelTest"

# Run with coverage
./gradlew testDebugUnitTestCoverage
```

### Instrumented Tests

```bash
# Run on connected device/emulator
./gradlew connectedAndroidTest

# Run specific test
./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.famcal.android.ChoresScreenTest
```

### Compose UI Tests

```kotlin
@RunWith(AndroidJUnit4::class)
class ChoresScreenTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun choresListDisplaysCorrectly() {
        composeTestRule.setContent {
            ChoresScreen(
                uiState = ChoresUiState(
                    isLoading = false,
                    chores = listOf(
                        Chore(id = "1", title = "Make Bed", points = 5)
                    )
                )
            )
        }

        composeTestRule.onNodeWithText("Make Bed").assertIsDisplayed()
        composeTestRule.onNodeWithText("5 pts").assertIsDisplayed()
    }
}
```

---

## Code Style

### Kotlin Style Guide

Follow the [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html).

Key points:
- Use 4 spaces for indentation
- Max line length: 120 characters
- Use trailing commas
- Prefer expression bodies for simple functions

### Compose Best Practices

1. **State hoisting**: Keep state in ViewModels
2. **Composable naming**: Use PascalCase, describe what it displays
3. **Modifier parameter**: Always accept and apply Modifier parameter
4. **Preview annotations**: Add previews for all screens

```kotlin
@Composable
fun ChoreItem(
    chore: Chore,
    onComplete: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Implementation
}

@Preview(showBackground = true)
@Composable
private fun ChoreItemPreview() {
    FamCalTheme {
        ChoreItem(
            chore = Chore(id = "1", title = "Make Bed", points = 5),
            onComplete = {}
        )
    }
}
```

### Linting

```bash
# Run lint
./gradlew lint

# Run ktlint
./gradlew ktlintCheck
./gradlew ktlintFormat
```

---

## Debugging

### Logging

```kotlin
// Use Timber for logging
Timber.d("Loading chores for member: %s", memberId)
Timber.e(exception, "Failed to complete chore")
```

### Network Debugging

HTTP logging is enabled in debug builds via OkHttp's logging interceptor.

View logs in Logcat with tag filter: `OkHttp`

### Compose Debugging

```kotlin
// Add to debug performance issues
@Composable
fun ChoresList() {
    SideEffect {
        Timber.d("ChoresList recomposed")
    }
    // ...
}
```

---

## Troubleshooting

### Common Issues

**Gradle Sync Failed**
```bash
# Clean and rebuild
./gradlew clean
./gradlew build
```

**Hilt Compilation Errors**
- Ensure all `@HiltViewModel` classes are in the correct package
- Verify `@AndroidEntryPoint` is on Activity
- Clean build: `./gradlew clean`

**Emulator Network Issues**
```bash
# Use host loopback from emulator
adb reverse tcp:3000 tcp:3000
# Server address: http://10.0.2.2:3000
```

**Compose Preview Not Loading**
- File > Invalidate Caches and Restart
- Ensure all preview functions have `@Preview` annotation

---

## Environment Variables

Create a `local.properties` file (not committed to git):

```properties
# Signing
KEYSTORE_PASSWORD=your_password
KEY_PASSWORD=your_key_password

# Development
DEFAULT_SERVER_URL=http://192.168.1.100:3000
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/android.yml
name: Android CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Setup Gradle
      uses: gradle/actions/setup-gradle@v3

    - name: Run Tests
      run: ./gradlew test

    - name: Build Debug APK
      run: ./gradlew assembleDebug

    - name: Upload APK
      uses: actions/upload-artifact@v4
      with:
        name: app-debug
        path: app/build/outputs/apk/debug/app-debug.apk
```

---

## Resources

- [Android Developer Documentation](https://developer.android.com/docs)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [Hilt Dependency Injection](https://developer.android.com/training/dependency-injection/hilt-android)
- [Retrofit](https://square.github.io/retrofit/)
- [Material Design 3](https://m3.material.io/)

@echo off
:: --------------------------------------------------------------
::  Build Release APK (signed with lifecare-release.keystore)
:: --------------------------------------------------------------

:: 1️⃣ ضبط JAVA_HOME إذا لم يكن مضبوطة
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"

:: 2️⃣ الانتقال إلى مجلد android
cd /d "%~dp0"

:: 3️⃣ تنظيف المشروع
call gradlew clean

:: 4️⃣ توليد ملفات codegen المطلوبة للمعمارية الجديدة
call gradlew generateCodegenArtifactsFromSchema

:: 5️⃣ إنشاء APK الإصدار
call gradlew assembleRelease

:: 6️⃣ إظهار مسار ملف APK الناتج
set "APK_PATH=%cd%\app\build\outputs\apk\release\app-release.apk"
if exist "%APK_PATH%" (
    echo.
    echo ==========================================================
    echo تم إنشاء APK بنجاح:
    echo %APK_PATH%
    echo ==========================================================
) else (
    echo [!] لم يتم العثور على ملف APK في المسار المتوقع.
)

pause

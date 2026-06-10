@echo off
set "KEYTOOL=C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
set "KEYSTORE=C:\Users\pc\Desktop\life care\life-care-app\android\app\lifecare-release.keystore"
"%KEYTOOL%" -genkeypair -v -keystore "%KEYSTORE%" -alias ahmedshibl -keyalg RSA -keysize 2048 -validity 10000 -storepass lifecare2026 -keypass lifecare2026 -dname "CN=LifeCare, OU=Dev, O=LifeCare, L=City, S=State, C=EG"

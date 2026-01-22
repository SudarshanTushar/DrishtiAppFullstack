@echo off
REM Mesh Network Quick Test Script
REM Run this to build and deploy to connected Android device

echo 🚀 Building Mesh Network App...
echo.

cd frontend

echo 📦 Syncing Capacitor...
call npx cap sync android

echo.
echo 🔨 Opening Android Studio...
call npx cap open android

echo.
echo ✅ Android Studio opened!
echo.
echo 📱 Next steps:
echo 1. Wait for Gradle sync to complete in Android Studio
echo 2. Click Run or Build APK
echo 3. Install on two Android phones
echo 4. Enable Airplane Mode on both
echo 5. Keep Bluetooth ON, Wi-Fi ON
echo 6. Open app on both devices
echo 7. Navigate to Mesh Test screen
echo 8. Tap "Start Mesh" on both
echo 9. Wait 10-15 seconds
echo 10. Send messages between devices
echo.
echo 🐛 Debug commands:
echo    adb logcat ^| findstr MeshService    # View mesh logs
echo    adb logcat ^| findstr Mesh           # View all mesh logs
echo.
echo 📖 Documentation:
echo    MESH_DTN_IMPLEMENTATION.md           # Full technical docs
echo    MESH_INTEGRATION_GUIDE.md            # Integration examples
echo    MESH_IMPLEMENTATION_SUMMARY.md       # Implementation summary
echo.

pause

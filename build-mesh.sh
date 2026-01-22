#!/bin/bash
# Mesh Network Quick Test Script
# Run this to build and deploy to connected Android device

echo "🚀 Building Mesh Network App..."

cd frontend

echo "📦 Syncing Capacitor..."
npx cap sync android

echo "🔨 Building Android app..."
npx cap build android

echo "✅ Build complete!"
echo ""
echo "📱 Next steps:"
echo "1. Connect two Android phones via USB"
echo "2. Run: adb devices (verify both connected)"
echo "3. Install APK on both devices"
echo "4. Enable Airplane Mode on both"
echo "5. Keep Bluetooth ON, Wi-Fi ON"
echo "6. Open app on both devices"
echo "7. Navigate to Mesh Test screen"
echo "8. Tap 'Start Mesh' on both"
echo "9. Wait 10-15 seconds"
echo "10. Send messages between devices"
echo ""
echo "🐛 Debug commands:"
echo "   adb logcat | grep MeshService    # View mesh logs"
echo "   adb logcat | grep Mesh           # View all mesh related logs"
echo ""
echo "📖 Docs:"
echo "   MESH_DTN_IMPLEMENTATION.md       # Full technical docs"
echo "   MESH_INTEGRATION_GUIDE.md        # Integration examples"
echo "   MESH_IMPLEMENTATION_SUMMARY.md   # This implementation summary"

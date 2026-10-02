// Capturing is now done via the <ViewShot> component's .capture() method
// directly inside DashboardView.tsx.
// react-native-view-shot@4.0.3's captureRef() is broken on Fabric
// (Expo SDK 54 / RN 0.81 New Architecture), so we use the component API.
export {};

import type { CapacitorConfig } from "@capacitor/cli";

const appUrl =
  process.env.CAPACITOR_SERVER_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://spark-social-media.vercel.app";

const config: CapacitorConfig = {
  appId: "com.spark.social",
  appName: "Spark",
  webDir: "public",
  server: {
    url: `${appUrl.replace(/\/$/, "")}/login`,
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      backgroundColor: "#0a0a0a",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0a",
      overlaysWebView: false,
    },
  },
};

export default config;

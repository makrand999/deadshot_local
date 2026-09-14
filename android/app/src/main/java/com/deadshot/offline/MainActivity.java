package com.deadshot.offline;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import java.io.File;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {
    private static final String TAG = "DeadshotOffline";
    private static final String SERVER_URL = "http://127.0.0.1:8080/";

    private WebView webView;
    private FrameLayout splashLayout;
    private TextView statusTextView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean serverReady = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen on during gameplay
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Root layout
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);

        // Game WebView
        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d("GAME_CONSOLE", "[" + consoleMessage.messageLevel() + "] "
                        + consoleMessage.message() + " ("
                        + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber() + ")");
                return true;
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
                    return false;
                }
                try {
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(browserIntent);
                } catch (Exception ignored) {}
                return true;
            }
        });

        // Add dummy MobileApp interface for game compatibility
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void receiveMessage(String message) {
                Log.d(TAG, "MobileApp.receiveMessage: " + message);
            }

            @JavascriptInterface
            public void requestRewardAd(String nonce) {
                Log.d(TAG, "MobileApp.requestRewardAd: " + nonce);
            }

            @JavascriptInterface
            public void openInChrome(String url) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                } catch (Exception e) {
                    Log.e(TAG, "Error opening external URL: " + e.getMessage());
                }
            }
        }, "MobileApp");

        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        // Splash / Loading overlay
        splashLayout = new FrameLayout(this);
        splashLayout.setBackgroundColor(Color.parseColor("#121212"));

        FrameLayout.LayoutParams centerParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT);
        centerParams.gravity = android.view.Gravity.CENTER;

        android.widget.LinearLayout loadingBox = new android.widget.LinearLayout(this);
        loadingBox.setOrientation(android.widget.LinearLayout.VERTICAL);
        loadingBox.setGravity(android.view.Gravity.CENTER);

        ProgressBar spinner = new ProgressBar(this);
        loadingBox.addView(spinner);

        statusTextView = new TextView(this);
        statusTextView.setText("Initializing Deadshot Offline...");
        statusTextView.setTextColor(Color.WHITE);
        statusTextView.setTextSize(16f);
        statusTextView.setPadding(0, 32, 0, 0);
        loadingBox.addView(statusTextView);

        splashLayout.addView(loadingBox, centerParams);
        root.addView(splashLayout, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        setContentView(root);
        makeFullScreen();

        // Begin background initialization
        startBackgroundInitialization();
    }

    private void makeFullScreen() {
        if (getWindow() == null) return;
        View decorView = getWindow().peekDecorView();
        if (decorView == null) {
            getWindow().getDecorView().post(this::makeFullScreen);
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            final WindowInsetsController insetsController = getWindow().getInsetsController();
            if (insetsController != null) {
                insetsController.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                insetsController.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            decorView.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            makeFullScreen();
        }
    }

    private void updateStatus(final String text) {
        mainHandler.post(() -> {
            if (statusTextView != null) {
                statusTextView.setText(text);
            }
        });
    }

    private void startBackgroundInitialization() {
        new Thread(() -> {
            updateStatus("Preparing game assets...");
            boolean ok = AssetHelper.copyAssetsIfNeeded(MainActivity.this, MainActivity.this::updateStatus);
            if (!ok) {
                updateStatus("Failed to extract game assets!");
                return;
            }

            updateStatus("Starting local Node.js server...");
            File filesDir = getFilesDir();
            File serverScript = new File(filesDir, "server/server.bundle.mjs");
            File clientDir = new File(filesDir, "client");
            File rawDir = new File(filesDir, "raw");

            // Build node launch arguments
            String[] nodeArgs = new String[]{
                    "node",
                    "-e",
                    "process.env.GP_CLIENT_DIR=" + quote(clientDir.getAbsolutePath()) + ";" +
                    "process.env.GP_RAW_DIR=" + quote(rawDir.getAbsolutePath()) + ";" +
                    "import(" + quote(serverScript.getAbsolutePath()) + ");"
            };

            NodeRunner.start(nodeArgs, filesDir.getAbsolutePath());

            // Poll until server responds
            updateStatus("Waiting for local server...");
            pollServerUntilReady();
        }, "DeadshotInitThread").start();
    }

    private static String quote(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private void pollServerUntilReady() {
        int attempts = 0;
        final int maxAttempts = 60; // 30 seconds max
        while (attempts < maxAttempts && !serverReady) {
            attempts++;
            try {
                URL url = new URL(SERVER_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(600);
                conn.setReadTimeout(600);
                conn.setRequestMethod("GET");
                int responseCode = conn.getResponseCode();
                conn.disconnect();

                if (responseCode == 200) {
                    Log.i(TAG, "Local server is up and responding with HTTP 200!");
                    serverReady = true;
                    mainHandler.post(this::onServerReady);
                    return;
                }
            } catch (Exception ignored) {
                // Server still booting
            }

            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                break;
            }
        }

        if (!serverReady) {
            updateStatus("Server failed to start in time. Check logcat for NODEJS-MOBILE.");
        }
    }

    private void onServerReady() {
        if (splashLayout != null) {
            splashLayout.setVisibility(View.GONE);
        }
        Log.i(TAG, "Loading " + SERVER_URL + " into WebView...");
        webView.loadUrl(SERVER_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}

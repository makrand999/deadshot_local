package com.deadshot.offline;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
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
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.Socket;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final String TAG = "DeadshotOffline";
    private static final String PREFS_NAME = "DeadshotClientPrefs";
    private static final String KEY_LAST_SERVER = "last_server_url";
    private static final String DEFAULT_LOCAL_SERVER = "http://127.0.0.1:8080/";

    private WebView webView;
    private FrameLayout splashLayout;
    private TextView statusTextView;
    private ProgressBar spinner;
    private LinearLayout serverChooserBox;
    private EditText ipInputField;
    private Button scanLanButton;
    private Button connectLanButton;
    private Button hostSoloButton;
    private TextView serverIndicatorBadge;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private volatile boolean serverReady = false;
    private volatile String currentServerUrl = DEFAULT_LOCAL_SERVER;
    private SharedPreferences prefs;

    // Cross-Server Settings Persistence Bridge
    public class SettingsBridge {
        @JavascriptInterface
        public String getStoredValue(String key) {
            return prefs.getString("game_pref_" + key, "");
        }

        @JavascriptInterface
        public void saveStoredValue(String key, String value) {
            Log.d(TAG, "Persisting setting '" + key + "' to global app preferences");
            prefs.edit().putString("game_pref_" + key, value).apply();
        }

        @JavascriptInterface
        public String getAllStoredValuesJson() {
            try {
                JSONObject obj = new JSONObject();
                String[] syncKeys = new String[]{"settings", "mobilelayout", "keyb", "onboarded", "dses"};
                for (String k : syncKeys) {
                    String v = prefs.getString("game_pref_" + k, null);
                    if (v != null) {
                        obj.put(k, v);
                    }
                }
                return obj.toString();
            } catch (Exception e) {
                return "{}";
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        currentServerUrl = prefs.getString(KEY_LAST_SERVER, DEFAULT_LOCAL_SERVER);

        // Check if a specific server was passed via Intent
        Intent launchIntent = getIntent();
        if (launchIntent != null && launchIntent.hasExtra("server_url")) {
            String passedUrl = launchIntent.getStringExtra("server_url");
            if (passedUrl != null && !passedUrl.isEmpty()) {
                currentServerUrl = passedUrl;
                saveServerUrl(passedUrl);
            }
        }

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
                try {
                    Uri reqUri = Uri.parse(url);
                    Uri currentUri = Uri.parse(currentServerUrl);
                    if (reqUri.getHost() != null && reqUri.getHost().equalsIgnoreCase(currentUri.getHost())) {
                        return false;
                    }
                    if ("127.0.0.1".equals(reqUri.getHost()) || "localhost".equals(reqUri.getHost())) {
                        return false;
                    }
                } catch (Exception ignored) {}

                try {
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(browserIntent);
                } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                injectSettingsBridge();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectSettingsBridge();
            }
        });

        // Add AndroidSettingsBridge for seamless cross-server settings preservation
        webView.addJavascriptInterface(new SettingsBridge(), "AndroidSettingsBridge");

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

        // Floating Server Indicator / Switcher badge (top right)
        serverIndicatorBadge = new TextView(this);
        serverIndicatorBadge.setText("SERVER");
        serverIndicatorBadge.setTextColor(Color.parseColor("#8b949e"));
        serverIndicatorBadge.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10);
        serverIndicatorBadge.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        GradientDrawable badgeBg = new GradientDrawable();
        badgeBg.setColor(Color.parseColor("#cc161b22"));
        badgeBg.setCornerRadius(dp(6));
        badgeBg.setStroke(1, Color.parseColor("#30363d"));
        serverIndicatorBadge.setBackground(badgeBg);
        serverIndicatorBadge.setPadding(dp(8), dp(4), dp(8), dp(4));
        FrameLayout.LayoutParams badgeParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT);
        badgeParams.gravity = Gravity.TOP | Gravity.END;
        badgeParams.topMargin = dp(10);
        badgeParams.rightMargin = dp(10);
        serverIndicatorBadge.setOnClickListener(v -> showServerSwitchPrompt());
        root.addView(serverIndicatorBadge, badgeParams);

        // Splash / Loading overlay
        splashLayout = new FrameLayout(this);
        splashLayout.setBackgroundColor(Color.parseColor("#0d1117"));

        FrameLayout.LayoutParams centerParams = new FrameLayout.LayoutParams(
                dp(340), FrameLayout.LayoutParams.WRAP_CONTENT);
        centerParams.gravity = Gravity.CENTER;

        LinearLayout loadingBox = new LinearLayout(this);
        loadingBox.setOrientation(LinearLayout.VERTICAL);
        loadingBox.setGravity(Gravity.CENTER_HORIZONTAL);
        loadingBox.setPadding(dp(16), dp(16), dp(16), dp(16));

        TextView appTitle = new TextView(this);
        appTitle.setText("DEADSHOT");
        appTitle.setTextColor(Color.parseColor("#58a6ff"));
        appTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 24);
        appTitle.setTypeface(Typeface.DEFAULT_BOLD);
        appTitle.setPadding(0, 0, 0, dp(12));
        loadingBox.addView(appTitle);

        spinner = new ProgressBar(this);
        loadingBox.addView(spinner);

        statusTextView = new TextView(this);
        statusTextView.setText("Checking Deadshot Server...");
        statusTextView.setTextColor(Color.WHITE);
        statusTextView.setTextSize(14f);
        statusTextView.setGravity(Gravity.CENTER_HORIZONTAL);
        statusTextView.setPadding(0, dp(14), 0, dp(14));
        loadingBox.addView(statusTextView);

        // Server Chooser Panel (initially hidden, shown if no auto-detected server)
        serverChooserBox = buildServerChooserLayout();
        serverChooserBox.setVisibility(View.GONE);
        loadingBox.addView(serverChooserBox);

        splashLayout.addView(loadingBox, centerParams);
        root.addView(splashLayout, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        setContentView(root);
        makeFullScreen();

        // Begin server connection checks
        initiateServerConnection();
    }

    private void injectSettingsBridge() {
        String script = "(function(){\n" +
                "  try {\n" +
                "    if (window.AndroidSettingsBridge) {\n" +
                "      var raw = window.AndroidSettingsBridge.getAllStoredValuesJson();\n" +
                "      if (raw) {\n" +
                "        var allStored = JSON.parse(raw);\n" +
                "        for (var k in allStored) {\n" +
                "          if (!localStorage.getItem(k) && allStored[k]) {\n" +
                "            console.log('[AndroidSettingsBridge] Restored: ' + k);\n" +
                "            localStorage.setItem(k, allStored[k]);\n" +
                "          }\n" +
                "        }\n" +
                "      }\n" +
                "      var syncKeys = ['settings', 'mobilelayout', 'keyb', 'onboarded', 'dses'];\n" +
                "      for (var i = 0; i < syncKeys.length; i++) {\n" +
                "        var key = syncKeys[i];\n" +
                "        var localVal = localStorage.getItem(key);\n" +
                "        if (localVal) {\n" +
                "          window.AndroidSettingsBridge.saveStoredValue(key, localVal);\n" +
                "        }\n" +
                "      }\n" +
                "      if (!window.__dsSetItemHooked) {\n" +
                "        window.__dsSetItemHooked = true;\n" +
                "        var orig = localStorage.setItem.bind(localStorage);\n" +
                "        localStorage.setItem = function(k, v) {\n" +
                "          orig(k, v);\n" +
                "          try {\n" +
                "            if (syncKeys.indexOf(k) !== -1 && window.AndroidSettingsBridge) {\n" +
                "              window.AndroidSettingsBridge.saveStoredValue(k, String(v));\n" +
                "            }\n" +
                "          } catch(e) {}\n" +
                "        };\n" +
                "      }\n" +
                "    }\n" +
                "  } catch(e) { console.error('[AndroidSettingsBridge] error:', e); }\n" +
                "})();";
        webView.evaluateJavascript(script, null);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null && intent.hasExtra("server_url")) {
            String target = intent.getStringExtra("server_url");
            if (target != null && !target.isEmpty()) {
                testAndConnect(target);
            }
        }
    }

    private LinearLayout buildServerChooserLayout() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_HORIZONTAL);

        GradientDrawable boxBg = new GradientDrawable();
        boxBg.setColor(Color.parseColor("#161b22"));
        boxBg.setCornerRadius(dp(12));
        boxBg.setStroke(1, Color.parseColor("#30363d"));
        box.setBackground(boxBg);
        box.setPadding(dp(14), dp(14), dp(14), dp(14));

        TextView chooseTitle = new TextView(this);
        chooseTitle.setText("SELECT SERVER CONNECTION");
        chooseTitle.setTextColor(Color.parseColor("#8b949e"));
        chooseTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        chooseTitle.setTypeface(Typeface.DEFAULT_BOLD);
        chooseTitle.setPadding(0, 0, 0, dp(10));
        box.addView(chooseTitle);

        // Host on this device button
        hostSoloButton = createStyledButton("HOST ON THIS DEVICE (SERVER APP)", "#238636", "#ffffff");
        hostSoloButton.setOnClickListener(v -> {
            serverChooserBox.setVisibility(View.GONE);
            spinner.setVisibility(View.VISIBLE);
            launchDedicatedServerAndConnect();
        });
        box.addView(hostSoloButton, matchWrapParams());

        TextView orText = new TextView(this);
        orText.setText("— OR JOIN DEDICATED SERVER ON LAN —");
        orText.setTextColor(Color.parseColor("#6e7681"));
        orText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10);
        orText.setGravity(Gravity.CENTER_HORIZONTAL);
        orText.setPadding(0, dp(12), 0, dp(8));
        box.addView(orText);

        // IP input field
        ipInputField = new EditText(this);
        String savedHost = currentServerUrl.replace("http://", "").replace("/", "");
        if (savedHost.startsWith("127.0.0.1") || savedHost.startsWith("localhost")) {
            savedHost = getLocalSubnetPrefix() + "xxx:8080";
        }
        ipInputField.setText(savedHost);
        ipInputField.setTextColor(Color.WHITE);
        ipInputField.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        ipInputField.setTypeface(Typeface.MONOSPACE);
        ipInputField.setSingleLine(true);
        ipInputField.setHint("10.x.x.x:8080");
        ipInputField.setHintTextColor(Color.parseColor("#484f58"));
        GradientDrawable inputBg = new GradientDrawable();
        inputBg.setColor(Color.parseColor("#0d1117"));
        inputBg.setCornerRadius(dp(6));
        inputBg.setStroke(1, Color.parseColor("#30363d"));
        ipInputField.setBackground(inputBg);
        ipInputField.setPadding(dp(10), dp(8), dp(10), dp(8));
        box.addView(ipInputField, matchWrapParams());

        // Buttons row: Connect & Scan LAN
        LinearLayout btnRow = new LinearLayout(this);
        btnRow.setOrientation(LinearLayout.HORIZONTAL);
        btnRow.setPadding(0, dp(10), 0, 0);

        connectLanButton = createStyledButton("CONNECT", "#1f6feb", "#ffffff");
        connectLanButton.setOnClickListener(v -> {
            String target = ipInputField.getText().toString().trim();
            if (!target.startsWith("http://") && !target.startsWith("https://")) {
                target = "http://" + target;
            }
            if (!target.endsWith("/")) {
                target = target + "/";
            }
            final String finalUrl = target;
            serverChooserBox.setVisibility(View.GONE);
            spinner.setVisibility(View.VISIBLE);
            updateStatus("Connecting to " + finalUrl + "...");
            testAndConnect(finalUrl);
        });
        btnRow.addView(connectLanButton, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.2f));

        View spacer = new View(this);
        btnRow.addView(spacer, new LinearLayout.LayoutParams(dp(8), ViewGroup.LayoutParams.MATCH_PARENT));

        scanLanButton = createStyledButton("SCAN LAN", "#21262d", "#c9d1d9");
        scanLanButton.setOnClickListener(v -> scanLanServers());
        btnRow.addView(scanLanButton, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        box.addView(btnRow, matchWrapParams());
        return box;
    }

    private LinearLayout.LayoutParams matchWrapParams() {
        return new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
    }

    private Button createStyledButton(String text, String bgHex, String textHex) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextColor(Color.parseColor(textHex));
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor(bgHex));
        bg.setCornerRadius(dp(6));
        b.setBackground(bg);
        b.setPadding(dp(8), dp(8), dp(8), dp(8));
        return b;
    }

    private void initiateServerConnection() {
        new Thread(() -> {
            // Check 1: If currentServerUrl is explicitly set (via Intent or saved LAN server)
            if (!DEFAULT_LOCAL_SERVER.equals(currentServerUrl)) {
                updateStatus("Checking server (" + currentServerUrl + ")...");
                if (probeServer(currentServerUrl, 1200)) {
                    Log.i(TAG, "Configured server " + currentServerUrl + " is reachable!");
                    saveServerUrl(currentServerUrl);
                    mainHandler.post(this::onServerReady);
                    return;
                }
            }

            // Check 2: Is local Dedicated Server (127.0.0.1:8080) already running on this device?
            updateStatus("Checking local server (127.0.0.1:8080)...");
            if (probeServer(DEFAULT_LOCAL_SERVER, 800)) {
                Log.i(TAG, "Local server at 127.0.0.1:8080 is reachable!");
                currentServerUrl = DEFAULT_LOCAL_SERVER;
                saveServerUrl(DEFAULT_LOCAL_SERVER);
                mainHandler.post(this::onServerReady);
                return;
            }

            // Check 3: If user previously saved a LAN IP, probe it
            String lastServer = prefs.getString(KEY_LAST_SERVER, "");
            if (!lastServer.isEmpty() && !lastServer.equals(DEFAULT_LOCAL_SERVER) && !lastServer.equals(currentServerUrl)) {
                updateStatus("Checking previous server (" + lastServer + ")...");
                if (probeServer(lastServer, 1000)) {
                    Log.i(TAG, "Saved LAN server " + lastServer + " is reachable!");
                    currentServerUrl = lastServer;
                    mainHandler.post(this::onServerReady);
                    return;
                }
            }

            // Neither is immediately active: show the server selector
            mainHandler.post(() -> {
                spinner.setVisibility(View.GONE);
                updateStatus("No server detected on 8080.");
                serverChooserBox.setVisibility(View.VISIBLE);
            });
        }, "ServerProbeThread").start();
    }

    private void testAndConnect(final String url) {
        new Thread(() -> {
            if (probeServer(url, 2000)) {
                currentServerUrl = url;
                saveServerUrl(url);
                mainHandler.post(this::onServerReady);
            } else {
                mainHandler.post(() -> {
                    spinner.setVisibility(View.GONE);
                    serverChooserBox.setVisibility(View.VISIBLE);
                    updateStatus("Could not reach " + url);
                    Toast.makeText(this, "Connection failed to " + url, Toast.LENGTH_LONG).show();
                });
            }
        }).start();
    }

    private void launchDedicatedServerAndConnect() {
        updateStatus("Starting Deadshot Server app...");
        try {
            Intent intent = new Intent();
            intent.setClassName("com.deadshot.server", "com.deadshot.server.ServerService");
            intent.setAction("com.deadshot.server.ACTION_START");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent);
            } else {
                startService(intent);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not start server service directly: " + e.getMessage());
            try {
                Intent launchApp = getPackageManager().getLaunchIntentForPackage("com.deadshot.server");
                if (launchApp != null) {
                    startActivity(launchApp);
                }
            } catch (Exception ignored) {}
        }

        new Thread(() -> {
            updateStatus("Waiting for local server daemon...");
            int attempts = 0;
            while (attempts < 40 && !serverReady) {
                attempts++;
                if (probeServer(DEFAULT_LOCAL_SERVER, 600)) {
                    currentServerUrl = DEFAULT_LOCAL_SERVER;
                    saveServerUrl(DEFAULT_LOCAL_SERVER);
                    serverReady = true;
                    mainHandler.post(this::onServerReady);
                    return;
                }
                try {
                    Thread.sleep(500);
                } catch (InterruptedException ignored) {}
            }

            if (!serverReady) {
                mainHandler.post(() -> {
                    spinner.setVisibility(View.GONE);
                    serverChooserBox.setVisibility(View.VISIBLE);
                    updateStatus("Server did not start. Open Deadshot Server app.");
                    Toast.makeText(this, "Please launch Deadshot Server app first", Toast.LENGTH_LONG).show();
                });
            }
        }).start();
    }

    private void scanLanServers() {
        scanLanButton.setEnabled(false);
        scanLanButton.setText("SCANNING...");
        updateStatus("Scanning local subnet on port 8080...");

        final String prefix = getLocalSubnetPrefix();
        final List<String> foundIps = Collections.synchronizedList(new ArrayList<>());
        ExecutorService executor = Executors.newFixedThreadPool(32);

        new Thread(() -> {
            // Check localhost first
            executor.execute(() -> {
                try (Socket socket = new Socket()) {
                    socket.connect(new InetSocketAddress("127.0.0.1", 8080), 250);
                    foundIps.add("127.0.0.1:8080");
                } catch (Exception ignored) {}
            });

            // Check all 254 IPs on current subnet
            for (int i = 1; i <= 254; i++) {
                final String host = prefix + i;
                executor.execute(() -> {
                    try (Socket socket = new Socket()) {
                        socket.connect(new InetSocketAddress(host, 8080), 300);
                        foundIps.add(host + ":8080");
                    } catch (Exception ignored) {}
                });
            }
            executor.shutdown();
            try {
                executor.awaitTermination(3, java.util.concurrent.TimeUnit.SECONDS);
            } catch (InterruptedException ignored) {}

            mainHandler.post(() -> {
                scanLanButton.setEnabled(true);
                scanLanButton.setText("SCAN LAN");
                if (!foundIps.isEmpty()) {
                    String best = foundIps.get(0);
                    ipInputField.setText(best);
                    updateStatus("Found server at " + best + "!");
                    Toast.makeText(this, "Found server: " + best, Toast.LENGTH_SHORT).show();
                } else {
                    updateStatus("No servers found on subnet " + prefix + "x");
                    Toast.makeText(this, "No servers found. Host server first!", Toast.LENGTH_SHORT).show();
                }
            });
        }).start();
    }

    private String getLocalSubnetPrefix() {
        try {
            List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
            for (NetworkInterface intf : interfaces) {
                String name = intf.getName().toLowerCase();
                if (name.contains("wlan") || name.contains("ap") || name.contains("rndis") || name.contains("eth")) {
                    List<InetAddress> addrs = Collections.list(intf.getInetAddresses());
                    for (InetAddress addr : addrs) {
                        if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                            String ip = addr.getHostAddress();
                            int lastDot = ip.lastIndexOf('.');
                            if (lastDot != -1) {
                                return ip.substring(0, lastDot + 1);
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        return "192.168.1.";
    }

    private boolean probeServer(String urlString, int timeoutMs) {
        try {
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs);
            conn.setRequestMethod("GET");
            int responseCode = conn.getResponseCode();
            conn.disconnect();
            return (responseCode == 200);
        } catch (Exception e) {
            return false;
        }
    }

    private void saveServerUrl(String url) {
        prefs.edit().putString(KEY_LAST_SERVER, url).apply();
    }

    private void onServerReady() {
        serverReady = true;
        if (splashLayout != null) {
            splashLayout.setVisibility(View.GONE);
        }
        if (serverIndicatorBadge != null) {
            Uri u = Uri.parse(currentServerUrl);
            String host = u.getHost() + (u.getPort() > 0 ? (":" + u.getPort()) : "");
            serverIndicatorBadge.setText("● " + host);
            serverIndicatorBadge.setTextColor(Color.parseColor("#39d353"));
        }
        Log.i(TAG, "Loading " + currentServerUrl + " into WebView...");
        webView.loadUrl(currentServerUrl);
    }

    private void showServerSwitchPrompt() {
        AlertDialog.Builder b = new AlertDialog.Builder(this);
        b.setTitle("Switch Game Server");
        b.setMessage("Currently connected to: " + currentServerUrl + "\n\nDo you want to switch servers?");
        b.setPositiveButton("Switch Server", (dialog, which) -> {
            serverReady = false;
            if (splashLayout != null) {
                splashLayout.setVisibility(View.VISIBLE);
            }
            if (spinner != null) {
                spinner.setVisibility(View.GONE);
            }
            if (serverChooserBox != null) {
                serverChooserBox.setVisibility(View.VISIBLE);
            }
            updateStatus("Select or enter server address:");
        });
        b.setNegativeButton("Cancel", null);
        b.show();
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

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, value, getResources().getDisplayMetrics());
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

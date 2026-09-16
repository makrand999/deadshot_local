package com.deadshot.server;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.List;

public class ServerActivity extends Activity implements ServerService.StateListener {
    private static final String TAG = "DeadshotServerActivity";
    private static final int PERMISSION_REQ_CODE = 101;

    private TextView statusBadge;
    private TextView statusSubtitle;
    private TextView ipAddressView;
    private TextView logConsoleView;
    private ScrollView logScrollView;
    private Button startButton;
    private Button stopButton;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final StringBuilder logBuffer = new StringBuilder();

    @SuppressLint("SetTextI18n")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Dark modern background
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#0d1117"));
        int pad = dp(16);
        root.setPadding(pad, pad, pad, pad);

        // 1. App Header
        TextView titleView = new TextView(this);
        titleView.setText("DEADSHOT SERVER");
        titleView.setTextColor(Color.parseColor("#58a6ff"));
        titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        titleView.setTypeface(Typeface.DEFAULT_BOLD);
        titleView.setGravity(Gravity.CENTER_HORIZONTAL);
        titleView.setPadding(0, dp(8), 0, dp(12));
        root.addView(titleView);

        // 2. Status Card
        LinearLayout statusCard = createCardLayout();
        
        LinearLayout statusRow = new LinearLayout(this);
        statusRow.setOrientation(LinearLayout.HORIZONTAL);
        statusRow.setGravity(Gravity.CENTER_VERTICAL);

        statusBadge = new TextView(this);
        statusBadge.setText("  STOPPED  ");
        statusBadge.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        statusBadge.setTypeface(Typeface.DEFAULT_BOLD);
        statusBadge.setTextColor(Color.WHITE);
        setStatusBadgeColor("#cf222e"); // Red
        statusRow.addView(statusBadge);

        statusSubtitle = new TextView(this);
        statusSubtitle.setText("Server offline");
        statusSubtitle.setTextColor(Color.parseColor("#8b949e"));
        statusSubtitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        statusSubtitle.setPadding(dp(12), 0, 0, 0);
        statusRow.addView(statusSubtitle);

        statusCard.addView(statusRow);
        root.addView(statusCard);
        addVerticalSpacer(root, 10);

        // 3. Network & IP Card
        LinearLayout ipCard = createCardLayout();

        TextView ipLabel = new TextView(this);
        ipLabel.setText("LAN ACCESS URL");
        ipLabel.setTextColor(Color.parseColor("#8b949e"));
        ipLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        ipLabel.setTypeface(Typeface.DEFAULT_BOLD);
        ipCard.addView(ipLabel);

        ipAddressView = new TextView(this);
        ipAddressView.setText("http://127.0.0.1:8080/");
        ipAddressView.setTextColor(Color.parseColor("#39d353"));
        ipAddressView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        ipAddressView.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        ipAddressView.setTextIsSelectable(true);
        ipAddressView.setPadding(0, dp(4), 0, dp(10));
        ipCard.addView(ipAddressView);

        // Buttons row for URL
        LinearLayout urlBtnRow = new LinearLayout(this);
        urlBtnRow.setOrientation(LinearLayout.HORIZONTAL);

        Button copyBtn = createActionButton("COPY URL", "#21262d", "#c9d1d9");
        copyBtn.setOnClickListener(v -> copyServerUrl());
        urlBtnRow.addView(copyBtn, createWeightParams(1f));
        addHorizontalSpacer(urlBtnRow, 8);

        Button shareBtn = createActionButton("SHARE", "#21262d", "#c9d1d9");
        shareBtn.setOnClickListener(v -> shareServerUrl());
        urlBtnRow.addView(shareBtn, createWeightParams(1f));
        addHorizontalSpacer(urlBtnRow, 8);

        Button browserBtn = createActionButton("BROWSER", "#21262d", "#c9d1d9");
        browserBtn.setOnClickListener(v -> openInBrowser());
        urlBtnRow.addView(browserBtn, createWeightParams(1f));

        ipCard.addView(urlBtnRow);
        root.addView(ipCard);
        addVerticalSpacer(root, 10);

        // 4. Server Control Buttons
        LinearLayout ctrlRow = new LinearLayout(this);
        ctrlRow.setOrientation(LinearLayout.HORIZONTAL);

        startButton = createActionButton("START SERVER", "#238636", "#ffffff");
        startButton.setOnClickListener(v -> startServerService());
        ctrlRow.addView(startButton, createWeightParams(1f));
        addHorizontalSpacer(ctrlRow, 8);

        stopButton = createActionButton("STOP SERVER", "#da3633", "#ffffff");
        stopButton.setOnClickListener(v -> stopServerService());
        ctrlRow.addView(stopButton, createWeightParams(1f));

        root.addView(ctrlRow);
        addVerticalSpacer(root, 12);

        // 5. Log Console Header & Clear
        LinearLayout logHeaderRow = new LinearLayout(this);
        logHeaderRow.setOrientation(LinearLayout.HORIZONTAL);
        logHeaderRow.setGravity(Gravity.CENTER_VERTICAL);

        TextView logTitle = new TextView(this);
        logTitle.setText("CONSOLE OUTPUT");
        logTitle.setTextColor(Color.parseColor("#8b949e"));
        logTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        logTitle.setTypeface(Typeface.DEFAULT_BOLD);
        logHeaderRow.addView(logTitle, createWeightParams(1f));

        Button clearLogsBtn = createActionButton("CLEAR", "#161b22", "#8b949e");
        clearLogsBtn.setPadding(dp(12), dp(4), dp(12), dp(4));
        clearLogsBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10);
        clearLogsBtn.setOnClickListener(v -> {
            logBuffer.setLength(0);
            if (logConsoleView != null) {
                logConsoleView.setText("");
            }
        });
        logHeaderRow.addView(clearLogsBtn);
        root.addView(logHeaderRow);
        addVerticalSpacer(root, 6);

        // 6. Log Console Scroll Area
        logScrollView = new ScrollView(this);
        GradientDrawable consoleBg = new GradientDrawable();
        consoleBg.setColor(Color.parseColor("#010409"));
        consoleBg.setCornerRadius(dp(8));
        consoleBg.setStroke(1, Color.parseColor("#30363d"));
        logScrollView.setBackground(consoleBg);
        int logPad = dp(10);
        logScrollView.setPadding(logPad, logPad, logPad, logPad);

        logConsoleView = new TextView(this);
        logConsoleView.setTextColor(Color.parseColor("#7ee787"));
        logConsoleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10.5f);
        logConsoleView.setTypeface(Typeface.MONOSPACE);
        logConsoleView.setTextIsSelectable(true);
        logScrollView.addView(logConsoleView);

        root.addView(logScrollView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1.0f));

        setContentView(root);

        // Check POST_NOTIFICATIONS permission on Android 13+
        checkNotificationPermission();

        // Auto-start server on app launch
        startServerService();
    }

    private void checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQ_CODE);
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        ServerService.addListener(this);
        updateIpDisplay();
    }

    @Override
    protected void onPause() {
        super.onPause();
        ServerService.removeListener(this);
    }

    private void updateIpDisplay() {
        String ip = ServerService.getDeviceIpAddress();
        if (ipAddressView != null) {
            ipAddressView.setText("http://" + ip + ":8080/");
        }
    }

    private void startServerService() {
        updateIpDisplay();
        Intent serviceIntent = new Intent(this, ServerService.class);
        serviceIntent.setAction(ServerService.ACTION_START);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    private void stopServerService() {
        Intent serviceIntent = new Intent(this, ServerService.class);
        serviceIntent.setAction(ServerService.ACTION_STOP);
        startService(serviceIntent);
    }

    private void copyServerUrl() {
        String url = ipAddressView.getText().toString();
        ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        if (clipboard != null) {
            ClipData clip = ClipData.newPlainText("Deadshot Server URL", url);
            clipboard.setPrimaryClip(clip);
            Toast.makeText(this, "Copied URL: " + url, Toast.LENGTH_SHORT).show();
        }
    }

    private void shareServerUrl() {
        String url = ipAddressView.getText().toString();
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_SUBJECT, "Join my Deadshot match!");
        intent.putExtra(Intent.EXTRA_TEXT, "Join my local Deadshot game at: " + url);
        startActivity(Intent.createChooser(intent, "Share Deadshot LAN Server"));
    }

    private void openInBrowser() {
        String url = ipAddressView.getText().toString();
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "Could not open browser: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void setStatusBadgeColor(String hexColor) {
        GradientDrawable badgeBg = new GradientDrawable();
        badgeBg.setColor(Color.parseColor(hexColor));
        badgeBg.setCornerRadius(dp(6));
        statusBadge.setBackground(badgeBg);
        int hPad = dp(8);
        int vPad = dp(4);
        statusBadge.setPadding(hPad, vPad, hPad, vPad);
    }

    @Override
    public void onStatusChanged(ServerService.Status status, String message) {
        mainHandler.post(() -> {
            if (statusBadge == null) return;
            switch (status) {
                case RUNNING:
                    statusBadge.setText("RUNNING");
                    setStatusBadgeColor("#238636"); // Green
                    if (startButton != null) startButton.setEnabled(false);
                    if (stopButton != null) stopButton.setEnabled(true);
                    updateIpDisplay();
                    break;
                case INITIALIZING:
                case EXTRACTING_ASSETS:
                case BOOTING_NODE:
                    statusBadge.setText("STARTING");
                    setStatusBadgeColor("#9e6a03"); // Amber
                    if (startButton != null) startButton.setEnabled(false);
                    if (stopButton != null) stopButton.setEnabled(true);
                    break;
                case ERROR:
                    statusBadge.setText("ERROR");
                    setStatusBadgeColor("#da3633"); // Red
                    if (startButton != null) startButton.setEnabled(true);
                    if (stopButton != null) stopButton.setEnabled(false);
                    break;
                case STOPPED:
                default:
                    statusBadge.setText("STOPPED");
                    setStatusBadgeColor("#6e7681"); // Grey
                    if (startButton != null) startButton.setEnabled(true);
                    if (stopButton != null) stopButton.setEnabled(false);
                    break;
            }
            if (statusSubtitle != null) {
                statusSubtitle.setText(message);
            }
        });
    }

    @Override
    public void onLogReceived(String logLine) {
        mainHandler.post(() -> {
            if (logConsoleView == null) return;
            logBuffer.append(logLine).append("\n");
            if (logBuffer.length() > 30000) {
                logBuffer.delete(0, 10000);
            }
            logConsoleView.setText(logBuffer.toString());
            if (logScrollView != null) {
                logScrollView.post(() -> logScrollView.fullScroll(View.FOCUS_DOWN));
            }
        });
    }

    // UI Helper Utilities
    private LinearLayout createCardLayout() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#161b22"));
        bg.setCornerRadius(dp(10));
        bg.setStroke(1, Color.parseColor("#30363d"));
        card.setBackground(bg);
        int p = dp(12);
        card.setPadding(p, p, p, p);
        return card;
    }

    private Button createActionButton(String text, String bgHex, String textHex) {
        Button btn = new Button(this);
        btn.setText(text);
        btn.setTextColor(Color.parseColor(textHex));
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        btn.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor(bgHex));
        bg.setCornerRadius(dp(8));
        btn.setBackground(bg);
        int vPad = dp(10);
        btn.setPadding(0, vPad, 0, vPad);
        return btn;
    }

    private LinearLayout.LayoutParams createWeightParams(float weight) {
        return new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, weight);
    }

    private void addVerticalSpacer(LinearLayout parent, int dpHeight) {
        View v = new View(this);
        parent.addView(v, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(dpHeight)));
    }

    private void addHorizontalSpacer(LinearLayout parent, int dpWidth) {
        View v = new View(this);
        parent.addView(v, new LinearLayout.LayoutParams(
                dp(dpWidth), ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, value, getResources().getDisplayMetrics());
    }
}

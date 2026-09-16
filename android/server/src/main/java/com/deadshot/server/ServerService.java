package com.deadshot.server;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Binder;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class ServerService extends Service {
    private static final String TAG = "DeadshotServerService";
    public static final String CHANNEL_ID = "deadshot_server_channel";
    public static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_START = "com.deadshot.server.ACTION_START";
    public static final String ACTION_STOP = "com.deadshot.server.ACTION_STOP";

    public enum Status {
        STOPPED,
        INITIALIZING,
        EXTRACTING_ASSETS,
        BOOTING_NODE,
        RUNNING,
        ERROR
    }

    public interface StateListener {
        void onStatusChanged(Status status, String message);
        void onLogReceived(String logLine);
    }

    private static volatile Status currentStatus = Status.STOPPED;
    private static volatile String statusMessage = "Server is stopped";
    private static final List<StateListener> listeners = new CopyOnWriteArrayList<>();
    private static final List<String> recentLogs = Collections.synchronizedList(new ArrayList<>());
    private static final int MAX_LOG_LINES = 200;

    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;
    private Thread logcatThread;
    private volatile boolean isRunning = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final IBinder binder = new LocalBinder();

    public class LocalBinder extends Binder {
        public ServerService getService() {
            return ServerService.this;
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    public static void addListener(StateListener listener) {
        listeners.add(listener);
        listener.onStatusChanged(currentStatus, statusMessage);
        synchronized (recentLogs) {
            for (String line : recentLogs) {
                listener.onLogReceived(line);
            }
        }
    }

    public static void removeListener(StateListener listener) {
        listeners.remove(listener);
    }

    public static Status getCurrentStatus() {
        return currentStatus;
    }

    public static String getStatusMessage() {
        return statusMessage;
    }

    public static List<String> getRecentLogs() {
        synchronized (recentLogs) {
            return new ArrayList<>(recentLogs);
        }
    }

    private static void appendLog(String line) {
        synchronized (recentLogs) {
            if (recentLogs.size() >= MAX_LOG_LINES) {
                recentLogs.remove(0);
            }
            recentLogs.add(line);
        }
        for (StateListener l : listeners) {
            try {
                l.onLogReceived(line);
            } catch (Exception ignored) {}
        }
    }

    private void updateState(Status status, String msg) {
        currentStatus = status;
        statusMessage = msg;
        Log.i(TAG, "Server Status -> " + status + ": " + msg);
        mainHandler.post(() -> {
            for (StateListener l : listeners) {
                try {
                    l.onStatusChanged(status, msg);
                } catch (Exception ignored) {}
            }
            updateNotification();
        });
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        acquireLocks();
        startLogcatMonitor();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopServer();
            return START_NOT_STICKY;
        }

        startForegroundServiceInternal();
        if (!isRunning) {
            startServer();
        }
        return START_STICKY;
    }

    private void startForegroundServiceInternal() {
        Notification notification = buildNotification("Initializing Deadshot Server...");
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                if (Build.VERSION.SDK_INT >= 34) {
                    startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
                } else {
                    startForeground(NOTIFICATION_ID, notification, 0);
                }
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in startForeground: " + e.getMessage(), e);
        }
    }

    private void acquireLocks() {
        try {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null && (wakeLock == null || !wakeLock.isHeld())) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "DeadshotServer::WakeLock");
                wakeLock.acquire();
                Log.i(TAG, "WakeLock acquired.");
            }

            WifiManager wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifiManager != null && (wifiLock == null || !wifiLock.isHeld())) {
                int mode = WifiManager.WIFI_MODE_FULL_HIGH_PERF;
                wifiLock = wifiManager.createWifiLock(mode, "DeadshotServer::WifiLock");
                wifiLock.acquire();
                Log.i(TAG, "WifiLock acquired.");
            }
        } catch (Exception e) {
            Log.w(TAG, "Error acquiring Wake/Wifi lock: " + e.getMessage());
        }
    }

    private void releaseLocks() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
                wakeLock = null;
                Log.i(TAG, "WakeLock released.");
            }
            if (wifiLock != null && wifiLock.isHeld()) {
                wifiLock.release();
                wifiLock = null;
                Log.i(TAG, "WifiLock released.");
            }
        } catch (Exception e) {
            Log.w(TAG, "Error releasing Wake/Wifi lock: " + e.getMessage());
        }
    }

    private void startServer() {
        isRunning = true;
        updateState(Status.INITIALIZING, "Starting server daemon...");

        new Thread(() -> {
            updateState(Status.EXTRACTING_ASSETS, "Verifying server assets...");
            boolean ok = AssetHelper.copyAssetsIfNeeded(ServerService.this, status -> {
                updateState(Status.EXTRACTING_ASSETS, status);
            });

            if (!ok) {
                updateState(Status.ERROR, "Failed to extract assets");
                return;
            }

            updateState(Status.BOOTING_NODE, "Booting Node.js runtime...");
            File filesDir = getFilesDir();
            File serverScript = new File(filesDir, "server/server.bundle.mjs");
            File clientDir = new File(filesDir, "client");
            File rawDir = new File(filesDir, "raw");

            String[] nodeArgs = new String[]{
                    "node",
                    "-e",
                    "process.env.GP_CLIENT_DIR=" + quote(clientDir.getAbsolutePath()) + ";" +
                    "process.env.GP_RAW_DIR=" + quote(rawDir.getAbsolutePath()) + ";" +
                    "import(" + quote(serverScript.getAbsolutePath()) + ");"
            };

            NodeRunner.start(nodeArgs, filesDir.getAbsolutePath(), () -> {
                Log.i(TAG, "NodeRunner exited.");
                if (isRunning) {
                    updateState(Status.STOPPED, "Node.js server exited");
                    isRunning = false;
                }
            });

            pollServerUntilReady();
        }, "ServerLauncherThread").start();
    }

    private void pollServerUntilReady() {
        int attempts = 0;
        final int maxAttempts = 60;
        while (attempts < maxAttempts && isRunning) {
            attempts++;
            try {
                URL url = new URL("http://127.0.0.1:8080/");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(800);
                conn.setReadTimeout(800);
                conn.setRequestMethod("GET");
                int responseCode = conn.getResponseCode();
                conn.disconnect();

                if (responseCode == 200) {
                    String ip = getDeviceIpAddress();
                    updateState(Status.RUNNING, "Active on http://" + ip + ":8080/");
                    return;
                }
            } catch (Exception e) {
                Log.d(TAG, "Poll attempt " + attempts + ": " + e.getMessage());
            }

            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                break;
            }
        }

        if (currentStatus != Status.RUNNING) {
            updateState(Status.ERROR, "Server port 8080 timed out");
        }
    }

    public void stopServer() {
        isRunning = false;
        updateState(Status.STOPPED, "Stopping server...");
        releaseLocks();
        stopForeground(true);
        stopSelf();

        // Node.js runs as native C++ thread without in-process cancel.
        // Terminate the process cleanly so all sockets and native threads are freed.
        mainHandler.postDelayed(() -> {
            android.os.Process.killProcess(android.os.Process.myPid());
            System.exit(0);
        }, 500);
    }

    private static String quote(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    public static String getDeviceIpAddress() {
        try {
            List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
            // Pass 1: prioritized wireless / hotspot interfaces
            for (NetworkInterface intf : interfaces) {
                String name = intf.getName().toLowerCase();
                if (name.contains("wlan") || name.contains("ap") || name.contains("softap") || name.contains("rndis") || name.contains("eth")) {
                    List<InetAddress> addrs = Collections.list(intf.getInetAddresses());
                    for (InetAddress addr : addrs) {
                        if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                            return addr.getHostAddress();
                        }
                    }
                }
            }
            // Pass 2: any non-loopback IPv4
            for (NetworkInterface intf : interfaces) {
                List<InetAddress> addrs = Collections.list(intf.getInetAddresses());
                for (InetAddress addr : addrs) {
                    if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to resolve device IP: " + e.getMessage());
        }
        return "127.0.0.1";
    }

    private void startLogcatMonitor() {
        logcatThread = new Thread(() -> {
            try {
                Process process = Runtime.getRuntime().exec(new String[]{
                        "logcat", "-v", "time", "-T", "50", "-s", "NODEJS-SERVER:V", "AssetHelperServer:V", "DeadshotServerService:V"
                });
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String line;
                while ((line = reader.readLine()) != null) {
                    appendLog(line);
                }
            } catch (Exception e) {
                Log.w(TAG, "Logcat monitor ended: " + e.getMessage());
            }
        }, "LogcatMonitorThread");
        logcatThread.setDaemon(true);
        logcatThread.start();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Deadshot Dedicated Server",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows active status of the local Deadshot game server daemon");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification(String text) {
        Intent notificationIntent = new Intent(this, ServerActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        Intent stopIntent = new Intent(this, ServerService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(
                this, 1, stopIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        builder.setContentTitle("Deadshot Dedicated Server")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setOngoing(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
            builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop Server", stopPendingIntent);
        }

        return builder.build();
    }

    private void updateNotification() {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                String desc;
                if (currentStatus == Status.RUNNING) {
                    desc = "Running on http://" + getDeviceIpAddress() + ":8080/";
                } else {
                    desc = statusMessage;
                }
                manager.notify(NOTIFICATION_ID, buildNotification(desc));
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not update notification: " + e.getMessage());
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        releaseLocks();
        Log.i(TAG, "ServerService destroyed.");
    }
}

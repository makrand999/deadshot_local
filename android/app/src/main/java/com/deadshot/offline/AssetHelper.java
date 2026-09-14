package com.deadshot.offline;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.res.AssetManager;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class AssetHelper {
    private static final String TAG = "AssetHelper";
    private static final String PREF_NAME = "DeadshotAssetPrefs";
    private static final String KEY_LAST_UPDATE = "last_apk_update_time";

    public interface ProgressListener {
        void onProgress(String status);
    }

    public static boolean copyAssetsIfNeeded(Context context, ProgressListener listener) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        long lastInstalledTime = prefs.getLong(KEY_LAST_UPDATE, 0);
        long currentUpdateTime = 1;

        try {
            PackageInfo info = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            currentUpdateTime = info.lastUpdateTime;
        } catch (Exception e) {
            Log.w(TAG, "Failed to get package info: " + e.getMessage());
        }

        File targetDir = context.getFilesDir();
        File serverFile = new File(targetDir, "server/server.bundle.mjs");
        File clientIndex = new File(targetDir, "client/index.html");

        if (lastInstalledTime == currentUpdateTime && serverFile.exists() && clientIndex.exists()) {
            Log.i(TAG, "Assets are up to date. Skipping extraction.");
            if (listener != null) listener.onProgress("Ready");
            return true;
        }

        Log.i(TAG, "Extracting assets from APK to " + targetDir.getAbsolutePath() + "...");
        if (listener != null) listener.onProgress("Extracting assets...");

        AssetManager assetManager = context.getAssets();
        try {
            copyAssetFolder(assetManager, "server", new File(targetDir, "server"), listener);
            copyAssetFolder(assetManager, "raw", new File(targetDir, "raw"), listener);
            copyAssetFolder(assetManager, "client", new File(targetDir, "client"), listener);

            prefs.edit().putLong(KEY_LAST_UPDATE, currentUpdateTime).apply();
            Log.i(TAG, "Asset extraction completed successfully.");
            if (listener != null) listener.onProgress("Assets ready");
            return true;
        } catch (IOException e) {
            Log.e(TAG, "Error extracting assets: " + e.getMessage(), e);
            if (listener != null) listener.onProgress("Extraction failed: " + e.getMessage());
            return false;
        }
    }

    private static void copyAssetFolder(AssetManager assetManager, String fromAssetPath, File toDir, ProgressListener listener) throws IOException {
        String[] files = assetManager.list(fromAssetPath);
        if (files == null || files.length == 0) {
            // It's a single file
            copyAssetFile(assetManager, fromAssetPath, toDir);
        } else {
            if (!toDir.exists() && !toDir.mkdirs()) {
                Log.w(TAG, "Could not create directory: " + toDir.getAbsolutePath());
            }
            for (String file : files) {
                String subFrom = fromAssetPath.isEmpty() ? file : (fromAssetPath + "/" + file);
                File subTo = new File(toDir, file);
                String[] subFiles = assetManager.list(subFrom);
                if (subFiles != null && subFiles.length > 0) {
                    copyAssetFolder(assetManager, subFrom, subTo, listener);
                } else {
                    copyAssetFile(assetManager, subFrom, subTo);
                }
            }
        }
    }

    private static void copyAssetFile(AssetManager assetManager, String fromAssetPath, File toFile) throws IOException {
        File parent = toFile.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }
        try (InputStream in = assetManager.open(fromAssetPath);
             OutputStream out = new FileOutputStream(toFile)) {
            byte[] buffer = new byte[65536];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            out.flush();
        }
    }
}

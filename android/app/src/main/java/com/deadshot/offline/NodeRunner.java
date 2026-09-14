package com.deadshot.offline;

import android.util.Log;

public class NodeRunner {
    private static final String TAG = "NodeRunner";

    static {
        System.loadLibrary("node");
        System.loadLibrary("node-runner");
    }

    public static native int startNodeWithArguments(String[] arguments, String nodePath);

    private static boolean isRunning = false;

    public static synchronized void start(final String[] args, final String nodePath) {
        if (isRunning) {
            Log.w(TAG, "Node.js instance is already running.");
            return;
        }
        isRunning = true;
        new Thread(new Runnable() {
            @Override
            public void run() {
                Log.i(TAG, "Spawning native Node.js thread...");
                int code = startNodeWithArguments(args, nodePath);
                Log.i(TAG, "Node.js process exited with code: " + code);
                isRunning = false;
            }
        }, "NodeRunnerThread").start();
    }
}

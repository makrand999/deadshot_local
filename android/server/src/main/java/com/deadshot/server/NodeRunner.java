package com.deadshot.server;

import android.util.Log;

public class NodeRunner {
    private static final String TAG = "NodeRunnerServer";

    static {
        System.loadLibrary("node");
        System.loadLibrary("node-runner-server");
    }

    public static native int startNodeWithArguments(String[] arguments, String nodePath);

    private static volatile boolean isRunning = false;
    private static Thread runnerThread = null;

    public static synchronized boolean isRunning() {
        return isRunning;
    }

    public static synchronized void start(final String[] args, final String nodePath, final Runnable onExit) {
        if (isRunning) {
            Log.w(TAG, "Node.js instance is already running.");
            return;
        }
        isRunning = true;
        runnerThread = new Thread(new Runnable() {
            @Override
            public void run() {
                Log.i(TAG, "Spawning native Node.js server thread...");
                int code = startNodeWithArguments(args, nodePath);
                Log.i(TAG, "Node.js server process exited with code: " + code);
                isRunning = false;
                if (onExit != null) {
                    onExit.run();
                }
            }
        }, "NodeServerThread");
        runnerThread.start();
    }
}

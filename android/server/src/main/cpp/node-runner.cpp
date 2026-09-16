#include <jni.h>
#include <string>
#include <cstdlib>
#include <cstring>
#include <pthread.h>
#include <unistd.h>
#include <android/log.h>

#include "node.h"

#define ADBTAG "NODEJS-SERVER"

static int pipe_stdout[2];
static int pipe_stderr[2];
static pthread_t thread_stdout;
static pthread_t thread_stderr;

static void *thread_stderr_func(void*) {
    ssize_t redirect_size;
    char buf[2048];
    while((redirect_size = read(pipe_stderr[0], buf, sizeof(buf) - 1)) > 0) {
        if(buf[redirect_size - 1] == '\n')
            --redirect_size;
        buf[redirect_size] = 0;
        __android_log_write(ANDROID_LOG_ERROR, ADBTAG, buf);
    }
    return nullptr;
}

static void *thread_stdout_func(void*) {
    ssize_t redirect_size;
    char buf[2048];
    while((redirect_size = read(pipe_stdout[0], buf, sizeof(buf) - 1)) > 0) {
        if(buf[redirect_size - 1] == '\n')
            --redirect_size;
        buf[redirect_size] = 0;
        __android_log_write(ANDROID_LOG_INFO, ADBTAG, buf);
    }
    return nullptr;
}

static int start_redirecting_stdout_stderr() {
    setvbuf(stdout, nullptr, _IONBF, 0);
    if (pipe(pipe_stdout) != 0) return -1;
    dup2(pipe_stdout[1], STDOUT_FILENO);

    setvbuf(stderr, nullptr, _IONBF, 0);
    if (pipe(pipe_stderr) != 0) return -1;
    dup2(pipe_stderr[1], STDERR_FILENO);

    if (pthread_create(&thread_stdout, nullptr, thread_stdout_func, nullptr) != 0)
        return -1;
    pthread_detach(thread_stdout);

    if (pthread_create(&thread_stderr, nullptr, thread_stderr_func, nullptr) != 0)
        return -1;
    pthread_detach(thread_stderr);

    return 0;
}

extern "C" JNIEXPORT jint JNICALL
Java_com_deadshot_server_NodeRunner_startNodeWithArguments(
        JNIEnv *env,
        jobject /* thisObj */,
        jobjectArray arguments,
        jstring nodePath) {

    if (nodePath != nullptr) {
        const char* path_str = env->GetStringUTFChars(nodePath, nullptr);
        setenv("NODE_PATH", path_str, 1);
        env->ReleaseStringUTFChars(nodePath, path_str);
    }

    start_redirecting_stdout_stderr();

    jsize argument_count = env->GetArrayLength(arguments);

    int c_arguments_size = 0;
    for (int i = 0; i < argument_count; i++) {
        auto strObj = (jstring)env->GetObjectArrayElement(arguments, i);
        const char* str = env->GetStringUTFChars(strObj, nullptr);
        c_arguments_size += strlen(str) + 1;
        env->ReleaseStringUTFChars(strObj, str);
    }

    char* args_buffer = (char*)calloc(c_arguments_size, sizeof(char));
    char* argv[argument_count];
    char* current_args_position = args_buffer;

    for (int i = 0; i < argument_count; i++) {
        auto strObj = (jstring)env->GetObjectArrayElement(arguments, i);
        const char* current_argument = env->GetStringUTFChars(strObj, nullptr);
        size_t len = strlen(current_argument);
        strncpy(current_args_position, current_argument, len);
        argv[i] = current_args_position;
        current_args_position += len + 1;
        env->ReleaseStringUTFChars(strObj, current_argument);
    }

    __android_log_write(ANDROID_LOG_INFO, ADBTAG, "Starting dedicated Node.js server runtime...");

    int exit_code = node::Start(argument_count, argv);

    free(args_buffer);
    return jint(exit_code);
}

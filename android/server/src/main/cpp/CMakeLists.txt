cmake_minimum_required(VERSION 3.22.1)
project("node-runner-server")

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../app/src/main/cpp/include/node
)

add_library(node SHARED IMPORTED)
set_target_properties(node PROPERTIES IMPORTED_LOCATION
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../app/src/main/jniLibs/${ANDROID_ABI}/libnode.so
)

add_library(node-runner-server SHARED
    node-runner.cpp
)

target_link_libraries(node-runner-server
    node
    log
)

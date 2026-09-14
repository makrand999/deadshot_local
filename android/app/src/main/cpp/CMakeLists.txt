cmake_minimum_required(VERSION 3.22.1)
project("node-runner")

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include/node
)

add_library(node SHARED IMPORTED)
set_target_properties(node PROPERTIES IMPORTED_LOCATION
    ${CMAKE_CURRENT_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}/libnode.so
)

add_library(node-runner SHARED
    node-runner.cpp
)

target_link_libraries(node-runner
    node
    log
)

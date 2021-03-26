project(GLSample)
cmake_minimum_required(VERSION 3.10)

set(CMAKE_CXX_STANDARD 20)
if(CMAKE_BUILD_TYPE MATCHES Debug)
    set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Zi")
else()
    set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Zi -O2")
endif()

include(${CMAKE_BINARY_DIR}/conanbuildinfo.cmake)
conan_basic_setup()

include_directories(src)
include_directories(include/gl3w)

add_executable(sampl src/main.cpp src/gl3w.c)

target_link_libraries(sampl ${CONAN_LIBS})
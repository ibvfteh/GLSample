#include <iostream>
#include <cstdlib>
#include <GL/gl3w.h>
#include <GLFW/glfw3.h>

#include <memory>
#include <vector>

#include "shader.h"

static int width = 1200;
static int height = 1200;

unsigned int VAO;
unsigned int VBO;
unsigned int shaderProgram;
float frameCount = 0;

std::unique_ptr<Shader> shader;

static void display(GLFWwindow *window)
{
	glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    
    shader->setFloat("frameCount", frameCount);

    shader->use();
    glBindVertexArray(VAO);
    glDrawArrays(GL_TRIANGLES, 0, 6);

	glfwSwapBuffers(window);
    frameCount++;
}

static void reshape(GLFWwindow *window, int w, int h)
{
	width = w > 1 ? w : 1;
	height = h > 1 ? h : 1;
	glViewport(0, 0, width, height);
	glClearDepth(1.0);
	glClearColor(0.0f, 0.0f, 0.0f, 0.0f);
	glEnable(GL_DEPTH_TEST);
} 

int main(int argc, char **argv)
{
	GLFWwindow *window;

	glfwInit();

	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 5);
	glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
	window = glfwCreateWindow(width, height, "GLSample", NULL, NULL);

	glfwSetFramebufferSizeCallback(window, reshape);
	glfwSetWindowRefreshCallback(window, display);

	glfwMakeContextCurrent(window);

	if (gl3wInit()) {
		fprintf(stderr, "failed to initialize OpenGL\n");
		return -1;
	}
	if (!gl3wIsSupported(4, 5)) {
		fprintf(stderr, "OpenGL 4.5 not supported\n");
		return -1;
	}
	printf("OpenGL %s, GLSL %s\n", glGetString(GL_VERSION),
	       glGetString(GL_SHADING_LANGUAGE_VERSION));
           
    std::vector<float> vertices = {
        -1.0f, -1.0f, 0.0f,
         1.0f, -1.0f, 0.0f,
         1.0f,  1.0f, 0.0f,
        -1.0f, -1.0f, 0.0f,
        -1.0f,  1.0f, 0.0f,
         1.0f,  1.0f, 0.0f
    }; 

    glGenVertexArrays(1, &VAO);
    glBindVertexArray(VAO);

    glGenBuffers(1, &VBO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(float), vertices.data(), GL_STATIC_DRAW);

    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);

    shader = std::make_unique<Shader>("../../shaders/main.vert", "../../shaders/main.frag");

	while (!glfwWindowShouldClose(window)) {
		display(window);
		glfwPollEvents();
	}

	glfwTerminate();
	return 0;
}

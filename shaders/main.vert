#version 450 core
layout (location = 0) in vec3 aPos;

out vec2 coord;

void main()
{
    coord = aPos.xy;
    gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);
}
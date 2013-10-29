precision mediump float;

// Built-in attributes
attribute vec4 a_position;
attribute vec2 a_texCoord;

// Built-in uniforms
uniform mat4 u_projectionMatrix;

// Uniforms passed in from CSS
uniform float amount;
uniform float cylinderRadius;
uniform float cylinderLength;
uniform mat4 transform;

// Constants
const float PI = 3.1415;

// Cone function
vec3 computeCylindricalConePosition( vec2 uv, float r, float l ) {
    vec3 p;
    float fi = uv.x * PI * 2.0;

    p.x = r * cos( fi ) /* * uv.y */;
	p.y = r * sin( fi ) /* * uv.y */;
    p.z = (uv.y - 0.5) * l;
    return p;
}

// Main
void main() {
    vec4 position = a_position;

    // Map plane to cone using UV coordinates
    vec3 cone = computeCylindricalConePosition( a_texCoord, cylinderRadius, cylinderLength );

    // Blend plane and cone
    position.xyz = mix( position.xyz, cone, amount );

    // Set vertex position
    gl_Position = u_projectionMatrix * transform * position;
}

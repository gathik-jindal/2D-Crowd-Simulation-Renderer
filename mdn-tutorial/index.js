import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

// global variables
let cubeRotation = 0.0;
let deltaTime = 0;
let keysPressed = {};
const cubeTranslation = [0, 0, 0];
let yaw = 0, pitch = 0;

/**
 * Initialize a shader program, so WebGL knows how to draw our data
 * @param {WebGLRenderingContext} gl 
 * @param {string} vsSource 
 * @param {string} fsSource 
 * @returns {WebGLProgram}
 */
function initShaderProgram(gl, vsSource, fsSource) {
  /** @type {WebGLShader} */
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  /** @type {WebGLShader} */
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  /** @type {WebGLProgram} */
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram,
      )}`,
    );
    return null;
  }

  return shaderProgram;
}

/**
 * creates a shader of a given type, uploads the source and compiles it
 * @param {WebGLRenderingContext} gl 
 * @param {Number} type 
 * @param {string} source 
 * @returns 
 */
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function getYawPitch() {

}

function main() {
  /** @type {HTMLCanvasElement} */ // this is for vscode intellisense
  const canvas = document.querySelector("#gl-canvas");
  canvas.addEventListener('click', async () => {
    canvas.requestPointerLock();
  })
  // Initialize the GL context
  /** @type {WebGLRenderingContext} */
  const gl = canvas.getContext("webgl");
  canvas.width = canvas.clientWidth; // setting correct dimensions
  canvas.height = canvas.clientHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it.",
    );
    return;
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Vertex shader program
  // we provide uMoelViewMatrix and uProjectionMatrix
  const vsSource = `
      attribute vec4 aVertexPosition;
      attribute vec4 aVertexColor;

      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;

      varying lowp vec4 vColor;

      void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
      }
  `;

  // Fragment shader program
  const fsSource = `
    varying lowp vec4 vColor;

    void main() {
      gl_FragColor = vColor;
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  let then = 0;

  document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
  })

  document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
  })

  document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement === canvas) {
      const sensitivity = 0.002;
      yaw += event.movementX * sensitivity;
      pitch -= event.movementY * sensitivity;

      // clamp pitch so you can't flip upside down
      const maxPitch = Math.PI / 2 - 0.1;
      if (pitch > maxPitch) pitch = maxPitch;
      if (pitch < -maxPitch) pitch = -maxPitch;
    }
  });

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // ms → s
    deltaTime = now - then;
    then = now;

    // Movement speed
    const speed = 3.0; // units per second

    // Compute forward/right vectors from yaw
    const forward = [Math.sin(yaw), 0, -Math.cos(yaw)];
    const right = [Math.cos(yaw), 0, Math.sin(yaw)];

    // WASD movement
    if (keysPressed["w"]) {
      cubeTranslation[0] += forward[0] * speed * deltaTime;
      cubeTranslation[1] += forward[2] * speed * deltaTime;
    }
    if (keysPressed["s"]) {
      cubeTranslation[0] -= forward[0] * speed * deltaTime;
      cubeTranslation[1] -= forward[2] * speed * deltaTime;
    }
    if (keysPressed["a"]) {
      cubeTranslation[0] -= right[0] * speed * deltaTime;
      cubeTranslation[1] -= right[2] * speed * deltaTime;
    }
    if (keysPressed["d"]) {
      cubeTranslation[0] += right[0] * speed * deltaTime;
      cubeTranslation[1] += right[2] * speed * deltaTime;
    }

    // Draw scene
    drawScene(gl, programInfo, buffers, cubeRotation, cubeTranslation, yaw, pitch);
    // cubeRotation += deltaTime;

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}

main();
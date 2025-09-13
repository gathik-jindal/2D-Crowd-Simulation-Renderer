import { initBuffers } from "./init-buffers.js";
import { drawObject } from "./draw-scene.js";

// Global variables
let obstacleX = 0;
let obstacleY = 0;
let obstacleScale = 1;
let keyboardSensitivity = 1;
let steps = 3;
let obstacleVertexCount = 8; // points + lines
let keyboardEvents = {};

/**
 * Transform the x and y to a translation matrix
 * @param {Number} x The x location of the vertex (-100 to 100)
 * @param {Number} y The y location of the vertex (-100 to 100)
 * @returns {mat4} The tranform matrix
 */
function getTransformMatrix(x, y, scale) {
  const transformMatrix = mat4.create();
  mat4.scale(transformMatrix, transformMatrix, [obstacleScale, obstacleScale, 1]);
  mat4.translate(transformMatrix, transformMatrix, [x / 100, y / 100, 0]);

  return transformMatrix;
}

/**
 * Utility function that does the calculation for object movements
 */
function calculateMovements() {
  if (keyboardEvents['w']) {
    obstacleY += steps * keyboardSensitivity;
  }
  if (keyboardEvents['s']) {
    obstacleY -= steps * keyboardSensitivity;
  }
  if (keyboardEvents['a']) {
    obstacleX -= steps * keyboardSensitivity;
  }
  if (keyboardEvents['d']) {
    obstacleX += steps * keyboardSensitivity;
  }

  if (keyboardEvents['o']) {
    obstacleScale += 0.01 * keyboardSensitivity;
  }
  if (keyboardEvents['p']) {
    obstacleScale -= 0.01 * keyboardSensitivity;
  }

  if (obstacleX > 50) obstacleX = 50;
  if (obstacleX < -50) obstacleX = -50;
  if (obstacleY > 50) obstacleY = 50;
  if (obstacleY < -50) obstacleY = -50;
}

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

function main() {
  /** @type {HTMLCanvasElement} */ // this is for vscode intellisense
  const canvas = document.querySelector("#gl-canvas");
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

  // Set clear color to white, fully opaque
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Vertex shader program
  const vsSource = `
      attribute vec2 aVertexPosition;

      uniform mat4 uTransformMatrix; // This will hold the object's unique transformation

      void main() {
        gl_Position = uTransformMatrix * vec4(aVertexPosition, 0.0, 1.0);

        gl_PointSize = 10.0;
      }
  `;

  // Fragment shader program
  const fsSource = `
    precision mediump float;

    void main() {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Output solid black
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.
  console.log(gl.getUniformLocation(shaderProgram, "uTransformMatrix"));
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    },
    uniformLocations: {
      transformMatrix: gl.getUniformLocation(shaderProgram, "uTransformMatrix"),
    }
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  // Keyboard inputs
  document.addEventListener('keydown', (event) => {
    keyboardEvents[event.key] = true;
  });
  document.addEventListener('keyup', (event) => {
    keyboardEvents[event.key] = false;
  })

  // Draw scene
  function render(now) {
    // calculate movements
    calculateMovements();

    // Clear the canvas before we start drawing on it.
    gl.clearColor(1.0, 1.0, 1.0, 1.0); // Set background to white
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw the obstacle
    drawObject(gl, programInfo, buffers, getTransformMatrix(obstacleX, obstacleY), obstacleVertexCount, [gl.LINES, gl.POINTS]); // need to fix

    requestAnimationFrame(render);
  }

  // start the loop
  requestAnimationFrame(render);
}

main();
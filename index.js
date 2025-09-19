import { initBuffers, generateUniformColors } from "./init-buffers.js";
import { drawObject } from "./draw-scene.js";
import { calculateMovements, getTransformMatrix } from "./utility.js";
import { initShaderProgram, updateBuffer } from "./gl-utility.js";
import { removeCollisions, triangulateWithObstacle, convertTriangleIndicesToLineIndices } from "./math.js";

// ===========================
// Global variables
// ===========================
let keyboardEvents = {};
const keyboardSensitivity = 1;
const steps = 2;
let maxX = 100; // not true changes based on aspect
const maxY = 100;
let minX = -100; // not true changes based on aspect
const minY = -100;
const minScale = 0.1;
const maxScale = 1.5;

const NUMBER_OF_PEOPLE = 30;
const NUMBER_OF_DOTS = 40;
const DOT_SIZE = 2.0; // in canvas units

function main() {

  const d = document.getElementById("debug");
  /** @type {HTMLCanvasElement} */ // this is for vscode intellisense
  const canvas = document.querySelector("#gl-canvas");
  // Initialize the GL context
  /** @type {WebGLRenderingContext} */
  const gl = canvas.getContext("webgl");
  canvas.width = canvas.clientWidth; // setting correct dimensions
  canvas.height = canvas.clientHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  const projectionMatrix = mat4.create();
  const aspect = canvas.clientWidth / canvas.clientHeight;
  // This creates a camera that shows -100 to 100 on the Y axis,
  // and a correctly scaled range on the X axis.
  mat4.ortho(projectionMatrix, -100 * aspect, 100 * aspect, -100, 100, -1, 1);
  maxX = 100 * aspect;
  minX = -100 * aspect;

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it.",
    );
    return;
  }

  // Set clear color to white, fully opaque
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  // Enable alpha blending
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  // =============================
  // SHADER PROGRAM
  // =============================

  // Vertex shader program
  const vsSource = `
      attribute vec2 aVertexPosition;
      attribute vec4 aVertexColor;

      uniform mat4 uTransformMatrix; // This will hold the object's unique transformation
      uniform mat4 uProjectionMatrix; // This will hold the camera's projection matrix

      varying lowp vec4 vColor;

      void main() {
        gl_Position = uProjectionMatrix * uTransformMatrix * vec4(aVertexPosition, 0.0, 1.0);
        vColor = aVertexColor;
        gl_PointSize = ${DOT_SIZE * (canvas.height / 200.0)}; // make size of point depend on canvas size
      }
  `;

  // Fragment shader program
  const fsSource = `
    precision mediump float;

    varying lowp vec4 vColor;

    void main() {
      gl_FragColor = vColor; // Output solid black
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.
  const obstacleProgramInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    },
    uniformLocations: {
      transformMatrix: gl.getUniformLocation(shaderProgram, "uTransformMatrix"),
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
    }
  };
  const peopleProgramInfo = obstacleProgramInfo; // using same shader for now
  const dotProgramInfo = obstacleProgramInfo; // using same shader for now
  const triangleProgramInfo = obstacleProgramInfo; // using same shader for now
  const lineProgramInfo = obstacleProgramInfo; // using same shader for now

  // ==========================
  // Defining objects
  // =========================
  let obstacle = {
    x: 0,
    y: 0,
    scale: 1,
    vertexCount: 6, // triangles
    length: 100,
    width: 100,

    // for the sake of collision detection
    p1: [-50, -50], // minX, minY
    p3: [50, 50], // maxX, maxY
  };

  let people = (() => {
    let array = [];
    for (let i = 0; i < NUMBER_OF_PEOPLE; i++) {
      array.push(Math.random() * (maxX - minX) + minX, Math.random() * (maxY - minY) + minY);
    }
    return array;
  })();

  let dots = (() => {
    let array = [];
    for (let i = 0; i < NUMBER_OF_DOTS; i++) {
      array.push(Math.random() * (maxX - minX) + minX, Math.random() * (maxY - minY) + minY);
    }
    return array;
  })();

  const corners = [
    minX, maxY, // Top-left
    maxX, maxY, // Top-right
    maxX, minY, // Bottom-right
    minX, minY, // Bottom-left
  ]

  // make sure there are no initial collisions
  const updatedPositions = removeCollisions(obstacle, people, dots, { maxX, minX, maxY, minY });
  people = updatedPositions.people;
  dots = updatedPositions.dots;
  let triangle = triangulateWithObstacle(obstacle, dots.concat(corners));
  let lines = { vertices: triangle.vertices, indices: convertTriangleIndicesToLineIndices(triangle.indices) };

  // Here's where we call the routine that builds all the objects we'll be drawing.
  // --- Obstacle Buffers ---
  const obstacleBuffers = initBuffers(gl, {
    positions: [-50, 50, 50, 50, 50, -50, -50, -50],
    colors: [
      1.6, 0.32, 2.4, 1.0,
      1.6, 0.32, 2.4, 1.0,
      1.6, 0.32, 2.4, 1.0,
      1.6, 0.32, 2.4, 1.0,
    ],
    indices: [0, 1, 2, 0, 2, 3],
  });

  // --- People Buffers ---
  const peopleBuffers = initBuffers(gl, {
    positions: people,
    colors: generateUniformColors(NUMBER_OF_PEOPLE, [1.0, 0.0, 0.0, 1.0]), // Red
    positionUsage: gl.DYNAMIC_DRAW,
  });

  // --- Dot Buffers ---
  const dotBuffers = initBuffers(gl, {
    positions: dots,
    colors: generateUniformColors(NUMBER_OF_DOTS, [0.0, 0.0, 0.0, 1.0]), // Black
    positionUsage: gl.DYNAMIC_DRAW,
  });

  // --- Triangle Buffers ---
  const triangleBuffers = initBuffers(gl, {
    positions: triangle.vertices,
    colors: generateUniformColors(triangle.vertices.length / 2, [0.0, 1.0, 0.0, 0.3]), // red, transparent
    indices: triangle.indices,
    positionUsage: gl.DYNAMIC_DRAW,
  });

  // --- Line Buffers ---
  const lineBuffers = initBuffers(gl, {
    positions: lines.vertices,
    colors: generateUniformColors(lines.vertices.length / 2, [0.0, 0.0, 1.0, 1.0]), // Blue
    indices: lines.indices,
    positionUsage: gl.DYNAMIC_DRAW,
  });

  // =============================
  // DOM Related events
  // =============================
  // Keyboard inputs
  document.addEventListener('keydown', (event) => {
    keyboardEvents[event.key] = true;
  });
  document.addEventListener('keyup', (event) => {
    keyboardEvents[event.key] = false;
  })
  // Mouse click
  let mouseX = 0;
  let mouseY = 0;
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();

    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;
    const clipX = (pixelX / canvas.width) * 2 - 1;
    const clipY = (pixelY / canvas.height) * -2 + 1; // Y is inverted
    const clipCoords = vec4.fromValues(clipX, clipY, 0, 1); // vec4 for 4x4 matrix math

    const invProjectionMatrix = mat4.create();
    mat4.invert(invProjectionMatrix, projectionMatrix); // projectionMatrix from main()
    const worldCoords = vec4.create();
    vec4.transformMat4(worldCoords, clipCoords, invProjectionMatrix);

    mouseX = worldCoords[0];
    mouseY = worldCoords[1];
  });


  // ====================================
  // Draw scene
  // ====================================
  function render(now) {
    // calculate movements
    let movement = calculateMovements(keyboardEvents, obstacle, maxX, minX, maxY, minY, minScale, maxScale, keyboardSensitivity, steps);

    if (movement) {
      // if there was a movement, update the people and dot positions to remove collisions
      const updatedPositions = removeCollisions(obstacle, people, dots, { maxX, minX, maxY, minY });
      people = updatedPositions.people;
      dots = updatedPositions.dots;
      // dots.push(...addCorners(obstacle, maxX, minX, maxY, minY)); // adding corners of the canvas
      updateBuffer(gl, gl.ARRAY_BUFFER, peopleBuffers.position, new Float32Array(people), gl.DYNAMIC_DRAW);
      updateBuffer(gl, gl.ARRAY_BUFFER, dotBuffers.position, new Float32Array(dots), gl.DYNAMIC_DRAW);

      // if there was a movement, update triangulation lines
      triangle = triangulateWithObstacle(obstacle, dots.concat(corners));
      lines = { vertices: triangle.vertices, indices: convertTriangleIndicesToLineIndices(triangle.indices) };
      let vertices = new Float32Array(triangle.vertices);
      updateBuffer(gl, gl.ARRAY_BUFFER, triangleBuffers.position, vertices, gl.DYNAMIC_DRAW);
      updateBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, triangleBuffers.indices, new Uint16Array(triangle.indices), gl.DYNAMIC_DRAW);
      updateBuffer(gl, gl.ARRAY_BUFFER, lineBuffers.position, vertices, gl.DYNAMIC_DRAW);
      updateBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, lineBuffers.indices, new Uint16Array(lines.indices), gl.DYNAMIC_DRAW);
    }

    d.innerText = `x: ${obstacle.x}, y: ${obstacle.y}, scale: ${obstacle.scale}`;

    // Clear the canvas before we start drawing on it.
    gl.clearColor(1.0, 1.0, 1.0, 1.0); // Set background to white
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw the elements
    drawObject(gl, triangleProgramInfo, triangleBuffers, mat4.create(), triangle.indices.length, [gl.TRIANGLES], projectionMatrix);
    drawObject(gl, lineProgramInfo, lineBuffers, mat4.create(), lines.indices.length, [gl.LINES], projectionMatrix);
    drawObject(gl, obstacleProgramInfo, obstacleBuffers, getTransformMatrix(obstacle.x, obstacle.y, obstacle.scale), obstacle.vertexCount, [gl.TRIANGLES], projectionMatrix);
    drawObject(gl, dotProgramInfo, dotBuffers, mat4.create(), dots.length / 2, [gl.POINTS], projectionMatrix);
    drawObject(gl, peopleProgramInfo, peopleBuffers, mat4.create(), people.length / 2, [gl.POINTS], projectionMatrix);

    requestAnimationFrame(render);
  }

  // start the loop
  requestAnimationFrame(render);
}

main();
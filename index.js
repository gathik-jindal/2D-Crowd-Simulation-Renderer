import { initBuffers, generateUniformColors } from "./init-buffers.js";
import { drawObject } from "./draw-scene.js";
import { calculateMovements, getTransformMatrix } from "./utility.js";
import { initShaderProgram, updateBuffer } from "./gl-utility.js";
import { updateCollisions, triangulateWithObstacle, getTriangleDensity, convertTriangleIndicesToLineIndices, resetAndRegeneratePoints, findClosestEdge, getObstacleCorners } from "./math.js";
import { createSliderEventListeners, setupSliders, getValuesFromSliders, getMouseWorldCoordinates } from "./DOM.js";

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

let NUMBER_OF_PEOPLE = 200;
let NUMBER_OF_DOTS = 40;
const DOT_SIZE = 2.0; // in canvas units
let DENSITY = 4 // number of people per triangle

const RED = [1.0, 0.0, 0.0, 0.8];
const RED_SOLID = [1.0, 0.0, 0.0, 1.0];
const ORANGE = [1.0, 0.5, 0.0, 1.0];
const GREEN = [0.0, 1.0, 0.0, 1.0];
const BLACK = [0.0, 0.0, 0.0, 1.0];
const BLUE = [0.0, 0.0, 1.0, 1.0];
const YELLOW = [1.0, 1.0, 0.0, 1.0];
const PURPLE = [0.5, 0.0, 0.5, 1.0];

const UNDER_POPULATED_COLOR = BLUE;
const CORRECT_POPULATED_COLOR = GREEN;
const OVER_POPULATED_COLOR = RED;
const LINE_COLOR = BLACK;
const OBSTACLE_COLOR = PURPLE;
const PEOPLE_COLOR = YELLOW;
const DOT_COLOR = BLACK;

let isDragging = false;
let draggedPointIndex = -1; // the index of the person being dragged
let editMode = 'none'; // can be 'none', 'addTriangle', or 'deleteEdge'
let triangleSelection = []; // stores the indices of vertices for creating a new triangle


function main() {
  // =============================
  // Setting up WebGL context 
  // =============================
  const d = document.getElementById("debug");
  setupSliders(NUMBER_OF_DOTS, NUMBER_OF_PEOPLE, DENSITY);
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

    rotation: 0,

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
  const updatedPositions = updateCollisions(obstacle, people, dots, { maxX, minX, maxY, minY }, NUMBER_OF_DOTS, NUMBER_OF_PEOPLE);
  people = updatedPositions.people;
  dots = updatedPositions.dots;
  let triangle = triangulateWithObstacle(obstacle, dots.concat(corners));
  let lines = { vertices: triangle.vertices, indices: convertTriangleIndicesToLineIndices(triangle.indices) };
  // get triangles based on density
  let triangleDensity = getTriangleDensity(triangle, people, DENSITY);
  let overPopulatedTriangles = triangleDensity.red;
  let correctPopulatedTriangles = triangleDensity.orange;
  let underPopulatedTriangles = triangleDensity.blue;

  // Here's where we call the routine that builds all the objects we'll be drawing.
  // --- Obstacle Buffers ---
  const obstacleBuffers = initBuffers(gl, {
    positions: [-50, 50, 50, 50, 50, -50, -50, -50],
    colors: [...OBSTACLE_COLOR, ...OBSTACLE_COLOR, ...OBSTACLE_COLOR, ...OBSTACLE_COLOR],
    indices: [0, 1, 2, 0, 2, 3],
  });

  // --- People Buffers ---
  const peopleBuffers = initBuffers(gl, {
    positions: people,
    colors: generateUniformColors(NUMBER_OF_PEOPLE, PEOPLE_COLOR),
    positionUsage: gl.DYNAMIC_DRAW,
    colorUsage: gl.DYNAMIC_DRAW,
  });

  // --- Dot Buffers ---
  const dotBuffers = initBuffers(gl, {
    positions: dots,
    colors: generateUniformColors(NUMBER_OF_DOTS, DOT_COLOR),
    positionUsage: gl.DYNAMIC_DRAW,
    colorUsage: gl.DYNAMIC_DRAW,
  });

  // --- Triangle Buffers ---
  const overPopulatedTriangleBuffers = initBuffers(gl, {
    positions: overPopulatedTriangles.vertices,
    colors: generateUniformColors(overPopulatedTriangles.vertices.length / 2, OVER_POPULATED_COLOR), // red, transparent
    indices: overPopulatedTriangles.indices,
    positionUsage: gl.DYNAMIC_DRAW,
    colorUsage: gl.DYNAMIC_DRAW,
  });

  const correctPopulatedTriangleBuffers = initBuffers(gl, {
    positions: correctPopulatedTriangles.vertices,
    colors: generateUniformColors(correctPopulatedTriangles.vertices.length / 2, CORRECT_POPULATED_COLOR), // orange, transparent
    indices: correctPopulatedTriangles.indices,
    positionUsage: gl.DYNAMIC_DRAW,
    colorUsage: gl.DYNAMIC_DRAW,
  });

  const underPopulatedTriangleBuffers = initBuffers(gl, {
    positions: underPopulatedTriangles.vertices,
    colors: generateUniformColors(underPopulatedTriangles.vertices.length / 2, UNDER_POPULATED_COLOR), // blue, transparent
    indices: underPopulatedTriangles.indices,
    positionUsage: gl.DYNAMIC_DRAW,
    colorUsage: gl.DYNAMIC_DRAW,
  });

  // --- Line Buffers ---
  const lineBuffers = initBuffers(gl, {
    positions: lines.vertices,
    colors: generateUniformColors(lines.vertices.length / 2, LINE_COLOR), // Blue
    indices: lines.indices,
    positionUsage: gl.DYNAMIC_DRAW,
    colorUsage: gl.DYNAMIC_DRAW,
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

  // Mouse click (dragging people)
  const pickRadius = 5.0; // in world units

  canvas.addEventListener('mousedown', (event) => {
    const mouseWorld = getMouseWorldCoordinates(event, canvas, projectionMatrix);
    const allTriPoints = dots.concat(corners, ...getObstacleCorners(obstacle)); // all possible points for triangle creation

    // --- MODE: ADD TRIANGLE ---
    if (editMode === 'addTriangle') {
      let closestDistSq = Infinity;
      let pickedVertexIndex = -1;

      // find the closest vertex (dot or corner) to the click
      for (let i = 0; i < allTriPoints.length; i += 2) {
        const dx = mouseWorld.x - allTriPoints[i];
        const dy = mouseWorld.y - allTriPoints[i + 1];
        const distSq = dx * dx + dy * dy;

        if (distSq < pickRadius * pickRadius && distSq < closestDistSq) {
          closestDistSq = distSq;
          pickedVertexIndex = i / 2;
        }
      }

      if (pickedVertexIndex !== -1 && !triangleSelection.includes(pickedVertexIndex)) {
        triangleSelection.push(pickedVertexIndex);
        editModeStatus.innerText = `Current Mode: Add Triangle (selected ${triangleSelection.length}/3 points)`;

        // if we have selected 3 points, create the new triangle
        if (triangleSelection.length === 3) {
          triangle.indices.push(...triangleSelection);
          triangleSelection = [];
          editModeStatus.innerText = "Current Mode: Add Triangle (select 3 points)";
          update(false);
        }
      }
    }
    // --- MODE: DELETE EDGE ---
    else if (editMode === 'deleteEdge') {
      const closest = findClosestEdge(mouseWorld, triangle.vertices, triangle.indices);

      if (closest && closest.distance < pickRadius) {
        const [v1, v2] = closest.edge;
        const newIndices = [];
        // filter out any triangle that contains the selected edge
        for (let i = 0; i < triangle.indices.length; i += 3) {
          const tri = [triangle.indices[i], triangle.indices[i + 1], triangle.indices[i + 2]];
          if (!(tri.includes(v1) && tri.includes(v2))) {
            newIndices.push(...tri);
          }
        }
        triangle.indices = newIndices;
        update(false); // no need to retriangulate
      }
    }
    // --- MODE: NONE (DRAG PEOPLE) ---
    else {
      let closestDistSq = Infinity;
      draggedPointIndex = -1; // reset before checking
      for (let i = 0; i < people.length; i += 2) {
        const dx = mouseWorld.x - people[i];
        const dy = mouseWorld.y - people[i + 1];
        const distSq = dx * dx + dy * dy;
        if (distSq < pickRadius * pickRadius && distSq < closestDistSq) {
          closestDistSq = distSq;
          draggedPointIndex = i / 2;
        }
      }
      if (draggedPointIndex !== -1) {
        isDragging = true;
      }
    }
  });

  canvas.addEventListener('mousemove', (event) => {
    if (!isDragging) {
      return;
    }

    const mouseWorld = getMouseWorldCoordinates(event, canvas, projectionMatrix);

    people[draggedPointIndex * 2] = mouseWorld.x;
    people[draggedPointIndex * 2 + 1] = mouseWorld.y;

    updateBuffer(gl, gl.ARRAY_BUFFER, peopleBuffers.position, new Float32Array(people), gl.DYNAMIC_DRAW);
  });

  canvas.addEventListener('mouseup', (event) => {
    if (isDragging) {
      isDragging = false;
      draggedPointIndex = -1;

      update(false); // don't retriangulate, just update densities
    }
  });

  const editModeStatus = document.getElementById("edit-mode-status");
  document.getElementById("mode-none").addEventListener('click', () => {
    editMode = 'none';
    triangleSelection = []; // clear selection when changing mode
    editModeStatus.innerText = "Current Mode: None (Drag people)";
  });
  document.getElementById("mode-add").addEventListener('click', () => {
    editMode = 'addTriangle';
    triangleSelection = [];
    editModeStatus.innerText = "Current Mode: Add Triangle (select 3 points)";
  });
  document.getElementById("mode-delete").addEventListener('click', () => {
    editMode = 'deleteEdge';
    triangleSelection = [];
    editModeStatus.innerText = "Current Mode: Delete Edge (click an edge)";
  });

  let update = (retriangulate) => { }; // prototype function

  // Handle sliders
  createSliderEventListeners(() => {
    let values = getValuesFromSliders();
    NUMBER_OF_DOTS = values.numDots;
    NUMBER_OF_PEOPLE = values.numPeople;
    DENSITY = values.density;

    const regenerated = resetAndRegeneratePoints(gl, obstacle, { maxX, minX, maxY, minY }, peopleBuffers, dotBuffers, NUMBER_OF_DOTS, NUMBER_OF_PEOPLE, dots, people, lineBuffers);
    people = regenerated.people;
    dots = regenerated.dots;

    update(false);
  });

  // =============================
  // Update function
  // =============================
  update = (retriangulate = true) => {
    const updatedPositions = updateCollisions(obstacle, people, dots, { maxX, minX, maxY, minY }, NUMBER_OF_DOTS, NUMBER_OF_PEOPLE);
    people = updatedPositions.people;
    dots = updatedPositions.dots;
    updateBuffer(gl, gl.ARRAY_BUFFER, peopleBuffers.position, new Float32Array(people), gl.DYNAMIC_DRAW);
    updateBuffer(gl, gl.ARRAY_BUFFER, dotBuffers.position, new Float32Array(dots), gl.DYNAMIC_DRAW);

    // if there was a movement, update triangulation lines
    if (retriangulate)
      triangle = triangulateWithObstacle(obstacle, dots.concat(corners));

    triangleDensity = getTriangleDensity(triangle, people, DENSITY);
    overPopulatedTriangles = triangleDensity.red;
    correctPopulatedTriangles = triangleDensity.orange;
    underPopulatedTriangles = triangleDensity.blue;
    lines = { vertices: triangle.vertices, indices: convertTriangleIndicesToLineIndices(triangle.indices) };

    // red triangles
    updateBuffer(gl, gl.ARRAY_BUFFER, overPopulatedTriangleBuffers.position, new Float32Array(overPopulatedTriangles.vertices), gl.DYNAMIC_DRAW);
    updateBuffer(gl, gl.ARRAY_BUFFER, overPopulatedTriangleBuffers.color, new Float32Array(generateUniformColors(overPopulatedTriangles.vertices.length / 2, OVER_POPULATED_COLOR)), gl.DYNAMIC_DRAW);
    updateBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, overPopulatedTriangleBuffers.indices, new Uint16Array(overPopulatedTriangles.indices), gl.DYNAMIC_DRAW);

    // orange triangles
    updateBuffer(gl, gl.ARRAY_BUFFER, correctPopulatedTriangleBuffers.position, new Float32Array(correctPopulatedTriangles.vertices), gl.DYNAMIC_DRAW);
    updateBuffer(gl, gl.ARRAY_BUFFER, correctPopulatedTriangleBuffers.color, new Float32Array(generateUniformColors(correctPopulatedTriangles.vertices.length / 2, CORRECT_POPULATED_COLOR)), gl.DYNAMIC_DRAW);
    updateBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, correctPopulatedTriangleBuffers.indices, new Uint16Array(correctPopulatedTriangles.indices), gl.DYNAMIC_DRAW);

    // blue triangles
    updateBuffer(gl, gl.ARRAY_BUFFER, underPopulatedTriangleBuffers.position, new Float32Array(underPopulatedTriangles.vertices), gl.DYNAMIC_DRAW);
    updateBuffer(gl, gl.ARRAY_BUFFER, underPopulatedTriangleBuffers.color, new Float32Array(generateUniformColors(underPopulatedTriangles.vertices.length / 2, UNDER_POPULATED_COLOR)), gl.DYNAMIC_DRAW);
    updateBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, underPopulatedTriangleBuffers.indices, new Uint16Array(underPopulatedTriangles.indices), gl.DYNAMIC_DRAW);

    // lines
    let vertices = new Float32Array(triangle.vertices);
    updateBuffer(gl, gl.ARRAY_BUFFER, lineBuffers.position, vertices, gl.DYNAMIC_DRAW);
    updateBuffer(gl, gl.ARRAY_BUFFER, lineBuffers.color, new Float32Array(generateUniformColors(lines.vertices.length / 2, LINE_COLOR)), gl.DYNAMIC_DRAW);
    updateBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, lineBuffers.indices, new Uint16Array(lines.indices), gl.DYNAMIC_DRAW);
  }

  // ====================================
  // Draw scene
  // ====================================
  let then = 0;
  function render(now) {
    // calculate movements
    let movement = calculateMovements(keyboardEvents, obstacle, maxX, minX, maxY, minY, minScale, maxScale, keyboardSensitivity, steps);

    if (movement) {
      // if there was a movement, update the people and dot positions to remove collisions
      update();
    }

    let lag = now - then;
    d.innerText = `x: ${Math.round(obstacle.x)}, y: ${Math.round(obstacle.y)}, scale: ${Math.round(obstacle.scale * 100)}%, rotation: ${obstacle.rotation}, lag: ${Math.round(lag)}ms`;

    // clear the canvas before we start drawing on it.
    gl.clearColor(1.0, 1.0, 1.0, 1.0); // set background to white
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw the elements
    drawObject(gl, triangleProgramInfo, overPopulatedTriangleBuffers, mat4.create(), overPopulatedTriangles.indices.length, [gl.TRIANGLES], projectionMatrix);
    drawObject(gl, triangleProgramInfo, correctPopulatedTriangleBuffers, mat4.create(), correctPopulatedTriangles.indices.length, [gl.TRIANGLES], projectionMatrix);
    drawObject(gl, triangleProgramInfo, underPopulatedTriangleBuffers, mat4.create(), underPopulatedTriangles.indices.length, [gl.TRIANGLES], projectionMatrix);
    drawObject(gl, lineProgramInfo, lineBuffers, mat4.create(), lines.indices.length, [gl.LINES], projectionMatrix);
    drawObject(gl, obstacleProgramInfo, obstacleBuffers, getTransformMatrix(obstacle.x, obstacle.y, obstacle.scale, obstacle.rotation), obstacle.vertexCount, [gl.TRIANGLES], projectionMatrix);
    drawObject(gl, dotProgramInfo, dotBuffers, mat4.create(), dots.length / 2, [gl.POINTS], projectionMatrix);
    drawObject(gl, peopleProgramInfo, peopleBuffers, mat4.create(), people.length / 2, [gl.POINTS], projectionMatrix);

    then = now;
    requestAnimationFrame(render);
  }

  // start the loop
  requestAnimationFrame(render);
}

main();

export { PEOPLE_COLOR, DOT_COLOR };
/**
 * Creates a complete set of WebGL buffers for an object.
 * @param {WebGLRenderingContext} gl The WebGL context.
 * @param {object} data The data for the buffers.
 * @param {Array<Number>} data.positions The vertex positions.
 * @param {Array<Number>} data.colors The vertex colors.
 * @param {Array<Number>} [data.indices] Optional: The vertex indices for indexed drawing.
 * @param {GLenum} [data.positionUsage=gl.STATIC_DRAW] The usage hint for the position buffer.
 * @returns {{position: WebGLBuffer, color: WebGLBuffer, indices: WebGLBuffer|null}}
 */
function initBuffers(gl, { positions, colors, indices, positionUsage = gl.STATIC_DRAW }) {
    // --- Position Buffer ---
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), positionUsage);

    // --- Color Buffer ---
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // --- Index Buffer (optional) ---
    let indexBuffer = null;
    if (indices) {
        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };
}

/**
 * Generates a color array for a given number of vertices, all with the same color.
 * @param {Number} numVertices The number of vertices.
 * @param {Array<Number>} color The RGBA color array, e.g., [1.0, 0.0, 0.0, 1.0] for red.
 * @returns {Array<Number>} A flat array of color data.
 */
function generateUniformColors(numVertices, color) {
    const colors = [];
    for (let i = 0; i < numVertices; i++) {
        colors.push(...color);
    }
    return colors;
}

export { initBuffers, generateUniformColors };
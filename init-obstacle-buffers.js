/**
 * Initializes the required buffers, for now color and position buffer
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @returns {{position: WebGLBuffer, color: WebGLBuffer, indices: WebGLBuffer}} An object containing the initialized buffers.
 */

function initObstacleBuffers(gl) {
    const positionBuffer = initObstaclePositionBuffer(gl);
    const colorBuffer = initObstacleColorBuffer(gl);
    const indexBuffer = initObstacleIndexBuffer(gl);

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };
}

/**
 * Initializes the position buffer
 * @param {WebGLRenderingContext} gl the WebGL rendering context
 * @returns {WebGLBuffer} The WebGL buffer object containing the positions
 */
function initObstaclePositionBuffer(gl) {
    // Create a buffer for the cube's positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions for the cube.
    const positions = [-50, 50, 50, 50, 50, -50, -50, -50];

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}

/**
 * Initializes the color buffer
 * @param {WebGLRenderingContext} gl the WebGL rendering context
 * @return {WebGLBuffer} The WebGL buffer object containing the colors
 */
function initObstacleColorBuffer(gl) {
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    const colors = [
        1.6, 0.32, 2.4, 1.0,
        1.6, 0.32, 2.4, 1.0,
        1.6, 0.32, 2.4, 1.0,
        1.6, 0.32, 2.4, 1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return colorBuffer;
}

/**
 * Initializes the element buffer, these are so that webgl knows which 3 vertices are traingles (doing the triangulation)
 * @param {WebGLRenderingContext} gl The WebGL rendering context
 * @returns {WebGLBuffer}
 */
function initObstacleIndexBuffer(gl) {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.

    // prettier-ignore
    const indices = [
        0, 1, 2,
        0, 2, 3,
    ];

    // Now send the element array to GL

    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW,
    );

    return indexBuffer;
}

export { initObstacleBuffers };
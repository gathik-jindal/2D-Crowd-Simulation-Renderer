/**
 * Initializes the required buffers, for now color and position buffer
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @returns {{position: WebGLBuffer, indices: WebGLBuffer}} An object containing the initialized buffers.
 */

function initBuffers(gl) {
    const positionBuffer = initPositionBuffer(gl);
    const indexBuffer = initIndexBuffer(gl);

    return {
        position: positionBuffer,
        indices: indexBuffer,
    };
}

/**
 * Initializes the position buffer
 * @param {WebGLRenderingContext} gl the WebGL rendering context
 * @returns {WebGLBuffer} The WebGL buffer object containing the positions
 */
function initPositionBuffer(gl) {
    // Create a buffer for the cube's positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions for the cube.
    const positions = [-0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5];

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}

/**
 * Initializes the element buffer, these are so that webgl knows which 3 vertices are traingles (doing the triangulation)
 * @param {WebGLRenderingContext} gl The WebGL rendering context
 * @returns {WebGLBuffer}
 */
function initIndexBuffer(gl) {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.

    // prettier-ignore
    const indices = [0, 1, 1, 2, 2, 3, 3, 0];

    // Now send the element array to GL

    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW,
    );

    return indexBuffer;
}

export { initBuffers };
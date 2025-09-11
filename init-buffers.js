/**
 * Initializes the required buffers, for now only position buffer
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @returns {{position: WebGLBuffer}} An object containing the initialized buffers.
 */

function initBuffers(gl) {
    const positionBuffer = initPositionBuffer(gl);

    return {
        position: positionBuffer,
    };
}

/**
 * Initilizes the position buffer
 * @param {WebGLRenderingContext} gl the WebGL rendering context
 * @returns {WebGLBuffer} The WebGL buffer object containing the positions
 */
function initPositionBuffer(gl) {
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions for the square.
    const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}

export { initBuffers };
/**
 * Initializes the required buffers, for now color and position buffer
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @returns {{position: WebGLBuffer, color: WebGLBuffer, indices: WebGLBuffer}} An object containing the initialized buffers.
 */

function initPeopleBuffers(gl, array) {
    const numberOfPeople = array.length / 2;
    const positionBuffer = initPeoplePositionBuffer(gl, array);
    const colorBuffer = initPeopleColorBuffer(gl, numberOfPeople);
    const indexBuffer = initPeopleIndexBuffer(gl, numberOfPeople);

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
function initPeoplePositionBuffer(gl, positions) {
    // Create a buffer for the cube's positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);

    return positionBuffer;
}

/**
 * Initializes the color buffer
 * @param {WebGLRenderingContext} gl the WebGL rendering context
 * @return {WebGLBuffer} The WebGL buffer object containing the colors
 */
function initPeopleColorBuffer(gl, numberOfPeople) {
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    let colors = [];
    for (let i = 0; i < numberOfPeople; i++) {
        // Use push() to add the values to the 'colors' array
        colors.push(1.0, 0.0, 0.0, 1.0); // red color for each person
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return colorBuffer;
}

/**
 * Initializes the element buffer
 * @param {WebGLRenderingContext} gl The WebGL rendering context
 * @returns {WebGLBuffer}
 */
function initPeopleIndexBuffer(gl, numberOfPeople) {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.

    // prettier-ignore
    const indices = [];
    for (let i = 0; i < numberOfPeople; i++) {
        indices.push(i);
    }

    // Now send the element array to GL

    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW,
    );

    return indexBuffer;
}

export { initPeopleBuffers };
/**
 * Draws the scene
 * @param {WebGLRenderingContext} gl The WebGL rendering context
 * @param {{program: WebGLProgram, attribLocations: {vertexPosition: Number}, uniformLocations: {transformMatrix: Number}}} programInfo An object containing the attribute and uniform locations of the shader program.
 * @param {{position: WebGLBuffer, indices: WebGLBuffer}} buffers An object containing the different buffers required.
 * @param {mat4} transformMatrix The matrix that will transform the vertices this scene will draw
 * @param {number} vertexCount The number of primitives in total
 * @param {Array<GLenum>} primitiveType An array containing the primities to draw with these vertices
 */
function drawObject(gl, programInfo, buffers, transformMatrix, vertexCount, primitiveType) {
    // connect the buffers to our program and ask gl to use it
    setPositionAttribute(gl, buffers, programInfo);
    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.transformMatrix,
        false,
        transformMatrix,
    );

    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    for (let t in primitiveType)
        gl.drawElements(t, vertexCount, type, offset);

    // gl.drawElements(gl.POINTS, vertexCount, type, offset);
    // gl.drawElements(gl.LINES, vertexCount, type, offset);
}

/**
 * Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute.
 * @param {WebGLRenderingContext} gl The WebGL rendering context
 * @param {{position: WebGLBuffer, indices: WebGLBuffer}} buffers An object containing the different buffers required.
 * @param {{program: WebGLProgram, attribLocations: {vertexPosition: Number}}} programInfo An object containing the attribute and unifrm locations of the shader program.
 */
function setPositionAttribute(gl, buffers, programInfo) {
    const numComponents = 2; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

export { drawObject };
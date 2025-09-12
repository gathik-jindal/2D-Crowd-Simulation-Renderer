/**
 * 
 * @param {WebGLRenderingContext} gl The WebGL rendering context
 * @param {{program: WebGLProgram, attribLocations: {vertexPosition: Number, vertexColor: Number}, uniformLocations: {projectionMatrix: Number, modelViewMatrix: Number}}} programInfo An object containing the attribute and unifrm locations of the shader program.
 * @param {{position: WebGLBuffer, color: WebGLBuffer, indices: WebGLBuffer}} buffers An object containing the different buffers required.
 * @param {Number} cubeRotation The amount to rotate the cube
 * @param {Array} cubeTranslation The x, y change
 */
function drawScene(gl, programInfo, buffers, cubeRotation, cubeTranslation, yaw, pitch) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // alternate projection view
    // mat4.ortho(projectionMatrix,
    //     -10, 10,   // left, right
    //     -10, 10,   // bottom, top
    //     -1, 100    // near, far
    // );

    // note: glMatrix always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    /** @type {mat4} */
    const modelViewMatrix = mat4.create();

    // Now move the drawing position a bit to where we want to
    // start drawing the cube.
    mat4.translate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to translate
        [0, 0, -6.0], // amount to translate
    );
    // Apply camera rotation (pitch, then yaw)
    mat4.rotate(modelViewMatrix, modelViewMatrix, pitch, [1, 0, 0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, yaw, [0, 1, 0]);
    mat4.translate(
        modelViewMatrix,
        modelViewMatrix,
        cubeTranslation
    )

    mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        cubeRotation, // amount to rotate in radians
        [0, 0, 1],
    ); // axis to rotate around (Z)
    mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        cubeRotation * 0.7, // amount to rotate in radians
        [0, 1, 0],
    ); // axis to rotate around (Y)
    mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        cubeRotation * 0.3, // amount to rotate in radians
        [1, 0, 0],
    ); // axis to rotate around (X)

    // connect the buffers to our program and ask gl to use it
    setPositionAttribute(gl, buffers, programInfo);
    setColorAttribute(gl, buffers, programInfo);
    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix,
    );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix,
    );

    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

/**
 * Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute.
 * @param {WebGLRenderingContext} gl The WebGL rendering context
 * @param {{position: WebGLBuffer, color: WebGLBuffer, indices: WebGLBuffer}} buffers An object containing the different buffers required.
 * @param {{program: WebGLProgram, attribLocations: {vertexPosition: Number, vertexColor: Number}, uniformLocations: {projectionMatrix: Number, modelViewMatrix: Number}}} programInfo An object containing the attribute and unifrm locations of the shader program.
 */
function setPositionAttribute(gl, buffers, programInfo) {
    const numComponents = 3; // pull out 3 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
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

/**
 * Tell WebGL how to pull out the colors from the color buffer into the vertexColor attribute.
 * @param {WebGLRenderingContext} gl The WebGL rendering contrext
 * @param {{position: WebGLBuffer, color: WebGLBuffer, indices: WebGLBuffer}} buffers An object containing the different buffers required.
 * @param {{program: WebGLProgram, attribLocations: {vertexPosition: Number, vertexColor: Number}, uniformLocations: {projectionMatrix: Number, modelViewMatrix: Number}}} programInfo An object containing the attribute and unifrm locations of the shader program.
 */
function setColorAttribute(gl, buffers, programInfo) {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

export { drawScene };
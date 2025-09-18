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

/**
 * Updates the data in a given buffer
 * @param {WebGLRenderingContext} gl The WebGL rendering context
 * @param {WebGLBuffer} buffer The buffer to update
 * @param {Array} data The new data to put in the buffer
 * @param {Number} usage The usage pattern of the data store. Default is gl.DYNAMIC_DRAW
 *                      Other options include gl.STATIC_DRAW and gl.STREAM_DRAW
 */
function updateBuffer(gl, buffer, data, usage = gl.DYNAMIC_DRAW) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), usage);
}

export { initShaderProgram, updateBuffer };
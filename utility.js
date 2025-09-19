/**
 * Utility functions for handling keyboard events and object movements.
 * @param {Object} keyboardEvents The object containing the keyboard events
 * @param {*} object The element object
 * @returns {boolean} Returns true if there was any movement, false otherwise
 */
function calculateMovements(keyboardEvents, object, maxX, minX, maxY, minY, minScale, maxScale, keyboardSensitivity = 1, steps = 3) {
    let movement = false;
    if (keyboardEvents['w']) {
        object.y += steps * keyboardSensitivity;
        movement = true;
    }
    if (keyboardEvents['s']) {
        object.y -= steps * keyboardSensitivity;
        movement = true;
    }
    if (keyboardEvents['a']) {
        object.x -= steps * keyboardSensitivity;
        movement = true;
    }
    if (keyboardEvents['d']) {
        object.x += steps * keyboardSensitivity;
        movement = true;
    }

    if (keyboardEvents['o']) {
        object.scale += 0.01 * keyboardSensitivity;
        movement = true;
    }
    if (keyboardEvents['p']) {
        object.scale -= 0.01 * keyboardSensitivity;
        movement = true;
    }

    clamp(object, maxX, minX, maxY, minY, minScale, maxScale);

    object.p1 = [object.x - (object.length * object.scale) / 2, object.y - (object.width * object.scale) / 2];
    object.p3 = [object.x + (object.length * object.scale) / 2, object.y + (object.width * object.scale) / 2];

    return movement;
}

/**
 * Transform the x and y to a translation matrix
 * @param {Number} x The x location of the vertex (-100 to 100)
 * @param {Number} y The y location of the vertex (-100 to 100)
 * @returns {mat4} The tranform matrix
 */
function getTransformMatrix(x, y, scale) {
    const transformMatrix = mat4.create();
    mat4.translate(transformMatrix, transformMatrix, [x, y, 0]);
    mat4.scale(transformMatrix, transformMatrix, [scale, scale, 1]);

    return transformMatrix;
}

/**
 * 
 * @param {Object} object The obstacle object
 * @param {Number} maxX Max x value
 * @param {Number} minX Min x value
 * @param {Number} maxY Min y value
 * @param {Number} minY Min y value
 * @param {Number} minScale Min scale
 * @param {Number} maxScale Max scale
 */
function clamp(object, maxX, minX, maxY, minY, minScale, maxScale) {
    if (object.scale < minScale) object.scale = minScale;
    if (object.scale > maxScale) object.scale = maxScale;

    let realLength = object.length * object.scale;
    let realWidth = object.width * object.scale;

    if (object.x + realLength / 2 > maxX) object.x = maxX - realLength / 2;
    if (object.x - realLength / 2 < minX) object.x = minX + realLength / 2;
    if (object.y + realWidth / 2 > maxY) object.y = maxY - realWidth / 2;
    if (object.y - realWidth / 2 < minY) object.y = minY + realWidth / 2;
}

export { calculateMovements, getTransformMatrix };
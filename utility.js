/**
 * Utility functions for handling keyboard events and object movements.
 * @param {Object} keyboardEvents The object containing the keyboard events
 * @param {*} object The element object
 * @returns {boolean} Returns true if there was any movement, false otherwise
 */
function calculateMovements(keyboardEvents, object, maxX, minX, maxY, minY, minScale, maxScale, keyboardSensitivity = 1, steps = 3) {
    let movement = false;
    if (keyboardEvents['w'] || keyboardEvents['ArrowUp'] || keyboardEvents['W']) {
        object.y += steps * keyboardSensitivity;
        movement = true;
    }
    if (keyboardEvents['s'] || keyboardEvents['ArrowDown'] || keyboardEvents['S']) {
        object.y -= steps * keyboardSensitivity;
        movement = true;
    }
    if (keyboardEvents['a'] || keyboardEvents['ArrowLeft'] || keyboardEvents['A']) {
        object.x -= steps * keyboardSensitivity;
        movement = true;
    }
    if (keyboardEvents['d'] || keyboardEvents['ArrowRight'] || keyboardEvents['D']) {
        object.x += steps * keyboardSensitivity;
        movement = true;
    }
    if (keyboardEvents['q'] || keyboardEvents['Q']) {
        object.rotation += 1 * keyboardSensitivity;
        movement = true;
    }
    if (keyboardEvents['e'] || keyboardEvents['E']) {
        object.rotation -= 1 * keyboardSensitivity;
        movement = true;
    }

    if (keyboardEvents['o'] || keyboardEvents['O']) {
        object.scale += 0.01 * keyboardSensitivity;
        movement = true;
    }
    if (keyboardEvents['p'] || keyboardEvents['P']) {
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
 * @param {Number} scale The scale of the object (1 is original size)
 * @param {Number} rotation The rotation of the object in degrees
 * @returns {mat4} The tranform matrix
 */
function getTransformMatrix(x, y, scale, rotation) {
    /** @type {mat4} */
    const transformMatrix = mat4.create();
    mat4.translate(transformMatrix, transformMatrix, [x, y, 0]);
    mat4.rotateZ(transformMatrix, transformMatrix, rotation * Math.PI / 180);
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
    if (object.rotation >= 90) object.rotation = 0;
    if (object.rotation < -90) object.rotation = 0;

    const halfLength = (object.length * object.scale) / 2;
    const halfWidth = (object.width * object.scale) / 2;
    const angleRad = object.rotation * Math.PI / 180;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    const localCorners = [
        { x: -halfLength, y: -halfWidth },
        { x: halfLength, y: -halfWidth },
        { x: halfLength, y: halfWidth },
        { x: -halfLength, y: halfWidth },
    ];

    const worldCorners = localCorners.map(p => {
        const rotatedX = p.x * cosAngle - p.y * sinAngle;
        const rotatedY = p.x * sinAngle + p.y * cosAngle;
        return {
            x: rotatedX + object.x,
            y: rotatedY + object.y,
        };
    });

    // find the min/max extents of the rotated object (its new AABB)
    let rotMinX = Infinity, rotMaxX = -Infinity, rotMinY = Infinity, rotMaxY = -Infinity;
    worldCorners.forEach(p => {
        rotMinX = Math.min(rotMinX, p.x);
        rotMaxX = Math.max(rotMaxX, p.x);
        rotMinY = Math.min(rotMinY, p.y);
        rotMaxY = Math.max(rotMaxY, p.y);
    });

    // push the object back inside the boundaries if it has moved outside
    if (rotMaxX > maxX) object.x -= (rotMaxX - maxX);
    if (rotMinX < minX) object.x += (minX - rotMinX);
    if (rotMaxY > maxY) object.y -= (rotMaxY - maxY);
    if (rotMinY < minY) object.y += (minY - rotMinY);
}

export { calculateMovements, getTransformMatrix };
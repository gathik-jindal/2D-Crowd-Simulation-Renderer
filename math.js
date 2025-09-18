/**
 * This function removes people and dots that collide with a given obstacle position and adds them back within the defined boundaries.
 * @param {p1: Array<Number>, p2: Array<Number>, p3: Array<Number>, p4: Array<Number>, } obstacle The obstacle's position
 * @param {Array<Number>} people The array of people positions [x1, y1, x2, y2, ...]
 * @param {Array<Number>} dots The array of dot positions [x1, y1, x2, y2, ...]
 * @param {maxX: Number, minX: Number, maxY: Number, minY: Number} bounds The boundary limits
 * @returns {people: Array<Number>, dots: Array<Number>} The updated array of dots and people positions
 */
function removeCollisions(obstacle, people, dots, bounds) {
    const maxX = bounds.maxX;
    const minX = bounds.minX;
    const maxY = bounds.maxY;
    const minY = bounds.minY;

    function isColliding(x, y) {
        let isInside = false;
        if (x >= obstacle.p1[0] && x <= obstacle.p3[0] && y >= obstacle.p1[1] && y <= obstacle.p3[1]) {
            isInside = true;
        }

        return isInside;
    }

    // Remove colliding people
    let updatedPeople = [];
    for (let i = 0; i < people.length; i += 2) {
        const px = people[i];
        const py = people[i + 1];
        if (!isColliding(px, py)) {
            updatedPeople.push(px, py);
        }
    }

    // Remove colliding dots
    let updatedDots = [];
    for (let i = 0; i < dots.length; i += 2) {
        const dx = dots[i];
        const dy = dots[i + 1];
        if (!isColliding(dx, dy)) {
            updatedDots.push(dx, dy);
        }
    }

    // Calculate how many people and dots were removed
    const peopleRemoved = (people.length - updatedPeople.length) / 2;
    const dotsRemoved = (dots.length - updatedDots.length) / 2;

    // Add new people at random positions within the bounds
    for (let i = 0; i < peopleRemoved; i++) {
        const newPos = createNewPosition(obstacle, minX, maxX, minY, maxY);
        updatedPeople.push(newPos.x, newPos.y);
    }

    // Add new dots at random positions within the bounds
    for (let i = 0; i < dotsRemoved; i++) {
        const newPos = createNewPosition(obstacle, minX, maxX, minY, maxY);
        updatedDots.push(newPos.x, newPos.y);
    }

    return { people: updatedPeople, dots: updatedDots };
}

/**
 * Generates a new position outside of a rectangular obstacle but within defined bounds.
 * @param {object} obstacle - The obstacle with p1 [minX, minY] and p3 [maxX, maxY] corners.
 * @param {number} minX - The minimum X boundary.
 * @param {number} maxX - The maximum X boundary.
 * @param {number} minY - The minimum Y boundary.
 * @param {number} maxY - The maximum Y boundary.
 * @returns {{x: number, y: number}|null} - The new position, or null if no space is available.
 */
function createNewPosition(obstacle, minX, maxX, minY, maxY) {
    const potentialRegions = [
        {
            x: minX,
            y: minY,
            width: obstacle.p1[0] - minX,
            height: maxY - minY
        },
        {
            x: obstacle.p3[0],
            y: minY,
            width: maxX - obstacle.p3[0],
            height: maxY - minY
        },
        {
            x: obstacle.p1[0],
            y: minY,
            width: obstacle.p3[0] - obstacle.p1[0],
            height: obstacle.p1[1] - minY
        },
        {
            x: obstacle.p1[0],
            y: obstacle.p3[1],
            width: obstacle.p3[0] - obstacle.p1[0],
            height: maxY - obstacle.p3[1]
        }
    ];

    const validRegions = potentialRegions.filter(region => region.width > 0 && region.height > 0);

    if (validRegions.length === 0) {
        console.error("No valid spawn area exists.");
        return null;
    }

    const chosenRegion = validRegions[Math.floor(Math.random() * validRegions.length)];

    const x = Math.random() * chosenRegion.width + chosenRegion.x;
    const y = Math.random() * chosenRegion.height + chosenRegion.y;

    return { x, y };
}

/**
 * Triangulates a set of 2D points around a square obstacle, ensuring no triangle
 * edges pass through the obstacle. This is achieved by treating the obstacle's
 * edges as constraints.
 *
 * @param {object} obstacle - The obstacle definition.
 * @param {number} obstacle.cx - The center x-coordinate of the obstacle.
 * @param {number} obstacle.cy - The center y-coordinate of the obstacle.
 * @param {number} obstacle.length - The length of the obstacle.
 * @param {number} obstacle.width - The width of the obstacle
 * @param {number} obstacle.scale - The scale factor for the obstacle.
 * @param {number[]} flatPoints - A flat array of points in the format [x1, y1, x2, y2, ...].
 * @returns {{flatPoints: number[], indices: number[]}} An object containing a flat array of
 * vertex coordinates (x1, y1, x2, y2, ...) and a flat array of triangle indices
 * (i1, i2, i3, i4, i5, i6, ...) suitable for rendering with APIs like OpenGL/WebGL.
 * @throws {Error} if the cdt2d library is not available.
 */
function triangulateWithObstacle(obstacle, flatPoints) {
    // Check if the required cdt2d library is loaded.
    if (typeof cdt2d === 'undefined') {
        throw new Error('The "cdt2d" library is not loaded. Please include it in your project.');
    }

    // 1. Convert the flat point array into an array of [x, y] pairs for easier processing.
    const userPoints = [];
    for (let i = 0; i < flatPoints.length; i += 2) {
        userPoints.push([flatPoints[i], flatPoints[i + 1]]);
    }

    // 2. Calculate the four vertices of the square obstacle from its center and side length.
    const halfLength = (obstacle.length * obstacle.scale) / 2;
    const halfWidth = (obstacle.width * obstacle.scale) / 2;
    const obstacleVertices = [
        [obstacle.cx - halfLength, obstacle.cy - halfWidth], // Top-left
        [obstacle.cx + halfLength, obstacle.cy - halfWidth], // Top-right
        [obstacle.cx + halfLength, obstacle.cy + halfWidth], // Bottom-right
        [obstacle.cx - halfLength, obstacle.cy + halfWidth]  // Bottom-left
    ];

    // 3. Combine the user-provided points and the obstacle's vertices into a single list.
    // This is necessary because the triangulation algorithm operates on a single set of vertices.
    const allPoints = [...userPoints, ...obstacleVertices];

    // 4. Define the constraint edges. These are the sides of the square obstacle that
    // the triangulation cannot cross. The indices must refer to the `allPoints` array.
    const userPointsCount = userPoints.length;
    const constraints = [
        [userPointsCount, userPointsCount + 1], // Top edge
        [userPointsCount + 1, userPointsCount + 2], // Right edge
        [userPointsCount + 2, userPointsCount + 3], // Bottom edge
        [userPointsCount + 3, userPointsCount]      // Left edge
    ];

    // 5. Perform the constrained Delaunay triangulation using the cdt2d library.
    // This is the core step that generates the list of triangles.
    const triangles = cdt2d(allPoints, constraints, { interior: false });

    // 6. Flatten the points and triangle indices for rendering (e.g., with WebGL/OpenGL).
    const flatPointsResult = allPoints.flat();
    const indices = triangles.flat();

    // 7. Return the final structure in the requested flat format.
    return {
        flatPoints: flatPointsResult,
        indices: indices
    };
}

export { removeCollisions };
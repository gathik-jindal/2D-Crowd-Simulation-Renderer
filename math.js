/**
 * This function removes people and dots that collide with a given obstacle position and adds them back within the defined boundaries.
 * @param {p1: Array<Number>, p2: Array<Number>, p3: Array<Number>, p4: Array<Number>, } obstacle The obstacle's position
 * @param {Array<Number>} people The array of people positions [x1, y1, x2, y2, ...]
 * @param {Array<Number>} dots The array of dot positions [x1, y1, x2, y2, ...]
 * @param {maxX: Number, minX: Number, maxY: Number, minY: Number} bounds The boundary limits
 * @returns {people: Array<Number>, dots: Array<Number>} The updated array of dots and people positions
 */
function updateCollisions(obstacle, people, dots, bounds) {
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
 * @returns {{vertices: number[], indices: number[]}} An object containing a flat array of
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
        [obstacle.x - halfLength, obstacle.y - halfWidth], // Top-left
        [obstacle.x + halfLength, obstacle.y - halfWidth], // Top-right
        [obstacle.x + halfLength, obstacle.y + halfWidth], // Bottom-right
        [obstacle.x - halfLength, obstacle.y + halfWidth]  // Bottom-left
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
        vertices: flatPointsResult,
        indices: indices
    };
}

/**
 * This function assigns a color to each triangle based on the density of people within it.
 * Triangles with a density above the specified threshold are colored red (overpopulated),
 * those with a density equal to the threshold are colored orange (correctly populated),
 * and those below are colored green (underpopulated).
 *
 * @param {{vertices: Array<Number>, indices: Array<Number>}} triangleData The complete triangulation data.
 * @param {Array<Number>} people A flat array of people positions [x1, y1, x2, y2, ...].
 * @param {Number} densityThreshold The target number of people per triangle.
 * @returns {{
 * red: {vertices: Array<Number>, indices: Array<Number>},
 * orange: {vertices: Array<Number>, indices: Array<Number>},
 * green: {vertices: Array<Number>, indices: Array<Number>}
 * }} An object containing the separated geometry for each density color.
 */
function getTriangleDensityColor(triangleData, people, densityThreshold) {
    // Helper function to check if a point is inside a triangle using barycentric coordinates.
    const isPointInTriangle = (px, py, v1x, v1y, v2x, v2y, v3x, v3y) => {
        const d1 = (px - v2x) * (v1y - v2y) - (v1x - v2x) * (py - v2y);
        const d2 = (px - v3x) * (v2y - v3y) - (v2x - v3x) * (py - v3y);
        const d3 = (px - v1x) * (v3y - v1y) - (v3x - v1x) * (py - v1y);
        const has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        return !(has_neg && has_pos);
    };

    // Initialize output structure. We will create new, separate geometry for each color.
    const result = {
        red: { vertices: [], indices: [] },    // Overpopulated
        orange: { vertices: [], indices: [] }, // Correctly populated
        green: { vertices: [], indices: [] },  // Underpopulated
    };

    // To avoid duplicating vertex data, we use maps to track which vertices
    // have already been added to each color's vertex list.
    const vertexMaps = {
        red: new Map(),
        orange: new Map(),
        green: new Map(),
    };

    // 1. Iterate through each triangle defined in the index buffer.
    for (let i = 0; i < triangleData.indices.length; i += 3) {
        const i1 = triangleData.indices[i];
        const i2 = triangleData.indices[i + 1];
        const i3 = triangleData.indices[i + 2];

        const v1x = triangleData.vertices[i1 * 2];
        const v1y = triangleData.vertices[i1 * 2 + 1];
        const v2x = triangleData.vertices[i2 * 2];
        const v2y = triangleData.vertices[i2 * 2 + 1];
        const v3x = triangleData.vertices[i3 * 2];
        const v3y = triangleData.vertices[i3 * 2 + 1];

        // 2. For the current triangle, count how many people are inside it.
        let peopleCount = 0;
        for (let j = 0; j < people.length; j += 2) {
            const px = people[j];
            const py = people[j + 1];
            if (isPointInTriangle(px, py, v1x, v1y, v2x, v2y, v3x, v3y)) {
                peopleCount++;
            }
        }

        // 3. Categorize the triangle based on its population density.
        let category;
        if (peopleCount > densityThreshold) {
            category = 'red';
        } else if (peopleCount === densityThreshold) {
            category = 'orange';
        } else {
            category = 'green';
        }

        const target = result[category];
        const vertexMap = vertexMaps[category];
        const originalIndices = [i1, i2, i3];

        // 4. Add the triangle's vertices and new indices to the correct category.
        originalIndices.forEach(originalIndex => {
            // If we haven't seen this vertex before for this color...
            if (!vertexMap.has(originalIndex)) {
                // ...add its position to the new vertex list...
                const newIndex = target.vertices.length / 2;
                target.vertices.push(
                    triangleData.vertices[originalIndex * 2],
                    triangleData.vertices[originalIndex * 2 + 1]
                );
                // ...and map the original index to its new index.
                vertexMap.set(originalIndex, newIndex);
            }
            // Add the new index (for this color category) to the new index list.
            target.indices.push(vertexMap.get(originalIndex));
        });
    }

    return result;
}

/**
 * Converts an index buffer for triangles into an index buffer for lines.
 * @param {Array<Number>} triangleIndices The array of indices for triangles.
 * @returns {Array<Number>} The array of indices for lines.
 */
function convertTriangleIndicesToLineIndices(triangleIndices) {
    const lineIndices = [];
    // A triangle is made of 3 indices
    for (let i = 0; i < triangleIndices.length; i += 3) {
        const v1 = triangleIndices[i];
        const v2 = triangleIndices[i + 1];
        const v3 = triangleIndices[i + 2];

        // Add lines for the triangle edges
        lineIndices.push(v1, v2);
        lineIndices.push(v2, v3);
        lineIndices.push(v3, v1);
    }
    return lineIndices;
}

export { updateCollisions, triangulateWithObstacle, getTriangleDensityColor, convertTriangleIndicesToLineIndices };
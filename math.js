import { updateBuffer } from "./gl-utility.js";
import { generateUniformColors } from "./init-buffers.js";
import { PEOPLE_COLOR, DOT_COLOR } from "./index.js";

/**
 * Calculates the four corner vertices of a rectangular obstacle based on its properties.
 * @param {Object} obstacle The obstacle object
 * @returns array of the 4 corner vertices of the obstacle [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
 */
function getObstacleCorners(obstacle) {
    // calculate the true rotated corner positions
    const halfLength = (obstacle.length * obstacle.scale) / 2;
    const halfWidth = (obstacle.width * obstacle.scale) / 2;
    const angleRad = obstacle.rotation * Math.PI / 180;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    const localCorners = [
        [-halfLength, -halfWidth], // local top-left
        [halfLength, -halfWidth],  // local top-right
        [halfLength, halfWidth],   // local bottom-right
        [-halfLength, halfWidth]   // local bottom-left
    ];

    const obstacleVertices = localCorners.map(p => {
        const rotatedX = p[0] * cosAngle - p[1] * sinAngle;
        const rotatedY = p[0] * sinAngle + p[1] * cosAngle;
        return [rotatedX + obstacle.x, rotatedY + obstacle.y];
    });

    return obstacleVertices;
}

/**
 * This function removes people and dots that collide with a given obstacle position and adds them back within the defined boundaries.
 * @param {p1: Array<Number>, p2: Array<Number>, p3: Array<Number>, p4: Array<Number>, } obstacle The obstacle's position
 * @param {Array<Number>} people The array of people positions [x1, y1, x2, y2, ...]
 * @param {Array<Number>} dots The array of dot positions [x1, y1, x2, y2, ...]
 * @param {maxX: Number, minX: Number, maxY: Number, minY: Number} bounds The boundary limits
 * @returns {people: Array<Number>, dots: Array<Number>} The updated array of dots and people positions
 */
function updateCollisions(obstacle, people, dots, bounds, NUMBER_OF_DOTS, NUMBER_OF_PEOPLE) {
    const { maxX, minX, maxY, minY } = bounds;

    function isColliding(x, y) {
        const translatedX = x - obstacle.x;
        const translatedY = y - obstacle.y;

        // rotate the point backwards by the obstacle's rotation angle.
        const angleRad = -obstacle.rotation * Math.PI / 180; // Negative angle
        const cosAngle = Math.cos(angleRad);
        const sinAngle = Math.sin(angleRad);

        const rotatedX = translatedX * cosAngle - translatedY * sinAngle;
        const rotatedY = translatedX * sinAngle + translatedY * cosAngle;

        // perform a simple AABB check in the obstacle's local, unrotated space.
        const halfLength = (obstacle.length * obstacle.scale) / 2;
        const halfWidth = (obstacle.width * obstacle.scale) / 2;

        return (rotatedX >= -halfLength && rotatedX <= halfLength &&
            rotatedY >= -halfWidth && rotatedY <= halfWidth);
    }

    // remove colliding people
    let updatedPeople = [];
    for (let i = 0; i < people.length; i += 2) {
        const px = people[i];
        const py = people[i + 1];
        if (!isColliding(px, py)) {
            updatedPeople.push(px, py);
        }
    }

    // remove colliding dots
    let updatedDots = [];
    for (let i = 0; i < dots.length; i += 2) {
        const dx = dots[i];
        const dy = dots[i + 1];
        if (!isColliding(dx, dy)) {
            updatedDots.push(dx, dy);
        }
    }

    // calculate how many people and dots were removed
    const peopleRemoved = NUMBER_OF_PEOPLE - (updatedPeople.length / 2);
    const dotsRemoved = NUMBER_OF_DOTS - (updatedDots.length / 2);

    // add new people at random positions within the bounds
    for (let i = 0; i < peopleRemoved; i++) {
        const newPos = createNewPosition(obstacle, minX, maxX, minY, maxY);
        updatedPeople.push(newPos.x, newPos.y);
    }

    // add new dots at random positions within the bounds
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
    let newPos;
    let isColliding = true;
    let attempts = 0;

    // A copy of the collision logic from above to use locally
    const isPointColliding = (x, y) => {
        const translatedX = x - obstacle.x;
        const translatedY = y - obstacle.y;
        const angleRad = -obstacle.rotation * Math.PI / 180;
        const cosAngle = Math.cos(angleRad);
        const sinAngle = Math.sin(angleRad);
        const rotatedX = translatedX * cosAngle - translatedY * sinAngle;
        const rotatedY = translatedX * sinAngle + translatedY * cosAngle;
        const halfLength = (obstacle.length * obstacle.scale) / 2;
        const halfWidth = (obstacle.width * obstacle.scale) / 2;
        return (rotatedX >= -halfLength && rotatedX <= halfLength &&
            rotatedY >= -halfWidth && rotatedY <= halfWidth);
    };

    while (isColliding) {
        newPos = {
            x: Math.random() * (maxX - minX) + minX,
            y: Math.random() * (maxY - minY) + minY,
        };
        isColliding = isPointColliding(newPos.x, newPos.y);

        attempts++;
        if (attempts > 100) { // Safety break to prevent infinite loops
            console.error("Could not find a valid position for a new point.");
            return null;
        }
    }
    return newPos;
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
    if (typeof cdt2d === 'undefined') {
        throw new Error('The "cdt2d" library is not loaded.');
    }

    const userPoints = [];
    for (let i = 0; i < flatPoints.length; i += 2) {
        userPoints.push([flatPoints[i], flatPoints[i + 1]]);
    }

    const obstacleVertices = getObstacleCorners(obstacle);

    const allPoints = [...userPoints, ...obstacleVertices];

    // constraints are the edges connecting the new obstacle vertices
    const userPointsCount = userPoints.length;
    const constraints = [
        [userPointsCount, userPointsCount + 1],
        [userPointsCount + 1, userPointsCount + 2],
        [userPointsCount + 2, userPointsCount + 3],
        [userPointsCount + 3, userPointsCount]
    ];

    const triangles = cdt2d(allPoints, constraints, { interior: false });

    return {
        vertices: allPoints.flat(),
        indices: triangles.flat()
    };
}

/**
 * This function assigns a color to each triangle based on the density of people within it.
 * Triangles with a density above the specified threshold are colored red (overpopulated),
 * those with a density equal to the threshold are colored orange (correctly populated),
 * and those below are colored blue (underpopulated).
 *
 * @param {{vertices: Array<Number>, indices: Array<Number>}} triangleData The complete triangulation data.
 * @param {Array<Number>} people A flat array of people positions [x1, y1, x2, y2, ...].
 * @param {Number} densityThreshold The target number of people per triangle.
 * @returns {{
 * red: {vertices: Array<Number>, indices: Array<Number>},
 * orange: {vertices: Array<Number>, indices: Array<Number>},
 * blue: {vertices: Array<Number>, indices: Array<Number>}
 * }} An object containing the separated geometry for each density color.
 */
function getTriangleDensity(triangleData, people, densityThreshold) {
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
        blue: { vertices: [], indices: [] },  // Underpopulated
    };

    // To avoid duplicating vertex data, we use maps to track which vertices
    // have already been added to each color's vertex list.
    const vertexMaps = {
        red: new Map(),
        orange: new Map(),
        blue: new Map(),
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
            category = 'blue';
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

/**
 * Regenerates the people and dots arrays based on global counts,
 * removes initial collisions, and updates their WebGL buffers.
 * @param {WebGLRenderingContext} gl The WebGL rendering context
 * @param {object} obstacle The obstacle definition
 * @param {object} bounds The boundary limits { maxX, minX, maxY, minY }
 * @param {object} peopleBuffers The people buffers { position: WebGLBuffer, color: WebGLBuffer }
 * @param {object} dotBuffers The dot buffers { position: WebGLBuffer, color: WebGLBuffer }
 * @param {Number} NUMBER_OF_DOTS The total number of dots to generate
 * @param {Number} NUMBER_OF_PEOPLE The total number of people to generate
 * @param {Array<Number>} dots The current array of dot positions
 * @param {Array<Number>} people The current array of people positions
 * @returns {people: Array<Number>, dots: Array<Number>} The new arrays of people and dots positions
 */
function resetAndRegeneratePoints(gl, obstacle, bounds, peopleBuffers, dotBuffers, NUMBER_OF_DOTS, NUMBER_OF_PEOPLE, dots, people) {
    let newPeople = [];
    if (NUMBER_OF_PEOPLE < people.length / 2) {
        newPeople.push(...people.slice(0, NUMBER_OF_PEOPLE * 2));
    }
    else if (NUMBER_OF_PEOPLE == people.length / 2) {
        newPeople.push(...people);
    }
    else if (NUMBER_OF_PEOPLE > people.length / 2) {
        newPeople.push(...people);
        for (let i = 0; i < NUMBER_OF_PEOPLE - people.length / 2; i++) {
            newPeople.push(Math.random() * (bounds.maxX - bounds.minX) + bounds.minX, Math.random() * (bounds.maxY - bounds.minY) + bounds.minY);
        }
    }

    let newDots = [];
    if (NUMBER_OF_DOTS < dots.length / 2) {
        newDots.push(...dots.slice(0, NUMBER_OF_DOTS * 2));
    }
    else if (NUMBER_OF_DOTS == dots.length / 2) {
        newDots.push(...dots);
    }
    else if (NUMBER_OF_DOTS > dots.length / 2) {
        newDots.push(...dots);
        for (let i = 0; i < NUMBER_OF_DOTS - dots.length / 2; i++) {
            newDots.push(Math.random() * (bounds.maxX - bounds.minX) + bounds.minX, Math.random() * (bounds.maxY - bounds.minY) + bounds.minY);
        }
    }

    const updatedPositions = { people: newPeople, dots: newDots };

    // The updation of location buffers is taken care in the main update loop
    updateBuffer(gl, gl.ARRAY_BUFFER, peopleBuffers.color, new Float32Array(generateUniformColors(updatedPositions.people.length / 2, PEOPLE_COLOR)), gl.DYNAMIC_DRAW);
    updateBuffer(gl, gl.ARRAY_BUFFER, dotBuffers.color, new Float32Array(generateUniformColors(updatedPositions.dots.length / 2, DOT_COLOR)), gl.DYNAMIC_DRAW);

    return { people: updatedPositions.people, dots: updatedPositions.dots };
}

/**
 * Finds the closest edge in a triangulation to a given point.
 * @param {{x: Number, y: Number}} point The point to test against.
 * @param {Array<Number>} vertices A flat array of vertex positions.
 * @param {Array<Number>} indices A flat array of triangle indices.
 * @returns {{edge: [Number, Number], distance: Number}|null} The closest edge and distance, or null.
 */
function findClosestEdge(point, vertices, indices) {
    let closestEdge = null;
    let minDistanceSq = Infinity;

    for (let i = 0; i < indices.length; i += 3) {
        const triIndices = [indices[i], indices[i + 1], indices[i + 2]];
        const edges = [[triIndices[0], triIndices[1]], [triIndices[1], triIndices[2]], [triIndices[2], triIndices[0]]];

        for (const edge of edges) {
            const v1x = vertices[edge[0] * 2];
            const v1y = vertices[edge[0] * 2 + 1];
            const v2x = vertices[edge[1] * 2];
            const v2y = vertices[edge[1] * 2 + 1];

            const l2 = (v1x - v2x) ** 2 + (v1y - v2y) ** 2;
            if (l2 === 0) continue;

            let t = ((point.x - v1x) * (v2x - v1x) + (point.y - v1y) * (v2y - v1y)) / l2;
            t = Math.max(0, Math.min(1, t));

            const closestPointX = v1x + t * (v2x - v1x);
            const closestPointY = v1y + t * (v2y - v1y);
            const distSq = (point.x - closestPointX) ** 2 + (point.y - closestPointY) ** 2;

            if (distSq < minDistanceSq) {
                minDistanceSq = distSq;
                closestEdge = edge;
            }
        }
    }
    return { edge: closestEdge, distance: Math.sqrt(minDistanceSq) };
}

export { updateCollisions, triangulateWithObstacle, getTriangleDensity, convertTriangleIndicesToLineIndices, resetAndRegeneratePoints, findClosestEdge, getObstacleCorners };
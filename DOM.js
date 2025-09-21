/**
 * Gets the current values from the sliders and updates the displayed values.
 * @returns {Object} An object containing numDots, numPeople, and density
 */
function getValuesFromSliders() {
    const dotsSlider = document.getElementById("dots");
    const peopleSlider = document.getElementById("people");
    const densitySlider = document.getElementById("density");

    const numDots = parseInt(dotsSlider.value, 10);
    const numPeople = parseInt(peopleSlider.value, 10);
    const density = parseInt(densitySlider.value, 10);

    document.getElementById("dots-value").innerText = numDots;
    document.getElementById("people-value").innerText = numPeople;
    document.getElementById("density-value").innerText = density;

    return { numDots, numPeople, density };
}

/**
 * Sets up the sliders with initial values.
 * @param {Number} dots The number of dots
 * @param {Number} people The number of people
 * @param {Number} density The density value
 */
function setupSliders(dots, people, density) {
    const sliders = ["dots", "people", "density"];
    const values = [dots, people, density];
    const valueIds = ["dots-value", "people-value", "density-value"];
    sliders.forEach((id, index) => {
        const slider = document.getElementById(id);
        slider.value = values[index];
        document.getElementById(valueIds[index]).innerText = values[index];
    });
}

/**
 * Creates event listeners for the slider inputs.
 * @param {*} onChange
 */
function createSliderEventListeners(onChange) {
    const sliders = ["dots", "people", "density"];
    sliders.forEach((id) => {
        const slider = document.getElementById(id);
        slider.addEventListener("input", onChange);
    });
}

export { createSliderEventListeners, setupSliders, getValuesFromSliders };
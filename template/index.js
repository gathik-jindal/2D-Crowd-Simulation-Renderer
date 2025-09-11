import { Scene, Triangle, Quadrilateral, WebGLRenderer, Shader } from './lib/threeD.js';
import {vertexShaderSrc} from './shaders/vertex.js';
import {fragmentShaderSrc} from './shaders/fragment.js';


const renderer = new WebGLRenderer();
renderer.setSize(600, 600);

document.body.appendChild(renderer.domElement);

const shader = new Shader(
	renderer.glContext(),
	vertexShaderSrc,
	fragmentShaderSrc
);

shader.use();

const triangle1 = new Triangle(
    [0, 0],
    [0.5, 0.5],
    [0.5, -0.5],
    [74 / 255, 134 / 255, 232 / 255, 1]
);
// const triangle2 = new Triangle(
//     [0, 0],
//     [0.5, 0.5],
//     [-0.5, 0.5],
//     [255 / 255, 153 / 255, 0 / 255, 1]
// );
// const triangle3 = new Triangle(
//     [0, -0.5],
//     [0.25, -0.25],
//     [0.5, -0.5],
//     [1, 1, 0, 1]
// );
const quadrilateral1 = new Quadrilateral(
    [0, 0],
    [0.25, -0.25],
    [0, -0.5],
    [-0.25, -0.25],
    [1, 0, 0, 1]
);
// const triangle4 = new Triangle(
//     [0, 0],
//     [-0.25, -0.25],
//     [-0.25, 0.25],
//     [0, 1, 1, 1]
// );
// const quadrilateral2 = new Quadrilateral(
//     [-0.5, 0.5],
//     [-0.25, 0.25],
//     [-0.25, -0.25],
//     [-0.5, 0],
//     [1, 0, 1, 1]
// );
// const triangle5 = new Triangle(
//     [-0.5, 0],
//     [-0.5, -0.5],
//     [0, -0.5],
//     [0, 1, 0, 1]
// );

const scene = new Scene();
scene.add(triangle1);
// scene.add(triangle2);
// scene.add(triangle3);
scene.add(quadrilateral1);
// scene.add(triangle4);
// scene.add(quadrilateral2);
// scene.add(triangle5);


document.addEventListener("keydown", event => {
    console.log(event);
})



renderer.setAnimationLoop(animation);

//Draw loop
function animation() 
{
	renderer.clear(0.9, 0.9, 0.9, 1);
	renderer.render(scene, shader);
}

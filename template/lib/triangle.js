import {Transform} from './transform.js';

export class Triangle
{
	constructor(vert1,vert2,vert3,color) 
	{
		this.vertexPositions = new Float32Array([
			//  x , y,  z
			vert1[0], vert1[1], 0.0,
			vert2[0], vert2[1], 0.0,
			vert3[0], vert3[1], 0.0,
		]);

		this.type = "triangle";
		this.color = color;
		this.transform = new Transform();
	}
}
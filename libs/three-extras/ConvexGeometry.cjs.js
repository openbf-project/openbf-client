/**@author Mugen87 / https://github.com/Mugen87
 */
const {
	BufferGeometry,
	Float32BufferAttribute,
	Geometry
} = require("three");

const { ConvexHull } = require("./ConvexHull.cjs.js");

let ConvexGeometry = function (points) {
	Geometry.call(this);
	this.fromBufferGeometry(new ConvexBufferGeometry(points));
	this.mergeVertices();
};
ConvexGeometry.prototype = Object.create(Geometry.prototype);
ConvexGeometry.prototype.constructor = ConvexGeometry;
// ConvexBufferGeometry
let ConvexBufferGeometry = function (points) {
	BufferGeometry.call(this);
	// buffers
	let vertices = [];
	let normals = [];
	if (ConvexHull === undefined) {
		console.error('THREE.ConvexBufferGeometry: ConvexBufferGeometry relies on ConvexHull');
	}
	let convexHull = new ConvexHull().setFromPoints(points);
	// generate vertices and normals
	let faces = convexHull.faces;
	for (let i = 0; i < faces.length; i++) {
		let face = faces[i];
		let edge = face.edge;
		// we move along a doubly-connected edge list to access all face points (see HalfEdge docs)
		do {
			let point = edge.head().point;
			vertices.push(point.x, point.y, point.z);
			normals.push(face.normal.x, face.normal.y, face.normal.z);
			edge = edge.next;
		} while (edge !== face.edge);
	}
	// build geometry
	this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
	this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
};
ConvexBufferGeometry.prototype = Object.create(BufferGeometry.prototype);
ConvexBufferGeometry.prototype.constructor = ConvexBufferGeometry;
module.exports = { ConvexGeometry, ConvexBufferGeometry };

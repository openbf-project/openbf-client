
const { ConvexHull } = require("../../libs/three-extras/ConvexHull.cjs.js");

function pointsToConvex(points) {
  let hull = new ConvexHull();
  hull.setFromPoints(points);

  let result = new Array();
  let edge;
  let point;
  for (let face of hull.faces) {
    edge = face.edge;
    do {
      point = edge.head().point;

      result.push(point.x, point.y, point.z);
      edge = edge.next;
    } while (edge !== face.edge);
  }
  console.log(hull);
  throw "We need to do more work here..";
  return result;
}
module.exports.pointsToConvex = pointsToConvex;

const cannon = require("../../libs/cannon-es/cannon-es.cjs");

/**Create a cannon js convex mesh
 * @param {Array<number>} coords ...x,y,z
 * @param {Array<number>} faces
 */
function makeCannonConvexMesh(coords, faces) {
  if (coords.length % 3 !== 0) throw `coords length not divisible by 3 ${coords.length}`;
  let vecs = new Array(coords / 3);
  for (let i = 0; i < coords.length; i += 3) {
    vecs.push(new cannon.Vec3(
      coords[i + 0],
      coords[i + 1],
      coords[i + 2],
    ));
  }
  let indicies = new Array();
  for (let i = 0; i < faces.count; i += 3) {
    indicies.push([
      faces.array[i + 0],
      faces.array[i + 1],
      faces.array[i + 2]
    ]);
  }
  return new cannon.ConvexPolyhedron(vecs, indicies);
}
module.exports.makeCannonConvexMesh = makeCannonConvexMesh;
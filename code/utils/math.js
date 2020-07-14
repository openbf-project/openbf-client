
const { ConvexHull } = require("../../libs/three-extras/ConvexHull.cjs.js");

function attrToConvex(verts, inds) {
  if ( !(verts instanceof Array) ) verts = Array.from(verts);
  if ( !(inds instanceof Array) ) inds = Array.from(inds);
  let hull = new ConvexHull();
  hull.setFromPoints(verts);

  let result = {
    indicies:new Array(),
    verticies:new Array()
  }
  let edge;
  let point;
  let indCount = 0;
  for (let face of hull.faces) {
    edge = face.edge;
    do {
      point = edge.head().point;

      result.verticies.push(point.x, point.y, point.z);
      result.indicies.push(indCount);
      indCount++; //Not sure if triangulation needs to be done..

      edge = edge.next;
    } while (edge !== face.edge);
  }
  console.log(hull);
  return result;
}
module.exports.attrToConvex = attrToConvex;

const cannon = require("../../libs/cannon-es/cannon-es.cjs");

/**Create a cannon js convex mesh
 * @param {Array<number>} verts ...x,y,z
 * @param {Array<number>} inds
 */
function makeCannonConvexMesh(verts, inds) {
  if (verts.length % 3 !== 0) throw `coords length not divisible by 3 ${verts.length}`;
  let convex = attrToConvex(inds, verts);
  verts = convex.verticies;
  inds = convex.indicies;

  let vecs = new Array(verts / 3);
  for (let i = 0; i < verts.length; i += 3) {
    vecs.push(new cannon.Vec3(
      verts[i + 0],
      verts[i + 1],
      verts[i + 2],
    ));
  }
  let indicies = new Array();
  for (let i = 0; i < inds.length; i += 3) {
    indicies.push([
      inds.array[i + 0],
      inds.array[i + 1],
      inds.array[i + 2]
    ]);
  }
  return new cannon.ConvexPolyhedron(vecs, indicies);
}
module.exports.makeCannonConvexMesh = makeCannonConvexMesh;
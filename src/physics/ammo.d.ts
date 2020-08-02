
/**
 * Uses https://pybullet.org/Bullet/BulletFull/annotated.html
 * as reference
 */
declare namespace Ammo {
  class btCollisionShape {
    calculateLocalInertia(mass: number, inertia: btVector3);
  }
  class btConvexShape extends btCollisionShape {
  }
  class btConvexInternalShape extends btConvexShape {
  }
  class btPolyhedralConvexShape extends btConvexInternalShape {
  }
  class btBoxShape extends btPolyhedralConvexShape {
    constructor(halfExtents: btVector3);
  }
  class btDefaultMotionState extends btMotionState {
    constructor(startTrans?: btTransform, centerOfMassOffset?: btTransform);
  }
  class btMotionState {
    getWorldTransform (out: btTransform);
  }
  class btRigidBodyConstructionInfo {
    constructor(mass: number, motionState: btMotionState, collisionShape: btCollisionShape, localInertia?: btVector3);
  }
  class btRigidBody {
    constructor(constructionInfo: btRigidBodyConstructionInfo);
    constructor(mass: number, motionState: btMotionState, collisionShape: btCollisionShape, localInertia?: btVector3);
    getMotionState (): btMotionState;
  }
  class btVector3 {
    constructor();
    constructor(x: number, y: number, z: number);
    x(): number;
    y(): number;
    z(): number;
    w(): number;
    setValue(x: number, y: number, z: number);
    setZero();
    setX(x: number);
    setY(y: number);
    setZ(z: number);
    setW(w: number);
  }
  class btMatrix3x3 {
  }
  class btQuaternion {
    constructor();
    constructor(x: number, y: number, z: number, w: number);
    constructor(axis: btVector3, angle: number);
    constructor(yaw: number, pitch: number, roll: number);
    setRotation(axis: btVector3, angle: number);
    setEuler(yaw: number, pitch: number, roll: number);
    setEulerZYX(yawZ: number, pitchY: number, rollX: number);
    //getEulerZYX (btScalar &yawZ, btScalar &pitchY, btScalar &rollX)
  }
  class btTransform {
    constructor();
    constructor(quaternion: btQuaternion, position: btVector3);
    constructor(matrix: btMatrix3x3, position: btVector3);
    constructor(other: btTransform);
    mult(one: btTransform, two: btTransform);
    getOrigin(): btVector3;
    getRotation(): btQuaternion;
    setOrigin(vec: btVector3);
    setRotation(quaternion: btQuaternion);
    setIdentity();
    static getIdentity(): btTransform;
  }
  class btCollisionConfiguration {
  }
  class btDefaultCollisionConfiguration extends btCollisionConfiguration {
    constructor();
  }
  class btDispatcher {
  }
  class btCollisionDispatcher extends btDispatcher {
    constructor(collisionConfiguration: btCollisionConfiguration);
  }
  interface btBroadphaseInterface {
  }
  class btOverlappingPairCache {
  }
  class btDbvtBroadphase implements btBroadphaseInterface {
    constructor();
    constructor(paircache: btOverlappingPairCache);
  }
  class btConstraintSolver {
  }
  class btSequentialImpulseConstraintSolver extends btConstraintSolver {
    constructor();
  }
  class btCollisionWorld {
  }
  class btDynamicsWorld extends btCollisionWorld {
  }
  class btDiscreteDynamicsWorld extends btDynamicsWorld {
    constructor(dispatcher: btDispatcher, pairCache: btBroadphaseInterface, constraintSolver: btConstraintSolver, collisionConfiguration: btCollisionConfiguration);
    setGravity(gravity: btVector3);
    getGravity(): btVector3;
    stepSimulation(timeStep: number, maxSubSteps?: number, fixedTimeStep?: number);
    addRigidBody(rb: btRigidBody);
    addRigidBody(body: btRigidBody, group: number, mask: number);
    removeRigidBody(body: btRigidBody);
  }
}

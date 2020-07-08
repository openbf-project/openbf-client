
//Define a structure to hold box cutter params
struct boxParams {
  vec3 size;
  vec3 position;
  vec3 rotation;
};

//Expose to material.uniforms
uniform boxParams box;

//Declare vPos, our position in the world for each vertex
varying vec3 vPos;

//Matrix rotation function for testing rotated cube point collision
mat3 rotationMatrix(vec3 axis, float angle)
{
  axis=normalize(axis);
  float s=sin(angle);
  float c=cos(angle);
  float oc=1.-c;
  
  return mat3(
    oc*axis.x*axis.x+c,oc*axis.x*axis.y-axis.z*s,oc*axis.z*axis.x+axis.y*s,
    oc*axis.x*axis.y+axis.z*s,oc*axis.y*axis.y+c,oc*axis.y*axis.z-axis.x*s,
    oc*axis.z*axis.x-axis.y*s,oc*axis.y*axis.z+axis.x*s,oc*axis.z*axis.z+c
  );
}

//Check if point is inside a box
bool isInside(boxParams box,vec3 pt){
  
  vec3 nullVector0=-box.size*.5;
  vec3 nullVectorX=nullVector0+vec3(box.size.x,0,0);
  vec3 nullVectorY=nullVector0+vec3(0,box.size.y,0);
  vec3 nullVectorZ=nullVector0+vec3(0,0,box.size.z);
  
  mat3 matX=rotationMatrix(vec3(1,0,0),box.rotation.x);
  mat3 matY=rotationMatrix(vec3(0,1,0),box.rotation.y);
  mat3 matZ=rotationMatrix(vec3(0,0,1),box.rotation.z);
  mat3 mat=matX*matY*matZ;
  
  nullVector0=nullVector0*mat+box.position;
  nullVectorX=nullVectorX*mat+box.position;
  nullVectorY=nullVectorY*mat+box.position;
  nullVectorZ=nullVectorZ*mat+box.position;
  
  vec3 ptPos=pt-nullVector0;
  
  vec3 nullX=nullVectorX-nullVector0;
  vec3 nullY=nullVectorY-nullVector0;
  vec3 nullZ=nullVectorZ-nullVector0;
  
  float dotX=dot(nullX,ptPos);
  float dotY=dot(nullY,ptPos);
  float dotZ=dot(nullZ,ptPos);
  
  float dotNullX=dot(nullX,nullX);
  float dotNullY=dot(nullY,nullY);
  float dotNullZ=dot(nullZ,nullZ);
  
  bool isX=(0.<=dotX)&&(dotX<=dotNullX);
  bool isY=(0.<=dotY)&&(dotY<=dotNullY);
  bool isZ=(0.<=dotZ)&&(dotZ<=dotNullZ);
  
  return!(isX&&isY&&isZ);
}

//The main function, executed for every vert
void main(){
  //If current vert inside the box, discard rendering it
  if(isInside(box,vPos)==false) discard;

  //Otherwise, render the color
  gl_FrontColor = gl_FrontMaterial.diffuse;

  

  gl_FragColor=vec4(1.0, 0.0, 0.9176, 1.0);
}
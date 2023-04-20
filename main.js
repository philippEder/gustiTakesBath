/**
 * the OpenGL context
 * @type {WebGLRenderingContext}
 */
var gl = null;
/**
 * program with vertex and fragment shader
 * @type {WebGLProgram}
 */
var program = null;

// stuff from 03_scenegraphs
var canvasWidth = 800;
var canvasHeight = 800;
var aspectRatio = canvasWidth / canvasHeight;

//rendering context
var context;

//camera and projection settings
var animatedAngle = 0;
var fieldOfViewInRadians = convertDegreeToRadians(30);

var headTransformationNode;

//links to buffer stored on the GPU
var cubeVertexBuffer, cubeColorBuffer, tubColorsBuffer, waterColorsBuffer, cubeIndexBuffer;

var s = 0.3; //size of cube
var cubeVertices = new Float32Array([
 -s,-s,-s, s,-s,-s, s, s,-s, -s, s,-s,
 -s,-s, s, s,-s, s, s, s, s, -s, s, s,
 -s,-s,-s, -s, s,-s, -s, s, s, -s,-s, s,
 s,-s,-s, s, s,-s, s, s, s, s,-s, s,
 -s,-s,-s, -s,-s, s, s,-s, s, s,-s,-s,
 -s, s,-s, -s, s, s, s, s, s, s, s,-s,
]);

var cubeColors = new Float32Array([
 0,1,1, 0,1,1, 0,1,1, 0,1,1,
 1,0,1, 1,0,1, 1,0,1, 1,0,1,
 1,0,0, 1,0,0, 1,0,0, 1,0,0,
 0,0,1, 0,0,1, 0,0,1, 0,0,1,
 1,1,0, 1,1,0, 1,1,0, 1,1,0,
 0,1,0, 0,1,0, 0,1,0, 0,1,0
]);

var tubColors = new Float32Array([
  1,1,1, 1,1,1, 1,1,1, 1,1,1,
  1,1,1, 1,1,1, 1,1,1, 1,1,1,
  1,1,1, 1,1,1, 1,1,1, 1,1,1,
  1,1,1, 1,1,1, 1,1,1, 1,1,1,
  1,1,1, 1,1,1, 1,1,1, 1,1,1,
  1,1,1, 1,1,1, 1,1,1, 1,1,1
 ]);

 var waterColors = new Float32Array([
  0,1,1, 0,1,1, 0,1,1, 0,1,1,
  0,1,1, 0,1,1, 0,1,1, 0,1,1,
  0,1,1, 0,1,1, 0,1,1, 0,1,1,
  0,1,1, 0,1,1, 0,1,1, 0,1,1,
  0,1,1, 0,1,1, 0,1,1, 0,1,1,
  0,1,1, 0,1,1, 0,1,1, 0,1,1
 ]);

var cubeIndices =  new Float32Array([
 0,1,2, 0,2,3,
 4,5,6, 4,6,7,
 8,9,10, 8,10,11,
 12,13,14, 12,14,15,
 16,17,18, 16,18,19,
 20,21,22, 20,22,23
]);

/**
 * initializes OpenGL context, compile shader, and load buffers
 */
function init(resources) {
  //create a GL context
  gl = createContext(canvasWidth /*width*/, canvasHeight /*height*/);

  //compile and link shader program
  shaderProgram = createProgram(gl, resources.vs, resources.fs);

  //set buffers for cube
    initCubeBuffer();

  //create scenegraph
  rootNode = new SceneGraphNode();

  createBathtub(rootNode);
}

function initCubeBuffer() {

  cubeVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

  cubeColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);

  tubColorsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tubColorsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, tubColors, gl.STATIC_DRAW);

  waterColorsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, waterColorsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, waterColors, gl.STATIC_DRAW);

  cubeIndexBuffer = gl.createBuffer ();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
}


loadResources({
  vs: 'shader/simple.vs.glsl',
  fs: 'shader/simple.fs.glsl'
  //staticcolorvs: 'shader/static_color.vs.glsl'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);
  render(0);
});

function createBathtub(rootNode) {
  var tubLength = 2;
  var tubWidth = 1;
  var tubHeigth = 1;
  var tubThicc = 0.3;
  var waterThicc = 0.1;

  var tubMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(0.6,0,0));
  tubMatrix = mat4.multiply(mat4.create(), tubMatrix, glm.scale(1,1,1));
  tubNode = new TransformationSceneGraphNode(tubMatrix);
  rootNode.append(tubNode);

  // tub front
  var tubFrontTrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(0,0,tubLength/2));
  tubFrontTrafoMatrix = mat4.multiply(mat4.create(), tubFrontTrafoMatrix, glm.scale(tubWidth+tubThicc,tubHeigth,tubThicc));
  tubFrontTrafoNode = new TransformationSceneGraphNode(tubFrontTrafoMatrix);
  tubNode.append(tubFrontTrafoNode);
  
  tubFrontNode = new TubRenderNode();
  tubFrontTrafoNode.append(tubFrontNode);

  // tub back
  var tubBackTrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(0,0,-tubLength/2));
  tubBackTrafoMatrix = mat4.multiply(mat4.create(), tubBackTrafoMatrix, glm.scale(tubWidth+tubThicc,tubHeigth,tubThicc));
  tubBackTrafoNode = new TransformationSceneGraphNode(tubBackTrafoMatrix);
  tubNode.append(tubBackTrafoNode);
  
  tubBackNode = new TubRenderNode();
  tubBackTrafoNode.append(tubBackNode);

  // tub right
  var tubRightTrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(tubWidth/2,0,0));
  tubRightTrafoMatrix = mat4.multiply(mat4.create(), tubRightTrafoMatrix, glm.scale(tubThicc,tubHeigth,tubLength*2-tubThicc));
  tubRightTrafoNode = new TransformationSceneGraphNode(tubRightTrafoMatrix);
  tubNode.append(tubRightTrafoNode);
  
  tubRightNode = new TubRenderNode();
  tubRightTrafoNode.append(tubRightNode);

  // tub left
  var tubLeftTrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(-tubWidth/2,0,0));
  tubLeftTrafoMatrix = mat4.multiply(mat4.create(), tubLeftTrafoMatrix, glm.scale(tubThicc,tubHeigth,tubLength*2-tubThicc));
  tubLeftTrafoNode = new TransformationSceneGraphNode(tubLeftTrafoMatrix);
  tubNode.append(tubLeftTrafoNode);
  
  tubLeftNode = new TubRenderNode();
  tubLeftTrafoNode.append(tubLeftNode);

  // tub water Q1
  var Q1TrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate((tubWidth-tubThicc)*0.25,tubHeigth*0.2,(tubLength-tubThicc)*0.25));
  Q1TrafoMatrix = mat4.multiply(mat4.create(), Q1TrafoMatrix, glm.scale(tubWidth-tubThicc,waterThicc,tubLength));
  Q1TrafoNode = new TransformationSceneGraphNode(Q1TrafoMatrix);
  tubNode.append(Q1TrafoNode);
  
  Q1Node = new WaterRenderNode();
  Q1TrafoNode.append(Q1Node);

  // tub water Q2
  var Q2TrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate((tubWidth-tubThicc)*0.25,tubHeigth*0.2,-(tubLength-tubThicc)*0.25));
  Q2TrafoMatrix = mat4.multiply(mat4.create(), Q2TrafoMatrix, glm.scale(tubWidth-tubThicc,waterThicc,tubLength));
  Q2TrafoNode = new TransformationSceneGraphNode(Q2TrafoMatrix);
  tubNode.append(Q2TrafoNode);
  
  Q2Node = new WaterRenderNode();
  Q2TrafoNode.append(Q2Node);

// tub water Q3
var Q3TrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(-(tubWidth-tubThicc)*0.25,tubHeigth*0.2,(tubLength-tubThicc)*0.25));
Q3TrafoMatrix = mat4.multiply(mat4.create(), Q3TrafoMatrix, glm.scale(tubWidth-tubThicc,waterThicc,tubLength));
Q3TrafoNode = new TransformationSceneGraphNode(Q3TrafoMatrix);
tubNode.append(Q3TrafoNode);

Q3Node = new WaterRenderNode();
Q3TrafoNode.append(Q3Node);

// tub water Q4
var Q4TrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(-(tubWidth-tubThicc)*0.25,tubHeigth*0.2,-(tubLength-tubThicc)*0.25));
Q4TrafoMatrix = mat4.multiply(mat4.create(), Q4TrafoMatrix, glm.scale(tubWidth-tubThicc,waterThicc,tubLength));
Q4TrafoNode = new TransformationSceneGraphNode(Q4TrafoMatrix);
tubNode.append(Q4TrafoNode);

Q4Node = new WaterRenderNode();
Q4TrafoNode.append(Q4Node);

}


function render(timeInMilliseconds) {

  //set background color to light gray
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //TASK 0-1
  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);

  //TASK 1-1
  gl.enable(gl.BLEND);
  //TASK 1-2
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 

  //activate this shader program
  gl.useProgram(shaderProgram);

  context = createSceneGraphContext(gl, shaderProgram);

  rootNode.render(context);

  requestAnimationFrame(render);

  animatedAngle = timeInMilliseconds/10;
}


function renderCube() {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
}

function setUpModelViewMatrix(sceneMatrix, viewMatrix) {
  var modelViewMatrix = mat4.multiply(mat4.create(), viewMatrix, sceneMatrix);
  gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_modelView'), false, modelViewMatrix);
}

function createSceneGraphContext(gl, shader) {

  //create a default projection matrix
  projectionMatrix = mat4.perspective(mat4.create(), fieldOfViewInRadians, aspectRatio, 0.01, 10);
  gl.uniformMatrix4fv(gl.getUniformLocation(shader, 'u_projection'), false, projectionMatrix);

  return {
    gl: gl,
    sceneMatrix: mat4.create(),
    viewMatrix: calculateViewMatrix(),
    projectionMatrix: projectionMatrix,
    shader: shader
  };
}

function calculateViewMatrix() {
  //compute the camera's matrix
  var eye = [0,3,5];
  var center = [0,0,0];
  var up = [0,1,0];
  viewMatrix = mat4.lookAt(mat4.create(), eye, center, up);
  return viewMatrix;
}

function convertDegreeToRadians(degree) {
  return degree * Math.PI / 180
}
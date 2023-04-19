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

var robotTransformationNode;
var headTransformationNode;

//links to buffer stored on the GPU
var cubeVertexBuffer, cubeColorBuffer, cubeIndexBuffer;

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

  createRobot(rootNode);

  createBathtub(rootNode);
}

function initCubeBuffer() {

  cubeVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

  cubeColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);

  cubeIndexBuffer = gl.createBuffer ();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
}


//load the shader resources using a utility function
loadResources({
  vs: 'shader/simple.vs.glsl',
  fs: 'shader/simple.fs.glsl',
  staticcolorvs: 'shader/static_color.vs.glsl'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  //render one frame
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
  
  tubFrontNode = new CubeRenderNode();
  tubFrontTrafoNode.append(tubFrontNode);

  // tub back
  var tubBackTrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(0,0,-tubLength/2));
  tubBackTrafoMatrix = mat4.multiply(mat4.create(), tubBackTrafoMatrix, glm.scale(tubWidth+tubThicc,tubHeigth,tubThicc));
  tubBackTrafoNode = new TransformationSceneGraphNode(tubBackTrafoMatrix);
  tubNode.append(tubBackTrafoNode);
  
  tubBackNode = new CubeRenderNode();
  tubBackTrafoNode.append(tubBackNode);

  // tub right
  var tubRightTrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(tubWidth/2,0,0));
  tubRightTrafoMatrix = mat4.multiply(mat4.create(), tubRightTrafoMatrix, glm.scale(tubThicc,tubHeigth,tubLength*2-tubThicc));
  tubRightTrafoNode = new TransformationSceneGraphNode(tubRightTrafoMatrix);
  tubNode.append(tubRightTrafoNode);
  
  tubRightNode = new CubeRenderNode();
  tubRightTrafoNode.append(tubRightNode);

  // tub left
  var tubLeftTrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(-tubWidth/2,0,0));
  tubLeftTrafoMatrix = mat4.multiply(mat4.create(), tubLeftTrafoMatrix, glm.scale(tubThicc,tubHeigth,tubLength*2-tubThicc));
  tubLeftTrafoNode = new TransformationSceneGraphNode(tubLeftTrafoMatrix);
  tubNode.append(tubLeftTrafoNode);
  
  tubLeftNode = new CubeRenderNode();
  tubLeftTrafoNode.append(tubLeftNode);

  // tub water Q1
  var Q1TrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate((tubWidth-tubThicc)*0.25,tubHeigth*0.2,(tubLength-tubThicc)*0.25));
  Q1TrafoMatrix = mat4.multiply(mat4.create(), Q1TrafoMatrix, glm.scale(tubWidth-tubThicc,waterThicc,tubLength));
  Q1TrafoNode = new TransformationSceneGraphNode(Q1TrafoMatrix);
  tubNode.append(Q1TrafoNode);
  
  Q1Node = new CubeRenderNode();
  Q1TrafoNode.append(Q1Node);

  // tub water Q2
  var Q2TrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate((tubWidth-tubThicc)*0.25,tubHeigth*0.2,-(tubLength-tubThicc)*0.25));
  Q2TrafoMatrix = mat4.multiply(mat4.create(), Q2TrafoMatrix, glm.scale(tubWidth-tubThicc,waterThicc,tubLength));
  Q2TrafoNode = new TransformationSceneGraphNode(Q2TrafoMatrix);
  tubNode.append(Q2TrafoNode);
  
  Q2Node = new CubeRenderNode();
  Q2TrafoNode.append(Q2Node);

// tub water Q3
var Q3TrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(-(tubWidth-tubThicc)*0.25,tubHeigth*0.2,(tubLength-tubThicc)*0.25));
Q3TrafoMatrix = mat4.multiply(mat4.create(), Q3TrafoMatrix, glm.scale(tubWidth-tubThicc,waterThicc,tubLength));
Q3TrafoNode = new TransformationSceneGraphNode(Q3TrafoMatrix);
tubNode.append(Q3TrafoNode);

Q3Node = new CubeRenderNode();
Q3TrafoNode.append(Q3Node);

// tub water Q4
var Q4TrafoMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(-(tubWidth-tubThicc)*0.25,tubHeigth*0.2,-(tubLength-tubThicc)*0.25));
Q4TrafoMatrix = mat4.multiply(mat4.create(), Q4TrafoMatrix, glm.scale(tubWidth-tubThicc,waterThicc,tubLength));
Q4TrafoNode = new TransformationSceneGraphNode(Q4TrafoMatrix);
tubNode.append(Q4TrafoNode);

Q4Node = new CubeRenderNode();
Q4TrafoNode.append(Q4Node);

}

function createRobot(rootNode) {

  //TASK 6-1

  //transformations of whole body
  var robotTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.rotateY(animatedAngle/2));
  robotTransformationMatrix = mat4.multiply(mat4.create(), robotTransformationMatrix, glm.translate(0.3,0.9,0));
  robotTransformationNode = new TransformationSceneGraphNode(robotTransformationMatrix);
  rootNode.append(robotTransformationNode);

  //body
  cubeNode = new CubeRenderNode();
  robotTransformationNode.append(cubeNode);

  //transformation of head
  var headTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.rotateY(animatedAngle));
  headTransformationMatrix = mat4.multiply(mat4.create(), headTransformationMatrix, glm.translate(0.0,0.4,0));
  headTransformationMatrix = mat4.multiply(mat4.create(), headTransformationMatrix, glm.scale(0.4,0.33,0.5));
  headTransformationNode = new TransformationSceneGraphNode(headTransformationMatrix);
  robotTransformationNode.append(headTransformationNode);

  //head
  cubeNode = new CubeRenderNode();
  headTransformationNode.append(cubeNode);

  //transformation of left leg
  var leftLegTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(0.16,-0.6,0));
  leftLegTransformationMatrix = mat4.multiply(mat4.create(), leftLegTransformationMatrix, glm.scale(0.2,1,1));
  var leftLegTransformationNode = new TransformationSceneGraphNode(leftLegTransformationMatrix);
  robotTransformationNode.append(leftLegTransformationNode);

  //left leg
  cubeNode = new CubeRenderNode();
  leftLegTransformationNode.append(cubeNode);

  //transformation of right leg
  var rightLegTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(-0.16,-0.6,0));
  rightLegTransformationMatrix = mat4.multiply(mat4.create(), rightLegTransformationMatrix, glm.scale(0.2,1,1));
  var rightLegtTransformationNode = new TransformationSceneGraphNode(rightLegTransformationMatrix);
  robotTransformationNode.append(rightLegtTransformationNode);

  //right leg
  cubeNode = new CubeRenderNode();
  rightLegtTransformationNode.append(cubeNode);
}



/**
 * render one frame
 */
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

  //TASK 6-2
  //update transformation of robot for rotation animation
  var robotTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.rotateY(animatedAngle/2));
  robotTransformationMatrix = mat4.multiply(mat4.create(), robotTransformationMatrix, glm.translate(0.3,0.9,0));
  robotTransformationNode.setMatrix(robotTransformationMatrix);

  var headTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.rotateY(animatedAngle));
  headTransformationMatrix = mat4.multiply(mat4.create(), headTransformationMatrix, glm.translate(0.0,0.4,0));
  headTransformationMatrix = mat4.multiply(mat4.create(), headTransformationMatrix, glm.scale(0.4,0.33,0.5));
  headTransformationNode.setMatrix(headTransformationMatrix);

  context = createSceneGraphContext(gl, shaderProgram);

  rootNode.render(context);

  //TASK 2-0 comment renderQuad & renderRobot out:
  // renderQuad(context.sceneMatrix, context.viewMatrix);
  // renderRobot(context.sceneMatrix, context.viewMatrix);

  //request another render call as soon as possible
  requestAnimationFrame(render);

  //animate based on elapsed time
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

/**
 * returns a new rendering context
 * @param gl the gl context
 * @param shader the shader program
 * @returns {ISceneGraphContext}
 */
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

/**
 * base node of the scenegraph
 */
class SceneGraphNode {

  constructor() {
    this.children = [];
  }

  /**
   * appends a new child to this node
   * @param child the child to append
   * @returns {SceneGraphNode} the child
   */
  append(child) {
    this.children.push(child);
    return child;
  }

  /**
   * removes a child from this node
   * @param child
   * @returns {boolean} whether the operation was successful
   */
  remove(child) {
    var i = this.children.indexOf(child);
    if (i >= 0) {
      this.children.splice(i, 1);
    }
    return i >= 0;
  };

  /**
   * render method to render this scengraph
   * @param context
   */
  render(context) {

    //render all children
    this.children.forEach(function (c) {
      return c.render(context);
    });
  };
}

/**
 * a quad node that renders floor plane
 */
class QuadRenderNode extends SceneGraphNode {

  render(context) {


    //TASK 2-1

    //setting the model view and projection for the shader
    setUpModelViewMatrix(context.sceneMatrix, context.viewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_projection'), false, context.projectionMatrix);


    var positionLocation = gl.getAttribLocation(context.shader, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    var colorLocation = gl.getAttribLocation(context.shader, 'a_color');
    gl.bindBuffer(gl.ARRAY_BUFFER, quadColorBuffer);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);

    //set alpha value for blending
    //TASK 1-3
    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_alpha'), 1);

    // draw the bound data as 6 vertices = 2 triangles starting at index 0
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    //render children
    super.render(context);
  }
}

/**
 * a cube node that renders a cube at its local origin
 */
class CubeRenderNode extends SceneGraphNode {

  render(context) {

    //setting the model view and projection for the shader
    setUpModelViewMatrix(context.sceneMatrix, context.viewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_projection'), false, context.projectionMatrix);


    var positionLocation = gl.getAttribLocation(context.shader, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false,0,0) ;
    gl.enableVertexAttribArray(positionLocation);

    var colorLocation = gl.getAttribLocation(context.shader, 'a_color');
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false,0,0) ;
    gl.enableVertexAttribArray(colorLocation);

    //set alpha value for blending
    //TASK 1-3
    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_alpha'), 0.5);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

    //render children
    super.render(context);
  }
}

/**
 * a transformation node, i.e applied a transformation matrix to its successors
 */
class TransformationSceneGraphNode extends SceneGraphNode { //compare with TransformationSGNode in framework.js
  /**
   * the matrix to apply
   * @param matrix
   */
  constructor(matrix) {
    super();
    this.matrix = matrix || mat4.create();
  }

  render(context) {
    //backup previous one
    var previous = context.sceneMatrix;
    //set current world matrix by multiplying it
    if (previous === null) {
      context.sceneMatrix = mat4.clone(this.matrix);
    }
    else {
      context.sceneMatrix = mat4.multiply(mat4.create(), previous, this.matrix);
    }

    //render children
    super.render(context);
    //restore backup
    context.sceneMatrix = previous;
  }

  setMatrix(matrix) {
    this.matrix = matrix;
  }
}

/**
 * a shader node sets a specific shader for the successors
 */
class ShaderSceneGraphNode extends SceneGraphNode { //compare with ShaderSGNode in framework.js
  /**
   * constructs a new shader node with the given shader program
   * @param shader the shader program to use
   */
  constructor(shader) {
    super();
    this.shader = shader;
  }

  render(context) {
    //backup prevoius one
    var backup = context.shader;
    //set current shader
    context.shader = this.shader;
    //activate the shader
    context.gl.useProgram(this.shader);
    //render children
    super.render(context);
    //restore backup
    context.shader = backup;
    //activate the shader
    context.gl.useProgram(backup);
  }
};

function convertDegreeToRadians(degree) {
  return degree * Math.PI / 180
}
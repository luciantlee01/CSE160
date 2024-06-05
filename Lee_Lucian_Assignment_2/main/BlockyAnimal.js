// Vertex and fragment shader programs
const VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_PointSize;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = u_PointSize;\n' +
  '}\n';

const FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// Class Point
class Point {
    constructor(x, y, color, size) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size*5;
    }
  
    render(gl, a_Position, u_FragColor, u_PointSize) {
      gl.disableVertexAttribArray(a_Position);
      gl.vertexAttrib3f(a_Position, this.x, this.y, 0.0);
      gl.uniform4fv(u_FragColor, this.color);
      gl.uniform1f(u_PointSize, this.size);
      gl.drawArrays(gl.POINTS, 0, 1);
    }
}


// Global variables updated with UI elements
let canvas, gl, a_Position, u_FragColor, u_PointSize, u_ModelMatrix, u_GlobalRotateMatrix;
let g_magentaAngle = 0;
let g_yellowAngle = 0;
let g_magentaAnimation = false;
let g_yellowAnimation = false;
let g_legAnimation = false;
let g_legAngle = 0;
let g_tailAnimation = false;
let g_tailAngle = 0;
let g_headAnimation = false; // Control activation of head animation
let g_headAngle = 0; // Current angle for head movement
let shapesList = [];
let currentShape = 'point'; // Default shape
let currentSegments = 20; // Default number of segments for circles
let currentSize = 10;  // Default size
let g_globalAngle = 0; // Initialize rotation angle to 0
let isDragging = false;
let lastX = -1, lastY = -1; // Track the last position of the mouse
let rotationX = 0, rotationY = 0; // To store the rotation angles
let isJumping = false;
let jumpStartTime = 0;
let jumpDuration = 1.5; // duration of the jump in seconds
let jumpHeight = 0.2; // maximum height of the jump
let g_jumpY = 0; // Initial vertical position of the jump, no displacement


function updateSize(newSize) {
    currentSize = parseFloat(newSize);
}

function initEventHandlers(canvas, document) {
  canvas.onmousedown = function(ev) {   // Mouse is pressed
    let x = ev.clientX, y = ev.clientY;
    // Start dragging if it's a valid click inside the canvas
    let rect = ev.target.getBoundingClientRect();
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
      lastX = x; lastY = y;
      isDragging = true;
    }

  };

  canvas.onmouseup = function(ev) { isDragging = false; }; // Mouse is released

  canvas.onmousemove = function(ev) { // Mouse is moved
    let x = ev.clientX, y = ev.clientY;
    if (isDragging) {
      let factor = 100 / canvas.height; // The rotation factor
      let dx = factor * (x - lastX);
      let dy = factor * (y - lastY);
      // Update the global model rotation angles
      rotationX = Math.max(Math.min(rotationX + dy, 90), -90);
      rotationY = rotationY + dx;

      // Redraw the scene with the new rotation angles
      renderAllShapes();
    }
    lastX = x; lastY = y;
  };

  canvas.onclick = function(ev) { // Handling click for the special 'poke' animation
    if (ev.shiftKey) { // Check if Shift key is pressed
      triggerPokeAnimation();
    }
  };
}

function setupWebGL() {
    canvas = document.getElementById('webgl');
    // Adjusted for better performance with more points
    gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) {
      console.error('Failed to get the rendering context for WebGL');
      return false;
    }
    gl.enable(gl.DEPTH_TEST);
    return true;
  }

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.error('Failed to initialize shaders.');
    return false;
  }
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (a_Position < 0 || !u_FragColor || !u_PointSize || !u_ModelMatrix || !u_GlobalRotateMatrix) {
    console.error('Failed to get the storage location of GLSL variables.');
    return false;
  }
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  return true;
}

function handleClicks() {
    canvas.onmousedown = function(ev) { handleMouseEvent(ev); };
    canvas.onmouseup = function() { canvas.onmousemove = null; }; // Disable moving when mouse is up
    canvas.onmouseleave = function() { canvas.onmousemove = null; }; // Disable on leaving canvas
}


function handleMouseEvent(ev) {
    if (ev.buttons !== 1) return;  // Only proceed if left mouse button is pressed
    let x = ev.clientX, y = ev.clientY;
    const rect = ev.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
    y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);

    let r = parseFloat(document.getElementById('colorR').value);
    let g = parseFloat(document.getElementById('colorG').value);
    let b = parseFloat(document.getElementById('colorB').value);

    if (currentShape === 'point') {
        const point = new Point(x, y, [r, g, b, 1.0], currentSize);
        shapesList.push(point);
    } else if (currentShape === 'triangle') {
        const vertices = [x, y, x - 0.05, y - 0.05, x + 0.05, y - 0.05];
        const triangle = new Triangle(vertices, [r, g, b, 1.0], currentSize);
        shapesList.push(triangle);
    } else if (currentShape === 'circle') {
        const circle = new Circle(x, y, [r, g, b, 1.0], 0.05 * currentSize, currentSegments); // Scale radius with size
        shapesList.push(circle);
    }

    renderAllShapes();
    canvas.onmousemove = handleMouseEvent; // Set move handler only when mouse is down

}


function clearCanvas() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear color and depth buffer
    shapesList = []; // Clear the list of shapes
    renderAllShapes(); // Re-render the canvas which will now be clear
  }

function setShape(shape) {
    currentShape = shape;
    if (shape === 'circle') {
        currentSegments = parseInt(document.getElementById('circleSegments').value);
    }
}

document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle = this.value; renderAllShapes();});
document.getElementById('headSlide').addEventListener('mousemove', function() {g_headAngle = this.value; renderAllShapes();});
document.getElementById('legSlide').addEventListener('mousemove', function() {g_legAngle = this.value; renderAllShapes();});
document.getElementById('tailSlide').addEventListener('mousemove', function() {g_tailAngle = this.value; renderAllShapes();});
document.getElementById('animationLegsOnButton').onclick = function() { g_legAnimation = true; };
document.getElementById('animationLegsOffButton').onclick = function() { g_legAnimation = false; };
document.getElementById('animationHeadOnButton').onclick = function() { g_headAnimation = true; };
document.getElementById('animationHeadOffButton').onclick = function() { g_headAnimation = false; };
document.getElementById('animationTailsOnButton').onclick = function() { g_tailAnimation = true; };
document.getElementById('animationTailsOffButton').onclick = function() { g_tailAnimation = false; };

function renderAllShapes() {
    var globalRotMat = new Matrix4();
    globalRotMat.setRotate(rotationX, 1, 0, 0); // Rotation around x-axis
    globalRotMat.rotate(rotationY, 0, 1, 0); // Rotation around y-axis
    globalRotMat.rotate(g_globalAngle,1,1,1);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
    
    // Call render scene
    renderScene();
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var globalRotMat = new Matrix4().rotate(rotationX, 1, 0, 0);
  globalRotMat.rotate(rotationY, 0, 1, 0);
  if (isJumping) {
    globalRotMat.translate(0, g_jumpY, 0); // Apply the jump translation
  }
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
     // Body of the pig
     var body = new Cube();
     body.color = [1.0, 0.8, 0.8, 1.0]; // Pink color
     body.matrix.translate(-0.5, .30, 0.0);
     body.matrix.rotate(90, 0, 1, 0);
     body.matrix.rotate(90, 1, 0, 0);
     body.matrix.rotate(90, 0, 0, 1);
     body.matrix.scale(1.0, 0.6, 0.5); // Scaling to form the body shape
     body.render();
 
    // Head of the pig with animation
    var head = new Cube();
    head.color = [1.0, 0.8, 0.8, 1.0];
    head.matrix.translate(0.35, -0.15, .09);
    head.matrix.rotate(g_headAngle, 0, 1, 0); // Apply head animation rotation
    head.matrix.scale(0.4, 0.4, 0.4);
    head.render();

    // Eyes need to follow the head
    var eyeLeft = new Cube();
    var eyeRight = new Cube();
    eyeLeft.color = eyeRight.color = [1.0, 1.0, 1.0, 1.0];
    var eyeScale = 0.1;

    // Positioning eyes based on head position and animation
    eyeLeft.matrix = new Matrix4(head.matrix);
    eyeRight.matrix = new Matrix4(head.matrix);
    eyeLeft.matrix.translate(0.005, 0.5, 0.25); // Adjust multiplier for more natural movement
    eyeRight.matrix.translate(0.005, 0.5, 0.15);
    eyeLeft.matrix.translate(0.65 + g_headAngle * 0.009, 0.1, 0.35); // Adjust multiplier for more natural movement
    eyeRight.matrix.translate(0.65 + g_headAngle * 0.009, 0.1, 0.2);
    eyeLeft.matrix.scale(0.5, eyeScale, eyeScale);
    eyeRight.matrix.scale(0.5, eyeScale, eyeScale);
    eyeLeft.render();
    eyeRight.render();

    // Tail of the pig
    var tail = new Cube();
    tail.color = [1.0, 0.8, 0.8, 1.0];  // Same pink color as the body
    tail.matrix.rotate(g_tailAngle, 0, 1, 0);  // Rotate around Z-axis for wagging
    tail.matrix.translate(-.6, -.07, 0.35);  // Position it at the back of the body
    tail.matrix.rotate(90, 0, 1, 0); 
    tail.matrix.scale(0.1, 0.1, 0.2);  // Thin and long tail
  
    tail.render();

    // Snout of the pig following the head
    var snout = new Cube();
    snout.matrix = new Matrix4(head.matrix);
    snout.color = [1.0, 0.7, 0.7, 1.0];
    snout.matrix.translate(0.7 + g_headAngle * 0.01, 0.4, 0.35); // Snout follows the head
    snout.matrix.rotate(90, 1, 0, 0);
    snout.matrix.scale(0.5, 0.3, 0.2);
    snout.render();
 
     // Legs of the pig (4 legs: front left, front right, back left, back right)
     var legOffsets = [
      { x: 0.2, y: -0.3, z: 0.40 },  // front left
      { x: -0.35, y: -0.3, z: 0.40 }, // front right
      { x: 0.2, y: -0.3, z: 0.09 },  // back left
      { x: -0.35, y: -0.3, z: 0.09 }  // back right
    ];
    var legRotations = [g_legAngle, -g_legAngle, -g_legAngle, g_legAngle]; // Diagonal legs move in sync
    var legs = [new Cube(), new Cube(), new Cube(), new Cube()];
  
    legs.forEach((leg, index) => {
      leg.color = [1.0, 0.8, 0.8, 1.0];
      leg.matrix.translate(legOffsets[index].x, legOffsets[index].y, legOffsets[index].z);
      leg.matrix.rotate(legRotations[index], 0, 0, 1); // Rotating around the X-axis
      leg.matrix.scale(0.1, 0.2, 0.1);
      leg.render();
    });
 
}

function tick(){
  g_seconds = performance.now()/1000.0-g_startTime
  // console.log(performance.now());
  updateAnimationAngles()
  renderAllShapes();
  requestAnimationFrame(tick);
}

function triggerPokeAnimation() {
  if (!isJumping) { // Start a new jump only if not already jumping
    isJumping = true;
    jumpStartTime = performance.now() / 1000; // Record start time in seconds
    requestAnimationFrame(animateJump);
  }
}

function animateJump() {
  const currentTime = performance.now() / 1000;
  const time = (currentTime - jumpStartTime) / jumpDuration;
  if (time > 1) {
    isJumping = false; // Stop the animation after the duration has passed
    renderAllShapes(); // One last render to reset the position
    return;
  }
  const phase = Math.sin(time * Math.PI); // Sinusoidal motion for smooth jump
  g_jumpY = jumpHeight * phase; // Calculate the current height based on phase

  renderAllShapes();
  requestAnimationFrame(animateJump); // Continue animation
}

function updateAnimationAngles(){
  g_seconds = performance.now()/1000.0-g_startTime;

  if (g_yellowAnimation) {
    g_yellowAngle = 45 * Math.sin(g_seconds);
  }
  if (g_magentaAnimation) {
    g_magentaAngle = 45 * Math.sin(3 * g_seconds);
  }
  if (g_legAnimation) {
    g_legAngle = 30 * Math.sin(g_seconds * 2); // Legs oscillation
  }
  if (g_headAnimation) {
    g_headAngle = 15 * Math.sin(g_seconds * 2); // Oscillates head side to side
  }
  if (g_tailAnimation) {
    g_tailAngle = 10 * Math.sin(g_seconds * 5);  // Faster wagging
  }
}


var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime

function main() {
  if (!setupWebGL()) {
    return;
  }
  if (!connectVariablesToGLSL()) {
    return;
  }
  handleClicks();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  //gl.clear(gl.COLOR_BUFFER_BIT);
  //renderAllShapes();
  requestAnimationFrame(tick);
  initEventHandlers(canvas, document); // Setup mouse controls
}
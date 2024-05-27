// Based on ColoredPoint.js © 2012 matsuda
// Shader and some things styled from: https://people.ucsc.edu/~jwdicker/Asgn3/BlockyWorld.html

// WebGL Code
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;

  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform vec3 u_LightPos;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_LightDir;
  varying vec3 v_WorldPos;

  void main() {
    vec4 worldPos = u_ModelMatrix * a_Position;
    v_WorldPos = worldPos.xyz;
    v_UV = a_UV;
    v_Normal = mat3(u_ModelMatrix) * a_Normal;
    v_LightDir = u_LightPos - worldPos.xyz;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * worldPos;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_LightDir;
  varying vec3 v_WorldPos;

  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform bool u_LightingOn;
  uniform bool u_NormalViz;
  uniform vec3 u_LightColor;
  uniform int u_TextureChoice;

  void main() {
    vec3 normal = normalize(v_Normal);
    vec3 lightDir = normalize(v_LightDir);

    vec4 texColor;
    if (u_TextureChoice == 0) {
      texColor = texture2D(u_Sampler0, v_UV);
    } else if (u_TextureChoice == 1) {
      texColor = texture2D(u_Sampler1, v_UV);
    } else if (u_TextureChoice == 2) {
      texColor = texture2D(u_Sampler2, v_UV);
    } else {
      texColor = u_FragColor; // Default color if no texture is chosen
    }

    vec4 baseColor = texColor * u_FragColor;

    if (u_NormalViz) {
      gl_FragColor = vec4(normal, 1.0);
    } else {
      float nDotL = max(dot(normal, lightDir), 0.0);
      vec3 diffuse = nDotL * u_LightColor * baseColor.rgb;

      vec3 ambient = 0.1 * u_LightColor * baseColor.rgb;
      vec3 viewDir = normalize(-v_WorldPos);
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
      vec3 specular = spec * u_LightColor;

      vec3 finalColor = ambient + diffuse + specular;
      gl_FragColor = vec4(finalColor, baseColor.a);
    }
  }`;

// Enumerable for texture choices
const TEXTURES = {
  DEBUG: -1,
  COLOR: 0,
  TEXTURE0: 1,
  TEXTURE1: 2,
  TEXTURE2: 3
}

// Global variables
let canvas, gl; // Canvas
let a_Position, a_UV, u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix; // Vertex Shader
let u_FragColor, u_Sampler0, u_Sampler1, u_Sampler2, u_TextureChoice; // Fragment shader

// Buffers
let g_VertexBuffer;
let g_UVBuffer;

// Lighting
let lightPos = [0, 5, 0];
let lightColor = [1.0, 1.0, 1.0];
let lightingOn = true;
let normalViz = false;

// Camera
let gameCamera;
let cursorSpeed = 0.25;
let invertAxis = {'x': false, 'y': false};
const MOVEMENT_SPEEDS = {
  MOVE: 0.15,
  MOVE_ACCEL: 0.01,
  PAN: 2.5,
  PAN_ACCEL: 0.25
}
let isMoving = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
  leftPan: false,
  rightPan: false,
  upPan: false,
  downPan: false
};
let currentSpeeds = {
  z: 0,
  x: 0,
  y: 0,
  yPan: 0,
  xPan: 0
}

// Performance
const g_startTime = performance.now() / 1000;
let g_time = performance.now();
let g_animTime = g_time / 1000 - g_startTime;

// Javascript helper functions
// Gets the canvas and GL context
function initializeWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext('webgl', {preserveDrawingBugger: true});
  if (!gl) {
    throw 'Failed to get the rendering context for WebGL';
  }

  // Enable 3D
  gl.enable(gl.DEPTH_TEST);

  // Define the camera
  gameCamera = new Camera();
  gameCamera.updateProjectionMatrix();  // This needs to be called here to set the aspect ratio correctly
}

// Move shader initialization to a more static part of your setup
async function initializeShaders() {
  if (!gl.program) { // Only create if not already created
      const vertexShader = createAndCompileShader(gl.VERTEX_SHADER, VSHADER_SOURCE);
      const fragmentShader = createAndCompileShader(gl.FRAGMENT_SHADER, FSHADER_SOURCE);
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.error('Could not initialize shaders');
          return null;
      }
      gl.useProgram(program);
      gl.program = program;
      getShaderLocations();
  }
}

function getShaderLocations() {
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_LightPos = gl.getUniformLocation(gl.program, 'u_LightPos');
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_LightingOn = gl.getUniformLocation(gl.program, 'u_LightingOn');
  u_NormalViz = gl.getUniformLocation(gl.program, 'u_NormalViz');
  u_TextureChoice = gl.getUniformLocation(gl.program, 'u_TextureChoice');
}

function createAndCompileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}


function connectVariablesToGLSL() {
    // Attempt to initialize shaders and check for failure
    if (!initializeShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        throw 'Failed to initialize shaders.';
    }

    // Helper function to retrieve attribute location
    function getAttribLocation(attributeName) {
        const location = gl.getAttribLocation(gl.program, attributeName);
        if (location < 0) {
            throw `Failed to get the storage location of ${attributeName}`;
        }
        return location;
    }

    // Helper function to retrieve uniform location
    function getUniformLocation(uniformName) {
        const location = gl.getUniformLocation(gl.program, uniformName);
        if (!location) {
            throw `Failed to get the storage location of ${uniformName}`;
        }
        return location;
    }

    // Retrieve attribute locations
    a_Position = getAttribLocation('a_Position');
    a_UV = getAttribLocation('a_UV');

    // Retrieve uniform locations
    u_ModelMatrix = getUniformLocation('u_ModelMatrix');
    u_ViewMatrix = getUniformLocation('u_ViewMatrix');
    u_ProjectionMatrix = getUniformLocation('u_ProjectionMatrix');
    u_FragColor = getUniformLocation('u_FragColor');
    u_Sampler0 = getUniformLocation('u_Sampler0');
    u_Sampler1 = getUniformLocation('u_Sampler1');
    u_Sampler2 = getUniformLocation('u_Sampler2');
    u_TextureChoice = getUniformLocation('u_TextureChoice');

    // Set default values for matrix uniforms
    const defaultMatrix = new Matrix4().elements;
    gl.uniformMatrix4fv(u_ModelMatrix, false, defaultMatrix);
    gl.uniformMatrix4fv(u_ViewMatrix, false, defaultMatrix);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, defaultMatrix);

    // Create and check vertex and UV buffers
    g_VertexBuffer = gl.createBuffer();
    if (!g_VertexBuffer) {
        throw 'Failed to create the vertex buffer object';
    }
    g_UVBuffer = gl.createBuffer();
    if (!g_UVBuffer) {
        throw 'Failed to create the UV buffer object';
    }
}


// Initializes all textures to be used
function initializeTextures() {
  const urls = ['textures/snownight.jpeg', 'textures/snow.jpg', 'textures/stone.jpeg'];
  loadAndBind(urls);
}

async function loadAndBind(urls) {
  for (let i = 0; i < urls.length; i++) {
    const texture = gl.createTexture();
    const image = new Image();
    image.onload = () => {
      bindTexture(image, texture, i);
    };
    image.src = urls[i];
  }
}

function bindTexture(image, texture, index) {
  const textureUnit = gl.TEXTURE0 + index;
  gl.activeTexture(textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const samplerLocation = gl.getUniformLocation(gl.program, 'u_Sampler' + index);
  if (samplerLocation) {
    gl.uniform1i(samplerLocation, index);
  } else {
    console.log('Failed to get the storage location of u_Sampler' + index);
  }
}


// Clear the canvas and render the animal
function drawScene() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniform4f(u_FragColor, COLORS.WHITE[0], COLORS.WHITE[1], COLORS.WHITE[2], COLORS.WHITE[3]);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, gameCamera.projectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, gameCamera.viewMatrix.elements);
  // Set light position and color
  gl.uniform3fv(u_LightPos, lightPos);
  gl.uniform3fv(u_LightColor, lightColor);
  gl.uniform1i(u_LightingOn, lightingOn);
  gl.uniform1i(u_NormalViz, normalViz);
  gl.uniform1i(u_TextureChoice, textureChoice);

  renderWorldObjects();
  drawSphere();
  for(let i in g_bodyParts) {
    g_bodyParts[i].render();
  }
}

// Sets up the listeners for the mouse and UI elements
function initializeUIHandlers() {
  // Setup pointer lock for canvas to capture mouse movement
  canvas.addEventListener('click', () => {
      if (!document.pointerLockElement) {
          canvas.requestPointerLock();
      }
  });

  // Handle changes in pointer lock state
  document.addEventListener('pointerlockchange', managePointerLockState, false);

  // Setup UI element interactions
  configureSliders();

  // Setup keyboard interactions
  document.addEventListener('keydown', (e) => processKeyboardInput(e, true));
  document.addEventListener('keyup', (e) => processKeyboardInput(e, false));
}

function managePointerLockState() {
  if (document.pointerLockElement === canvas) {
      document.addEventListener('mousemove', rotateCameraBasedOnMouse, false);
      document.addEventListener('click', handleCanvasClick, false);
  } else {
      document.removeEventListener('mousemove', rotateCameraBasedOnMouse, false);
      document.removeEventListener('click', handleCanvasClick, false);
  }
}

function handleCanvasClick(event) {
  let blockPos = [
      Math.round(gameCamera.at.elements[0]) + 16,
      Math.round(gameCamera.at.elements[1]) - MIN_Y,
      Math.round(gameCamera.at.elements[2]) + 16
  ];
  if (event.button === 2) {
      addWorldBlock(blockPos[0], blockPos[1], blockPos[2]);
  } else if (event.button === 0) {
      deleteWorldBlock(blockPos[0], blockPos[1], blockPos[2]);
  }
}

function configureSliders() {
  document.getElementById("FOVSlide").oninput = function() {
      let newFOV = parseFloat(this.value);
      gameCamera.setFOV(newFOV);
      refreshUI("FOV", newFOV);
  };

  document.getElementById("MouseSlide").oninput = function() {
      cursorSpeed = parseFloat(this.value);
  };

  document.getElementById("xInv").onchange = function() {
      invertAxis.x = this.checked;
  };

  document.getElementById("yInv").onchange = function() {
      invertAxis.y = this.checked;
  };

  // Update light position and color based on UI input
  document.getElementById('toggleLighting').onclick = () => { lightingOn = !lightingOn; };
  document.getElementById('toggleNormalViz').onclick = () => { normalViz = !normalViz; };
  document.getElementById('lightPosX').oninput = (e) => { lightPos[0] = parseFloat(e.target.value); };
  document.getElementById('lightPosY').oninput = (e) => { lightPos[1] = parseFloat(e.target.value); };
  document.getElementById('lightPosZ').oninput = (e) => { lightPos[2] = parseFloat(e.target.value); };
  document.getElementById('lightColor').oninput = (e) => { 
    const color = e.target.value.match(/[A-Za-z0-9]{2}/g).map(v => parseInt(v, 16) / 255);
    lightColor = [color[0], color[1], color[2]];
  };

  document.getElementById('textureChoice').onchange = (e) => {
    textureChoice = parseInt(e.target.value);
  };  
}

function refreshUI(field, value) {
  let element = document.getElementById(field);
  if (element) {
      element.textContent = value;
  }
}

function rotateCameraBasedOnMouse(event) {
  let deltaX = event.movementX * cursorSpeed;
  let deltaY = event.movementY * cursorSpeed;

  // Apply inversion settings for x and y axis
  if (invertAxis.x) {
      deltaX = -deltaX;  // Invert pan direction horizontally
  }
  if (invertAxis.y) {
      deltaY = -deltaY;  // Invert pan direction vertically
  }

  // Pan horizontally based on deltaX
  if (deltaX > 0) {
      gameCamera.panRight(deltaX);
  } else if (deltaX < 0) {
      gameCamera.panLeft(-deltaX);  // Pass a positive speed value
  }

  // Pan vertically based on deltaY
  if (deltaY > 0) {
      gameCamera.panDown(deltaY);
  } else if (deltaY < 0) {
      gameCamera.panUp(-deltaY);  // Pass a positive speed value
  }
}



// Handles keyboard input
function processKeyboardInput(event, keyDown) {
  const keyMap = {
    "ArrowUp": "forward",
    "KeyW": "forward",
    "ArrowDown": "backward",
    "KeyS": "backward",
    "ArrowLeft": "left",
    "KeyA": "left",
    "ArrowRight": "right",
    "KeyD": "right",
    "Space": "up",
    "ShiftLeft": "down",
    "ShiftRight": "down",
    "KeyQ": "panLeft",
    "KeyE": "panRight",
    "KeyZ": "panUp",
    "KeyX": "panDown"
  };

  if (keyMap[event.code]) {
    isMoving[keyMap[event.code]] = keyDown;
    event.preventDefault();
  }
}

// Handles all player movement
function updateCameraPosition() {
  if (isMoving.forward) gameCamera.moveForward(MOVEMENT_SPEEDS.MOVE);
  if (isMoving.backward) gameCamera.moveBackward(MOVEMENT_SPEEDS.MOVE);
  if (isMoving.left) gameCamera.moveLeft(MOVEMENT_SPEEDS.MOVE);
  if (isMoving.right) gameCamera.moveRight(MOVEMENT_SPEEDS.MOVE);
  if (isMoving.up) gameCamera.moveUp(MOVEMENT_SPEEDS.MOVE);
  if (isMoving.down) gameCamera.moveDown(MOVEMENT_SPEEDS.MOVE);
  if (isMoving.leftPan) gameCamera.panLeft(MOVEMENT_SPEEDS.PAN);
  if (isMoving.rightPan) gameCamera.panRight(MOVEMENT_SPEEDS.PAN);
  if (isMoving.upPan) gameCamera.panUp(MOVEMENT_SPEEDS.PAN);
  if (isMoving.downPan) gameCamera.panDown(MOVEMENT_SPEEDS.PAN);
}

// Reset all UI inputs to their defualt positions
function resetUserInterface() {
  const uiSettings = {
    "FOVSlide": gameCamera.fov,
    "MouseSlide": cursorSpeed,
    "xInv": invertAxis.x,
    "yInv": invertAxis.y
  };

  Object.keys(uiSettings).forEach(id => {
    const element = document.getElementById(id);
    if (element.type === 'checkbox') {
      element.checked = uiSettings[id];
    } else {
      element.value = uiSettings[id];
      if (id === "FOVSlide") {
        sendTextToHTML(uiSettings[id], "FOV");
      }
    }
  });
}

function sendTextToHTML(text, destination) {
  const element = document.getElementById(destination);
  if (element) {
    element.textContent = text;
  }
}

// Render each frame of animation
function tick() {
  const nowTime = performance.now();
  const elapsedTime = (nowTime - g_startTime) / 1000; // Convert to seconds for smoother animation

  lightPos[0] = 5 * Math.sin(elapsedTime);
  lightPos[2] = 5 * Math.cos(elapsedTime);

  if (nowTime - g_time > 16) { // Only update every ~16ms
    const duration = nowTime - g_time;
    const fps = 1000 / duration;
    sendTextToHTML(`ms: ${Math.floor(duration)}\tfps: ${Math.floor(fps)}`, "perf");
    g_time = nowTime;
    g_animTime = g_time / 1000 - g_startTime;
    if(g_isAnimating) {
      updateAnimationAngles();
    }
    updateCameraPosition();
    drawScene();
  }
  requestAnimationFrame(tick);
}


// Add these lines to create the buffers in `main.js`
function initializeBuffers() {
  g_vertexBuffer = gl.createBuffer();
  g_uvBuffer = gl.createBuffer();
  g_normalBuffer = gl.createBuffer();

  if (!g_vertexBuffer || !g_uvBuffer || !g_normalBuffer) {
    console.error('Failed to create buffers');
    return false;
  }
  return true;
}

function main() {
  // Set up the environment
  try {
    initializeWebGL();
    connectVariablesToGLSL();
    if (!initializeBuffers()) {
      throw 'Failed to initialize buffers.';
    }
    initializeTextures();
  } catch(e) {
    console.error(e);
    return;
  }

  initializeUIHandlers();
  resetUserInterface();
  gl.clearColor(1, 0, 1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  createWorld();
  generateAnimal();
  requestAnimationFrame(tick);
}

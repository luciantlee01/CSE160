// Vertex and fragment shader programs
const VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_PointSize;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
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
let canvas, gl, a_Position, u_FragColor, u_PointSize;
let shapesList = [];
let currentShape = 'point'; // Default shape
let currentSegments = 20; // Default number of segments for circles
let currentSize = 10;  // Default size

function updateSize(newSize) {
    currentSize = parseFloat(newSize);
}


function setupWebGL() {
    canvas = document.getElementById('webgl');
    // Adjusted for better performance with more points
    gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) {
      console.error('Failed to get the rendering context for WebGL');
      return false;
    }
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
  if (a_Position < 0 || !u_FragColor || !u_PointSize) {
    console.error('Failed to get the storage location of GLSL variables.');
    return false;
  }
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


function click(ev) {
    let [x,y] = convertCoordinatesEventToGL(ev);

    let point;
    if (g_selectedType == POINT){
        point = new Point();
    } else if(g_selectedType == TRIANGLE){
        point = new Triangle();
    } else {
        point = new Circle();
    }
    point.position = [x,y];
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;
    g_shapesList.push(point);
  
    renderAllShapes();
  }


function clearCanvas() {
    shapesList = []; // Clear the list of shapes
    renderAllShapes(); // Re-render the canvas which will now be clear
  }

function setShape(shape) {
    currentShape = shape;
    if (shape === 'circle') {
        currentSegments = parseInt(document.getElementById('circleSegments').value);
    }
}

document.getElementById('circleSegments').oninput = function() {
    currentSegments = parseInt(this.value);
};

function renderAllShapes() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    shapesList.forEach(shape => {
        if (shape instanceof Point) {
            shape.render(gl, a_Position, u_FragColor, u_PointSize);
        } else if (shape instanceof Triangle) {
            shape.render(gl, a_Position, u_FragColor);
        } else if (shape instanceof Circle) {
            shape.render(gl, a_Position, u_FragColor);
        }
    });
}

function createDrawing() {
    const vertices = [
        // Roof
        -0.3, 0.1, 0.0, 0.4, 0.3, 0.1,

        // Body of the house
        -0.3, 0.1, 0.3, 0.1, -0.3, -0.4,
        0.3, 0.1, -0.3, -0.4, 0.3, -0.4,

        // Door
        -0.1, -0.1, 0.1, -0.1, -0.1, -0.4,
        0.1, -0.1, -0.1, -0.4, 0.1, -0.4,

        // Left tree trunk
        -0.8, -0.1, -0.7, -0.1, -0.8, -0.4,
        -0.7, -0.1, -0.8, -0.4, -0.7, -0.4,

        // Left tree leaves
        -0.85, 0.0, -0.65, 0.0, -0.75, 0.2,

        // Right tree trunk
        0.7, -0.1, 0.8, -0.1, 0.7, -0.4,
        0.8, -0.1, 0.7, -0.4, 0.8, -0.4,

        // Right tree leaves
        0.65, 0.0, 0.85, 0.0, 0.75, 0.2,

        // Grass front yard
        -1.0, -0.4, 1.0, -0.4, -1.0, -0.6,
        1.0, -0.4, -1.0, -0.6, 1.0, -0.6
    ];
    const colors = [0.5, 0.3, 0.1, 1.0]; // Brown color for the body and trunk
    const roofColors = [1.0, 0.0, 0.0, 1.0]; // Red color for the roof
    const doorColors = [0.4, 0.2, 0.0, 1.0]; // Dark brown for the door
    const leafColors = [0.0, 0.5, 0.0, 1.0]; // Green color for leaves
    const grassColors = [0.1, 0.6, 0.1, 1.0]; // Dark green for grass

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.error('Failed to create the buffer object for the house scene');
        return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Draw the roof
    gl.uniform4fv(u_FragColor, roofColors);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Draw the body
    gl.uniform4fv(u_FragColor, colors);
    gl.drawArrays(gl.TRIANGLES, 3, 6);

    // Draw the door
    gl.uniform4fv(u_FragColor, doorColors);
    gl.drawArrays(gl.TRIANGLES, 9, 6);

    // Draw the left tree trunk
    gl.uniform4fv(u_FragColor, colors);
    gl.drawArrays(gl.TRIANGLES, 15, 6);

    // Draw the left tree leaves
    gl.uniform4fv(u_FragColor, leafColors);
    gl.drawArrays(gl.TRIANGLES, 21, 3);

    // Draw the right tree trunk
    gl.uniform4fv(u_FragColor, colors);
    gl.drawArrays(gl.TRIANGLES, 24, 6);

    // Draw the right tree leaves
    gl.uniform4fv(u_FragColor, leafColors);
    gl.drawArrays(gl.TRIANGLES, 30, 3);

    // Draw the grass
    gl.uniform4fv(u_FragColor, grassColors);
    gl.drawArrays(gl.TRIANGLES, 33, 6);
}




function main() {
  if (!setupWebGL()) {
    return;
  }
  if (!connectVariablesToGLSL()) {
    return;
  }
  handleClicks();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

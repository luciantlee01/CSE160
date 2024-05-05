// Stores and handles all information for all shapes
// Source and taken from: https://people.ucsc.edu/~jwdicker/Asgn3/BlockyWorld.html
// with an extra function added by me
// Source: https://people.ucsc.edu/~cchen258/contest/
class Shape {
    constructor(textureType = TEXTURES.DEBUG, color = COLORS.WHITE, origin = [0.5, 0.5, 0.5], baseMatrix) {
      this.type = undefined;
  
      // The point where the cube is rendered from. Values are measured relative to the front lower left corner
      // Default is the center of the cube
      this.origin = origin;
  
      // The texture the cube will use
      this.textureType = textureType;
  
      // The color of the cube
      this.color = color;
  
      // Handles position, and rotation of the cube
      if(!baseMatrix) {
        this.matrix = new Matrix4();
      } else if(baseMatrix.type && baseMatrix.type == "cube") {
        this.matrix = new Matrix4(baseMatrix.matrix);
        baseMatrix.children.push(this);
      } else {
        this.matrix = new Matrix4(baseMatrix);
      }
  
      // Stores the values used in transformations so they can be undone later
      this.translations = [0, 0, 0];
      this.rotations = [0, 0, 0];
  
      // Handles the transformations of the cube (carried out in rendering)
      this.scaleVals = [1, 1, 1];
  
      // Keeps a reference to all objects that use this matrix
      // Allows for propagation of changes
      this.children = [];
    }
  
    // Transformations
    translate(tx = 0, ty = 0, tz = 0, saveVals = true) {
      if(saveVals) {
        this.translations[0] += tx;
        this.translations[1] += ty;
        this.translations[2] += tz;
      }
      this.matrix.translate(tx, ty, tz);
      this.propagate();
    }
  
    rotateX(deg = 0, saveVal = true) {
      if(saveVal) {
        this.rotations[0] += deg;
      }
      this.matrix.rotate(deg, 1, 0, 0);
      this.propagate();
    }
  
    rotateY(deg = 0, saveVal = true) {
      if(saveVal) {
        this.rotations[1] += deg;
      }
      this.matrix.rotate(deg, 0, 1, 0);
      this.propagate();
    }
  
    rotateZ(deg = 0, saveVal = true) {
      if(saveVal) {
        this.rotations[2] += deg;
      }
      this.matrix.rotate(deg, 0, 0, 1);
      this.propagate();
    }
  
    // Stored seperately to avoid changing sub-objects
    // (yes, I know this isn't how scaling normally works but this is my own class)
    scale(sx = 1, sy = 1, sz = 1) {
      this.scaleVals[0] *= sx;
      this.scaleVals[1] *= sy;
      this.scaleVals[2] *= sz;
      this.propagate();
    }
  
    // Set transformations
    // Source: https://people.ucsc.edu/~cchen258/contest/
    // Sets the translation, rotation, or scale without effecting the other transformations
    setTranslate(tx = 0, ty = 0, tz = 0) {
      this.matrix.translate(tx - this.translations[0], ty - this.translations[1], tz - this.translations[2]);
      this.translations[0] = tx;
      this.translations[1] = ty;
      this.translations[2] = tz;
      this.propagate();
    }
  
    setRotateX(deg = 0) {
      this.matrix.rotate(deg - this.rotations[0], 1, 0, 0);
      this.rotations[0] = deg;
      this.propagate();
    }
  
    setRotateY(deg = 0) {
      this.matrix.rotate(deg - this.rotations[1], 0, 1, 0);
      this.rotations[1] = deg;
      this.propagate();
    }
  
    setRotateZ(deg = 0) {
      this.matrix.rotate(deg - this.rotations[2], 0, 0, 1);
      this.rotations[2] = deg;
      this.propagate();
    }
  
    setScale(sx = 1, sy = 1, sz = 1) {
      this.scaleVals[0] = sx;
      this.scaleVals[1] = sy;
      this.scaleVals[2] = sz;
      this.propagate();
    }
  
    // Handle changes in heirarchy
    propagate() {
      for(let child of this.children) {
        child.update(this.matrix);
      }
    }
  
    update(newBase) {
      this.matrix = new Matrix4(newBase);
      this.translate(this.translations[0], this.translations[1], this.translations[2], false);
      this.rotateX(this.rotations[0], false);
      this.rotateY(this.rotations[1], false);
      this.rotateZ(this.rotations[2], false);
      }
  
    // Render function
    render() {
      gl.uniform1i(u_TextureChoice, this.textureType); // Only set if changed
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements); // Pass matrix only once
  
      if (!this.vertexBuffer) {
          this.setupBuffers();
      }
  
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
  
      gl.drawArrays(gl.TRIANGLES, 0, 36); // Assuming the cube is always made of 36 vertices
    }

    setupBuffers() {
      g_VertexBuffer = gl.createBuffer();
      g_UVBuffer = gl.createBuffer();
      if (!g_VertexBuffer || !g_UVBuffer) {
          console.error('Failed to create buffer objects');
          return false;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, g_VertexBuffer);
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, g_UVBuffer);
      gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_UV);
      return true;
  }
  
  }
  
  // Cube
  class Cube extends Shape {
    constructor(textureType = TEXTURES.DEBUG, color = COLORS.WHITE, origin = [0.5, 0.5, 0.5], baseMatrix) {
      super(textureType, color, origin, baseMatrix);
      this.type = "cube";
    }
  
    // Draw
    render() {
      // Use the appropriate texture
      gl.uniform1i(u_TextureChoice, this.textureType);
  
      // Set the color
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
  
      // Set the scale
      // Performed last and using a copy to avoid influencing the scale of joined shapes
      let newMat = new Matrix4(this.matrix);
      newMat.scale(this.scaleVals[0], this.scaleVals[1], this.scaleVals[2]);
  
      // Pass the now scaled matrix copy
      gl.uniformMatrix4fv(u_ModelMatrix, false, newMat.elements);
  
      let vertices = [];
      let uv = [];
  
      // Define the cube's back
      vertices = vertices.concat([0 - this.origin[0], 0 - this.origin[1], 0 - this.origin[2],
                                  1 - this.origin[0], 0 - this.origin[1], 0 - this.origin[2],
                                  1 - this.origin[0], 1 - this.origin[1], 0 - this.origin[2]]);
      uv = uv.concat([0,0, 1,0, 1,1]);
  
      vertices = vertices.concat([0 - this.origin[0], 0 - this.origin[1], 0 - this.origin[2],
                                  0 - this.origin[0], 1 - this.origin[1], 0 - this.origin[2],
                                  1 - this.origin[0], 1 - this.origin[1], 0 - this.origin[2]]);
      uv = uv.concat([0,0, 0,1, 1,1]);
  
      // Define the cube's front
      vertices = vertices.concat([1 - this.origin[0], 0 - this.origin[1], 1 - this.origin[2], 
                                  0 - this.origin[0], 0 - this.origin[1], 1 - this.origin[2], 
                                  0 - this.origin[0], 1 - this.origin[1], 1 - this.origin[2]]);
      uv = uv.concat([0,0, 1,0, 1,1]);
      vertices = vertices.concat([1 - this.origin[0], 0 - this.origin[1], 1 - this.origin[2], 
                                  1 - this.origin[0], 1 - this.origin[1], 1 - this.origin[2], 
                                  0 - this.origin[0], 1 - this.origin[1], 1 - this.origin[2]]);
      uv = uv.concat([0,0, 0,1, 1,1]);
      
      // Define the cube's top
      vertices = vertices.concat([0 - this.origin[0], 1 - this.origin[1], 0 - this.origin[2], 
                                  0 - this.origin[0], 1 - this.origin[1], 1 - this.origin[2], 
                                  1 - this.origin[0], 1 - this.origin[1], 1 - this.origin[2]]);
      uv = uv.concat([0,0, 0,1, 1,1]);
      vertices = vertices.concat([0 - this.origin[0], 1 - this.origin[1], 0 - this.origin[2], 
                                  1 - this.origin[0], 1 - this.origin[1], 0 - this.origin[2], 
                                  1 - this.origin[0], 1 - this.origin[1], 1 - this.origin[2]]);
      uv = uv.concat([0,0, 1,0, 1,1]);
  
      // Define the cube's bottom
      vertices = vertices.concat([0 - this.origin[0], 0 - this.origin[1], 1 - this.origin[2], 
                                  0 - this.origin[0], 0 - this.origin[1], 0 - this.origin[2], 
                                  1 - this.origin[0], 0 - this.origin[1], 0 - this.origin[2]]);
      uv = uv.concat([0,0, 0,1, 1,1]);
      vertices = vertices.concat([0 - this.origin[0], 0 - this.origin[1], 1 - this.origin[2], 
                                  1 - this.origin[0], 0 - this.origin[1], 1 - this.origin[2], 
                                  1 - this.origin[0], 0 - this.origin[1], 0 - this.origin[2]]);
      uv = uv.concat([0,0, 1,0, 1,1]);
  
      // Define the cube's sides
      vertices = vertices.concat([0 - this.origin[0], 0 - this.origin[1], 1 - this.origin[2], 
                      0 - this.origin[0], 0 - this.origin[1], 0 - this.origin[2], 
                      0 - this.origin[0], 1 - this.origin[1], 0 - this.origin[2]]);
      uv = uv.concat([0,0, 1,0, 1,1]);
      vertices = vertices.concat([0 - this.origin[0], 0 - this.origin[1], 1 - this.origin[2], 
                      0 - this.origin[0], 1 - this.origin[1], 1 - this.origin[2], 
                      0 - this.origin[0], 1 - this.origin[1], 0 - this.origin[2]]);
      uv = uv.concat([0,0, 0,1, 1,1]);
      vertices = vertices.concat([1 - this.origin[0], 0 - this.origin[1], 0 - this.origin[2], 
                      1 - this.origin[0], 0 - this.origin[1], 1 - this.origin[2], 
                      1 - this.origin[0], 1 - this.origin[1], 1 - this.origin[2]]);
      uv = uv.concat([0,0, 1,0, 1,1]);
      vertices = vertices.concat([1 - this.origin[0], 0 - this.origin[1], 0 - this.origin[2], 
                      1 - this.origin[0], 1 - this.origin[1], 0 - this.origin[2], 
                      1 - this.origin[0], 1 - this.origin[1], 1 - this.origin[2]]);
      uv = uv.concat([0,0, 0,1, 1,1]);
      
      drawTriangles(vertices, uv);
    }
  }
  
  // Render a cube
  function drawCube(matrix = new Matrix4()) {
    new Cube(COLORS.WHITE, [0.5, 0.5, 0.5], matrix).render();
  }
  
  // Render a triangle in 3D
  function drawTriangles(vertices, uv) {
    // Checks to ensure validity
    console.assert(vertices.length % 3 == 0, "vertices does not have a multiple of 3 number of elements");
  
    const NUM_VERTICES = vertices.length / 3;
    const vertData = new Float32Array(vertices);
    const uvData = new Float32Array(uv);
    console.assert(vertData.BYTES_PER_ELEMENT == uvData.BYTES_PER_ELEMENT);
    const FSIZE = uvData.BYTES_PER_ELEMENT;
  
    // Bind the buffer object to the gl ARRAY_BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, g_VertexBuffer);
    
    // Write data into the buffer object, tell the renderer what values to use, and enable the array on the variable
    gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    if(uv) {
      // More validity checks
      console.assert(uv.length % 2 == 0, "vertices does not have an even number of elements");
      console.assert(uv.length / 2 == vertices.length / 3, "vertices and uv do not describe the same number of vertices");
  
      // Bind the buffer object to the gl ARRAY_BUFFER
      gl.bindBuffer(gl.ARRAY_BUFFER, g_UVBuffer);
  
      // Write data into the buffer object, tell the renderer what values to use, and enable the array on the variable
      gl.bufferData(gl.ARRAY_BUFFER, uvData, gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_UV);
    }
  
    gl.drawArrays(gl.TRIANGLES, 0, NUM_VERTICES);
    return;
  }
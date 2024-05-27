class Sphere {
  constructor(radius = 1, latitudeBands = 30, longitudeBands = 30) {
    this.radius = radius;
    this.latitudeBands = latitudeBands;
    this.longitudeBands = longitudeBands;
    this.vertices = [];
    this.normals = [];
    this.uv = [];
    this.indices = [];
    this.initBuffers();
  }

  initBuffers() {
    for (let latNumber = 0; latNumber <= this.latitudeBands; latNumber++) {
      const theta = latNumber * Math.PI / this.latitudeBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let longNumber = 0; longNumber <= this.longitudeBands; longNumber++) {
        const phi = longNumber * 2 * Math.PI / this.longitudeBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;
        const u = 1 - (longNumber / this.longitudeBands);
        const v = 1 - (latNumber / this.latitudeBands);

        this.normals.push(x, y, z);
        this.uv.push(u, v);
        this.vertices.push(this.radius * x, this.radius * y, this.radius * z);
      }
    }

    for (let latNumber = 0; latNumber < this.latitudeBands; latNumber++) {
      for (let longNumber = 0; longNumber < this.longitudeBands; longNumber++) {
        const first = (latNumber * (this.longitudeBands + 1)) + longNumber;
        const second = first + this.longitudeBands + 1;
        this.indices.push(first, second, first + 1, second, second + 1, first + 1);
      }
    }
  }

  render() {
    if (!this.vertexBuffer) this.setupBuffers();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  setupBuffers() {
    this.vertexBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uv), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
  }
}

// Create and render a sphere
function drawSphere(matrix = new Matrix4()) {
    matrix.translate(0, 3, 0);  // Move the sphere up by 2 units (adjust the value as needed)
  const sphere = new Sphere();
  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  sphere.render();
}

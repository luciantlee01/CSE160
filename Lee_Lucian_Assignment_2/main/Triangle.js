class Triangle{
    constructor(vertices, color, size = 5.0){
        this.vertices = vertices;
        this.color = color;
        this.size = size;
    }

    render(gl, a_Position, u_FragColor) {
        var d = this.size / 50.0;
        var scaledVertices = [
            this.vertices[0], this.vertices[1], 
            this.vertices[0] + d, this.vertices[1], 
            this.vertices[0], this.vertices[1] + d
        ];

        gl.uniform4fv(u_FragColor, this.color);

        // Create a buffer object
        var vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.error('Failed to create the buffer object');
            return;
        }

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // Write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scaledVertices), gl.STATIC_DRAW);

        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        // Draw the triangle
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}

function drawTriangle3D(vertices) {
    var n = 3;

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.error('Failed to create the buffer object');
        return;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    // Draw the triangle
    gl.drawArrays(gl.TRIANGLES, 0, n);
}
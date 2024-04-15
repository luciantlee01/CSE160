class Circle {
    constructor(x, y, color, radius, segments) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = radius;
        this.segments = segments;
    }

    render(gl, a_Position, u_FragColor) {
        var xy = [this.x, this.y];
        var rgba = this.color;
        var radius = this.radius/3;

        gl.uniform4fv(u_FragColor, rgba);

        let angleStep = 360 / this.segments;

        for (let angle = 0; angle < 360; angle += angleStep) {
            let centerPt = xy;
            let angle1 = angle * Math.PI / 180;
            let angle2 = (angle + angleStep) * Math.PI / 180;
            let vec1 = [Math.cos(angle1) * radius, Math.sin(angle1) * radius];
            let vec2 = [Math.cos(angle2) * radius, Math.sin(angle2) * radius];
            let pt1 = [centerPt[0] + vec1[0], centerPt[1] + vec1[1]];
            let pt2 = [centerPt[0] + vec2[0], centerPt[1] + vec2[1]];

            drawTriangle(gl, a_Position, [centerPt[0], centerPt[1], pt1[0], pt1[1], pt2[0], pt2[1]]);
        }
    }
}

function drawTriangle(gl, a_Position, vertices) {
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
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    // Draw the triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

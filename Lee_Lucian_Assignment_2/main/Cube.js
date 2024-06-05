class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0,1.0,1.0,1.0];
        this.matrix = new Matrix4();
    }

    render() {
        var rgba = this.color;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3])
        // Front of cube
        //drawTriangle3D( [0.0,0.0,0.0, 1.0,1.0,1.0, 1.0,0.0,0.0]);
        //drawTriangle3D( [0.0,0.0,0.0, 0.0,1.0,0.0, 1.0,1.0,0.0]);
        drawTriangle3D( [0,0,0, 1,1,0, 1,0,0]);
        drawTriangle3D( [0,0,0, 0,1,0, 1,1,0]);

        // Other sides of the cube top, bottom, left, right, back
        // Top of cube
        gl.uniform4f(u_FragColor, rgba[0]*.8, rgba[1]*.8, rgba[2]*.8, rgba[3])
        drawTriangle3D( [0,1,0, 0,1,1, 1,1,1]);
        drawTriangle3D( [0,1,0, 1,1,1, 1,1,0]);

        // Right of cube
        gl.uniform4f(u_FragColor, rgba[0]*.7, rgba[1]*.7, rgba[2]*.7, rgba[3])
        drawTriangle3D( [1,0,0, 1,0,1, 1,1,1]);
        drawTriangle3D( [1,0,0, 1,1,0, 1,1,1]);

        //Left of cube
        gl.uniform4f(u_FragColor, rgba[0]*.6, rgba[1]*.6, rgba[2]*.6, rgba[3])
        drawTriangle3D( [0,0,0, 0,1,0, 0,1,1]);
        drawTriangle3D( [0,0,0, 0,1,1, 0,0,1]);

        //Bottom of cube
        gl.uniform4f(u_FragColor, rgba[0]*.5, rgba[1]*.5, rgba[2]*.5, rgba[3])
        drawTriangle3D( [0,0,0, 1,0,0, 1,0,1]);
        drawTriangle3D( [0,0,0, 1,0,1, 0,0,1]);

        //Back of cube
        gl.uniform4f(u_FragColor, rgba[0]*.4, rgba[1]*.4, rgba[2]*.4, rgba[3])
        drawTriangle3D( [0,0,1, 1,0,1, 1,1,1]);
        drawTriangle3D( [0,0,1, 0,1,1, 1,1,1]);
        
    }
}



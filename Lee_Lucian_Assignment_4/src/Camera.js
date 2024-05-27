class Camera {
    constructor() {
        this.fov = 60;
        this.eye = new Vector3([8,5,8]);
        this.at = new Vector3([5,5,5]);
        this.up = new Vector3([0,1,0]);
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }

    updateProjectionMatrix() {
        const aspect = canvas.width / canvas.height;
        this.projectionMatrix.setPerspective(this.fov, aspect, 0.1, 1000);
    }

    setFOV(newFOV) {
      this.fov = newFOV;
      this.updateProjectionMatrix();
    }

    moveForward(speed) {
        let f = new Vector3(this.at.elements);
        f.sub(this.eye);
        f.normalize();
        f.mul(speed);
        this.eye.add(f);
        this.at.add(f);
        this.updateViewMatrix();
    }

    moveBackward(speed) {
        let b = new Vector3(this.eye.elements);
        b.sub(this.at);
        b.normalize();
        b.mul(speed);
        this.eye.add(b);
        this.at.add(b);
        this.updateViewMatrix();
    }

    moveLeft(speed) {
        let f = new Vector3(this.at.elements);
        f.sub(this.eye);
        let s = Vector3.cross(this.up, f);
        s.normalize();
        s.mul(speed);
        this.eye.add(s);
        this.at.add(s);
        this.updateViewMatrix();
    }

    moveRight(speed) {
        let f = new Vector3(this.at.elements);
        f.sub(this.eye);
        let s = Vector3.cross(f, this.up);
        s.normalize();
        s.mul(speed);
        this.eye.add(s);
        this.at.add(s);
        this.updateViewMatrix();
    }

    moveUp(speed) {
      let upVector = new Vector3(this.up.elements);
      upVector.normalize();
      upVector.mul(speed);
      this.eye.add(upVector);
      this.at.add(upVector);
      this.updateViewMatrix();
    }
    
    moveDown(speed) {
        let downVector = new Vector3(this.up.elements);
        downVector.normalize();
        downVector.mul(-speed);
        this.eye.add(downVector);
        this.at.add(downVector);
        this.updateViewMatrix();
    }  

    panLeft(alpha) {
        this.rotateAroundUp(alpha);
    }

    panRight(alpha) {
        this.rotateAroundUp(-alpha);
    }

    panUp(alpha) {
      let forward = new Vector3();
      forward.set(this.at).sub(this.eye).normalize();

      let right = new Vector3();
      right.set(Vector3.cross(forward, this.up)).normalize();

      let up = new Vector3();
      up.set(Vector3.cross(right, forward)).normalize();

      let rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(alpha, right.elements[0], right.elements[1], right.elements[2]);

      forward = rotationMatrix.multiplyVector3(forward);
      let newAt = new Vector3();
      newAt.set(this.eye).add(forward);

      this.at = newAt;
      this.updateViewMatrix();
    }

    panDown(alpha) {
        this.panUp(-alpha);  // Utilizing panUp with a negative angle for downward panning
    }

    rotateAroundUp(alpha) {
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let forward = new Vector3(this.at.elements);
        forward.sub(this.eye);
        forward = rotationMatrix.multiplyVector3(forward);
        this.at = new Vector3(this.eye.elements);
        this.at.add(forward);
        this.updateViewMatrix();
    }
}

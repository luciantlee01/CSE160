function main() {
    // Initial draw
    handleDrawEvent();
}

function drawVector(ctx, v, color, scale = 20) {
    ctx.beginPath();
    ctx.moveTo(200, 200); // Canvas center
    ctx.lineTo(200 + v.elements[0] * scale, 200 - v.elements[1] * scale);
    ctx.strokeStyle = color;
    ctx.stroke();
}

function handleDrawEvent() {
    const canvas = document.getElementById('example');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    const v1 = new Vector3([parseFloat(document.getElementById('v1x').value), parseFloat(document.getElementById('v1y').value), 0]);
    const v2 = new Vector3([parseFloat(document.getElementById('v2x').value), parseFloat(document.getElementById('v2y').value), 0]);

    drawVector(ctx, v1, 'red');
    drawVector(ctx, v2, 'blue');
}

function angleBetween(v1, v2) {
    let dot = Vector3.dot(v1, v2);
    let magV1 = v1.magnitude();
    let magV2 = v2.magnitude();
    let cosAngle = dot / (magV1 * magV2);
    return Math.acos(cosAngle) * (180 / Math.PI); // Convert to degrees
}

function areaTriangle(v1, v2) {
    let crossV = Vector3.cross(v1, v2);
    return 0.5 * crossV.magnitude();
}

function handleDrawOperationEvent() {
    handleDrawEvent(); // Redraw initial vectors

    const canvas = document.getElementById('example');
    const ctx = canvas.getContext('2d');
    const operation = document.getElementById('operation').value;
    const scalar = parseFloat(document.getElementById('scalar').value);

    const v1 = new Vector3([parseFloat(document.getElementById('v1x').value), parseFloat(document.getElementById('v1y').value), 0]);
    const v2 = new Vector3([parseFloat(document.getElementById('v2x').value), parseFloat(document.getElementById('v2y').value), 0]);

    let resultVector;

    switch(operation) {
        case 'add':
            resultVector = v1.add(v2);
            drawVector(ctx, resultVector, 'green');
            break;
        case 'sub':
            resultVector = v1.sub(v2);
            drawVector(ctx, resultVector, 'green');
            break;
        case 'mul':
            resultVector = v1.mul(scalar);
            drawVector(ctx, resultVector, 'green');
            resultVector = v2.mul(scalar);
            drawVector(ctx, resultVector, 'green', 20 / scalar); // Adjust scale back for display
            break;
        case 'div':
            resultVector = v1.div(scalar);
            drawVector(ctx, resultVector, 'green');
            resultVector = v2.div(scalar);
            drawVector(ctx, resultVector, 'green', scalar * 20); // Adjust scale for display
            break;
        case 'mag':
            console.log('Magnitude of V1:', v1.magnitude());
            console.log('Magnitude of V2:', v2.magnitude());
            break;
        case 'norm':
            resultVector = v1.normalize();
            drawVector(ctx, resultVector, 'green');
            resultVector = v2.normalize();
            drawVector(ctx, resultVector, 'green');
            break;
        case 'angle':
            const angle = angleBetween(v1, v2);
            console.log('Angle between V1 and V2:', angle);
            break;
        case 'area':
            const area = areaTriangle(v1, v2);
            console.log('Area of triangle formed by V1 and V2:', area);
            break;
    }
}


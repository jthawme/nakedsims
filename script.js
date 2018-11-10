'use strict';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const WIDTH = 640;
const HEIGHT = 480;
const TILE_WIDTH = WIDTH / 20;
const TILE_HEIGHT = TILE_WIDTH;

canvas.width = WIDTH;
canvas.height = HEIGHT;
video.width = WIDTH;
video.height = HEIGHT;
video.style.width = `${WIDTH}px`;
video.style.height = `${HEIGHT}px`;

let model;
let pose;

posenet.load(0.5)
    .then(net => {
        model = net;
        modelLoop();
    });

function drawTiles([x1, y1], [x2, y2], imgData) {
    let wid = x2 - x1;
    let hei = y2 - y1;
    
    let xAmt = Math.round(wid / TILE_WIDTH);
    let yAmt = Math.round(hei / TILE_HEIGHT);

    ctx.save();
    ctx.translate(x1, y1);
    // ctx.fillRect(0, 0, wid, hei);
    for (let x = 0; x < xAmt; x++) {
        for (let y = 0; y < yAmt; y++) {
            const pxl = ((x * TILE_WIDTH) + (y * TILE_HEIGHT) * imgData.width) * 4;
            
            ctx.save();
            ctx.translate(x * TILE_WIDTH, y * TILE_HEIGHT);

            drawIndividual(TILE_WIDTH, TILE_HEIGHT, imgData.data.slice(pxl, pxl + 4));
            // drawIndividual(TILE_WIDTH, TILE_HEIGHT, [255, 255, 0]);

            ctx.restore();
        }
    }
    ctx.restore();
}

function rgbLuminance(r, g, b) {
    return (0.299 * (r / 255) + 0.587 * (g / 255) + 0.114 * (b / 255));
}

function drawIndividual(width, height, [r,g,b,a]) {
    ctx.fillStyle = `rgba(${r},${g},${b}, 1)`
    ctx.fillRect(0, 0, width, height);
}

function loop() {
    requestAnimationFrame(loop);

    ctx.drawImage(video, 0, 0);
    // ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // drawTiles(imgData, topLeft, bottomRight);

    if (pose) {
        annotatePose(pose);
    }
}

function angle(cx, cy, ex, ey) {
    var dy = ey - cy;
    var dx = ex - cx;
    var theta = Math.atan2(dy, dx); // range (-PI, PI]
    // theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
    //if (theta < 0) theta = 360 + theta; // range [0, 360)
    return theta;
}

function annotatePose(pose) {
    // console.log(pose);
    let leftEye = pose.keypoints[KEYPOINTS.LEFT_EYE];
    let rightEye = pose.keypoints[KEYPOINTS.RIGHT_EYE];
    let {x: x1, y: y1} = leftEye.position;
    let {x: x2, y: y2} = rightEye.position;

    // let topLeft = [
    //     Math.min(leftEye.position.x, rightEye.position.x) - (TILE_WIDTH * 1.5), 
    //     Math.min(leftEye.position.y, rightEye.position.y) - (TILE_HEIGHT * 1.5)
    // ];
    // let bottomRight = [
    //     Math.max(leftEye.position.x, rightEye.position.x) + (TILE_WIDTH * 1.5), 
    //     Math.max(leftEye.position.y, rightEye.position.y) + (TILE_HEIGHT * 1.5)
    // ];

    // const imgData = ctx.getImageData(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
    // drawTiles(topLeft, bottomRight, imgData);

    let ang = angle(rightEye.position.x, rightEye.position.y, leftEye.position.x, leftEye.position.y);
    // console.log(ang);

    let size = 30;
    ctx.save();
    ctx.translate(
        (x2 + ((x1 - x2) / 2)) - (size / 2),
        (y2 + ((y1 - y2) / 2)) - (size / 2)
    );
    ctx.rotate(ang);
    // ctx.translate(size / 2, size /2);
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
}

function modelLoop() {
    model.estimateSinglePose(video)
        .then(_pose => {
            pose = _pose;
            requestAnimationFrame(modelLoop);
        });
}

navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
        facingMode: 'environment'
    }
})
    .then(stream => {
        video.srcObject = stream;
        loop();
    });
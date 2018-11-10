'use strict';

console.log(posenet);

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const WIDTH = 640;
const HEIGHT = 480;
const HORIZ_AMT = 32;

canvas.width = WIDTH;
canvas.height = HEIGHT;

function drawTiles(imgData) {
    let tileWidth = WIDTH / HORIZ_AMT;
    let tileHeight = tileWidth;
    
    let xAmt = HORIZ_AMT;
    let yAmt = Math.ceil(HEIGHT / tileHeight);
    let fullRow = WIDTH * 4;
    let r, g, b;

    for (let x = 0; x < xAmt; x++) {
        for (let y = 0; y < yAmt; y++) {
            const pxl = ((x * tileWidth) + (y * tileHeight) * imgData.width) * 4;
            
            ctx.save();
            ctx.translate(x * tileWidth, y * tileHeight);

            drawIndividual(tileWidth, tileHeight, imgData.data.slice(pxl, pxl + 4));

            ctx.restore();
        }
    }
}

function rgbLuminance(r, g, b) {
    return (0.299 * (r / 255) + 0.587 * (g / 255) + 0.114 * (b / 255));
}

function drawIndividual(width, height, [r,g,b,a]) {
    let luminance = rgbLuminance(r, g, b);

    ctx.fillStyle = `rgba(${r},${g},${b}, 1)`
    if (luminance <= 0.5) {
        ctx.fillRect(0, 0, width, height);
    } else {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function loop() {
    requestAnimationFrame(loop);

    ctx.drawImage(video, 0, 0);
    const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawTiles(imgData);
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
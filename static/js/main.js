'use strict';

import { KEYPOINTS, WIDTH, HEIGHT, TILE_WIDTH, TILE_HEIGHT, MAGIC_FOREHEAD } from './constants.js';
import { calculateAngle, calculateDistance, roundTo } from './utils.js';
import Updater from './updater.js';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let streaming = false;

let WID, HEI;

const UPDATERS = [
  new Updater(),
  new Updater(),
  new Updater(),
  new Updater(),
  new Updater(),
  new Updater()
];

const UKEYS = {
  LEFT_EYE_X: 0,
  LEFT_EYE_Y: 1,
  RIGHT_EYE_X: 2,
  RIGHT_EYE_Y: 3,
  NOSE_X: 4,
  NOSE_Y: 5
};

function setDimensions(width, height) {
  WID = width;
  HEI = height;
  canvas.width = width;
  canvas.height = height;
  video.width = width;
  video.height = height;
  video.style.width = `${width}px`;
  video.style.height = `${height}px`;

  let wWid = window.innerWidth;
  let wHei = window.innerHeight;

  if (wWid / width < 1) {
    canvas.style.transform = `scale(${wWid / width})`;
  } else {
    canvas.style.transform = `scale(1)`;
  }
}

setDimensions(WIDTH, HEIGHT);

if(document.readyState === "complete") {
  loadModel();
}
else {
  window.addEventListener("DOMContentLoaded", function () {
    loadModel();
  }, false);
}

let model;

function loadModel() {
  posenet.load(0.5)
    .then(net => {
      model = net;
      modelLoop();
    });
}

function drawMosaic([x1, y1], [x2, y2], imgData) {
    let wid = x2 - x1;
    let hei = y2 - y1;

    let xAmt = Math.round(wid / TILE_WIDTH);
    let yAmt = Math.round(hei / TILE_HEIGHT);

    ctx.save();
    ctx.translate(x1, y1);
    for (let x = 0; x < xAmt; x++) {
        for (let y = 0; y < yAmt; y++) {
            const pxl = (((x * TILE_WIDTH) + (TILE_WIDTH * 0.5)) + ((y * TILE_HEIGHT) + (TILE_HEIGHT * 0.5)) * imgData.width) * 4;

            ctx.save();
            ctx.translate(x * TILE_WIDTH, y * TILE_HEIGHT);

            drawIndividual(TILE_WIDTH, TILE_HEIGHT, imgData.data.slice(pxl, pxl + 4));

            ctx.restore();
        }
    }
    ctx.restore();
}

function drawIndividual(width, height, [r,g,b,a]) {
    ctx.fillStyle = `rgba(${r},${g},${b}, 1)`
    ctx.fillRect(0, 0, width, height);
}

let frame = 0;
function loop() {
  frame++;
  for (let i = 0; i < UPDATERS.length; i++) {
    UPDATERS[i].update();
  }

  ctx.drawImage(video, 0, 0);

  if (pose) {
    drawPose(pose);
  }


  requestAnimationFrame(loop);
}

function drawPose(pose) {
  drawHead();
  drawBody();
}

/**
 * Draw the plumbob over the head
 */
function drawHead() {
  let leftEye = pose.keypoints[KEYPOINTS.LEFT_EYE];
  let rightEye = pose.keypoints[KEYPOINTS.RIGHT_EYE];
  let nose = pose.keypoints[KEYPOINTS.NOSE];

  // Get the tweened values needed, so it
  // doesn't jump around
  let x1 = UPDATERS[UKEYS.RIGHT_EYE_X].value;
  let y1 = UPDATERS[UKEYS.RIGHT_EYE_Y].value;
  let x2 = UPDATERS[UKEYS.LEFT_EYE_X].value;
  let y2 = UPDATERS[UKEYS.LEFT_EYE_Y].value;
  let noseX = UPDATERS[UKEYS.NOSE_X].value;
  let noseY = UPDATERS[UKEYS.NOSE_Y].value;

  const headAngle = calculateAngle(x1, y1, x2, y2);

  // get the distance between the eyes to inform the
  // size of the plumbob
  const distance = calculateDistance(x1, y1, x2, y2);

  // Get a loose distance between the eyes and the nose
  const noseToEyes = calculateDistance(
    noseX, noseY,
    x2 + (x2 - x1), y2 + (y2 - y1)
  );

  ctx.save();
  ctx.translate(
      (x1 + ((x2 - x1) / 2)),
      (y1 + ((y2 - y1) / 2))
  );
  ctx.rotate(headAngle);

  // Add a little modification for the
  // plumbob to slightly move up and down
  let bobbing = Math.sin(frame / 10);

  if (plumbob && leftEye.score > 0.4 && rightEye.score > 0.4) {
    let newHei = (distance / plumbob.width) * plumbob.height;
    ctx.drawImage(
      plumbob,
      0 - (distance / 2),
      0 - (newHei + (noseToEyes * MAGIC_FOREHEAD)) + (bobbing * 5),
      distance,
      newHei
    );
  }

  ctx.restore();
}


/**
 * The function that draws the mosaic-ed body
 */
function drawBody() {
  // The bounding box ideally goes from shoulders to hips
  let leftShoulder = pose.keypoints[KEYPOINTS.LEFT_SHOULDER];
  let rightShoulder = pose.keypoints[KEYPOINTS.RIGHT_SHOULDER];
  let leftHip = pose.keypoints[KEYPOINTS.LEFT_HIP];
  let rightHip = pose.keypoints[KEYPOINTS.RIGHT_HIP];

  let {x: lsx, y: lsy} = leftShoulder.position;
  let {x: rsx, y: rsy} = rightShoulder.position;
  let {x: lhx, y: lhy} = leftHip.position;
  let {x: rhx, y: rhy} = rightHip.position;


  // If the hips are visible use them, if not
  // just extend the box to the bottom of the image
  let topLeft;
  let bottomRight;
  if (leftHip.score > 0.3 && rightHip.score > 0.3) {
    topLeft = [
      Math.min(rsx, rhx) - (TILE_WIDTH * 1),
      Math.min(lsy, rsy) - (TILE_HEIGHT * 0.5)
    ];
    bottomRight = [
        Math.max(lhx, lsx) + (TILE_WIDTH * 1),
        Math.max(lhy, rhy) + (TILE_HEIGHT * 4)
    ];
  } else {
    topLeft = [
      rsx - (TILE_WIDTH * 1),
      Math.min(lsy, rsy) - (TILE_HEIGHT * 0.5)
    ];
    bottomRight = [
      lsx + (TILE_WIDTH * 1),
      HEI
    ];
  }

  try {
    const imgData = ctx.getImageData(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
    drawMosaic(topLeft, bottomRight, imgData);
  } catch (e) {
    //sorry
  }
}

/**
 * The recursive loop to check whether
 * pose net can detect a new pose from the
 * webcam feed
 */
function modelLoop() {
  if (streaming) {
    model.estimateSinglePose(video)
      .then(_pose => {
        // Store as a globally available variable
        pose = _pose;
        requestAnimationFrame(modelLoop);

        // Update the values for the desired keypoints
        let it = ['LEFT_EYE', 'RIGHT_EYE', 'NOSE'];
        it.forEach(i => {
          UPDATERS[UKEYS[`${i}_X`]].setValue(_pose.keypoints[KEYPOINTS[i]].position.x, 10);
          UPDATERS[UKEYS[`${i}_Y`]].setValue(_pose.keypoints[KEYPOINTS[i]].position.y, 10);
        });
      });
  } else {
    setTimeout(modelLoop, 150);
  }
}
let pose;

/**
 * Just a little helper to load an
 * image for the canvas
 * @param {String} src
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.src = src;
  });
}

// Grab the plumbob image
let plumbob;
loadImage('/static/images/plumbob.png')
  .then(img => {
    plumbob = img;
  });

video.addEventListener('canplay', (e) => {
  if (!streaming) {
    streaming = true;
    setDimensions(video.videoWidth, video.videoHeight);
  }
});

/**
 * Get the webcam stream
 */
function requestWebcam() {
  navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'facing'
      }
  })
    .then(stream => {
      video.srcObject = stream;
      loop();
    });
}
requestWebcam();

const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');
const canvasCtx = canvasElement.getContext('2d');
const statusElement = document.getElementById('status');

// Setup MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

// Setup camera
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();

// Variables for mouse control
let lastX = null;
let lastY = null;
let isClicking = false;

// Map normalized coordinates to screen coordinates
function normalizedToScreen(x, y) {
  return {
    x: window.innerWidth * x,
    y: window.innerHeight * y
  };
}

// Simple gesture detection: index finger tip position controls mouse
// Pinch gesture (thumb tip close to index tip) triggers click

function distance(a, b) {
  return Math.sqrt(
    (a.x - b.x) * (a.x - b.x) +
    (a.y - b.y) * (a.y - b.y)
  );
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    // Draw landmarks
    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
      {color: '#00FF00', lineWidth: 2});
    drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1});

    // Get index finger tip and thumb tip
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];

    // Map index tip to screen coordinates
    // Invert x coordinate because video is mirrored
    const screenPos = normalizedToScreen(1 - indexTip.x, indexTip.y);

    // Move mouse pointer (simulate)
    moveMouse(screenPos.x, screenPos.y);

    // Detect pinch for click
    const pinchDistance = distance(indexTip, thumbTip);
    if (pinchDistance < 0.05) {
      if (!isClicking) {
        isClicking = true;
        simulateClick();
        statusElement.textContent = 'Click detected';
      }
    } else {
      isClicking = false;
      statusElement.textContent = 'Move mouse with index finger';
    }
  } else {
    statusElement.textContent = 'Show your hand to control mouse';
  }
  canvasCtx.restore();
}

// Simulate mouse move by moving a custom cursor element
// Since we cannot move the real OS mouse pointer from browser for security reasons,
// we will create a custom cursor div that follows the detected finger

let cursor = document.getElementById('customCursor');
if (!cursor) {
  cursor = document.createElement('div');
  cursor.id = 'customCursor';
  cursor.style.position = 'fixed';
  cursor.style.width = '20px';
  cursor.style.height = '20px';
  cursor.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
  cursor.style.borderRadius = '50%';
  cursor.style.pointerEvents = 'none';
  cursor.style.zIndex = '10000';
  document.body.appendChild(cursor);
}

function moveMouse(x, y) {
  cursor.style.left = `${x - 10}px`;
  cursor.style.top = `${y - 10}px`;
}

// Simulate click by briefly changing cursor color
function simulateClick() {
  cursor.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';
  setTimeout(() => {
    cursor.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
  }, 200);
}
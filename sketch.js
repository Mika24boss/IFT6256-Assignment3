const MARGIN = 5;

function setup() {
  let canvasWidth = windowWidth - 2 * MARGIN;
  let canvasHeight = windowHeight - 2 * MARGIN;
  createCanvas(canvasWidth, canvasHeight);
}

function windowResized() {
  let canvasWidth = windowWidth - 2 * MARGIN;
  let canvasHeight = windowHeight - 2 * MARGIN;
  resizeCanvas(canvasWidth, canvasHeight);
}

function draw() {
  noLoop();
  background(200);
}

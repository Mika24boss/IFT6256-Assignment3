const MARGIN = 5;
const FRAMERATE = 60;
const BIRTH_MULTIPLIER = 60 / FRAMERATE;
let year = 1900;
let yearSpeed = 0.05;
let birthsPerSecondData;
let countryLongitudesData;
let birthsByYear = {};
let longitudesByCountry = {};

let drops = [];
const SPLASH_VELOCITY_MULT_MIN = 0.08;
const SPLASH_VELOCITY_MULT_MAX = 0.1;
const SPLASH_DROP_AMOUNT = 5;
const SPLASH_WIDTH_MULT = 0.5;

let surfaces = [];
let grass;

function preload() {
  birthsPerSecondData = loadTable("data/births_per_second.csv", "csv", "header");
  countryLongitudesData = loadTable("data/country_longitudes.csv", "csv", "header");
  grass = loadImage("/assets/2d_grass_side_view.png");
}

function setup() {
  colorMode(HSB);
  let canvasWidth = windowWidth - 2 * MARGIN;
  let canvasHeight = windowHeight - 2 * MARGIN;
  createCanvas(canvasWidth, canvasHeight);

  indexBirthsByYear();
  indexLongitudesByCountry();

  frameRate(FRAMERATE);

  createSurfaces();
}

function windowResized() {
  let canvasWidth = windowWidth - 2 * MARGIN;
  let canvasHeight = windowHeight - 2 * MARGIN;
  resizeCanvas(canvasWidth, canvasHeight);
}

function draw() {
  background(246, 100, 20);

  // Display year
  push();
  textSize(60);
  fill(255);
  stroke(0);
  text(year, 50, 80);
  pop();

  let birthAmounts = birthsByYear[year];

  for (let index = 0; index < birthAmounts.length; index++) {
    let countryBirthData = birthAmounts[index];
    let countryCode = countryBirthData.getString("code");
    let births = countryBirthData.getNum("births_per_second");
    let adjustedBirths = births * BIRTH_MULTIPLIER;

    if (random() < adjustedBirths) {
      spawnDrop(countryCode, drops);
    }
  }

  drops = updateDrops(drops);

  if (year < 2023 && frameCount * yearSpeed > 1) {
    year++;
    frameCount = 0;
  }

  drawEnvironment(surfaces);
}

function indexBirthsByYear() {
  for (let index = 0; index < birthsPerSecondData.getRowCount(); index++) {
    let row = birthsPerSecondData.getRow(index);
    let year = row.getNum("year");

    if (!birthsByYear[year]) {
      birthsByYear[year] = [];
    }

    birthsByYear[year].push(row);
  }

  // let data = birthsByYear[2023];
  // for (let row of data) {
  //   let country = row.getString("entity");
  //   let births = row.getNum("births_per_second");
  //   console.log(country, births);
  // }
}

function indexLongitudesByCountry() {
  for (let index = 0; index < countryLongitudesData.getRowCount(); index++) {
    let row = countryLongitudesData.getRow(index);
    let code = row.getString("code");

    if (!longitudesByCountry[code]) {
      longitudesByCountry[code] = [];
    }

    longitudesByCountry[code].push(row);
  }

  // let data = longitudesByCountry["CAN"][0];
  // let country = data.getString("entity");
  // let minLongitude = data.getNum("min_long");
  // let maxLongitude = data.getNum("max_long");
  // console.log(country, minLongitude, maxLongitude);
}

function keyPressed() {
  switch (keyCode) {
    case 32: // Space key
      if (isLooping()) {
        noLoop();
      } else {
        loop();
      }
      break;
    case 37: // Left arrow key
      year -= 20;
      year = max(year, 1900);
      break;
    case 39: // Right arrow key
      year += 20;
      year = min(year, 2023);
      break;
  }
}

function spawnDrop(countryCode, drops) {
  let longitudeData = longitudesByCountry[countryCode][0];
  let minLongitude = longitudeData.getNum("min_long");
  let maxLongitude = longitudeData.getNum("max_long");
  let longitude = random(minLongitude, maxLongitude);
  let x = map(longitude, -180, 180, 0, width);
  drops.push(new Drop(x, 0, 0, Drop.MAX_VELOCITY, Drop.INITIAL_WIDTH));
}

function updateDrops(drops) {
  let newDrops = drops.slice();

  for (let drop of drops) {
    drop.update(surfaces);
    drop.draw();

    if (drop.state === DropState.HitSurface) {
      handleSplash(drop, newDrops);
    } else if (drop.state === DropState.ShouldRemove) {
      newDrops.splice(newDrops.indexOf(drop), 1);
    }
  }
  return newDrops;
}

function handleSplash(drop, newDrops) {
  drop.state = DropState.Disappearing;

  if (drop.width <= 1) return; // Don't create new drops if the drop is already small

  // if (!drop.collisionSurface) return; // not sure about this yet

  // Create new drops for a splash effect

  let isSurfaceHit = drop.collisionSurface != null;
  let centerAngle = -HALF_PI;
  let normalAngle = -HALF_PI;
  let spawnPosition = drop.position;

  // Center splash on reflection over the surface normal, or -PI/2 if hitting the ground
  if (isSurfaceHit) {
    let normal = drop.collisionSurface.getNormalVector();
    let reflection = p5.Vector.reflect(drop.velocity, normal);
    centerAngle = reflection.heading();
    normalAngle = drop.collisionSurface.getNormalVector().heading();
  }

  for (let i = 0; i < SPLASH_DROP_AMOUNT; i++) {
    let angle;
    if (isSurfaceHit) {
      angle = randomGaussian(centerAngle, 0.2);
    } else {
      angle =
        random() < 0.5 ? randomGaussian(centerAngle - 0.3 * PI, 0.4) : randomGaussian(centerAngle + 0.3 * PI, 0.4);
    }
    angle = constrain(angle, normalAngle - HALF_PI, normalAngle + HALF_PI);

    let newVelocityMag = drop.velocity.mag() * random(SPLASH_VELOCITY_MULT_MIN, SPLASH_VELOCITY_MULT_MAX);
    let velocityX = cos(angle) * newVelocityMag;
    let velocityY = sin(angle) * newVelocityMag;
    newDrops.push(new Drop(spawnPosition.x, spawnPosition.y, velocityX, velocityY, drop.width * SPLASH_WIDTH_MULT));
  }
}

function createSurfaces() {
  surfaces.push(new Surface(width / 2, height * 0.4, (2 / 3) * width, height * 0.7));
  surfaces.push(new Surface((1 / 3) * width, height * 0.7, width / 2, height * 0.4));
}

function drawEnvironment(surfaces) {
  for (let surface of surfaces) {
    surface.draw();
  }

  let grassWidth = 1024;
  let grassHeight = 256;
  let grassScale = 0.3;
  for (let left = 0; left < width; left += grassWidth * grassScale) {
    image(grass, left, height - grassHeight * grassScale, grassWidth * grassScale, grassHeight * grassScale);
  }
}

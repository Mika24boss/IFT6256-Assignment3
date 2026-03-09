const MARGIN = 5;
const FRAMERATE = 60;
const BIRTH_MULTIPLIER = 1; // Multiplies the number of drops spawned
const YEAR_DELAY = FRAMERATE / 4; // Number of frames to wait before increasing the year
let year = 1900;
let yearCounter = 0;
let birthsPerSecondData;
let countryLongitudesData;
let birthsByYear = {};
let longitudesByCountry = {};
let paused = false;

let drops = [];
const SPLASH_VELOCITY_MULT_MIN = 0.1;
const SPLASH_VELOCITY_MULT_MAX = 0.15;
const SPLASH_DROP_AMOUNT = 3;
const SPLASH_WIDTH_MULT = 0.5;
let gravity = 0.4;
let dropWidth = 4;

let colliders = [];
let grass;
let house;
let grassScale = 0.1;
let houseScale;

function preload() {
  birthsPerSecondData = loadTable("data/births_per_second.csv", "csv", "header");
  countryLongitudesData = loadTable("data/country_longitudes.csv", "csv", "header");
  grass = loadImage("/assets/2d_grass_side_view.png");
  house = loadImage("/assets/minecraft_house.png");
}

function setup() {
  colorMode(HSB);
  let canvasWidth = windowWidth - 2 * MARGIN;
  let canvasHeight = windowHeight - 2 * MARGIN;
  createCanvas(canvasWidth, canvasHeight);
  adjustScales();

  indexBirthsByYear();
  indexLongitudesByCountry();

  frameRate(FRAMERATE);
}

function windowResized() {
  let canvasWidth = windowWidth - 2 * MARGIN;
  let canvasHeight = windowHeight - 2 * MARGIN;
  resizeCanvas(canvasWidth, canvasHeight);
  adjustScales();
}

function draw() {
  // Background gradient
  background(0);
  let darkblue = color(240, 100, 20);
  let marineblue = color(240, 100, 40);
  let lightblue = color(200, 100, 60);

  for (let i = 0; i < height; i++) {
    let mergeColor = lerpColor(darkblue, marineblue, i / height);
    mergeColor = lerpColor(mergeColor, lightblue, i / height);
    stroke(mergeColor);
    line(0, i, width, i);
  }

  // Display year
  push();
  textSize(60);
  fill(255);
  stroke(0);
  text(year, 50, 80);
  pop();

  // Spawn drops
  if (!paused) spawnDropsForYear();

  // Move drops and check for collisions
  drops = updateDrops(drops);

  // Increase year
  if (!paused && year < 2023 && yearCounter >= YEAR_DELAY) {
    year++;
    yearCounter = 0;
  } else if (!paused) {
    yearCounter++;
  }

  drawEnvironment();

  // Draw tooltips
  for (let drop of drops) {
    if (drop.isMouseOver()) drawTooltip(drop.countryName);
  }
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
      paused = !paused;
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

function adjustScales() {
  houseScale = (height * 0.5) / house.height;
  createColliders();
  gravity = -0.0004 * height + 0.92;
  gravity = constrain(gravity, 0.3, 0.8);
  dropWidth = 1.5/600 * height + 0.5;
  dropWidth = constrain(dropWidth, 2, 5);
}

function spawnDropsForYear() {
  let birthAmounts = birthsByYear[year];

  // Loop through the countries
  for (let countryBirthData of birthAmounts) {
    let countryCode = countryBirthData.getString("code");
    let countryName = countryBirthData.getString("entity");
    let births = countryBirthData.getNum("births_per_second");
    let adjustedBirths = (births * BIRTH_MULTIPLIER) / FRAMERATE;

    if (random() < adjustedBirths) {
      console.log("Spawning drop for", countryName, "with", births.toFixed(3), "births per second!");
      spawnDrop(countryCode, countryName, drops);
    }
  }
}

function spawnDrop(countryCode, countryName, drops) {
  let longitudeData = longitudesByCountry[countryCode][0];
  let minLongitude = longitudeData.getNum("min_long");
  let maxLongitude = longitudeData.getNum("max_long");
  let longitude = random(minLongitude, maxLongitude);
  let x = map(longitude, -180, 180, 0, width);
  drops.push(new Drop(x, 0, random(-2, 2), Drop.MAX_VELOCITY, dropWidth, countryName, gravity));
}

function updateDrops(drops) {
  let newDrops = drops.slice();

  for (let drop of drops) {
    if (!paused) drop.update(colliders);
    drop.draw();

    if (drop.state === DropState.HitCollider) {
      handleSplash(drop, newDrops);
    } else if (drop.state === DropState.ShouldRemove) {
      newDrops.splice(newDrops.indexOf(drop), 1);
    }
  }
  return newDrops;
}

function handleSplash(drop, newDrops) {
  drop.state = DropState.Disappearing;

  if (drop.width < dropWidth) return; // Don't create new drops if the drop is already small

  // Create new drops for a splash effect

  let isColliderHit = drop.colliderHit != null;
  let centerAngle = -HALF_PI;
  let normalAngle = -HALF_PI;
  let spawnPosition = drop.position;

  // Center splash on reflection over the collider normal, or -PI/2 if hitting the ground
  if (isColliderHit) {
    let normal = drop.colliderHit.getNormalVector();
    let reflection = p5.Vector.reflect(drop.velocity, normal);
    centerAngle = reflection.heading();
    normalAngle = normal.heading();
  }

  for (let i = 0; i < SPLASH_DROP_AMOUNT; i++) {
    let angle;
    if (isColliderHit) {
      angle = randomGaussian(centerAngle, 0.2);
    } else {
      // For drops on the ground, the splash is mainly to the left and right
      angle =
        random() < 0.5 ? randomGaussian(centerAngle - 0.3 * PI, 0.4) : randomGaussian(centerAngle + 0.3 * PI, 0.4);
    }
    angle = constrain(angle, normalAngle - HALF_PI, normalAngle + HALF_PI);

    let newVelocityMag = drop.velocity.mag() * random(SPLASH_VELOCITY_MULT_MIN, SPLASH_VELOCITY_MULT_MAX);
    let velocityX = cos(angle) * newVelocityMag;
    let velocityY = sin(angle) * newVelocityMag;
    newDrops.push(
      new Drop(
        spawnPosition.x,
        spawnPosition.y,
        velocityX,
        velocityY,
        drop.width * SPLASH_WIDTH_MULT,
        drop.countryName,
        gravity
      )
    );
  }
}

function drawTooltip(countryName) {
  push();
  textSize(20);
  let padding = 8;
  let offset = 10;
  let rectWidth = textWidth(countryName) + padding * 2;
  let rectHeight = 28;

  // Rectangle around text
  fill(200);
  rect(mouseX + offset, mouseY + offset, rectWidth, rectHeight, 6);

  // Tooltip text
  fill(0);
  text(countryName, mouseX + offset + padding, mouseY + offset + padding + rectHeight / 2);
  pop();
}

function createColliders() {
  let topHouse = height - house.height * houseScale - 10;
  let roofLength1D = 550 * houseScale;
  let leftRoofEdge = width / 2 - roofLength1D;
  let rightRoofEdge = width / 2 + roofLength1D;
  let bottomRoofEdge = topHouse + roofLength1D;
  colliders = [];
  colliders.push(new Collider(leftRoofEdge, bottomRoofEdge, width / 2, topHouse));
  colliders.push(new Collider(width / 2, topHouse, rightRoofEdge, bottomRoofEdge));
}

function drawEnvironment() {
  // Draw house
  let leftHouse = width / 2 - (house.width * houseScale) / 2;
  let topHouse = height - house.height * houseScale;
  image(house, leftHouse, topHouse, house.width * houseScale, house.height * houseScale);

  // Draw grass
  for (let left = 0; left < width; left += grass.width * grassScale) {
    image(grass, left, height - grass.height * grassScale, grass.width * grassScale, grass.height * grassScale);
  }
}

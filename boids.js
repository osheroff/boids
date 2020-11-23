// Size of canvas. These get updated to fill the whole browser.
let width = 150;
let height = 150;

const numBoids = 1500;
const visualRange = 50;
const maxNeighbors = 500;

var boids = [];

let gradientCanvas = () => { return document.getElementById("gradient") }
let gradientData = null;

function initBoids() {
  for (var i = 0; i < numBoids; i += 1) {
    let x;
    let y;

    if ( i < numBoids / 4 ) {
      x = Math.random() * width
      y = -Math.random() * height
    } else if ( i < (numBoids / 4) * 2 ) {
      x = width + (Math.random() * width)
      y = Math.random() * height
    } else if ( i < (numBoids / 4) * 3 ) {
      x = Math.random() * width
      y = height + (Math.random() * height)
    } else {
      x = -Math.random() * width
      y = Math.random() * height
    }
    boids[boids.length] = {
      id: boids.length,
      x: x,
      y: y,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      flapState: Math.random() * 20,
      history: [],
    };
  }
}

function distance(boid1, boid2) {
  return Math.sqrt(
    (boid1.x - boid2.x) * (boid1.x - boid2.x) +
      (boid1.y - boid2.y) * (boid1.y - boid2.y),
  );
}

// TODO: This is naive and inefficient.
function nClosestBoids(boid, n) {
  // Make a copy
  const sorted = boids.slice();
  // Sort the copy by distance from `boid`
  sorted.sort((a, b) => distance(boid, a) - distance(boid, b));
  // Return the `n` closest
  return sorted.slice(1, n + 1);
}

// Called initially and whenever the window resizes to update the canvas
// size and width/height variables.
function sizeCanvas() {
  const canvas = document.getElementById("boids");
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  const gc = gradientCanvas()
  gc.width = width
  gc.height = height
  drawGradient()
}

// Constrain a boid to within the window. If it gets too close to an edge,
// nudge it back in and reverse its direction.
function keepWithinBounds(boid) {
  const margin = 50;
  const turnFactor = 1;

  if (boid.x < margin) {
    boid.dx += turnFactor;
  }
  if (boid.x > width - margin) {
    boid.dx -= turnFactor
  }
  if (boid.y < margin) {
    boid.dy += turnFactor;
  }
  if (boid.y > height - margin) {
    boid.dy -= turnFactor;
  }
}

// Find the center of mass of the other boids and adjust velocity slightly to
// point towards the center of mass.
function flyTowardsCenter(boid) {
  const centeringFactor = 0.01; // adjust velocity by this %

  let centerX = 0;
  let centerY = 0;
  let numNeighbors = 0;

  let i = 0;
  for (let i = 0; i < boids.length && numNeighbors < maxNeighbors; i++) {
    if (distance(boid, boids[i]) < visualRange) {
      centerX += boids[i].x;
      centerY += boids[i].y;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    centerX = centerX / numNeighbors;
    centerY = centerY / numNeighbors;

    boid.dx += (centerX - boid.x) * centeringFactor;
    boid.dy += (centerY - boid.y) * centeringFactor;
  }
}

// Move away from other boids that are too close to avoid colliding
function avoidOthers(boid) {
  const minDistance = 20; // The distance to stay away from other boids
  const avoidFactor = 0.02; // Adjust velocity by this %
  let moveX = 0;
  let moveY = 0;
  let numNeighbors = 0;

  for (let i = 0; i < boids.length && numNeighbors < maxNeighbors; i++) {
    if (boids[i].id !== boid.id) {
      if (distance(boid, boids[i]) < minDistance) {
        moveX += boid.x - boids[i].x;
        moveY += boid.y - boids[i].y;
        numNeighbors++;
      }
    }
  }

  boid.dx += moveX * avoidFactor;
  boid.dy += moveY * avoidFactor;
}

// Find the average velocity (speed and direction) of the other boids and
// adjust velocity slightly to match.
function matchVelocity(boid) {
  const matchingFactor = 0.05; // Adjust by this % of average velocity

  let avgDX = 0;
  let avgDY = 0;
  let numNeighbors = 0;

  for(let i = 0; i < boids.length && numNeighbors < maxNeighbors; i++) {
    if (distance(boid, boids[i]) < visualRange) {
      avgDX += boids[i].dx;
      avgDY += boids[i].dy;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    avgDX = avgDX / numNeighbors;
    avgDY = avgDY / numNeighbors;

    boid.dx += (avgDX - boid.dx) * matchingFactor;
    boid.dy += (avgDY - boid.dy) * matchingFactor;
  }
}

// Speed will naturally vary in flocking behavior, but real animals can't go
// arbitrarily fast.
function limitSpeed(boid) {
  const speedLimit = 10;

  const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
  if (speed > speedLimit) {
    boid.dx = (boid.dx / speed) * speedLimit;
    boid.dy = (boid.dy / speed) * speedLimit;
  }
}

const DRAW_TRAIL = false;

function drawBoid(ctx, boid) {
  const angle = Math.atan2(boid.dy, boid.dx);
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.translate(-boid.x, -boid.y);
  ctx.strokeStyle = "#558cf4";

  ctx.save();
  ctx.strokeStyle="#000000";
  ctx.beginPath();

  ctx.translate(boid.x, boid.y);
  ctx.transform(0.20, 0, 0, 0.20, 0, 0);

  if ( boid.flapState < 30 ) {
    ctx.bezierCurveTo(52.7044127,30.815104,51.2294778,23.8733722,48.828125,19.3212891);
    ctx.bezierCurveTo(46.4267722,14.7692059,41.0367982,8.69759132,32.6582031,1.10644531);
    ctx.bezierCurveTo(35.010599,12.9723594,36.3517449,21.7760703,36.6816406,27.5175781);
    ctx.bezierCurveTo(37.0115364,33.2590859,36.4181119,37.4687213,34.9013672,40.1464844);
    ctx.bezierCurveTo(27.2118623,42.8493411,21.3895966,44.6410077,17.4345703,45.5214844);
    ctx.bezierCurveTo(13.479544,46.401961,7.72693982,47.1871173,0.176757812,47.8769531);
    ctx.lineTo(10.3388672,49.5078125);
    ctx.lineTo(0.176757812,53.0966797);
    ctx.bezierCurveTo(9.77701823,52.0641276,16.9580078,51.5478516,21.7197266,51.5478516);
    ctx.bezierCurveTo(26.4814453,51.5478516,30.8753255,52.0641276,34.9013672,53.0966797);
    ctx.bezierCurveTo(37.4031032,55.3535883,38.4919704,58.5267654,38.1679688,62.6162109);
    ctx.bezierCurveTo(37.8439671,66.7056565,36.0073785,72.9699794,32.6582031,81.4091797);
    ctx.bezierCurveTo(41.0203032,76.1486626,46.4102772,71.7655246,48.828125,68.2597656);
    ctx.bezierCurveTo(51.2459728,64.7540067,52.7209077,59.1833686,53.2529297,51.5478516);
    ctx.bezierCurveTo(56.545531,50.8813124,58.8853748,50.2012994,60.2724609,49.5078125);
    ctx.bezierCurveTo(61.6595471,48.8143256,63.337607,47.4855496,65.3066406,45.5214844);
    ctx.bezierCurveTo(63.3566956,43.306079,61.6786357,41.884855,60.2724609,41.2578125);
    ctx.bezierCurveTo(58.8662862,40.63077,56.5264425,40.2603273,53.2529297,40.1464844);
  } else if ( boid.flapState < 60 ) {
    ctx.moveTo(35.5,96.6367188);
    ctx.bezierCurveTo(46.1284696,90.9321201,52.3477765,85.101391,54.1579207,79.1445312);
    ctx.bezierCurveTo(55.9680648,73.1876715,57.7971781,65.0757817,59.6452605,54.8088617);
    ctx.bezierCurveTo(62.7032382,54.3892633,64.873802,53.7863093,66.156952,53);
    ctx.bezierCurveTo(67.4401021,52.2136907,69.0544514,50.4972646,71,47.8507217);
    ctx.bezierCurveTo(67.9371329,45.9080302,65.5493921,44.5818617,63.8367774,43.8722163);
    ctx.bezierCurveTo(62.1241626,43.1625708,59.5518213,42.4334611,56.1197533,41.6848872);
    ctx.bezierCurveTo(56.3417473,39.3445043,56.3417473,37.4811716,56.1197533,36.0948889);
    ctx.bezierCurveTo(55.8977592,34.7086062,55.243815,32.4882644,54.1579207,29.4338634);
    ctx.bezierCurveTo(48.7312785,21.9017835,43.7354023,16.4079938,39.1702919,12.9524943);
    ctx.bezierCurveTo(34.6051816,9.49699485,27.079595,5.51283008,16.5935323,1);
    ctx.bezierCurveTo(24.4470876,9.95778608,29.6866848,16.6617281,32.3123237,21.1118261);
    ctx.bezierCurveTo(34.9379626,25.5619241,36.6005735,30.5562783,37.3001563,36.0948889);
    ctx.bezierCurveTo(37.1781865,38.8120649,35.5155757,40.6753976,32.3123237,41.6848872);
    ctx.bezierCurveTo(29.1090717,42.6943767,22.545499,43.4234864,12.6216055,43.8722163);
    ctx.lineTo(0,41.6848872);
    ctx.lineTo(10.6826972,47.8507217);
    ctx.lineTo(0,53);
    ctx.bezierCurveTo(12.9872011,52.4164009,22.3475314,52.4164009,28.0809911,53);
    ctx.bezierCurveTo(33.8144507,53.5835991,38.5183445,55.0151725,42.1926724,57.2947202);
    ctx.bezierCurveTo(42.9481369,61.6625102,43.458457,66.7205201,43.7236328,72.46875);
    ctx.bezierCurveTo(43.9888086,78.2169799,41.2475977,86.2729695,35.5,96.6367188);
  } else if ( boid.flapState < 30 ) {
    ctx.moveTo(66.0579887,7.36914062);
    ctx.bezierCurveTo(59.9677741,3.19284625,54.0946048,0.951526248,48.4384809,0.645180634);
    ctx.bezierCurveTo(42.782357,0.338835019,33.1752097,1.74171385,19.6170389,4.85381713);
    ctx.lineTo(0.774414062,4.85381713);
    ctx.lineTo(17.1565608,8.57894785);
    ctx.lineTo(4.06054688,12.1964305);
    ctx.bezierCurveTo(13.8563649,10.4217457,21.2518868,9.53440334,26.2471125,9.53440334);
    ctx.bezierCurveTo(31.2423382,9.53440334,34.5433198,10.4217457,36.1500574,12.1964305);
    ctx.bezierCurveTo(37.8715763,15.4679308,36.960291,19.9066858,33.4162014,25.5126953);
    ctx.bezierCurveTo(29.8721118,31.1187049,21.7575496,40.9569555,9.07251498,55.0274472);
    ctx.bezierCurveTo(18.8827316,49.4835709,26.3898099,44.5629635,31.59375,40.265625);
    ctx.bezierCurveTo(36.7976901,35.9682865,42.8952611,29.654371,49.8864631,21.3238786);
    ctx.lineTo(54.6318359,12.1964305);
    ctx.bezierCurveTo(57.3405475,10.3261897,59.3356647,9.12036212,60.6171875,8.57894785);
    ctx.bezierCurveTo(61.8987103,8.03753358,63.7123107,7.63426451,66.0579887,7.36914062);
    ctx.closePath();
    ctx.fill("evenodd");
    ctx.stroke();
  }


  boid.flapState++
  if ( boid.flapState >= 60 ) boid.flapState = 0

  ctx.closePath();
  ctx.fillStyle = "#000";
  ctx.fill("evenodd");
  ctx.stroke();
  ctx.restore();


  ctx.setTransform(1, 0, 0, 1, 0, 0);

  let boidX = Math.round(boid.x)
  let boidY = Math.round(boid.y)
  let s = 3
  for ( let x = Math.max(boidX - s, 0); x < Math.min(boidX + s, width); x++ ) {
    for ( let y = Math.max(boidY - s, 0); y < Math.min(boidY + s, height); y++ ) {
      let centerOffset = 1.0 - (Math.abs(x - boidX) * Math.abs(y - boidY) / (s * s))
      revealAt(x, y, centerOffset * 60)
    }
  }

  if (DRAW_TRAIL) {
    ctx.globalCompositeOperation = "lighter"
    ctx.strokeStyle = "#558cf466";
    ctx.beginPath();
    ctx.moveTo(boid.history[0][0], boid.history[0][1]);
    for (const point of boid.history) {
      ctx.lineTo(point[0], point[1]);
    }
    ctx.stroke();
  }
}

function revealAt(x, y, delta) {
  let offset = (y * 4 * width)  + (x * 4) + 3
  gradientData.data[offset] -= delta

}


function drawGradient() {
  let gc = gradientCanvas()
  let ctx = gc.getContext("2d")
  let gradient = ctx.createLinearGradient(0, 0, 0, gc.height)
  gradient.addColorStop(0.0, '#154277')
  gradient.addColorStop(0.3, '#576e71')
  gradient.addColorStop(0.7, '#e1c45e')

  gradient.addColorStop(1.0, '#b26339')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, gc.width, gc.height)

  gradientData = ctx.getImageData(0, 0, gc.width, gc.height)
}

// Main animation loop
function animationLoop() {
  // Update each boid
  for (let boid of boids) {
    // Update the velocities according to each rule
    flyTowardsCenter(boid);
    avoidOthers(boid);
    matchVelocity(boid);
    limitSpeed(boid);
    keepWithinBounds(boid);

    // Update the position based on the current velocity
    boid.x += boid.dx;
    boid.y += boid.dy;
    boid.history.push([boid.x, boid.y])
    boid.history = boid.history.slice(-50);
  }

  // Clear the canvas and redraw all the boids in their current positions
  const ctx = document.getElementById("boids").getContext("2d");

  ctx.clearRect(0, 0, width, height);
  let gc = gradientCanvas().getContext("2d")
  gc.clearRect(0, 0, width, height)
  gc.putImageData(gradientData, 0, 0)

  for (let boid of boids) {
    drawBoid(ctx, boid);
  }

  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  window.addEventListener("resize", sizeCanvas, false);
  sizeCanvas();

  drawGradient();

  // Randomly distribute the boids to start
  initBoids();

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);
};

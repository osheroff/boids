// Size of canvas. These get updated to fill the whole browser.
let width = 150;
let height = 150;

const numBoids = 1500;
const visualRange = 50;
const maxNeighbors = 500;

let nRevealed = 0;
let nCovered = 0;
var boids = [];

const N_PHOTOS = 5

let gradientCanvas = () => { return document.getElementById("gradient") }
let gradientData = null;
let gradientOpacity = 1.0;

let layers;

function initLayers() {
  let layers = [ ]
  let body = document.getElementsByTagName("body")[0]
  let width = window.innerWidth;
  let height = window.innerHeight;

  for(i = 0; i < N_PHOTOS + 2; i++) {
    let newCanvas = document.createElement("canvas")
    newCanvas.width = width
    newCanvas.height = height
    newCanvas.style.position = "fixed"
    newCanvas.style.top = 0
    newCanvas.style.left = 0
    newCanvas.style.zIndex = 10 - i
    body.appendChild(newCanvas)

    layers[i] = { idx: i, finished: false }
    if ( i == 1 ) {
      layers[i].data = drawGradient(newCanvas)
    } else if ( i > 1 ) {
      drawPhoto(newCanvas, layers[i], i - 1)
    }

    layers[i].canvas = newCanvas
    layers[i].nRevealed = 0
  }
  return layers
}


function drawGradient(gc) {
  let ctx = gc.getContext("2d")
  let gradient = ctx.createLinearGradient(0, 0, 0, gc.height)
  gradient.addColorStop(0.0, 'rgb(21, 66, 119)')
  gradient.addColorStop(0.3, 'rgb(75, 119, 125)')
  gradient.addColorStop(0.7, 'rgb(225, 163, 94)')
  gradient.addColorStop(1.0, 'rgb(178, 89, 57)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, gc.width, gc.height)

  return ctx.getImageData(0, 0, gc.width, gc.height)
}

function drawPhoto(canvas, layer, i) {
  let img = document.createElement("img")
  img.src = "./images/" + i + ".jpg"
  img.crossOrigin = "Anonymous"

  img.onload = () => {
    let ctx = canvas.getContext("2d")
    let canvasRatio = canvas.width / canvas.height
    let imgRatio = img.width / img.height
    let drawWidth, drawHeight

    if ( imgRatio > canvasRatio ) {
      drawHeight = canvas.height
      drawWidth = drawHeight * imgRatio
    } else {
      drawWidth = canvas.width
      drawHeight = drawWidth / imgRatio
    }

    ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
    layer.data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  }
}

function initBoids() {
  boids = []
  let width = window.innerWidth
  let height = window.innerHeight
  for (var i = 0; i < numBoids; i += 1) {
    let x;
    let y;

    if ( i < numBoids / 4 ) {
      x = Math.random() * width
      y = -((Math.random() * height) + 10)
    } else if ( i < (numBoids / 4) * 2 ) {
      x = width + (Math.random() * width) + 10
      y = Math.random() * height
    } else if ( i < (numBoids / 4) * 3 ) {
      x = Math.random() * width
      y = height + (Math.random() * height) + 10
    } else {
      x = -(Math.random() * width + 10)
      y = Math.random() * height
    }
    boids[boids.length] = {
      id: boids.length,
      x: x,
      y: y,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      layer: 1,
      nTicks: [],
      history: [],
    };
  }
  //boids[boids.length - 1].white = true
}

function distance(boid1, boid2) {
  return Math.sqrt(
    (boid1.x - boid2.x) * (boid1.x - boid2.x) +
      (boid1.y - boid2.y) * (boid1.y - boid2.y),
  );
}

// Constrain a boid to within the window. If it gets too close to an edge,
// nudge it back in and reverse its direction.
function keepWithinBounds(boid) {
  const margin = -100;
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

const MAX_TURN = Math.PI / 3
function clampTurning(boid) {
  let atan = Math.atan2(boid.dy, boid.dx)

  if ( boid.last_atan ) {
    let diff = Math.abs(atan - boid.last_atan) % (2 * Math.PI)
    diff = Math.min(diff, 2  * Math.PI - diff)
    if ( diff  > MAX_TURN ) {
      let r = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy)

      let newAngle = atan - ((atan - boid.last_atan) / 3)
      boid.dx = Math.cos(newAngle) * r
      boid.dy = Math.sin(newAngle) * r
    }
  }
  boid.last_atan = atan
}

const DRAW_TRAIL = false;

function drawBoid(ctx, boid) {
  const angle = Math.atan2(boid.dy, boid.dx) + Math.PI / 2;
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.translate(-boid.x, -boid.y);

  ctx.save();
  ctx.beginPath();

  if ( boid.white )
    ctx.fillStyle = "#ffffff";
  else
    ctx.fillStyle = "#000000";


  ctx.translate(boid.x, boid.y);
  ctx.transform(0.08, 0, 0, 0.08, -132.5 * 0.08, -109 * 0.08);


  ctx.moveTo(119.566007,186.618503);
  ctx.bezierCurveTo(116.31149,189.587574,108.127165,199.82961,95.0130319,217.344612);
  ctx.bezierCurveTo(99.9548781,207.242563,103.538678,199.305742,105.764431,193.534148);
  ctx.bezierCurveTo(107.990184,187.762554,109.990991,181.217947,111.766854,173.900326);
  ctx.bezierCurveTo(115.558973,163.520154,117.455032,154.872595,117.455032,147.957646);
  ctx.lineTo(117.454811,146.893691);
  ctx.bezierCurveTo(117.448496,136.702394,117.262213,124.21187,111.766854,116.84038);
  ctx.bezierCurveTo(106.078675,109.210241,94.862854,87.7803625,71.4058555,96.4144872);
  ctx.bezierCurveTo(55.7678564,102.17057,32.3207446,111.522581,1.06451982,124.470518);
  ctx.bezierCurveTo(13.256286,99.5545564,27.8998442,79.8538985,44.9951944,65.3685445);
  ctx.bezierCurveTo(62.0905445,50.8831906,86.2438238,36.4641561,117.455032,22.1114411);
  ctx.lineTo(128.802378,5.53382812);
  ctx.lineTo(132.584669,0.00818656067);
  ctx.lineTo(136.36696,5.53382812);
  ctx.lineTo(147.714306,22.1114411);
  ctx.bezierCurveTo(178.925514,36.4641561,203.078793,50.8831906,220.174144,65.3685445);
  ctx.bezierCurveTo(237.269494,79.8538985,251.913052,99.5545564,264.104818,124.470518);
  ctx.bezierCurveTo(232.848593,111.522581,209.401481,102.17057,193.763482,96.4144872);
  ctx.bezierCurveTo(170.306484,87.7803625,159.090663,109.210241,153.402484,116.84038);
  ctx.bezierCurveTo(147.714306,124.470518,147.714306,137.585224,147.714306,147.957646);
  ctx.bezierCurveTo(147.714306,154.872595,149.610365,163.520154,153.402484,173.900326);
  ctx.bezierCurveTo(155.178346,181.217947,157.179154,187.762554,159.404907,193.534148);
  ctx.bezierCurveTo(161.63066,199.305742,165.21446,207.242563,170.156306,217.344612);
  ctx.bezierCurveTo(157.042173,199.82961,148.857848,189.587574,145.603331,186.618503);
  ctx.bezierCurveTo(142.348814,183.649432,138.00926,180.545912,132.584669,177.307942);
  ctx.lineTo(132.584669,177.307942);
  ctx.bezierCurveTo(127.160078,180.545912,122.820524,183.649432,119.566007,186.618503);
  ctx.closePath();

  ctx.globalAlpha = 0.8
  ctx.fill();
  ctx.restore();


  ctx.setTransform(1, 0, 0, 1, 0, 0);

  let boidX = Math.round(boid.x)
  let boidY = Math.round(boid.y)

  for ( let i = 1 ; i <= boid.layer; i++ ) {
    if ( layers[i].finished )
      continue;

    if ( !boid.nTicks[i] )
      boid.nTicks[i] = 1

    let s = Math.round(1 + ( 10 * ( boid.nTicks[i] / 900 ) ))

    let revealFactor = Math.min(200, Math.sqrt(boid.nTicks[i]) * 2)

    for ( let x = Math.max(boidX - s, 0); x < Math.min(boidX + s, width); x++ ) {
      for ( let y = Math.max(boidY - s, 0); y < Math.min(boidY + s, height); y++ ) {
        let centerOffset = (1.0 - (Math.abs(x - boidX) * Math.abs(y - boidY) / (s * s))) + 0.1

        revealAt(boid, layers[i], x, y, centerOffset * revealFactor)
      }
    }

    boid.nTicks[i]++;
  }

  if (boid.white && boid.history[0]) {
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(boid.history[0][0], boid.history[0][1]);
    for (const point of boid.history) {
      ctx.lineTo(point[0], point[1]);
    }
    ctx.stroke();
  }
}

function revealAt(boid, layer, x, y, delta) {
  let endRevealThreshold = 0.5;
  let offset = (y * 4 * width)  + (x * 4) + 3

  if ( layer.data.data[offset] > 0 && layer.data.data[offset] - delta <= 0 ) {
    layer.nRevealed++

    if ( layer.idx == boid.layer && layer.nRevealed / (width * height) > endRevealThreshold && boid.layer < layers.length - 1 )
      boid.layer++

    if ( layer.nRevealed / (width * height) > 0.98 )
      layer.finished = true
  }

  layer.data.data[offset] -= delta
}

const FPS = 60;
let prevTick = 0;

let blankTime = 0;

// Main animation loop
function animationLoop() {
  // clamp to fixed framerate
  let now = Math.round(FPS * Date.now() / 1000)

  if (now == prevTick) {
    window.requestAnimationFrame(animationLoop)
    return
  }
  prevTick = now

  if ( blankTime++ > 20 ) {
    // Update each boid
    for (let boid of boids) {
      // Update the velocities according to each rule
      flyTowardsCenter(boid);
      avoidOthers(boid);
      matchVelocity(boid);
      limitSpeed(boid);
      clampTurning(boid);
      keepWithinBounds(boid);

      // Update the position based on the current velocity
      boid.x += boid.dx;
      boid.y += boid.dy;
      boid.history.push([boid.x, boid.y])
      boid.history = boid.history.slice(-50);
    }
  }


  for ( let i = 1 ; i < layers.length; i++ ) {
    let ctx = layers[i].canvas.getContext("2d")
    ctx.clearRect(0, 0, layers[i].canvas.width, layers[i].canvas.height)
    if ( layers[i].data && !layers[i].finished )
      ctx.putImageData(layers[i].data, 0, 0)

    if ( layers[i].nRevealed == 0 )
      break;
  }

  // Clear the canvas and redraw all the boids in their current positions
  const ctx = layers[0].canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  for (let boid of boids) {
    drawBoid(ctx, boid);
  }

  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

window.onload = () => {
  layers = initLayers()

  // Randomly distribute the boids to start
  initBoids();

  width = window.innerWidth
  height = window.innerHeight
  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);
};

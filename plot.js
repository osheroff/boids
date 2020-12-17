const numBoids = 3000;
const visualRange = 50;

let width = 1920
let height = 1080

var boids = [];

function initBoids() {
  boids = []
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
      history: []
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
  for (let i = 0; i < boids.length; i++) {
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

  for (let i = 0; i < boids.length; i++) {
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

  for(let i = 0; i < boids.length; i++) {
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
  const speedLimit = 8;
  const grandmaLimit = 4;

  const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
  if (speed > speedLimit) {
    boid.dx = (boid.dx / speed) * speedLimit;
    boid.dy = (boid.dy / speed) * speedLimit;
  } else if ( speed < grandmaLimit) {
    boid.dx = (boid.dx / speed) * grandmaLimit;
    boid.dy = (boid.dy / speed) * grandmaLimit;
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

NFRAMES = 30 * 60 * 5
// NFRAMES = 30

initBoids();

for (let i = 0; i < NFRAMES; i++) {
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
    boid.history.push([Math.round(boid.x), Math.round(boid.y)])
  }
  if ( i % 60 == 0 )
    console.log(`finished ${i} of ${NFRAMES}`)
}

data = {}
for ( let boid of boids ) {
  data[boid.id] = boid.history
}

fs = require('fs');
fs.writeFile("data.json", JSON.stringify(data), function() {} )

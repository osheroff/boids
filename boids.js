// Size of canvas. These get updated to fill the whole browser.
let width = 1920;
let height = 1080;
const numBoids = 3000;
let movementData
let nTicks = 0
let waterline = 0

var boids = [];
let activeLayer = 1;

//changeFrames = [400, 600, 722, 1200, 1700, 1800, 2095, 2670, 2957, 3378]
changeFrames = []
changeFrames = [120, 199, 388, 560, 800, 900, 1000, 1200, 1400, 1800]
let photos = [
  {
    src: "house/home0.jpeg",
  },
  {
    src: "house/home1.jpeg",
  },
  {
    src: "house/home2.jpeg",
  },
  {
    src: "house/home3.jpeg",
  },
  {
    src: "house/home0.jpeg",
  },
  {
    src: "hands/53.jpg",
    desc: "woman smoking cigarette"
  },
  {
    src: "hands/2013-03-31 11.48.28.jpg",
    desc: "mom & sis"
  },
  {
    src: "hands/3.jpg",
    desc: "couple on bike"
  },
  {
    src: "hands/Old_Ladies.jpg",
    desc: "baby hands"
  },
  {
    src: "images/2019-07-08 12.45.54.jpg",
    desc: "sagrada"
  },
  {
    src: "images/53.jpg",
    desc: "woman smoking cigarette",
    rainbow: true
  },
  {
    src: "images/white.png",
    desc: "white background for composite",
  },
  {
    src: "images/2017-05-03 16.08.22.jpg",
    desc: "pachinko parlour"
  },
  {
    src: "images/24.jpg",
    desc: "baskets.  asia."
  },
  {
    src: "images/2018-03-23 15.40.39.jpg",
    desc: "light slashes on floor"
  },
  {
    src: "images/2017-06-26 15.58.02.jpg",
    desc: "teufulsburg"
  },
  {
    src: "images/2019-07-23 22.12.44.jpg",
    desc: "blackie"
  },
  {
    src: "images/2017-04-25 22.22.37.jpg",
    desc: "in between sign",
  },
]
/*
 *
 *
  "images/2017-08-15 16.30.21.jpg",
  "images/2017-12-20 12.38.35.jpg",
  "images/2018-08-05 11.57.32.jpg",
  "images/2018-10-19 20.09.17.jpg",
  "images/2019-02-23 11.18.46.jpg",
  "images/2019-04-26 20.40.54.jpg",
  "images/2019-07-08 12.56.35.jpg",
  "images/2019-12-22 13.01.08.jpg",
  "images/2020-02-01 13.50.27.jpg",
  "images/5.jpg",
  "images/6.JPG",
  {
    src: "images/2017-07-05 20.19.36.jpg",
    desc: "lou / armenia / outside"
  },
*/

let layers;

async function initLayers() {
  let layers = [ ]
  let body = document.getElementsByTagName("body")[0]

  for(i = 0; i < photos.length + 1; i++) {
    let newCanvas = document.createElement("canvas")
    newCanvas.width = width
    newCanvas.height = height
    newCanvas.style.position = "fixed"
    newCanvas.style.top = 0
    newCanvas.style.left = 0
    newCanvas.style.zIndex = 10 - i
    body.appendChild(newCanvas)

    layers[i] = { idx: i, finished: false }
    if ( false && i == 1 ) {
      layers[i].revealThreshold = 0.1
      layers[i].data = drawGradient(newCanvas)
    } else if ( i > 0 ) {
      await drawPhoto(newCanvas, layers[i], i - 1)
      layers[i].revealThreshold = photos[i - 1].revealThreshold
      layers[i].rainbow = photos[i - 1].rainbow
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

async function drawPhoto(canvas, layer, i) {
  let img = document.createElement("img")
  img.src = photos[i].src
  img.crossOrigin = "Anonymous"

  let promise = new Promise((resolve, reject) => {
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
      resolve()
    }
  })
  await promise
}

function initBoids() {
  boids = []
  for (var i = 0; i < numBoids; i += 1) {
    boids[boids.length] = {
      id: boids.length,
      x: movementData[boids.length][1][0],
      lastX: movementData[boids.length][0][0],
      y: movementData[boids.length][0][1],
      lastY: movementData[boids.length][0][1],
      layer: 1,
      layerTicks: [],
      flapTicks: Math.round(Math.random() * 90),
      history: [],
    };
  }
  //boids[boids.length - 1].white = true
}

const DRAW_TRAIL = false;

let boidCanvas = document.createElement("canvas")
boidCanvas.width = 305
boidCanvas.height = 190

let boidCtx = boidCanvas.getContext("2d")
boidCtx.fillStyle = "#000000";
boidCtx.beginPath();
boidCtx.moveTo(148.409946,178.014515);
boidCtx.bezierCurveTo(147.388629,182.380258,146.429867,186.378148,145.53366,190.008187);
boidCtx.bezierCurveTo(144.037194,184.737785,143.111294,178.615364,142.75596,171.640924);
boidCtx.bezierCurveTo(142.400626,164.666484,142.400626,149.544906,142.75596,126.27619);
boidCtx.bezierCurveTo(140.010142,116.841788,138.241805,109.690359,137.450949,104.8219);
boidCtx.bezierCurveTo(136.660093,99.9534417,136.11381,92.856223,135.8121,83.530244);
boidCtx.bezierCurveTo(135.630096,81.0089531,134.690779,79.4795561,132.994149,78.9420528);
boidCtx.bezierCurveTo(131.297519,78.4045496,127.409292,78.4045496,121.329467,78.9420528);
boidCtx.bezierCurveTo(100.433394,83.0377033,82.3062532,87.699939,66.9480445,92.92876);
boidCtx.bezierCurveTo(51.5898357,98.157581,29.6457504,107.137904,1.11578858,119.86973);
boidCtx.bezierCurveTo(6.81050932,106.713706,11.7027331,97.7333829,15.7924599,92.92876);
boidCtx.bezierCurveTo(34.3275021,71.153739,54.5346827,59.2797509,66.9480445,51.1510222);
boidCtx.bezierCurveTo(81.0014521,41.9483308,103.258935,30.1998425,126.62083,27.2540529);
boidCtx.bezierCurveTo(129.356458,26.9091072,132.966498,28.2681295,137.450949,31.3311199);
boidCtx.bezierCurveTo(138.248092,26.0639358,139.486886,21.2678766,141.167329,16.9429421);
boidCtx.bezierCurveTo(142.847772,12.6180077,146.986886,6.97308915,153.584669,0.00818656067);
boidCtx.lineTo(154.030708,0.481020853);
boidCtx.bezierCurveTo(160.369324,7.22899454,164.359757,12.7163016,166.002009,16.9429421);
boidCtx.bezierCurveTo(167.682452,21.2678766,168.921245,26.0639358,169.718389,31.3311199);
boidCtx.bezierCurveTo(174.20284,28.2681295,177.81288,26.9091072,180.548508,27.2540529);
boidCtx.bezierCurveTo(203.910402,30.1998425,226.167886,41.9483308,240.221293,51.1510222);
boidCtx.bezierCurveTo(252.634655,59.2797509,272.841836,71.153739,291.376878,92.92876);
boidCtx.bezierCurveTo(295.466605,97.7333829,300.358829,106.713706,306.053549,119.86973);
boidCtx.bezierCurveTo(277.523587,107.137904,255.579502,98.157581,240.221293,92.92876);
boidCtx.bezierCurveTo(224.863085,87.699939,206.735944,83.0377033,185.839871,78.9420528);
boidCtx.bezierCurveTo(179.760046,78.4045496,175.871819,78.4045496,174.175189,78.9420528);
boidCtx.bezierCurveTo(172.478559,79.4795561,171.539242,81.0089531,171.357238,83.530244);
boidCtx.bezierCurveTo(171.055528,92.856223,170.509245,99.9534417,169.718389,104.8219);
boidCtx.bezierCurveTo(168.927533,109.690359,167.159196,116.841788,164.413378,126.27619);
boidCtx.bezierCurveTo(164.768712,149.544906,164.768712,164.666484,164.413378,171.640924);
boidCtx.bezierCurveTo(164.058044,178.615364,163.132144,184.737785,161.635678,190.008187);
boidCtx.bezierCurveTo(160.739471,186.378148,159.780709,182.380258,158.759392,178.014515);
boidCtx.bezierCurveTo(157.738074,173.648772,156.013166,166.174999,153.584669,155.593194);
boidCtx.lineTo(153.584669,155.593194);
boidCtx.bezierCurveTo(151.156171,166.174999,149.431264,173.648772,148.409946,178.014515);
boidCtx.closePath();
boidCtx.fill();




function drawBoid(ctx, boid) {
  if ( nTicks < waterline )
    return

  const angle = Math.atan2(boid.dy, boid.dx) + Math.PI / 2;
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.translate(-boid.x, -boid.y);

  ctx.save();

  //ctx.globalAlpha = 0.5

  if ( layers[activeLayer].rainbow ) {
    if ( !boid.rainbowColor ) {
      if ( Math.random() > 0.98 ) {
        let blue = (Math.round(Math.random() * 255)).toString(16)
        let green = (Math.round(Math.random() * 50)).toString(16)
        boid.rainbowColor = "#00" + green + blue
      }
    }

    if ( boid.rainbowColor ) {
      /* let frameCount = 2400
      let mod = boid.flapTicks % frameCount
      let colorFloat = (mod / frameCount) * 16777216*/
      ctx.fillStyle = boid.rainbowColor
    } else {
      ctx.fillStyle = "#000000";
    }
  } else
    ctx.fillStyle = "#000000";

  ctx.translate(boid.x, boid.y);

  let mod = boid.flapTicks++ % 90

  // 0,1 - half down
  // 2,3 - all down
  // 4,5 - half down
  // 9 - 11 - regular
  // 12, 13 half
  // 14-15 all down
  // 16, 17 half
  if ( [0, 1, 4, 5, 12, 13, 16, 17].includes(mod) ) {
    // half down state
    ctx.transform(0.08, 0, 0, 0.08, -82 * 0.08, -95 * 0.08);

    ctx.beginPath();
    ctx.moveTo(78.2941578,178.006328);
    ctx.bezierCurveTo(77.2728403,182.372071,76.314078,186.369962,75.417871,190);
    ctx.bezierCurveTo(73.9214051,184.729599,72.9955051,178.607178,72.640171,171.632738);
    ctx.bezierCurveTo(72.284837,164.658298,72.284837,149.536719,72.640171,126.268003);
    ctx.bezierCurveTo(69.8943532,116.833602,68.1260162,109.682172,67.3351601,104.813714);
    ctx.bezierCurveTo(66.544304,99.9452552,65.9980211,92.8480365,65.6963114,83.5220575);
    ctx.bezierCurveTo(65.5143073,81.0007666,64.5749903,79.4713695,62.8783604,78.9338662);
    ctx.bezierCurveTo(61.1817305,78.396363,56.8535011,76.445332,49.8936722,73.0807733);
    ctx.bezierCurveTo(42.7643841,72.9290613,36.3511972,74.8800923,30.6541116,78.9338662);
    ctx.bezierCurveTo(24.957026,82.9876402,15.211526,91.614256,1.41761162,104.813714);
    ctx.bezierCurveTo(2.02828589,93.0622735,3.71385115,84.4356578,6.47430742,78.9338662);
    ctx.bezierCurveTo(22.3293606,47.3335841,44.1556069,28.8030532,56.5050417,27.2458663);
    ctx.bezierCurveTo(59.2406698,26.9009206,62.8507093,28.259943,67.3351601,31.3229333);
    ctx.bezierCurveTo(68.1323039,26.0557493,69.3710974,21.25969,71.0515406,16.9347556);
    ctx.bezierCurveTo(72.7319838,12.6098211,76.8710971,6.96490259,83.4688804,0);
    ctx.lineTo(83.9149193,0.472834292);
    ctx.bezierCurveTo(90.2535352,7.22080798,94.2439689,12.7081151,95.8862202,16.9347556);
    ctx.bezierCurveTo(97.5666634,21.25969,98.8054569,26.0557493,99.6026007,31.3229333);
    ctx.bezierCurveTo(104.087052,28.259943,107.697091,26.9009206,110.432719,27.2458663);
    ctx.bezierCurveTo(122.782154,28.8030532,144.6084,47.3335841,160.463453,78.9338662);
    ctx.bezierCurveTo(163.22391,84.4356578,164.909475,93.0622735,165.520149,104.813714);
    ctx.bezierCurveTo(151.726235,91.614256,141.980735,82.9876402,136.283649,78.9338662);
    ctx.bezierCurveTo(130.586564,74.8800923,124.173377,72.9290613,117.044089,73.0807733);
    ctx.bezierCurveTo(110.08426,76.445332,105.75603,78.396363,104.0594,78.9338662);
    ctx.bezierCurveTo(102.36277,79.4713695,101.423453,81.0007666,101.241449,83.5220575);
    ctx.bezierCurveTo(100.93974,92.8480365,100.393457,99.9452552,99.6026007,104.813714);
    ctx.bezierCurveTo(98.8117446,109.682172,97.0434076,116.833602,94.2975897,126.268003);
    ctx.bezierCurveTo(94.6529238,149.536719,94.6529238,164.658298,94.2975897,171.632738);
    ctx.bezierCurveTo(93.9422557,178.607178,93.0163557,184.729599,91.5198898,190);
    ctx.bezierCurveTo(90.6236828,186.369962,89.6649205,182.372071,88.6436029,178.006328);
    ctx.bezierCurveTo(87.6222854,173.640586,85.8973779,166.166812,83.4688804,155.585007);
    ctx.lineTo(83.4688804,155.585007);
    ctx.bezierCurveTo(81.0403829,166.166812,79.3154754,173.640586,78.2941578,178.006328);
    ctx.closePath();
    ctx.fill();

    ctx.stroke();
  } else if ( [2,3, 14, 15].includes(mod) ) {
    ctx.transform(0.08, 0, 0, 0.08, -21 * 0.08, -95 * 0.08);

    ctx.beginPath();
    ctx.moveTo(17.2941578,178.006328);
    ctx.bezierCurveTo(16.2728403,182.372071,15.314078,186.369962,14.417871,190);
    ctx.bezierCurveTo(12.9214051,184.729599,11.9955051,178.607178,11.640171,171.632738);
    ctx.bezierCurveTo(11.284837,164.658298,11.284837,149.536719,11.640171,126.268003);
    ctx.bezierCurveTo(8.89435318,116.833602,7.12601619,109.682172,6.33516009,104.813714);
    ctx.bezierCurveTo(5.54430398,99.9452552,4.99802109,92.8480365,4.6963114,83.5220575);
    ctx.bezierCurveTo(4.51430731,81.0007666,3.57499032,79.4713695,1.87836043,78.9338662);
    ctx.bezierCurveTo(0.181730536,78.396363,1.66733042,62.526052,6.33516009,31.3229333);
    ctx.bezierCurveTo(7.13230386,26.0557493,8.37109735,21.25969,10.0515406,16.9347556);
    ctx.bezierCurveTo(11.7319838,12.6098211,15.8710971,6.96490259,22.4688804,0);
    ctx.lineTo(22.9149193,0.472834292);
    ctx.bezierCurveTo(29.2535352,7.22080798,33.2439689,12.7081151,34.8862202,16.9347556);
    ctx.bezierCurveTo(36.5666634,21.25969,37.8054569,26.0557493,38.6026007,31.3229333);
    ctx.bezierCurveTo(43.2704303,62.526052,44.7560302,78.396363,43.0594003,78.9338662);
    ctx.bezierCurveTo(41.3627704,79.4713695,40.4234534,81.0007666,40.2414494,83.5220575);
    ctx.bezierCurveTo(39.9397397,92.8480365,39.3934568,99.9452552,38.6026007,104.813714);
    ctx.bezierCurveTo(37.8117446,109.682172,36.0434076,116.833602,33.2975897,126.268003);
    ctx.bezierCurveTo(33.6529238,149.536719,33.6529238,164.658298,33.2975897,171.632738);
    ctx.bezierCurveTo(32.9422557,178.607178,32.0163557,184.729599,30.5198898,190);
    ctx.bezierCurveTo(29.6236828,186.369962,28.6649205,182.372071,27.6436029,178.006328);
    ctx.bezierCurveTo(26.6222854,173.640586,24.8973779,166.166812,22.4688804,155.585007);
    ctx.lineTo(22.4688804,155.585007);
    ctx.bezierCurveTo(20.0403829,166.166812,18.3154754,173.640586,17.2941578,178.006328);
    ctx.closePath();
    ctx.fill();

    ctx.stroke();

  }else {
    ctx.transform(0.08, 0, 0, 0.08, -152.5 * 0.08, -95 * 0.08);
    if ( false ) {
      ctx.drawImage(boidCanvas, 0, 0)
    } else {
      ctx.beginPath();
      ctx.moveTo(148.409946,178.014515);
      ctx.bezierCurveTo(147.388629,182.380258,146.429867,186.378148,145.53366,190.008187);
      ctx.bezierCurveTo(144.037194,184.737785,143.111294,178.615364,142.75596,171.640924);
      ctx.bezierCurveTo(142.400626,164.666484,142.400626,149.544906,142.75596,126.27619);
      ctx.bezierCurveTo(140.010142,116.841788,138.241805,109.690359,137.450949,104.8219);
      ctx.bezierCurveTo(136.660093,99.9534417,136.11381,92.856223,135.8121,83.530244);
      ctx.bezierCurveTo(135.630096,81.0089531,134.690779,79.4795561,132.994149,78.9420528);
      ctx.bezierCurveTo(131.297519,78.4045496,127.409292,78.4045496,121.329467,78.9420528);
      ctx.bezierCurveTo(100.433394,83.0377033,82.3062532,87.699939,66.9480445,92.92876);
      ctx.bezierCurveTo(51.5898357,98.157581,29.6457504,107.137904,1.11578858,119.86973);
      ctx.bezierCurveTo(6.81050932,106.713706,11.7027331,97.7333829,15.7924599,92.92876);
      ctx.bezierCurveTo(34.3275021,71.153739,54.5346827,59.2797509,66.9480445,51.1510222);
      ctx.bezierCurveTo(81.0014521,41.9483308,103.258935,30.1998425,126.62083,27.2540529);
      ctx.bezierCurveTo(129.356458,26.9091072,132.966498,28.2681295,137.450949,31.3311199);
      ctx.bezierCurveTo(138.248092,26.0639358,139.486886,21.2678766,141.167329,16.9429421);
      ctx.bezierCurveTo(142.847772,12.6180077,146.986886,6.97308915,153.584669,0.00818656067);
      ctx.lineTo(154.030708,0.481020853);
      ctx.bezierCurveTo(160.369324,7.22899454,164.359757,12.7163016,166.002009,16.9429421);
      ctx.bezierCurveTo(167.682452,21.2678766,168.921245,26.0639358,169.718389,31.3311199);
      ctx.bezierCurveTo(174.20284,28.2681295,177.81288,26.9091072,180.548508,27.2540529);
      ctx.bezierCurveTo(203.910402,30.1998425,226.167886,41.9483308,240.221293,51.1510222);
      ctx.bezierCurveTo(252.634655,59.2797509,272.841836,71.153739,291.376878,92.92876);
      ctx.bezierCurveTo(295.466605,97.7333829,300.358829,106.713706,306.053549,119.86973);
      ctx.bezierCurveTo(277.523587,107.137904,255.579502,98.157581,240.221293,92.92876);
      ctx.bezierCurveTo(224.863085,87.699939,206.735944,83.0377033,185.839871,78.9420528);
      ctx.bezierCurveTo(179.760046,78.4045496,175.871819,78.4045496,174.175189,78.9420528);
      ctx.bezierCurveTo(172.478559,79.4795561,171.539242,81.0089531,171.357238,83.530244);
      ctx.bezierCurveTo(171.055528,92.856223,170.509245,99.9534417,169.718389,104.8219);
      ctx.bezierCurveTo(168.927533,109.690359,167.159196,116.841788,164.413378,126.27619);
      ctx.bezierCurveTo(164.768712,149.544906,164.768712,164.666484,164.413378,171.640924);
      ctx.bezierCurveTo(164.058044,178.615364,163.132144,184.737785,161.635678,190.008187);
      ctx.bezierCurveTo(160.739471,186.378148,159.780709,182.380258,158.759392,178.014515);
      ctx.bezierCurveTo(157.738074,173.648772,156.013166,166.174999,153.584669,155.593194);
      ctx.lineTo(153.584669,155.593194);
      ctx.bezierCurveTo(151.156171,166.174999,149.431264,173.648772,148.409946,178.014515);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();


  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function revealImage(boid) {
  let boidX = Math.round(boid.x)
  let boidY = Math.round(boid.y)

  for ( let i = 1 ; i <= activeLayer; i++ ) {
    if ( layers[i].finished )
      continue;

    if ( !boid.layerTicks[i] )
      boid.layerTicks[i] = 1

    let s = Math.round(1 + ( 12 * ( boid.layerTicks[i] / 900 ) ))

    let revealFactor = Math.min(200, Math.sqrt(boid.layerTicks[i]) * 2)

    for ( let x = Math.max(boidX - s, 0); x < Math.min(boidX + s, width); x++ ) {
      for ( let y = Math.max(boidY - s, 0); y < Math.min(boidY + s, height); y++ ) {
        let centerOffset = (1.0 - (Math.abs(x - boidX) * Math.abs(y - boidY) / (s * s))) + 0.1

        revealAt(boid, layers[i], x, y, centerOffset * revealFactor)
      }
    }

    boid.layerTicks[i]++;
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
  let endRevealThreshold = layer.revealThreshold || 0.4;
  let offset = (y * 4 * width)  + (x * 4) + 3

  if ( layer.data.data[offset] > 0 && layer.data.data[offset] - delta <= 0 ) {
    layer.nRevealed++

    /*
    if ( layer.idx == boid.layer && layer.nRevealed / (width * height) > endRevealThreshold && boid.layer < layers.length - 2 )
      boid.layer++
    */

    if ( layer.nRevealed / (width * height) > 0.98 )
      layer.finished = true
  }

  layer.data.data[offset] -= delta
}


function targetFPS() {
  return 4

  if ( nTicks >= waterline ) {
    return 30
  } else {
    return 2000
  }
}
window.fps = 0;

let prevTick = 0;
let lastAnimateTime = 0;

// Main animation loop
function animationLoop() {
  // clamp to fixed framerate
  let now = Math.round(targetFPS() * Date.now() / 1000)

  if (now == prevTick) {
    window.requestAnimationFrame(animationLoop)
    return
  }

  let timeBetween = Date.now() - lastAnimateTime

  lastAnimateTime = Date.now()
  prevTick = now

  window.fps = 1000 / (timeBetween)

  for ( let i = 1 ; i <= activeLayer + 1; i++ ) {
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
    boid.x = movementData[boid.id][nTicks][0]
    boid.y = movementData[boid.id][nTicks][1]
    boid.dx = boid.x - boid.lastX
    boid.dy = boid.y - boid.lastY
    drawBoid(ctx, boid)
    revealImage(boid)
    boid.lastX = boid.x
    boid.lastY = boid.y
  }
  nTicks++

  if ( changeFrames.includes(nTicks) )
    activeLayer++;

  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

window.onload = () => {
  let button = document.getElementsByTagName("button")[0]
  let body = document.getElementsByTagName("body")[0]

  fetch("/data.json")
    .then(response => response.json())
    .then(async (data) => {

      movementData = data
      layers = await initLayers()

      // Randomly distribute the boids to start
      initBoids();

      button.style.display = "block"
      // Schedule the main animation loop
    })

  button.addEventListener("mousedown", (ev) => {
    ev.target.style.display = "none"
    window.requestAnimationFrame(animationLoop)
  })

  body.addEventListener("keyup", (ev) => {
    if ( ev.keyCode == 32 ) {
      changeFrames.push(nTicks)
      console.log(changeFrames)
      activeLayer++
    }
  })
};

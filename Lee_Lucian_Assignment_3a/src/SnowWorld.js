// Create the Snowy World
// Idea Source: https://people.ucsc.edu/~jwdicker/Asgn3/BlockyWorld.html
let g_worldPieces = [];
const SIZE = {
  x: 32,
  y: 15,
  z: 32
}
const MIN_Y = -1;

const g_worldMap = [];

function initializeAquariumMap() {
    const baseDepth = 2; // Basic water depth across the map
    const maxDepth = 5; // Maximum depth for deeper areas
    const shallowDepth = 1; // Shallow areas, e.g., near the "shore"
    const randomFactor = 2; // Adds random depth variations

    for (let x = 0; x < SIZE.x; x++) {
      g_worldMap[x] = [];
      for (let z = 0; z < SIZE.z; z++) {
        // Create random variations
        let randomDepthAdjustment = Math.floor(Math.random() * randomFactor);

        if (x === 0 || x === SIZE.x - 1 || z === 0 || z === SIZE.z - 1) {
          // Edge of the map, make it shallow
          g_worldMap[x][z] = shallowDepth + randomDepthAdjustment;
        } else {
          // Calculate distance to center to create a valley
          let centerX = SIZE.x / 2;
          let centerZ = SIZE.z / 2;
          let distanceToCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(z - centerZ, 2));
          let depth = baseDepth + Math.floor((maxDepth - baseDepth) * (distanceToCenter / centerX));

          // Apply random depth adjustment
          depth += randomDepthAdjustment;

          // Ensure depth does not exceed maximum or fall below the base
          depth = Math.max(shallowDepth, Math.min(depth, maxDepth));

          g_worldMap[x][z] = depth;
        }
      }
    }
}

initializeAquariumMap();

// Generates all cubes to be loaded in the world
function createWorld() {
  const floor = buildFloor();
  const sky = buildSkyBox();
  const blocks = buildWorldBlocks();

  // Push to the global state here
  g_worldPieces.push(floor, sky, ...blocks);
}

function buildFloor() {
  let floor = new Cube(TEXTURES.COLOR, COLORS.GRAY);
  floor.setScale(SIZE.x, 0.001, SIZE.z);
  floor.setTranslate(0, MIN_Y, 0);
  return floor;
}

function buildSkyBox() {
  let sky = new Cube(TEXTURES.TEXTURE0);
  sky.setScale(1000, 1000, 1000);
  return sky;
}

function buildWorldBlocks() {
  return g_worldMap.flatMap((row, x) =>
      row.flatMap((depth, z) =>
          Array.from({ length: depth }, (_, y) => addWorldBlock(x, y, z))
      )
  ).filter(block => block !== undefined); // Filter out any undefined blocks if conditions fail
}

function getIndex(x, y, z) {
  return ((z * SIZE.x * SIZE.y) + (y * SIZE.x) + x) + 2;
}

// Places a block at the specified coordinates
function addWorldBlock(x, y, z) {
    let index = getIndex(x, y, z);
    let texture = TEXTURES.TEXTURE1
    if (!g_worldPieces[index]) {
        let block = new Cube(texture);
        block.setTranslate(x - (SIZE.x / 2), y + MIN_Y, z - (SIZE.z / 2));
        block.setScale(1, 1, 1); // Assuming uniform scaling for simplicity
        g_worldPieces[index] = block;
    }
}

// Removes a block at the specified coordinates
function deleteWorldBlock(x, y, z) {
  let index = getIndex(x, y, z);
  if (index < g_worldPieces.length) {
      g_worldPieces[index] = undefined;
  }
}

// Renders all pieces of the world
function renderWorldObjects() {
    g_worldPieces.forEach(cube => {
        if (cube) {
            cube.render();
        }
    });
}

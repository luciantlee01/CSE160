// Idea and style source: https://people.ucsc.edu/~jwdicker/Asgn3/BlockyWorld.html

// Size of each graph paper cell for scaling
const CELL_SIZE = 0.2;

// Animation flags
let g_isAnimating = true;
let g_mouthOpening = false;

// Pig body parts
let g_bodyParts = {};

// Colors for the pig
const COLORS = {
  WHITE: [1.0, 1.0, 1.0, 1.0],
  PINK: [0.97, 0.56, 0.65, 1.0],
  DARK_PINK: [0.91, 0.45, 0.56, 1.0],
  BLACK: [0.0, 0.0, 0.0, 1.0]
};

// Animation control variables
let g_pig = [0, 0, 0];
let g_ear = {"left": 0, "right": 0};
let g_tail = 0;
let g_mouth = 0;
let g_pos = [7, 1.5, -10];

function scaleToGraph(part) {
  part.scale(CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function generateAnimal() {
  let body = new Cube(TEXTURES.COLOR, COLORS.PINK);
  body.scale(6, 4, 5);
  scaleToGraph(body);
  body.translate(g_pos[0], g_pos[1], g_pos[2]);
  g_bodyParts["body"] = body;

  let head = new Cube(TEXTURES.COLOR, COLORS.PINK, [1, -0.01, 0.5], body);
  head.scale(3, 3, 4);
  scaleToGraph(head);
  head.translate(-3 * CELL_SIZE, 0, 0);
  g_bodyParts["head"] = head;

  let eyeL = new Cube(TEXTURES.COLOR, COLORS.BLACK, [1, 1, 0.5], head);
  eyeL.scale(0.5, 0.5, 0.5);
  scaleToGraph(eyeL);
  eyeL.translate(-3.6 * CELL_SIZE, 1.2 * CELL_SIZE, -1.5 * CELL_SIZE);
  g_bodyParts["eyeL"] = eyeL;

  let eyeR = new Cube(TEXTURES.COLOR, COLORS.BLACK, [1, 1, 0.5], head);
  eyeR.scale(0.5, 0.5, 0.5);
  scaleToGraph(eyeR);
  eyeR.translate(-3.6 * CELL_SIZE, 1.2 * CELL_SIZE, 1.5 * CELL_SIZE);
  g_bodyParts["eyeR"] = eyeR;

  let earL = new Cube(TEXTURES.COLOR, COLORS.DARK_PINK, [1, 1, 0.5], head);
  earL.scale(1, 1.5, 1);
  scaleToGraph(earL);
  earL.translate(-2.6 * CELL_SIZE, 2.5 * CELL_SIZE, -2 * CELL_SIZE);
  g_bodyParts["earL"] = earL;

  let earR = new Cube(TEXTURES.COLOR, COLORS.DARK_PINK, [1, 1, 0.5], head);
  earR.scale(1, 1.5, 1);
  scaleToGraph(earR);
  earR.translate(-2.6 * CELL_SIZE, 2.5 * CELL_SIZE, 2 * CELL_SIZE);
  g_bodyParts["earR"] = earR;

  let tail = new Cube(TEXTURES.COLOR, COLORS.DARK_PINK, [1, 1, 0.5], body);
  tail.scale(0.5, 0.5, 3);
  scaleToGraph(tail);
  tail.translate(3.5 * CELL_SIZE, 0, 0);
  tail.rotateX(90);
  tail.rotateY(45);
  g_bodyParts["tail"] = tail;
}

function updateAnimationAngles() {
  g_pig[1] = Math.sin(g_animTime) * 10; // Swaying side to side

  g_bodyParts["body"].setRotateY(g_pig[1]);

  // Ear flapping
  g_ear["left"] = 20 * Math.sin(2 * g_animTime);
  g_ear["right"] = -20 * Math.sin(2 * g_animTime);
  
  g_bodyParts["earL"].setRotateZ(g_ear["left"]);
  g_bodyParts["earR"].setRotateZ(g_ear["right"]);

  // Tail wagging
  g_tail = 30 * Math.sin(4 * g_animTime);
  g_bodyParts["tail"].setRotateZ(g_tail);

  if (g_mouthOpening) {
    g_mouth = 20 * Math.abs(Math.sin(g_animTime));
    g_bodyParts["head"].setRotateX(g_mouth);
  }

  resetUserInterface();
}

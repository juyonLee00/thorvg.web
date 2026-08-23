import { ShowcaseExample } from "./types";

export const interactiveSceneEditorExample: ShowcaseExample = {
  id: "interactive-scene-editor",
  title: "Interactive Scene Editor",
  description:
    "Select, drag, and snap Paint objects using WebCanvas hit testing and bounds.",
  category: "advanced",
  useDarkCanvas: true,
  code: `// Interactive Scene Editor

import { init } from '@thorvg/webcanvas';

const TVG = await init({
  renderer: 'gl',
  locateFile: (path) => '/webcanvas/' + path.split('/').pop()
});

const WIDTH = 600;
const HEIGHT = 600;

const canvas = new TVG.Canvas('#canvas', {
  width: WIDTH,
  height: HEIGHT,
});

if (window.__interactiveSceneEditorCleanup) {
  window.__interactiveSceneEditorCleanup();
}

const eventController = new AbortController();
const eventOptions = { signal: eventController.signal };

window.__interactiveSceneEditorCleanup = () => {
  eventController.abort();
};

const canvasElement = document.querySelector('#canvas');

if (!canvasElement) {
  throw new Error('Canvas element was not found.');
}

// Scene state data
let selectedItem = null;
let hoveredSlot = null;
let dragging = false;

let dragOffsetX = 0;
let dragOffsetY = 0;

let selectionOutline = null;

const slots = [];
const items = [];

// Create shape
function createCircle(color) {
  const shape = new TVG.Shape();

  shape.appendCircle(0, 0, 40, 40);
  shape.fill(color[0], color[1], color[2], color[3]);

  return shape;
}

function createSquare(color) {
  const shape = new TVG.Shape();

  shape.appendRect(-40, -40, 80, 80, {
    rx: 12,
    ry: 12,
  });

  shape.fill(color[0], color[1], color[2], color[3]);

  return shape;
}

function createTriangle(color) {
  const shape = new TVG.Shape();

  shape.moveTo(0, -46);
  shape.lineTo(44, 36);
  shape.lineTo(-44, 36);
  shape.close();

  shape.fill(color[0], color[1], color[2], color[3]);

  return shape;
}

function createSlot(id, x, y, shapeFactory, color) {
  const paint = shapeFactory([color[0], color[1], color[2], 35]);

  paint.stroke({
    width: 3,
    color: [color[0], color[1], color[2], 150],
    dash: [8, 6],
  });

  paint.translate(x, y);

  return {
    id,
    paint,
    x,
    y,
    color,
  };
}

function createItem(id, x, y, shapeFactory, color) {
  const paint = shapeFactory(color);

  paint.stroke({
    width: 3,
    color: [255, 255, 255, 180],
  });

  paint.translate(x, y);

  return {
    id,
    paint,
    x,
    y,
    homeX: x,
    homeY: y,
    placed: false,
    color,
  };
}

// Background
const background = new TVG.Shape();
background.appendRect(0, 0, WIDTH, HEIGHT);
background.fill(20, 25, 38, 255);
canvas.add(background);

const divider = new TVG.Shape();
divider.moveTo(300, 70);
divider.lineTo(300, 530);
divider.stroke({
  width: 2,
  color: [120, 140, 170, 80],
  dash: [6, 8],
});
canvas.add(divider);

// Target slots
slots.push(
  createSlot('circle', 450, 150, createCircle, [90, 210, 255]),
);

slots.push(
  createSlot('square', 450, 300, createSquare, [255, 175, 70]),
);

slots.push(
  createSlot('triangle', 450, 450, createTriangle, [195, 120, 255]),
);

for (const slot of slots) {
  canvas.add(slot.paint);
}

// Draggable shape
items.push(
  createItem(
    'circle',
    145,
    150,
    createCircle,
    [90, 210, 255, 255],
  ),
);

items.push(
  createItem(
    'square',
    145,
    300,
    createSquare,
    [255, 175, 70, 255],
  ),
);

items.push(
  createItem(
    'triangle',
    145,
    450,
    createTriangle,
    [195, 120, 255, 255],
  ),
);

for (const item of items) {
  canvas.add(item.paint);
}

canvas.render();

// Coordinate conversion
function getPointerPosition(event) {
  const rect = canvasElement.getBoundingClientRect();

  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function intersectsPoint(paint, x, y) {
  const dpr = canvas.dpr;

  return paint.intersects(
    x * dpr,
    y * dpr,
    Math.max(1, dpr),
    Math.max(1, dpr),
    true,
  );
}

function findItemAt(x, y) {
  for (let index = items.length - 1; index >= 0; --index) {
    const item = items[index];

    if (intersectsPoint(item.paint, x, y)) {
      return item;
    }
  }

  return null;
}

function removeSelectionOutline() {
  if (!selectionOutline) {
    return;
  }

  canvas.remove(selectionOutline);
  selectionOutline = null;
}

function updateSelectionOutline() {
  removeSelectionOutline();

  if (!selectedItem) {
    canvas.render();
    return;
  }

  const bounds = selectedItem.paint.bounds();

  if (!bounds) {
    canvas.render();
    return;
  }

  const dpr = canvas.dpr;

  const x = bounds.x / dpr;
  const y = bounds.y / dpr;
  const width = bounds.width / dpr;
  const height = bounds.height / dpr;

  const padding = 8;

  selectionOutline = new TVG.Shape();

  selectionOutline.appendRect(
    x - padding,
    y - padding,
    width + padding * 2,
    height + padding * 2,
    {
      rx: 6,
      ry: 6,
    },
  );

  selectionOutline.fill(80, 255, 210, 20);

  selectionOutline.stroke({
    width: 2,
    color: [80, 255, 210, 255],
    dash: [7, 5],
  });

  canvas.add(selectionOutline);
  canvas.render();
}

function setSlotVisual(slot, state) {
  const color = slot.color;

  if (state === 'hover') {
    slot.paint.fill(255, 225, 80, 100);
    slot.paint.stroke({
      width: 5,
      color: [255, 225, 80, 255],
      dash: [8, 4],
    });
    return;
  }

  if (state === 'complete') {
    slot.paint.fill(80, 230, 150, 80);
    slot.paint.stroke({
      width: 4,
      color: [80, 230, 150, 255],
    });
    return;
  }

  slot.paint.fill(color[0], color[1], color[2], 35);
  slot.paint.stroke({
    width: 3,
    color: [color[0], color[1], color[2], 150],
    dash: [8, 6],
  });
}

function refreshSlotVisuals() {
  for (const slot of slots) {
    const completedItem = items.find(
      (item) => item.id === slot.id && item.placed,
    );

    if (completedItem) {
      setSlotVisual(slot, 'complete');
    } else if (slot === hoveredSlot) {
      setSlotVisual(slot, 'hover');
    } else {
      setSlotVisual(slot, 'idle');
    }
  }
}

function findSlotAt(x, y) {
  for (const slot of slots) {
    if (intersectsPoint(slot.paint, x, y)) {
      return slot;
    }
  }

  return null;
}

// Point interaction
function onPointerDown(event) {
  const point = getPointerPosition(event);
  const item = findItemAt(point.x, point.y);

  selectedItem = item;

  if (!selectedItem) {
    dragging = false;
    hoveredSlot = null;

    refreshSlotVisuals();
    updateSelectionOutline();

    canvas.update().render();
    return;
  }

  dragging = true;

  dragOffsetX = point.x - selectedItem.x;
  dragOffsetY = point.y - selectedItem.y;

  selectedItem.placed = false;

  canvasElement.setPointerCapture(event.pointerId);

  refreshSlotVisuals();
  updateSelectionOutline();

  canvas.update().render();
}

function onPointerMove(event) {
  if (!dragging || !selectedItem) {
    return;
  }

  const point = getPointerPosition(event);

  selectedItem.x = point.x - dragOffsetX;
  selectedItem.y = point.y - dragOffsetY;

  selectedItem.paint.translate(selectedItem.x, selectedItem.y);

  hoveredSlot = findSlotAt(selectedItem.x, selectedItem.y);

  refreshSlotVisuals();

  canvas.update();

  updateSelectionOutline();

  canvas.render();
}

function onPointerUp(event) {
  if (!dragging || !selectedItem) {
    return;
  }

  if (hoveredSlot && hoveredSlot.id === selectedItem.id) {
    selectedItem.x = hoveredSlot.x;
    selectedItem.y = hoveredSlot.y;
    selectedItem.placed = true;

    selectedItem.paint.translate(selectedItem.x, selectedItem.y);
  } else {
    selectedItem.placed = false;
  }

  dragging = false;
  hoveredSlot = null;

  if (canvasElement.hasPointerCapture(event.pointerId)) {
    canvasElement.releasePointerCapture(event.pointerId);
  }

  refreshSlotVisuals();

  canvas.update();
  updateSelectionOutline();
  canvas.render();
}

function onPointerCancel(event) {
  dragging = false;
  hoveredSlot = null;

  if (canvasElement.hasPointerCapture(event.pointerId)) {
    canvasElement.releasePointerCapture(event.pointerId);
  }

  refreshSlotVisuals();
  canvas.update().render();
}

// Reset
function resetEditor() {
  for (const item of items) {
    item.x = item.homeX;
    item.y = item.homeY;
    item.placed = false;

    item.paint.translate(item.x, item.y);
  }

  selectedItem = null;
  hoveredSlot = null;
  dragging = false;

  removeSelectionOutline();
  refreshSlotVisuals();

  canvas.update().render();
}

function onKeyDown(event) {
  if (event.key.toLowerCase() === 'r') {
    resetEditor();
  }
}

canvasElement.style.touchAction = 'none';
canvasElement.style.cursor = 'grab';

canvasElement.addEventListener(
  'pointerdown',
  onPointerDown,
  eventOptions,
);

canvasElement.addEventListener(
  'pointermove',
  onPointerMove,
  eventOptions,
);

canvasElement.addEventListener(
  'pointerup',
  onPointerUp,
  eventOptions,
);

canvasElement.addEventListener(
  'pointercancel',
  onPointerCancel,
  eventOptions,
);

window.addEventListener(
  'keydown',
  onKeyDown,
  eventOptions,
);
`,
};

const MAT = { minX: 98, minY: 142, maxX: 402, maxY: 358 };

function mapPoint(point, rect) {
  return {
    x: rect.x + ((point.x - MAT.minX) / (MAT.maxX - MAT.minX)) * rect.width,
    y: rect.y + ((point.y - MAT.minY) / (MAT.maxY - MAT.minY)) * rect.height,
  };
}

function mapWall(wall, rect) {
  const start = mapPoint(wall, rect);
  return {
    x: start.x,
    y: start.y,
    width: (wall.width / (MAT.maxX - MAT.minX)) * rect.width,
    height: (wall.height / (MAT.maxY - MAT.minY)) * rect.height,
  };
}

export function createExplorerSketch(host, getViewState) {
  return new window.p5((p) => {
    let canvas;

    const resize = () => {
      const width = Math.max(300, host.clientWidth);
      const height = Math.round(width / 1.43);
      if (canvas) p.resizeCanvas(width, height);
      return { width, height };
    };

    p.setup = () => {
      const size = resize();
      canvas = p.createCanvas(size.width, size.height);
      canvas.parent(host);
      p.pixelDensity(Math.min(window.devicePixelRatio, 2));
      p.textFont("Bahnschrift");
    };

    p.windowResized = resize;

    p.draw = () => {
      const state = getViewState();
      p.background("#e9e9e1");
      const padding = Math.max(24, p.width * 0.045);
      const rect = { x: padding, y: padding, width: p.width - padding * 2, height: p.height - padding * 2 };

      p.noStroke();
      p.fill("#d8d9cf");
      p.rect(rect.x, rect.y, rect.width, rect.height);

      p.stroke("#a8aba1");
      p.strokeWeight(1);
      for (let column = 0; column <= 7; column += 1) {
        const x = rect.x + (rect.width * column) / 7;
        p.line(x, rect.y, x, rect.y + rect.height);
      }
      for (let row = 0; row <= 5; row += 1) {
        const y = rect.y + (rect.height * row) / 5;
        p.line(rect.x, y, rect.x + rect.width, y);
      }

      p.stroke("#161916");
      p.strokeWeight(3);
      p.noFill();
      p.rect(rect.x, rect.y, rect.width, rect.height);

      for (const wall of state.walls.filter((item) => item.revealed)) {
        const mapped = mapWall(wall, rect);
        p.noStroke();
        p.fill("#171917");
        p.rect(mapped.x, mapped.y, mapped.width, mapped.height, 2);
        p.fill("#ff4e38");
        for (let offset = -mapped.height; offset < mapped.width; offset += 13) {
          p.quad(
            mapped.x + offset, mapped.y,
            mapped.x + offset + 6, mapped.y,
            mapped.x + offset + mapped.height + 6, mapped.y + mapped.height,
            mapped.x + offset + mapped.height, mapped.y + mapped.height,
          );
        }
      }

      if (state.targetVisible && state.target) {
        const target = mapPoint(state.target, rect);
        const pulse = 34 + Math.sin(p.frameCount * 0.18) * 8;
        p.noFill();
        p.stroke("#ffffff");
        p.strokeWeight(5);
        p.circle(target.x, target.y, pulse);
        p.stroke("#ff4e38");
        p.strokeWeight(2);
        p.circle(target.x, target.y, pulse + 14);
      }

      if (state.collisionPoint) {
        const collision = mapPoint(state.collisionPoint, rect);
        p.stroke("#ff4e38");
        p.strokeWeight(3);
        p.line(collision.x - 8, collision.y - 8, collision.x + 8, collision.y + 8);
        p.line(collision.x + 8, collision.y - 8, collision.x - 8, collision.y + 8);
      }

      if (state.cube?.hasPosition) {
        const cube = mapPoint(state.cube, rect);
        const color = state.cube.light ?? [55, 110, 255];
        p.noStroke();
        p.fill(color[0], color[1], color[2], 55);
        p.circle(cube.x, cube.y, 54);
        p.push();
        p.translate(cube.x, cube.y);
        p.rotate(state.cube.angle ?? 0);
        p.fill("#111311");
        p.rectMode(p.CENTER);
        p.rect(0, 0, 25, 25, 4);
        p.fill(color[0], color[1], color[2]);
        p.triangle(4, -6, 13, 0, 4, 6);
        p.pop();
      }

      if (state.rival) {
        const rival = mapPoint(state.rival, rect);
        p.noFill();
        p.stroke("#ff5b35");
        p.strokeWeight(2);
        p.circle(rival.x, rival.y, 40);
        p.push();
        p.translate(rival.x, rival.y);
        p.rotate(state.rival.angle ?? 0);
        p.rectMode(p.CENTER);
        p.stroke("#111311");
        p.strokeWeight(2);
        p.fill("#ff5b35");
        p.rect(0, 0, 23, 23, 2);
        p.fill("#111311");
        p.noStroke();
        p.triangle(3, -5, 12, 0, 3, 5);
        p.pop();
        p.noStroke();
        p.fill("#8e2819");
        p.textSize(10);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text("RIVAL", rival.x, rival.y - 24);
      }

      p.noStroke();
      p.fill("#111311");
      p.textSize(Math.max(10, p.width * 0.013));
      p.textAlign(p.LEFT, p.BOTTOM);
      p.text("N", rect.x + 8, rect.y + 20);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text(`${state.revealedCount}/${state.wallCount} WALLS`, rect.x + rect.width - 8, rect.y + rect.height - 8);
    };
  });
}
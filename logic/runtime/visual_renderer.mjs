#!/usr/bin/env node
"use strict";

/*
 * VISUAL RENDERER: SVG/ASCII ART FOR POLYGONS AND SOLIDS
 */

function circumradius(n, side) {
  if (n < 3) return 0;
  return side / (2 * Math.sin(Math.PI / n));
}

function apothem(n, side) {
  if (n < 3) return 0;
  return side / (2 * Math.tan(Math.PI / n));
}

function vertex(n, R, angle) {
  return {
    x: R * Math.cos(angle),
    y: R * Math.sin(angle)
  };
}

function renderPolygonASCII(n, side = 1, scale = 10) {
  const R = circumradius(n, side);
  const lines = [];
  const height = Math.ceil(2 * R * scale);
  const width = Math.ceil(2 * R * scale);
  
  const grid = Array(height).fill(null).map(() => Array(width).fill(" "));
  
  const points = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    points.push(vertex(n, R, angle));
  }
  
  const cx = Math.floor(R * scale);
  const cy = Math.floor(R * scale);
  
  for (const p of points) {
    const px = Math.round(cx + p.x * scale);
    const py = Math.round(cy + p.y * scale);
    if (px >= 0 && px < width && py >= 0 && py < height) {
      grid[py][px] = "*";
    }
  }
  
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    
    const x0 = Math.round(cx + p1.x * scale);
    const y0 = Math.round(cy + p1.y * scale);
    const x1 = Math.round(cx + p2.x * scale);
    const y1 = Math.round(cy + p2.y * scale);
    
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(x0 + (dx * s) / steps);
      const y = Math.round(y0 + (dy * s) / steps);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        grid[y][x] = "#";
      }
    }
  }
  
  return grid.map(row => row.join("")).join("\n");
}

function renderPolygonSVG(n, side = 1, scale = 40) {
  const R = circumradius(n, side);
  const r = apothem(n, side);
  
  const points = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    points.push(vertex(n, R, angle));
  }
  
  const width = 2 * R * scale + 40;
  const height = 2 * R * scale + 40;
  const cx = width / 2;
  const cy = height / 2;
  
  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">\n`;
  svg += `  <rect width="${width}" height="${height}" fill="white"/>\n`;
  
  const pathData = points.map((p, i) => {
    const x = cx + p.x * scale;
    const y = cy + p.y * scale;
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ") + " Z";
  
  svg += `  <polygon points="${points.map(p => `${cx + p.x * scale},${cy + p.y * scale}`).join(" ")}" fill="none" stroke="black" stroke-width="2"/>\n`;
  
  svg += `  <circle cx="${cx}" cy="${cy}" r="${r * scale}" fill="none" stroke="#ccc" stroke-width="1"/>\n`;
  
  const labels = ["△", "□", "⬠", "⬡", "⬢", "⬣"];
  svg += `  <text x="${cx + R * scale + 10}" y="${cy + 5}" font-family="monospace" font-size="14">${n}×${n}</text>\n`;
  svg += "</svg>";
  
  return svg;
}

function renderTetrahedronASCII(scale = 4) {
  const lines = [];
  const base = scale;
  
  lines.push(" ".repeat(base * 2) + "●");
  lines.push(" ".repeat(base) + "/ \\");
  lines.push("●——●");
  lines.push(" \\ /");
  lines.push("  ●");
  
  return lines.join("\n");
}

function renderCubeASCII(scale = 6) {
  const lines = [];
  const s = scale;
  
  lines.push(" ".repeat(s * 2) + "┌" + "─".repeat(s) + "��");
  lines.push(" ".repeat(s * 2) + "│" + " ".repeat(s) + "│");
  lines.push(" ".repeat(s) + "┌" + "─".repeat(s) + "┐" + "┌" + "─".repeat(s) + "┐");
  lines.push(" ".repeat(s) + "│" + " ".repeat(s) + "│" + "│" + " ".repeat(s) + "│");
  lines.push("┌" + "─".repeat(s) + "┐" + "│" + "□".repeat(s) + "│" + "└" + "─".repeat(s) + "┘");
  lines.push("│" + " ".repeat(s) + "│" + "│" + " ".repeat(s) + "│");
  lines.push("└" + "─".repeat(s) + "┘" + "└" + "─".repeat(s) + "┘");
  
  return lines.join("\n");
}

function renderOctahedronASCII(scale = 4) {
  const lines = [];
  const s = scale;
  
  lines.push(" ".repeat(s * 2) + "●");
  lines.push(" ".repeat(s) + "/ \\");
  lines.push("─●─");
  lines.push(" \\ /");
  lines.push("  ●");
  lines.push(" / \\");
  lines.push("─●─");
  
  return lines.join("\n");
}

export function testVisualRenderer() {
  console.log("=== VISUAL RENDERER ===\n");

  console.log("--- 2D Polygons (ASCII) ---");
  for (const n of [3, 4, 5, 6]) {
    console.log(`\n${n}-gon (ASCII):`);
    console.log(renderPolygonASCII(n, 1, 8).slice(0, 200));
  }

  console.log("\n--- 3D Solids (ASCII) ---");
  console.log("\ncube:");
  console.log(renderCubeASCII(4));

  console.log("\n--- SVG Output (first 500 chars) ---");
  console.log(renderPolygonSVG(6, 1).slice(0, 500));

  console.log("\n=== Visual Renderer Ready ===");
  return { rendered: "polygons + solids" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testVisualRenderer();
}
/*
    Falling sand simulation with velocity, water and walls
    by https://www.inriz.com

    Useful resource:
    https://thecodingtrain.com/challenges/180-falling-sand

*/


const canvas = document.getElementById('canvas');
const CELL_SIZE = 4;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let gridW = Math.floor(canvas.width / CELL_SIZE);
let gridH = Math.floor(canvas.height / CELL_SIZE);

let rgbaTextureBuffer = new Uint8Array(gridW * gridH * 4); // 4 bytes per pixel

// indexed by: x + y * gridW
let materials = new Uint8Array(gridW * gridH); // stores the material type of each cell
let updated = new Uint8Array(gridW * gridH); // stores whether a cell has been updated this frame
let yVel = new Uint8Array(gridW * gridH); // stores the y velocity of each cell
let xVel = new Uint8Array(gridW * gridH); // stores the x velocity of each cell

const MAT_AIR = 0;
const MAT_SAND = 1;
const MAT_WATER = 2;
const MAT_WALL = 3;
let currentSelection = MAT_SAND;

let mousedown = false;
let mouseX = 0;
let mouseY = 0;
let prevMouseX = 0;
let prevMouseY = 0;


function stepSimulation() {
    if (mousedown)
        fillCircles(mouseX, mouseY, prevMouseX, prevMouseY, 3, currentSelection);

    // mark all cells as not updated
    for (let i = 0; i < updated.length; i++) updated[i] = 0;

    for (let y = 0; y < gridH; y++) {
        const randMovement = Math.random() > 0.5 ? 0 : 1;

        for (let x = randMovement == 0 ? 0 : gridW; randMovement == 0 ? (x < gridW) : (x >= 0); randMovement == 0 ? x++ : x--) {
            const thisID = x + y * gridW;
            const matID = materials[thisID];
            yVel[thisID] += 1;

            const cellSolid = (dx, dy) => {
                const toID = thisID + dx * 1 + dy * gridW;
                return materials[toID] == MAT_WALL;
            }

            // try to move the cell to the given position
            const tryMove = (dx, dy) => {
                // find the distance to the ground
                let dist = 1;
                let tdist = yVel[thisID] / 18;
                while ((materials[thisID + dx * 1 + dy * dist * gridW] == 0 || (materials[thisID + dx * 1 + dy * dist * gridW] == 2 && matID == 1)) && dist <= tdist + 1) dist++;

                // if the distance is 1, then we can't move
                if (dist == 1) {
                    yVel[thisID] = 0;
                    return false;
                }
                dist--;

                const toID = thisID + dx * dist + dy * dist * gridW; // the cell we're moving to
                materials[toID] = materials[thisID]; // copy the material
                yVel[toID] = yVel[thisID]; // copy the velocity
                updated[toID] = 1; // mark the cell as updated

                if (thisID != toID) { // if we're not moving to the same cell
                    materials[thisID] = 0;
                    return true;
                }

                return false;
            };

            if (matID > MAT_AIR && updated[thisID] == 0) {
                // update particle
                if (matID != MAT_WALL) {
                    if (tryMove(0, 1)) continue;
                    // const tu = ((randMovement === 0) ^ ((x + y) & 1)) ? 1 : -1;
                    const tu = randMovement === 0 ? 1 : -1;
                    if (matID == MAT_WATER) {
                        // for water we try move left and right twice
                        if (tryMove(2 * tu, 0, yVel[thisID])) continue;
                        if (tryMove(-2 * tu, 0, yVel[thisID])) continue;
                    } else if (matID == MAT_SAND) {
                        // we don't want the sand moving diagonally thought walls
                        if (!cellSolid(1 * tu, 0) && (tryMove(1 * tu, 1, yVel[thisID]))) continue;
                        if (!cellSolid(-1 * tu, 0) && (tryMove(-1 * tu, 1, yVel[thisID]))) continue;
                    }

                }
            }
        }
    }
}

// draw a line between the previous mouse position and the current mouse position using the given radius and material
function fillCircles(mouseX, mouseY, prevMouseX, prevMouseY, radius, material) {
    const mouseCellX = Math.floor(mouseX / CELL_SIZE);
    const mouseCellY = Math.floor(mouseY / CELL_SIZE);
    const prevMouseCellX = Math.floor(prevMouseX / CELL_SIZE);
    const prevMouseCellY = Math.floor(prevMouseY / CELL_SIZE);

    const setCell = (x, y, material) => {
        const thisID = x + y * gridW;
        if (materials[thisID] == MAT_AIR || material == MAT_AIR || material == MAT_WALL)
            materials[thisID] = material;

        yVel[thisID] = 0;
    }

    const drawCircle = (x0, y0, radius, material) => {
        for (let x = -radius; x < radius; x++) {
            for (let y = -radius; y < radius; y++) {
                if (x * x + y * y <= radius * radius) {
                    setCell(x0 + x, y0 + y, material);
                }
            }
        }
    }

    const drawLine = (x0, y0, x1, y1, material) => {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        for (let i = 0; i < 20; i++) {
            drawCircle(x0, y0, radius, material);

            if ((x0 == x1) && (y0 == y1)) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    drawLine(prevMouseCellX, prevMouseCellY, mouseCellX, mouseCellY, material);
}

// called every frame, updates the simulation and draws the texture to the screen
function draw() {
    stepSimulation();
    let p = 0; // pixel index
    // update the texture buffer RGBA values
    for (let y = gridH - 1; y >= 0; y--) {
        for (let x = 0; x < gridW; x++) {
            const cellMaterial = materials[x + y * gridW];
            switch (cellMaterial) {
                case MAT_SAND:
                    // set the sand color
                    rgbaTextureBuffer[4 * p] = 200;
                    rgbaTextureBuffer[4 * p + 1] = 170;
                    rgbaTextureBuffer[4 * p + 2] = 120;
                    rgbaTextureBuffer[4 * p + 3] = 255;
                    break;
                case MAT_WATER:
                    // set the water color
                    rgbaTextureBuffer[4 * p] = 70;
                    rgbaTextureBuffer[4 * p + 1] = 120;
                    rgbaTextureBuffer[4 * p + 2] = 230;
                    rgbaTextureBuffer[4 * p + 3] = 255;
                    break;
                case MAT_WALL:
                    // set the wall color
                    rgbaTextureBuffer[4 * p] = 200;
                    rgbaTextureBuffer[4 * p + 1] = 120;
                    rgbaTextureBuffer[4 * p + 2] = 120;
                    rgbaTextureBuffer[4 * p + 3] = 0;
                    break;
                case MAT_AIR:
                default:
                    // set the air color
                    rgbaTextureBuffer[4 * p] = 10;
                    rgbaTextureBuffer[4 * p + 1] = 10;
                    rgbaTextureBuffer[4 * p + 2] = 20;
                    rgbaTextureBuffer[4 * p + 3] = 255;
                    break;
            }

            p++;
        }
    }

    // send CPU-generated texture to GPU
    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gridW, gridH, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgbaTextureBuffer);

    // draw the texture to the screen
    gl.drawArrays(gl.TRIANGLES, 0, 3 * 2);
    requestAnimationFrame(draw);
}



// WebGL and other setup:

const vertexShader = `
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPosition, 0., 1.);
  vTexCoord = aTexCoord;
}`;

const fragShader = `
precision mediump float;

uniform sampler2D iPixelBuffer;
uniform vec2 iResolution;
varying vec2 vTexCoord;

float hash(vec2 cord) {
    return fract(sin(dot(cord.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec4 pc = texture2D(iPixelBuffer, vTexCoord.xy);

    if (pc.a > 0.8) {
        // make the sand pattern

        vec2 pixw = 4.0 / iResolution.xy;
        // blur the sand by averaging the surrounding pixels
        pc += texture2D(iPixelBuffer, vTexCoord.xy + vec2(-pixw.x, 0)) 
            + texture2D(iPixelBuffer, vTexCoord.xy + vec2(0, pixw.y)) 
            + texture2D(iPixelBuffer, vTexCoord.xy + vec2(0, -pixw.y)) 
            + texture2D(iPixelBuffer, vTexCoord.xy + vec2(pixw.x, 0));
        pc.rgb /= 5.0;
        float af = dot(normalize(pc.rgb), normalize(vec3(0.97647058823, 0.85882352941, 0.66274509803)));
        gl_FragColor.rgb = pc.rgb + hash(vTexCoord + vec2(pc.r, 0.0)) * clamp(pow(af, 50.0), 0.0, 1.0) / 4.0;
    } else {
        // make the brick pattern

        vec2 lc = vTexCoord.xy * iResolution.xy;
        
        gl_FragColor.rgb = pc.rgb;
        float brickLineWidth = 0.06;
        float brickW = 30.0;
        float brickH = 15.0;
        bool onVert = mod(lc.x, brickW) < brickW * brickLineWidth;
        bool onHorz = mod(lc.y, brickH) < brickH * brickLineWidth * brickW / brickH;
        if (onVert || onHorz) {
            gl_FragColor.rgb *= 1.4;
        }
    }

    gl_FragColor.a = 1.0; 
}
`;


const gl = canvas.getContext('webgl');
if (!gl) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    throw "Unable to initialize WebGL. Your browser or machine may not support it.";
}

function createShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var info = gl.getShaderInfoLog(shader);
        throw 'Could not compile WebGL program \n\n' + info;
    }
    return shader;
}
const vert = createShader(gl, vertexShader, gl.VERTEX_SHADER);
const frag = createShader(gl, fragShader, gl.FRAGMENT_SHADER);
const program = gl.createProgram();

gl.attachShader(program, vert);
gl.attachShader(program, frag);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    var info = gl.getProgramInfoLog(program);
    throw 'Could not compile WebGL program \n\n' + info;
}

const positionLocation = gl.getAttribLocation(program, "aPosition");
const texcoordLocation = gl.getAttribLocation(program, "aTexCoord");

const positionBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

function setRectangle(gl, x, y, toX, toY) {
    const x1 = x;
    const x2 = toX;
    const y1 = y;
    const y2 = toY;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
}

setRectangle(gl, -1, -1, 1, 1);

const texcoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0,
]), gl.STATIC_DRAW);

const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

const resolutionLocation = gl.getUniformLocation(program, "iResolution");

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.useProgram(program);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

gl.enableVertexAttribArray(texcoordLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

gl.useProgram(program);
gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

canvas.addEventListener('mousedown', e => {
    mousedown = true;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;
});

canvas.addEventListener('mouseup', () => { mousedown = false; });

canvas.addEventListener('touchstart', e => {
    mousedown = true;
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', () => { mousedown = false; });

canvas.addEventListener('mousemove', e => {
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;
});

canvas.addEventListener('touchmove', e => {
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
});

const setSandBtn = document.getElementById('set_sand');
const setWaterBtn = document.getElementById('set_water');
const setWallBtn = document.getElementById('set_wall');
const setEraserBtn = document.getElementById('set_eraser');

function setSand() {
    setSandBtn.classList.add('selected');
    setWaterBtn.classList.remove('selected');
    setWallBtn.classList.remove('selected');
    setEraserBtn.classList.remove('selected');
    currentSelection = MAT_SAND;
}

function setWater() {
    setSandBtn.classList.remove('selected');
    setWaterBtn.classList.add('selected');
    setWallBtn.classList.remove('selected');
    setEraserBtn.classList.remove('selected');
    currentSelection = MAT_WATER;
}

function setWall() {
    setSandBtn.classList.remove('selected');
    setWaterBtn.classList.remove('selected');
    setWallBtn.classList.add('selected');
    setEraserBtn.classList.remove('selected');
    currentSelection = MAT_WALL;
}

function setEraser() {
    setSandBtn.classList.remove('selected');
    setWaterBtn.classList.remove('selected');
    setWallBtn.classList.remove('selected');
    setEraserBtn.classList.add('selected');
    currentSelection = MAT_AIR;
}

setSandBtn.addEventListener('click', setSand);
setWaterBtn.addEventListener('click', setWater);
setWallBtn.addEventListener('click', setWall);
setEraserBtn.addEventListener('click', setEraser);
setSand();


// draw to the default framebuffer (the screen)
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
requestAnimationFrame(draw);

// resize the canvas and buffers when the window is resized
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    const oldGridW = gridW;
    const oldGridH = gridH;

    gridW = Math.floor(canvas.width / CELL_SIZE);
    gridH = Math.floor(canvas.height / CELL_SIZE);

    const newCells = new Uint8Array(gridW * gridH);
    const newUpdated = new Uint8Array(gridW * gridH);
    const newYVel = new Uint8Array(gridW * gridH);
    const newXVel = new Uint8Array(gridW * gridH);
    const newRtexbuff = new Uint8Array(gridW * gridH * 4);

    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const oldID = x + y * oldGridW;
            const newID = x + y * gridW;
            newCells[newID] = materials[oldID];
            newUpdated[newID] = updated[oldID];
            newYVel[newID] = yVel[oldID];
            newXVel[newID] = xVel[oldID];
            newRtexbuff[newID] = rgbaTextureBuffer[oldID];
        }
    }

    materials = newCells;
    updated = newUpdated;
    yVel = newYVel;
    xVel = newXVel;
    rgbaTextureBuffer = newRtexbuff;

}

window.addEventListener('resize', resize);

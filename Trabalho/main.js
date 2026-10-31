const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// ==================================================
// SHADERS
// ==================================================

const vertexShaderSource = `#version 300 es

in vec3 aPosition;
in vec3 aNormal;
in vec3 aColor;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec3 vColor;
out vec3 vNormal;
out vec3 vWorldPos;

void main() {

    vec4 world = u_model * vec4(aPosition, 1.0);

    vWorldPos = world.xyz;
    vNormal   = mat3(u_model) * aNormal;
    vColor    = aColor;

    gl_Position = u_projection * u_view * world;
}
`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

in vec3 vColor;
in vec3 vNormal;
in vec3 vWorldPos;

uniform vec3 u_cameraPos;

out vec4 outColor;

void main() {

    vec3 n = normalize(vNormal);
    vec3 toCamera = normalize(u_cameraPos - vWorldPos);

    // faces de costas para a câmera: inverte a normal (luz dos dois lados)
    if (dot(n, toCamera) < 0.0) {
        n = -n;
    }

    // luz principal (sol) + luz de preenchimento + ambiente
    vec3 keyDir  = normalize(vec3( 0.5, 1.0, 0.8));
    vec3 fillDir = normalize(vec3(-0.8, 0.2, -0.5));

    float key  = max(dot(n, keyDir), 0.0);
    float fill = max(dot(n, fillDir), 0.0);

    // brilho leve
    vec3 h = normalize(keyDir + toCamera);
    float spec = pow(max(dot(n, h), 0.0), 32.0) * 0.20;

    vec3 light = vec3(0.30) + key * vec3(0.85, 0.82, 0.75) + fill * vec3(0.25, 0.30, 0.45);

    vec3 color = vColor * light + spec;

    // névoa leve: objetos distantes se misturam com o céu
    float dist = length(u_cameraPos - vWorldPos);
    float fog = clamp((dist - 35.0) / 60.0, 0.0, 1.0);
    vec3 skyColor = vec3(0.46, 0.70, 0.92);

    outColor = vec4(mix(color, skyColor, fog), 1.0);
}
`;

function createShader(gl, type, source) {

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error);
    }

    return shader;
}

function createProgram(gl, vsSource, fsSource) {

    const program = gl.createProgram();

    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }

    return program;
}

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
gl.useProgram(program);

// ==================================================
// MATRIZES DE CÂMERA 
// ==================================================

function perspective(fovRad, aspect, near, far) {
    const f = 1 / Math.tan(fovRad / 2);
    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) / (near - far), -1,
        0, 0, (2 * far * near) / (near - far), 0
    ];
}

function lookAt(eye, target, up) {

    let z = [eye[0]-target[0], eye[1]-target[1], eye[2]-target[2]];
    let len = Math.hypot(...z);
    z = z.map(v => v / len);

    let x = [
        up[1]*z[2] - up[2]*z[1],
        up[2]*z[0] - up[0]*z[2],
        up[0]*z[1] - up[1]*z[0]
    ];
    len = Math.hypot(...x);
    x = x.map(v => v / len);

    const y = [
        z[1]*x[2] - z[2]*x[1],
        z[2]*x[0] - z[0]*x[2],
        z[0]*x[1] - z[1]*x[0]
    ];

    const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];

    return [
        x[0], y[0], z[0], 0,
        x[1], y[1], z[1], 0,
        x[2], y[2], z[2], 0,
        -dot(x, eye), -dot(y, eye), -dot(z, eye), 1
    ];
}

// ==================================================
// OBJETOS DA CENA
// ==================================================

function createAttribute(name, data) {

    const location = gl.getAttribLocation(program, name);
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
}

function createSceneObject(mesh) {

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    createAttribute("aPosition", mesh.vertices);
    createAttribute("aNormal",   mesh.normals);
    createAttribute("aColor",    mesh.colors);

    return {
        vao: vao,
        count: mesh.count,
        modelTransform: m4.identity()
    };
}

const ground    = createSceneObject(createGround());
const road      = createSceneObject(createRoad());
const buildings = createSceneObject(createBuildings());
const shadow    = createSceneObject(createShadow());
const arwing    = createSceneObject(createArwing());

const uModel      = gl.getUniformLocation(program, "u_model");
const uView       = gl.getUniformLocation(program, "u_view");
const uProjection = gl.getUniformLocation(program, "u_projection");
const uCameraPos  = gl.getUniformLocation(program, "u_cameraPos");

function drawObject(object) {

    gl.uniformMatrix4fv(uModel, false, object.modelTransform);
    gl.bindVertexArray(object.vao);
    gl.drawArrays(gl.TRIANGLES, 0, object.count);
}

// ==================================================
// ESCALA E POSIÇÃO DA NAVE NA CENA
// ==================================================

const SHIP_SCALE  = 0.6;
const SHIP_HEIGHT = 3.2;

// ==================================================
// CONTROLE DA CÂMERA (mouse)
// ==================================================

let camYaw      = 0.7;
let camPitch    = 0.30;
let camDistance = 16;
let autoRotate  = false;

let dragging = false;
let lastX = 0, lastY = 0;

canvas.addEventListener("mousedown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

window.addEventListener("mouseup", () => dragging = false);

window.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    camYaw   -= (e.clientX - lastX) * 0.01;
    camPitch += (e.clientY - lastY) * 0.01;
    camPitch  = Math.max(0.02, Math.min(1.5, camPitch));   // não deixa a câmera entrar no chão

    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    camDistance *= (e.deltaY > 0) ? 1.08 : 0.92;
    camDistance = Math.max(4, Math.min(60, camDistance));
}, { passive: false });

window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        autoRotate = !autoRotate;
    }
});

// ==================================================
// CONFIGURAÇÃO INICIAL DO WEBGL
// ==================================================

gl.clearColor(0.46, 0.70, 0.92, 1.0);   // céu de Corneria
gl.viewport(0, 0, canvas.width, canvas.height);
gl.enable(gl.DEPTH_TEST);

// ==================================================
// LOOP DE ANIMAÇÃO
// ==================================================

let time = 0;

function render() {

    time += 0.016;

    if (autoRotate) {
        camYaw += 0.006;
    }

    // Nave
    const altura = SHIP_HEIGHT + 0.15 * Math.sin(time * 1.5);
    const inclinacao = 0.12 * Math.sin(time * 0.9);

    let m = m4.identity();
    m = m4.scale(m, SHIP_SCALE, SHIP_SCALE, SHIP_SCALE);
    m = m4.zRotate(m, inclinacao);
    m = m4.translate(m, 0, altura, 0);
    arwing.modelTransform = m;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const alvo = [0, 2.5, 0];
    const eye = [
        alvo[0] + camDistance * Math.cos(camPitch) * Math.sin(camYaw),
        alvo[1] + camDistance * Math.sin(camPitch),
        alvo[2] + camDistance * Math.cos(camPitch) * Math.cos(camYaw)
    ];

    const view = lookAt(eye, alvo, [0, 1, 0]);
    const proj = perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 200);

    gl.uniformMatrix4fv(uView, false, view);
    gl.uniformMatrix4fv(uProjection, false, proj);
    gl.uniform3fv(uCameraPos, eye);

    drawObject(ground);
    drawObject(road);
    drawObject(buildings);
    drawObject(shadow);
    drawObject(arwing);

    requestAnimationFrame(render);
}

render();

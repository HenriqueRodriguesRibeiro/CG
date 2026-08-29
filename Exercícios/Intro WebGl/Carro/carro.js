const canvas = document.getElementById("canvasCarro");
const gl = canvas.getContext("webgl2");

// --- SETUP DO WEBGL (Shaders, Programa, etc) ---
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

const vertexShaderSource = `#version 300 es
in vec2 aPosition;
uniform vec2 uResolution; 
void main() {
    vec2 clipSpace = ((aPosition / uResolution) * 2.0) - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0.0, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision mediump float;
uniform vec4 uColor; 
out vec4 outColor;
void main() { outColor = uColor; }`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const program = gl.createProgram();
gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexShaderSource));
gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource));
gl.linkProgram(program);

const positionLocation = gl.getAttribLocation(program, "aPosition");
const resolutionLocation = gl.getUniformLocation(program, "uResolution");
const colorLocation = gl.getUniformLocation(program, "uColor");

gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

gl.clearColor(0.9, 0.9, 0.9, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.useProgram(program);
gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

// --- FUNÇÕES DE DESENHO ---

function desenharRetangulo(x, y, largura, altura, cor) {
    const vertices = new Float32Array([
        x, y, x + largura, y, x, y + altura,
        x, y + altura, x + largura, y, x + largura, y + altura
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.uniform4f(colorLocation, cor[0], cor[1], cor[2], cor[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Nova função: Desenha polígonos quaisquer (como a cabine trapezoidal)
function desenharPoligono(coords, cor) {
    const vertices = new Float32Array(coords);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.uniform4f(colorLocation, cor[0], cor[1], cor[2], cor[3]);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, coords.length / 2);
}

// Nova função: Desenha círculos usando múltiplos triângulos
function desenharCirculo(cx, cy, raio, cor, segmentos = 30) {
    const vertices = [cx, cy]; // Vértice central
    for (let i = 0; i <= segmentos; i++) {
        const angulo = (i * 2 * Math.PI) / segmentos;
        vertices.push(cx + Math.cos(angulo) * raio, cy + Math.sin(angulo) * raio);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.uniform4f(colorLocation, cor[0], cor[1], cor[2], cor[3]);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, segmentos + 2);
}

// --- CONSTRUINDO O CARRO ---
const corCabine = [0.9, 0.3, 0.2, 1.0];
const corJanela = [0.9, 0.94, 0.94, 1.0];
const corChassi = [0.75, 0.2, 0.15, 1.0];
const corRoda = [0.17, 0.24, 0.31, 1.0];
const corCalota = [0.74, 0.76, 0.78, 1.0];

// Cabine (Trapezóide usando a função de Polígono)
desenharPoligono([
    160, 200, // inferior esquerdo
    240, 200, // inferior direito
    220, 165, // superior direito
    180, 165  // superior esquerdo
], corCabine);

// Janelas
desenharRetangulo(185, 170, 13, 25, corJanela);
desenharRetangulo(202, 170, 13, 25, corJanela);

// Chassi
desenharRetangulo(130, 200, 140, 35, corChassi);

// Rodas e Calotas
desenharCirculo(160, 235, 18, corRoda);
desenharCirculo(240, 235, 18, corRoda);
desenharCirculo(160, 235, 8, corCalota);
desenharCirculo(240, 235, 8, corCalota);
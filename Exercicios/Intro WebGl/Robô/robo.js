const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// 1 & 2. BUFFER
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

// 3. VERTEX SHADER
const vertexShaderSource = `#version 300 es
in vec2 aPosition;
uniform vec2 uResolution; 

void main() {
    vec2 zeroToOne = aPosition / uResolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0.0, 1.0);
}
`;

// 4. FRAGMENT SHADER
const fragmentShaderSource = `#version 300 es
precision mediump float;
uniform vec4 uColor; 
out vec4 outColor;

void main() {
    outColor = uColor;
}
`;

// 5. COMPILAR SHADERS
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

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// 6. CRIAR PROGRAMA
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
}

// 7. LOCAL DO ATRIBUTO E UNIFORMS
const positionLocation = gl.getAttribLocation(program, "aPosition");
const resolutionLocation = gl.getUniformLocation(program, "uResolution");
const colorLocation = gl.getUniformLocation(program, "uColor");

// 8. CONFIGURAR ATRIBUTO
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// 9. LIMPAR TELA E INICIAR PROGRAMA
gl.clearColor(0.9, 0.9, 0.9, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.useProgram(program);
gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

// 10. DESENHAR
function desenharRetangulo(x, y, largura, altura, cor) {
    const x1 = x;
    const x2 = x + largura;
    const y1 = y;
    const y2 = y + altura;

    const vertices = new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.uniform4f(colorLocation, cor[0], cor[1], cor[2], cor[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// --- CONSTRUINDO O ROBÔ ---
const corCorpo = [0.5, 0.55, 0.55, 1.0];
const corBracoPerna = [0.7, 0.75, 0.75, 1.0];
const corAntena = [0.4, 0.4, 0.4, 1.0];
const corOlho = [0.0, 0.9, 1.0, 1.0]; 
const corAlerta = [1.0, 0.2, 0.2, 1.0]; 

desenharRetangulo(198, 70, 4, 30, corAntena);
desenharRetangulo(196, 60, 8, 10, corAlerta);
desenharRetangulo(170, 100, 60, 50, corCorpo);
desenharRetangulo(180, 110, 10, 10, corOlho);
desenharRetangulo(210, 110, 10, 10, corOlho);
desenharRetangulo(160, 155, 80, 90, corCorpo);
desenharRetangulo(140, 155, 15, 60, corBracoPerna);
desenharRetangulo(245, 155, 15, 60, corBracoPerna);
desenharRetangulo(175, 245, 15, 50, corBracoPerna);
desenharRetangulo(210, 245, 15, 50, corBracoPerna);
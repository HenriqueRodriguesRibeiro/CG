const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// VERTICES E CORES
// --------------------------------------------------

function verticesBarra(){
    return new Float32Array([
        -0.05,  0.2,
        -0.05, -0.2,
         0.05,  0.2,
         0.05,  0.2,
        -0.05, -0.2,
         0.05, -0.2
    ]);
}

function verticesBola(){
    let vertices = [];
    let numSegments = 30;
    let radius = 0.05;

    for (let i = 0; i < numSegments; i++) {
        let theta1 = (i / numSegments) * 2 * Math.PI;
        let theta2 = ((i + 1) / numSegments) * 2 * Math.PI;

        vertices.push(0, 0); // Center of the circle
        vertices.push(radius * Math.cos(theta1), radius * Math.sin(theta1));
        vertices.push(radius * Math.cos(theta2), radius * Math.sin(theta2));
    }

    return new Float32Array(vertices);
}

let verticesBarraDireita = verticesBarra();

let corBarraDireita = new Float32Array([
    0.0, 0.0, 1.0,
]);

let verticesBarraEsquerda = verticesBarra();

let corBarraEsquerda = new Float32Array([
    0.0, 1.0, 0.0,
]);

let verticesBolaCentro = verticesBola();

let corBolaCentro = new Float32Array([
    1.0, 0.0, 0.0,
]);

// --------------------------------------------------
// TRANSFORMAÇÕES
// --------------------------------------------------

let MbarraEsquerda = m3.translation(-0.9, 0.0);

let MbarraDireita = m3.translation(0.9, 0.0);

let MbolaCentro = m3.identity();

// --------------------------------------------------
// TECLADO
// --------------------------------------------------

const teclasPressionadas = {};

window.addEventListener("keydown", (e) => {
    teclasPressionadas[e.key] = true;
});

window.addEventListener("keyup", (e) => {
    teclasPressionadas[e.key] = false;
});

// --------------------------------------------------
// PLACAR
// --------------------------------------------------

let placarEsquerda = 0;
let placarDireita = 0;

const placarEsquerdaEl = document.getElementById("placarEsquerda");
const placarDireitaEl = document.getElementById("placarDireita");

function atualizaPlacar() {
    placarEsquerdaEl.textContent = placarEsquerda;
    placarDireitaEl.textContent = placarDireita;
}

// --------------------------------------------------
// BUFFER
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();

// --------------------------------------------------
// VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_transform;

out vec3 vColor;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}

`;


// --------------------------------------------------
// FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
}

`;


// --------------------------------------------------
// COMPILAR SHADERS
// --------------------------------------------------

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


const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);


// --------------------------------------------------
// CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}


// --------------------------------------------------
// LOCAL DOS ATRIBUTOS E DO UNIFORM
// --------------------------------------------------

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation =
    gl.getUniformLocation(
        program,
        "uColor"
    );

const transformLocation =
    gl.getUniformLocation(
        program,
        "u_transform"
    );

// --------------------------------------------------
// LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// DESENHAR
// --------------------------------------------------

const numComponents = 2;

function drawScene(){
    
    atualizaAnimacao();

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    drawBarraEsquerda();
    drawBarraDireita();
    drawBolaCentro();
    
    requestAnimationFrame(drawScene);
}

function drawBarraEsquerda(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraEsquerda,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraEsquerda
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraEsquerda
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraEsquerda.length / numComponents
    );

}

function drawBarraDireita(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraDireita,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraDireita
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraDireita
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraDireita.length / numComponents
    );

}

function drawBolaCentro(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBolaCentro,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBolaCentro
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbolaCentro
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBolaCentro.length / numComponents
    );

}

// --------------------------------------------------
// PARÂMETROS ANIMAÇÃO
// --------------------------------------------------

const velocidadeBarra = 0.03;
const limiteBarra = 0.8; // metade da altura da barra (0.2) subtraída do limite da tela (1.0)

let tyBarraEsquerda = 0.0;
let tyBarraDireita = 0.0;

let txBola = 0.0;
let tyBola = 0.0;
let txBola_offset = 0.008;
let tyBola_offset = 0.006;

const raioBola = 0.05;
const meiaLarguraBarra = 0.05;
const meiaAlturaBarra = 0.2;

function moverBarras(){
    // Barra esquerda: W (cima) / S (baixo)
    if (teclasPressionadas["w"] || teclasPressionadas["W"]) {
        tyBarraEsquerda += velocidadeBarra;
    }
    if (teclasPressionadas["s"] || teclasPressionadas["S"]) {
        tyBarraEsquerda -= velocidadeBarra;
    }

    // Barra direita: setas cima / baixo
    if (teclasPressionadas["ArrowUp"]) {
        tyBarraDireita += velocidadeBarra;
    }
    if (teclasPressionadas["ArrowDown"]) {
        tyBarraDireita -= velocidadeBarra;
    }

    tyBarraEsquerda = Math.min(limiteBarra, Math.max(-limiteBarra, tyBarraEsquerda));
    tyBarraDireita = Math.min(limiteBarra, Math.max(-limiteBarra, tyBarraDireita));

    MbarraEsquerda = m3.translation(-0.9, tyBarraEsquerda);
    MbarraDireita = m3.translation(0.9, tyBarraDireita);
}

function colideComBarra(paddleX, paddleY, ladoEsquerdo){
    const dentroDoY = Math.abs(tyBola - paddleY) <= (meiaAlturaBarra + raioBola);

    const dentroDoX = ladoEsquerdo
        ? (txBola - raioBola <= paddleX + meiaLarguraBarra)
        : (txBola + raioBola >= paddleX - meiaLarguraBarra);

    return dentroDoX && dentroDoY;
}

function resetBola(){
    txBola = 0.0;
    tyBola = 0.0;

    const direcaoX = Math.random() > 0.5 ? 1 : -1;
    const direcaoY = Math.random() > 0.5 ? 1 : -1;

    txBola_offset = 0.008 * direcaoX;
    tyBola_offset = 0.006 * direcaoY;
}

function atualizaAnimacao(){
    moverBarras();

    txBola += txBola_offset;
    tyBola += tyBola_offset;

    // Colisão com o teto e o chão
    if (tyBola + raioBola > 1.0 || tyBola - raioBola < -1.0) {
        tyBola_offset = -tyBola_offset;
    }

    // Colisão com a barra esquerda (bola indo para a esquerda)
    if (txBola_offset < 0 && colideComBarra(-0.9, tyBarraEsquerda, true)) {
        txBola_offset = -txBola_offset;
    }

    // Colisão com a barra direita (bola indo para a direita)
    if (txBola_offset > 0 && colideComBarra(0.9, tyBarraDireita, false)) {
        txBola_offset = -txBola_offset;
    }

    // Pontuação
    if (txBola < -1.0) {
        placarDireita++;
        atualizaPlacar();
        resetBola();
    } else if (txBola > 1.0) {
        placarEsquerda++;
        atualizaPlacar();
        resetBola();
    }

    MbolaCentro = m3.translation(txBola, tyBola);
}


// --------------------------------------------------
// INÍCIO DO DESENHO
// --------------------------------------------------

drawScene();
const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

const vertexShaderSource = `#version 300 es
in vec2 aPosition;
uniform mat3 u_viewTransform;
uniform mat3 u_modelTransform;

void main() {
    vec3 position = u_viewTransform * u_modelTransform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;
uniform vec3 uColor;
out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
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

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }
    return program;
}

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

// ==================================================
// CLASSE RENDERER
// ==================================================

class Renderer {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        this.positionLocation = gl.getAttribLocation(program, "aPosition");
        this.colorLocation = gl.getUniformLocation(program, "uColor");
        this.viewTransformLocation = gl.getUniformLocation(program, "u_viewTransform");
        this.modelTransformLocation = gl.getUniformLocation(program, "u_modelTransform");
        this.viewTransform = m3.identity();
        this.verticesBuffer = gl.createBuffer();
    }

    defineViewTransform(viewTransform) {
        this.viewTransform = viewTransform;
    }

    draw(object) {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, object.vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.uniform3fv(this.colorLocation, object.color);
        gl.uniformMatrix3fv(this.modelTransformLocation, false, object.modelTransform);
        gl.uniformMatrix3fv(this.viewTransformLocation, false, this.viewTransform);
        gl.drawArrays(gl.TRIANGLES, 0, object.vertices.length / 2);
    }
}

// ==================================================
// FUNÇÕES AUXILIARES
// ==================================================

function rectangleVertices(x, y, width, height) {
    return [
        x, y,
        x + width, y + height,
        x, y + height,
        x, y,
        x + width, y,
        x + width, y + height
    ];
}

// ==================================================
// CLASSE SCENE OBJECT
// ==================================================

class SceneObject {
    constructor(vertices, color) {
        this.vertices = new Float32Array(vertices);
        this.color = new Float32Array(color);
        this.modelTransform = m3.identity();
    }
    updateModelTransform(modelTransform) {
        this.modelTransform = modelTransform;
    }
}

// ==================================================
// CLASSE ROBOT
// ==================================================

class Robot {
    constructor(tx, ty, color, speed) {
        this.tx = tx;
        this.ty = ty;
        this.speed = speed;
        this.time = 0.0;

        // Criação das partes usando deslocamentos locais (x, y, largura, altura)
        // Os pontos de origem (pivôs) afetam como as partes giram
        this.body = new SceneObject(rectangleVertices(-0.15, -0.2, 0.3, 0.4), color);
        
        // Cabeça desenhada do centro da base para cima
        this.head = new SceneObject(rectangleVertices(-0.1, 0.0, 0.2, 0.2), color);
        
        // Braços pendurados a partir do topo central deles
        this.leftArm = new SceneObject(rectangleVertices(-0.04, -0.3, 0.08, 0.3), [0.8, 0.8, 0.8]);
        this.rightArm = new SceneObject(rectangleVertices(-0.04, -0.3, 0.08, 0.3), [0.4, 0.4, 0.4]);
        
        // Pernas penduradas a partir do topo central
        this.leftLeg = new SceneObject(rectangleVertices(-0.05, -0.35, 0.1, 0.35), [0.3, 0.3, 0.3]);
        this.rightLeg = new SceneObject(rectangleVertices(-0.05, -0.35, 0.1, 0.35), [0.2, 0.2, 0.2]);
    }

    move() {
        this.tx += this.speed;
        this.time += 0.08; // Velocidade da oscilação dos membros

        // Bate e volta
        if (this.tx > 1.8 || this.tx < -1.8) {
            this.speed = -this.speed;
        }

        // Matriz global do corpo
        const bodyTransform = m3.translation(this.tx, this.ty);
        this.body.updateModelTransform(bodyTransform);

        // Cabeça: ancorada no topo do corpo
        const headT = m3.multiply(bodyTransform, m3.translation(0.0, 0.2));
        this.head.updateModelTransform(headT);

        // Animação de pêndulo usando seno
        const swing = Math.sin(this.time) * 0.4;

        // Braço esquerdo: ancorado no ombro esquerdo e rotacionando
        const lArmPivot = m3.multiply(bodyTransform, m3.translation(-0.17, 0.1));
        this.leftArm.updateModelTransform(m3.multiply(lArmPivot, m3.rotation(swing)));

        // Braço direito: movimenta ao contrário
        const rArmPivot = m3.multiply(bodyTransform, m3.translation(0.17, 0.1));
        this.rightArm.updateModelTransform(m3.multiply(rArmPivot, m3.rotation(-swing)));

        // Perna esquerda: move ao contrário do braço esquerdo
        const lLegPivot = m3.multiply(bodyTransform, m3.translation(-0.08, -0.2));
        this.leftLeg.updateModelTransform(m3.multiply(lLegPivot, m3.rotation(-swing)));

        // Perna direita: move junto com o braço esquerdo
        const rLegPivot = m3.multiply(bodyTransform, m3.translation(0.08, -0.2));
        this.rightLeg.updateModelTransform(m3.multiply(rLegPivot, m3.rotation(swing)));
    }

    draw(renderer) {
        // Renderizar do fundo para a frente (pseudo-profundidade)
        renderer.draw(this.rightArm);
        renderer.draw(this.rightLeg);
        renderer.draw(this.body);
        renderer.draw(this.head);
        renderer.draw(this.leftLeg);
        renderer.draw(this.leftArm);
    }
}

// ==================================================
// CLASSE SCENE
// ==================================================

class Scene {
    constructor(gl, program) {
        this.renderer = new Renderer(gl, program);
        this.viewTransform = m3.setClippingWindow(-2.0, -1.0, 2.0, 1.0);
        this.renderer.defineViewTransform(this.viewTransform);

        // Chão/Estrada de fundo
        this.floor = new SceneObject(
            rectangleVertices(-2.0, -0.55, 4.0, 0.1),
            [0.3, 0.3, 0.3]
        );

        this.robots = [
            new Robot(0.5, -0.2, [0.0, 0.5, 1.0], 0.005),
            new Robot(-0.8, -0.2, [1.0, 0.2, 0.0], 0.003)
        ];
    }

    update() {
        for (const robot of this.robots) {
            robot.move();
        }
    }

    draw() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);

        this.renderer.draw(this.floor);

        for (const robot of this.robots) {
            robot.draw(this.renderer);
        }
    }

    execute() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.execute());
    }

    init() {
        requestAnimationFrame(() => this.execute());
    }
}

// ==================================================
// CONFIGURAÇÃO INICIAL DO WEBGL
// ==================================================

gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.viewport(0, 0, canvas.width, canvas.height);

const scene = new Scene(gl, program);
scene.init();
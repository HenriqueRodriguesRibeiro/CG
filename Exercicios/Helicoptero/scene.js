// ==================================================
// CLASS - SCENE
// ==================================================

class Scene {

    constructor(gl, program) {

        this.renderer =
            new Renderer(gl, program);

        // Figura que será exibida
        this.helicopterBody = new HelicopterBody();

        this.helicopterTopShaft = new HelicopterTopShaft();

        this.helicopterTail = new HelicopterTail();

        this.helicopterPropellers = new HelicopterPropellers();

        this.helicopterTailPropeller = new HelicopterTailPropeller();

        // ==============================================
        // Posição do helicóptero (movida pelas setas)
        // ==============================================
        this.helicopterX = 0.0;
        this.helicopterY = 0.0;

        // Velocidade de deslocamento por frame
        this.moveSpeed = 0.015;

        // Limites para o helicóptero não sair da tela
        this.limits = {
            minX: -0.6, maxX: 0.6,
            minY: -0.6, maxY: 0.6,
        };

        // ==============================================
        // Orientação do helicóptero (rotação pelo WASD)
        // ==============================================
        this.helicopterYaw = 0.0;   // A / D -> gira em torno do eixo Y
        this.helicopterPitch = 0.0; // W / S -> gira em torno do eixo X

        // Velocidade de rotação por frame
        this.rotateSpeed = 0.02;

        // ==============================================
        // Ângulos de rotação das hélices (giram sempre)
        // ==============================================
        this.mainRotorAngle = 0.0;
        this.tailRotorAngle = 0.0;

        // Velocidade de rotação de cada hélice
        this.mainRotorSpeed = 0.15;
        this.tailRotorSpeed = 0.35;

        // Teclas atualmente pressionadas
        this.keysPressed = {};

        this.setupKeyboardControls();
    }

    setupKeyboardControls() {

        window.addEventListener("keydown", (event) => {

            const key = event.key.toLowerCase();

            if (
                key === "arrowup" || key === "arrowdown" ||
                key === "arrowleft" || key === "arrowright" ||
                key === "w" || key === "a" ||
                key === "s" || key === "d"
            ) {
                event.preventDefault();
                this.keysPressed[key] = true;
            }
        });

        window.addEventListener("keyup", (event) => {

            this.keysPressed[event.key.toLowerCase()] = false;
        });
    }

    // Setas -> translação
    updateHelicopterPosition() {

        if (this.keysPressed["arrowup"]) {
            this.helicopterY += this.moveSpeed;
        }

        if (this.keysPressed["arrowdown"]) {
            this.helicopterY -= this.moveSpeed;
        }

        if (this.keysPressed["arrowleft"]) {
            this.helicopterX -= this.moveSpeed;
        }

        if (this.keysPressed["arrowright"]) {
            this.helicopterX += this.moveSpeed;
        }

        // Impede que o helicóptero saia da área visível
        this.helicopterX = Math.min(
            this.limits.maxX,
            Math.max(this.limits.minX, this.helicopterX)
        );

        this.helicopterY = Math.min(
            this.limits.maxY,
            Math.max(this.limits.minY, this.helicopterY)
        );
    }

    // WASD -> rotação
    updateHelicopterRotation() {

        if (this.keysPressed["w"]) {
            this.helicopterPitch += this.rotateSpeed;
        }

        if (this.keysPressed["s"]) {
            this.helicopterPitch -= this.rotateSpeed;
        }

        if (this.keysPressed["a"]) {
            this.helicopterYaw -= this.rotateSpeed;
        }

        if (this.keysPressed["d"]) {
            this.helicopterYaw += this.rotateSpeed;
        }
    }

    update() {

        // 1) Atualiza translação (setas) e rotação (WASD) do helicóptero
        this.updateHelicopterPosition();
        this.updateHelicopterRotation();

        // 2) As hélices giram continuamente, independente do movimento
        this.mainRotorAngle += this.mainRotorSpeed;
        this.tailRotorAngle += this.tailRotorSpeed;

        // ==============================================
        // Transform "base" do helicóptero: primeiro rotaciona
        // (pitch em X, depois yaw em Y) e só então translada.
        // Reaproveitado por todas as partes, para que elas girem
        // e se movam sempre de forma coerente entre si.
        // ==============================================
        let heliBaseTransform = m4.identity();
        heliBaseTransform = m4.xRotate(heliBaseTransform, this.helicopterPitch);
        heliBaseTransform = m4.yRotate(heliBaseTransform, this.helicopterYaw);
        heliBaseTransform = m4.translate(
            heliBaseTransform,
            this.helicopterX,
            this.helicopterY,
            0
        );

        // Partes que só acompanham a rotação/translação do helicóptero
        this.helicopterBody.update(heliBaseTransform);
        this.helicopterTopShaft.update(heliBaseTransform);
        this.helicopterTail.update(heliBaseTransform);

        // Hélice superior: gira em torno do próprio eixo (Y) e depois
        // recebe a mesma rotação/translação do helicóptero
        let mainRotorTransform = m4.identity();
        mainRotorTransform = m4.yRotate(mainRotorTransform, this.mainRotorAngle);
        mainRotorTransform = m4.xRotate(mainRotorTransform, this.helicopterPitch);
        mainRotorTransform = m4.yRotate(mainRotorTransform, this.helicopterYaw);
        mainRotorTransform = m4.translate(
            mainRotorTransform,
            this.helicopterX,
            this.helicopterY,
            0
        );
        this.helicopterPropellers.update(mainRotorTransform);

        // Hélice da cauda: as pás estão deitadas no plano X-Y (pouca
        // espessura em Z), então o giro correto é em torno do eixo Z,
        // e precisa acontecer ao redor do próprio cubo da hélice
        // (aprox. x = 0.7), não da origem do helicóptero — senão a pá
        // "varre" um arco enorme e parece que a cauda toda gira.
        // Depois disso, recebe a mesma rotação/translação do helicóptero.
        const tailRotorHubX = 0.7; // ponto de rotação da hélice da cauda

        let tailRotorTransform = m4.identity();
        tailRotorTransform = m4.translate(tailRotorTransform, -tailRotorHubX, 0, 0);
        tailRotorTransform = m4.zRotate(tailRotorTransform, this.tailRotorAngle);
        tailRotorTransform = m4.translate(tailRotorTransform, tailRotorHubX, 0, 0);
        tailRotorTransform = m4.xRotate(tailRotorTransform, this.helicopterPitch);
        tailRotorTransform = m4.yRotate(tailRotorTransform, this.helicopterYaw);
        tailRotorTransform = m4.translate(
            tailRotorTransform,
            this.helicopterX,
            this.helicopterY,
            0
        );

        this.helicopterTailPropeller.update(tailRotorTransform);
    }

    draw() {

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        gl.useProgram(program);

        this.helicopterBody.draw(
            this.renderer
        );

        this.helicopterTopShaft.draw(
            this.renderer
        );

        this.helicopterTail.draw(
            this.renderer
        );

        this.helicopterPropellers.draw(
            this.renderer
        );

        this.helicopterTailPropeller.draw(
            this.renderer
        );
    }

    execute() {

        this.update();
        this.draw();

        requestAnimationFrame(
            () => this.execute()
        );
    }

    init() {

        requestAnimationFrame(
            () => this.execute()
        );
    }
}
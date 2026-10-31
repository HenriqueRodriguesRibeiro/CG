// ==================================================
// GEOMETRIA DO CENÁRIO - CORNERIA (estilo Star Fox antigao)
// ==================================================

function seededRandom(seed) {
    let s = seed;
    return function () {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
}

// ==================================================
// GRAMADO
// ==================================================

function createGround() {
    const mb = new MeshBuilder();
    const t = 65;

    mb.quad([-t, 0, -t], [t, 0, -t], [t, 0, t], [-t, 0, t], [0.10, 0.34, 0.22]);

    for (let z = -60; z < 60; z += 6) {
        const shade = ((z / 6) & 1) ? [0.12, 0.39, 0.25] : [0.10, 0.35, 0.22];
        mb.quad([-65, 0.012, z], [65, 0.012, z], [65, 0.012, z + 3], [-65, 0.012, z + 3], shade);
    }

    return mb.build();
}

// ==================================================
// FAIXA DE VOO / PISTA CENTRAL
// ==================================================

function createRoad() {
    const mb = new MeshBuilder();
    const y = 0.035;
    const largura = 2.7;
    const comprimento = 62;

    mb.quad(
        [-largura, y, -comprimento], [largura, y, -comprimento],
        [largura, y, comprimento], [-largura, y, comprimento],
        [0.13, 0.30, 0.30]
    );

    for (let z = -60; z < 58; z += 6) {
        mb.quad(
            [-0.075, y + 0.018, z], [0.075, y + 0.018, z],
            [0.075, y + 0.018, z + 2.0], [-0.075, y + 0.018, z + 2.0],
            [0.78, 0.88, 0.82]
        );
    }

    for (const x of [-2.35, 2.35]) {
        mb.quad([x - 0.035, y + 0.016, -comprimento], [x + 0.035, y + 0.016, -comprimento],
                [x + 0.035, y + 0.016, comprimento], [x - 0.035, y + 0.016, comprimento],
                [0.20, 0.60, 0.68]);
    }

    return mb.build();
}

// ==================================================
// SOMBRA DA NAVE
// ==================================================

function createShadow() {
    const mb = new MeshBuilder();
    const y = 0.065;
    mb.quad(
        [0, y, -2.4], [1.9, y, 0.9], [0, y, 1.0], [-1.9, y, 0.9],
        [0.04, 0.13, 0.12]
    );
    return mb.build();
}

// ==================================================
// MONTANHAS DISTANTES COM CUMES NEVADOS
// ==================================================

function addMountain(mb, x, z, width, height, color, snowColor) {
    const baseL = [x - width * 0.55, 0.08, z];
    const baseR = [x + width * 0.55, 0.08, z];
    const backL = [x - width * 0.42, 0.08, z - 3.0];
    const backR = [x + width * 0.42, 0.08, z - 3.0];
    const peak = [x, height, z - 1.1];
    const shoulderL = [x - width * 0.22, height * 0.48, z - 1.0];
    const shoulderR = [x + width * 0.25, height * 0.42, z - 1.0];

    mb.tri(baseL, peak, shoulderL, color);
    mb.tri(peak, baseR, shoulderR, color);
    mb.tri(baseL, shoulderL, backL, [color[0] * 0.72, color[1] * 0.78, color[2] * 0.86]);
    mb.tri(shoulderR, baseR, backR, [color[0] * 0.62, color[1] * 0.70, color[2] * 0.80]);
    mb.tri(shoulderL, peak, [x, height * 0.74, z - 1.45], snowColor);
    mb.tri([x, height * 0.74, z - 1.45], peak, shoulderR, [snowColor[0] * 0.88, snowColor[1] * 0.92, snowColor[2]]);
}

function createBuildings() {
    const mb = new MeshBuilder();

    addMountain(mb, -15, -34, 22, 12, [0.30, 0.48, 0.58], [0.84, 0.91, 0.92]);
    addMountain(mb,   2, -38, 29, 16, [0.25, 0.43, 0.54], [0.88, 0.94, 0.94]);
    addMountain(mb,  20, -35, 24, 11, [0.34, 0.52, 0.61], [0.82, 0.90, 0.91]);
    addMountain(mb, -31, -30, 18, 8,  [0.37, 0.55, 0.63], [0.80, 0.88, 0.90]);
    addMountain(mb,  34, -31, 19, 9,  [0.32, 0.50, 0.59], [0.84, 0.91, 0.92]);

    // Torres altas
    const tower = (x, z, w, h, color) => {
        const x0 = x - w / 2, x1 = x + w / 2;
        const y0 = 0.04, y1 = h;
        mb.quad([x0,y0,z], [x1,y0,z], [x1,y1,z], [x0,y1,z], color);
        mb.quad([x1,y0,z], [x1,y0,z-1.1], [x1,y1,z-1.1], [x1,y1,z], [color[0]*0.72,color[1]*0.78,color[2]*0.84]);
        mb.quad([x0,y1,z], [x1,y1,z], [x1,y1,z-1.1], [x0,y1,z-1.1], [0.28,0.43,0.54]);
    
        const glow = [0.30, 0.72, 0.78];
        mb.quad([x0+w*0.30,y0+0.5,z+0.012], [x0+w*0.42,y0+0.5,z+0.012],
                [x0+w*0.42,y1-0.5,z+0.012], [x0+w*0.30,y1-0.5,z+0.012], glow);
    };

    tower(-10.5, -22, 1.5, 10.5, [0.48, 0.62, 0.67]);
    tower( 10.5, -22, 1.5, 11.5, [0.45, 0.59, 0.65]);
    tower(-15.0, -28, 1.25, 7.2, [0.38, 0.53, 0.60]);
    tower( 15.0, -28, 1.25, 8.0, [0.40, 0.55, 0.62]);
    tower(-22.0, -34, 1.0, 5.8, [0.34, 0.49, 0.57]);
    tower( 22.0, -34, 1.0, 6.5, [0.35, 0.50, 0.58]);

    return mb.build();
}

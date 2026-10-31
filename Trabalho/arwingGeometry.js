// ==================================================
// GEOMETRIA DA ARWING (low poly)
// Eixos: nariz aponta para -Z, topo é +Y, asas em ±X
// ==================================================

class MeshBuilder {

    constructor() {
        this.vertices = [];
        this.normals  = [];
        this.colors   = [];
    }

    tri(a, b, c, color) {

        const u = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
        const v = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];

        let n = [
            u[1]*v[2] - u[2]*v[1],
            u[2]*v[0] - u[0]*v[2],
            u[0]*v[1] - u[1]*v[0]
        ];

        const len = Math.hypot(n[0], n[1], n[2]) || 1;
        n = [n[0]/len, n[1]/len, n[2]/len];

        for (const p of [a, b, c]) {
            this.vertices.push(p[0], p[1], p[2]);
            this.normals.push(n[0], n[1], n[2]);
            this.colors.push(color[0], color[1], color[2]);
        }
    }

    quad(a, b, c, d, color) {
        this.tri(a, b, c, color);
        this.tri(a, c, d, color);
    }

    prism(a, b, c, offset, color) {

        const add = (p) => [p[0]+offset[0], p[1]+offset[1], p[2]+offset[2]];
        const a2 = add(a), b2 = add(b), c2 = add(c);

        this.tri(a, b, c, color);
        this.tri(a2, b2, c2, color);

        this.quad(a, b, b2, a2, color);
        this.quad(b, c, c2, b2, color);
        this.quad(c, a, a2, c2, color);
    }

    build() {
        return {
            vertices: new Float32Array(this.vertices),
            normals:  new Float32Array(this.normals),
            colors:   new Float32Array(this.colors),
            count:    this.vertices.length / 3
        };
    }
}

// ==================================================
// CORES
// ==================================================

const COR_CORPO    = [0.95, 0.95, 0.97];
const COR_CORPO_2  = [0.80, 0.80, 0.84];
const COR_ASA      = [0.93, 0.94, 0.97];
const COR_ALETA    = [0.00, 0.08, 0.95];
const COR_TRASEIRA = [0.85, 0.28, 0.10];

// ==================================================
// CORPO
// ==================================================

function arwingBody(mb) {

    const N = [ 0.00,  0.00, -2.60];   // nariz
    const L = [-0.50,  0.00,  0.80];   // esquerda (traseira)
    const R = [ 0.50,  0.00,  0.80];   // direita (traseira)
    const U = [ 0.00,  0.38,  0.80];   // topo (traseira)
    const D = [ 0.00, -0.28,  0.80];   // baixo (traseira)

    mb.tri(N, L, U, COR_CORPO);
    mb.tri(N, U, R, COR_CORPO_2);
    mb.tri(N, D, L, COR_CORPO_2);
    mb.tri(N, R, D, COR_CORPO);

    mb.tri(L, R, U, COR_TRASEIRA);
    mb.tri(L, D, R, COR_CORPO_2);
}

// ==================================================
// ASAS
// ==================================================

function arwingWing(mb, lado) {

    const raizFrente = [lado * 0.65,  0.00, -0.40];
    const raizTras   = [lado * 0.65,  0.00,  0.45];
    const ponta      = [lado * 2.10, -0.50,  1.50];

    mb.prism(raizFrente, raizTras, ponta, [0, 0.05, 0], COR_ASA);
}

// ==================================================
// ALETAS AZUIS
// ==================================================

function arwingFin(mb, lado) {

    const baseFrente = [lado * 0.62, -0.15, -0.60];
    const baseTras   = [lado * 0.62,  0.05, -0.10];
    const topo       = [lado * 0.50,  0.85,  0.40];

    mb.prism(baseFrente, baseTras, topo, [lado * 0.04, 0, 0], COR_ALETA);
}

// ==================================================
// MONTA A NAVE COMPLETA
// ==================================================

function createArwing() {

    const mb = new MeshBuilder();

    arwingBody(mb);

    arwingWing(mb, -1);
    arwingWing(mb,  1);

    arwingFin(mb, -1);
    arwingFin(mb,  1);

    return mb.build();
}
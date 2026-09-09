// ===== Exercício 2: retas e triângulos com Bresenham =====

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const infoModo = document.getElementById('modo');

// Paleta de cores indexada pelas teclas 0-9
const cores = [
  '#000000', // 0 - preto
  '#FF0000', // 1 - vermelho
  '#00A000', // 2 - verde
  '#0000FF', // 3 - azul
  '#FFD700', // 4 - amarelo
  '#FF00FF', // 5 - magenta
  '#00FFFF', // 6 - ciano
  '#FF8000', // 7 - laranja
  '#800080', // 8 - roxo
  '#808080'  // 9 - cinza
];

let corAtual = cores[3]; // começa em azul
let modo = 'reta';       // 'reta' ou 'triangulo'
let cliques = [];        // pontos acumulados até fechar a figura atual

// Limpa a tela inteira (fundo branco) — usada para apagar a figura anterior
function limparTela() {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Pinta um único pixel na cor atual
function desenharPixel(x, y) {
  ctx.fillStyle = corAtual;
  ctx.fillRect(x, y, 1, 1);
}

// Função de traçar reta (igual ao exercício 1), com Bresenham
function desenharLinha(x0, y0, x1, y1) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;

  while (true) {
    desenharPixel(x, y);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

// Função de mudar a cor atual a partir de um índice de 0 a 9
function mudarCor(indice) {
  if (indice >= 0 && indice <= 9) {
    corAtual = cores[indice];
  }
}

// Função de traçar triângulo: apenas as três arestas, via Bresenham
function desenharTriangulo(p1, p2, p3) {
  desenharLinha(p1.x, p1.y, p2.x, p2.y);
  desenharLinha(p2.x, p2.y, p3.x, p3.y);
  desenharLinha(p3.x, p3.y, p1.x, p1.y);
}

// --- Troca de modo pelas teclas R/T e cor pelas teclas 0-9 ---
window.addEventListener('keydown', (evento) => {
  const tecla = evento.key.toLowerCase();

  if (tecla === 'r') {
    modo = 'reta';
    cliques = [];
    infoModo.textContent = 'Modo atual: reta';
  } else if (tecla === 't') {
    modo = 'triangulo';
    cliques = [];
    infoModo.textContent = 'Modo atual: triângulo';
  } else if (evento.key >= '0' && evento.key <= '9') {
    mudarCor(parseInt(evento.key, 10));
  }
});

// --- Cliques do mouse acumulam pontos até completar a figura do modo atual ---
canvas.addEventListener('click', (evento) => {
  const rect = canvas.getBoundingClientRect();
  const x = evento.clientX - rect.left;
  const y = evento.clientY - rect.top;
  cliques.push({ x, y });

  const pontosNecessarios = modo === 'reta' ? 2 : 3;

  if (cliques.length === pontosNecessarios) {
    limparTela(); // apaga a figura anterior: só uma figura por vez na tela

    if (modo === 'reta') {
      desenharLinha(cliques[0].x, cliques[0].y, cliques[1].x, cliques[1].y);
    } else {
      desenharTriangulo(cliques[0], cliques[1], cliques[2]);
    }

    cliques = [];
  }
});

// --- Estado inicial: reta azul entre (0,0) e (0,0) ---
limparTela();
desenharLinha(0, 0, 0, 0);

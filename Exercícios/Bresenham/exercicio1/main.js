// ===== Exercício 1: reta com algoritmo de Bresenham =====

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

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

let corAtual = cores[3]; // começa em azul, igual à reta inicial pedida
let pontoInicial = null; // guarda o primeiro clique, aguardando o segundo

// Limpa a tela inteira (fundo branco)
function limparTela() {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Pinta um único pixel na cor atual
function desenharPixel(x, y) {
  ctx.fillStyle = corAtual;
  ctx.fillRect(x, y, 1, 1);
}

// Função 1: desenha uma linha entre dois pontos quaisquer usando Bresenham
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

// Função 2: muda a cor atual a partir de um índice de 0 a 9
function mudarCor(indice) {
  if (indice >= 0 && indice <= 9) {
    corAtual = cores[indice];
  }
}

// --- Eventos de mouse: primeiro clique define o ponto inicial,
//     segundo clique define o ponto final e traça a reta ---
canvas.addEventListener('click', (evento) => {
  const rect = canvas.getBoundingClientRect();
  const x = evento.clientX - rect.left;
  const y = evento.clientY - rect.top;

  if (!pontoInicial) {
    pontoInicial = { x, y };
  } else {
    desenharLinha(pontoInicial.x, pontoInicial.y, x, y);
    pontoInicial = null;
  }
});

// --- Eventos de teclado: teclas 0-9 mudam a cor ---
window.addEventListener('keydown', (evento) => {
  if (evento.key >= '0' && evento.key <= '9') {
    mudarCor(parseInt(evento.key, 10));
  }
});

// --- Estado inicial: reta azul entre (0,0) e (0,0) ---
limparTela();
desenharLinha(0, 0, 0, 0);

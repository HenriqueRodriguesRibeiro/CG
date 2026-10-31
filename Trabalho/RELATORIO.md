# Relatório – Star Fox 3D: câmeras, projeção perspectiva e iluminação

## Tecnologia utilizada e arquivos

O projeto continua em **WebGL 2 puro**, sem Three.js ou Babylon.js. Os shaders (GLSL ES 3.00),
as matrizes de câmera e a construção das malhas são escritos à mão em JavaScript. Para executar,
basta abrir o `index.html` em um navegador com suporte a WebGL 2; não há instalação nem build.

| Arquivo | Função |
|---------|--------|
| `index.html` | Página, canvas 800×600, legenda de controles e HUD de estado |
| `m4.js` | Biblioteca de matrizes 4×4 (identidade, translação, rotação, escala) |
| `arwingGeometry.js` | Classe `MeshBuilder` e geometria da nave Arwing |
| `sceneGeometry.js` | Geometria do cenário: gramado, pista, sombra, montanhas e torres |
| `main.js` | Shaders, **câmeras, projeção, iluminação**, objetos da cena e laço de animação |

Esta entrega parte da cena e dos modelos da entrega anterior (a Arwing e o cenário de Corneria,
gerados por código) e acrescenta três sistemas: **múltiplas câmeras**, **projeção perspectiva
documentada** e **iluminação com múltiplas fontes controláveis**. Nenhum modelo foi recriado.

## Evolução em relação à entrega anterior

A entrega anterior deixou três itens marcados como **Parcial** na tabela de pendências. Esta
entrega fecha exatamente esses três pontos:

| Item da proposta | Antes (entrega anterior) | Agora |
|------------------|--------------------------|-------|
| Múltiplas câmeras (tecla C) | Parcial – só a câmera orbital | **Concluído** – 4 câmeras, troca por tecla (1–4 e C) |
| Iluminação | Parcial – luzes fixas no shader | **Concluído** – 2 fontes como *uniforms*, ligáveis/desligáveis |
| Projeção perspectiva | Presente, mas implícita | **Documentada** – definição e aplicação isoladas e comentadas |

Resumo das mudanças técnicas:

| Aspecto | Antes | Agora |
|---------|-------|-------|
| Câmeras | 1 (orbital) | 4 alternáveis em tempo de execução |
| Luzes | Constantes dentro do *fragment shader* | *Uniforms* enviados a cada quadro, com liga/desliga |
| Interação | Mouse + espaço | Mouse + teclado (câmeras e luzes) + HUD em tela |
| Feedback na tela | Apenas legenda estática | HUD dinâmico com câmera e luzes ativas |

## Cena 3D (modelos reaproveitados)

A cena é a mesma da entrega anterior, montada por código em `arwingGeometry.js` e
`sceneGeometry.js` e carregada em `main.js` por `createSceneObject(...)`. Cada elemento é um
objeto de cena separado, com seu próprio VAO e matriz de modelo.

| Objeto | Construtor | Papel na cena |
|--------|-----------|---------------|
| Gramado | `createGround()` | Chão com faixas alternadas de verde |
| Pista de voo | `createRoad()` | Faixa central que guia o olhar e reforça a perspectiva |
| Montanhas e torres | `createBuildings()` | Cidade de Corneria ao fundo |
| Sombra | `createShadow()` | Sombra projetada da nave, reforça a altura |
| Arwing | `createArwing()` | Nave principal, animada com flutuação e inclinação |

A nave recebe escala uniforme de 0,6, voa a cerca de 3,2 unidades de altura e tem oscilação
vertical e leve inclinação em Z animadas por seno, mantendo a proposta de sobrevoo.

## Múltiplas posições de câmera

Foram implementadas **4 configurações de câmera**, resolvidas na função `computeCamera(...)`
(em `main.js`). Cada modo produz um par `eye`/`target` próprio, que alimenta a matriz de
visualização `lookAt(eye, target, up)` — por isso a troca **altera de fato o ponto de vista**.

| Tecla | Modo | Descrição |
|-------|------|-----------|
| `1` | Orbital | Gira em volta da cena com o mouse (arrastar) e zoom (scroll), ângulo vertical limitado de 0,02 a 1,5 rad e distância de 4 a 60 |
| `2` | Perseguição | Posicionada atrás e acima da nave, estilo jogo |
| `3` | Torre fixa | Câmera parada em uma torre da cidade, olhando para a nave |
| `4` | Visão superior | De cima, acompanhando a nave |
| `C` | — | Cicla sequencialmente entre as quatro câmeras |

A alternância é feita pelo listener de `keydown`, e o modo ativo aparece em tempo real no **HUD**
no topo da página. Essa estrutura substitui a antiga câmera única e conclui o item "Múltiplas
câmeras" que estava pendente.

## Projeção perspectiva

A projeção perspectiva usa campo de visão de **45° (π/4)**, plano próximo **0,1** e distante
**200**. Ela aparece em dois pontos bem definidos do código:

- **Definição** – função `perspective(fovRad, aspect, near, far)` em `main.js`, que monta a
  matriz de projeção. O termo `-1` na terceira coluna é o que produz a divisão perspectiva (a
  razão pela qual objetos distantes aparecem menores):

  ```js
  function perspective(fovRad, aspect, near, far) {
      const f = 1 / Math.tan(fovRad / 2);
      return [
          f / aspect, 0, 0, 0,
          0, f, 0, 0,
          0, 0, (far + near) / (near - far), -1,
          0, 0, (2 * far * near) / (near - far), 0
      ];
  }
  ```

- **Aplicação** – no *vertex shader*, na linha:

  ```glsl
  gl_Position = u_projection * u_view * world;
  ```

  onde `u_projection` recebe a matriz montada por `perspective(...)` a cada quadro, dentro de
  `render()`.

O efeito fica evidente comparando a nave (próxima) com as torres e montanhas ao fundo
(distantes): as torres do fundo aparecem progressivamente menores e a pista converge em direção
ao horizonte. A câmera de **perseguição (tecla 2)** é a que melhor demonstra esse efeito.

## Múltiplas fontes de luz

As luzes deixaram de ser constantes dentro do *fragment shader* e passaram a ser **uniforms**
enviados a cada quadro, cada uma com seu próprio estado liga/desliga. São **duas fontes**
principais, mais luz ambiente e névoa:

| Fonte | Tipo | Uniforms | Comportamento |
|-------|------|----------|---------------|
| Sol | Direcional | `u_lightDir0`, `u_lightColor0`, `u_lightOn0` | Luz quente de direção fixa, ilumina a cena inteira de forma uniforme |
| Holofote | Pontual | `u_lightPos1`, `u_lightColor1`, `u_lightOn1` | Luz azulada que acompanha a nave e **atenua com a distância**, então dá para ver de onde vem |
| Ambiente | Global | `u_ambient` | Garante que nada fique totalmente preto |
| Névoa | — | `u_fogOn` | Mistura objetos distantes com a cor do céu, reforçando a profundidade |

O holofote ser **posicional com atenuação** é o que permite identificar visualmente a contribuição
de cada fonte: ele realça o que está perto da nave e se apaga ao longe, enquanto o sol ilumina
tudo igualmente.

### Demonstrando a contribuição de cada fonte

Cada fonte pode ser ligada/desligada individualmente pelo teclado:

| Tecla | Efeito |
|-------|--------|
| `Z` | Liga/desliga o **Sol** |
| `X` | Liga/desliga o **Holofote** |
| `F` | Liga/desliga a **Névoa** |

- Desligar o **Sol (Z)**: a cena escurece até a luz ambiente, sobrando o realce azul do holofote em
  volta da nave — isola a contribuição do sol.
- Desligar o **Holofote (X)**: some o brilho azulado próximo à nave — isola a contribuição do
  holofote.
- Desligar **as duas**: resta apenas a luz ambiente, deixando claro o papel combinado das fontes.

O estado de cada luz é refletido em tempo real no HUD, o que facilita a demonstração.

## Principais dificuldades

- **Separar a iluminação do shader.** No modelo anterior as luzes eram constantes fixas no
  *fragment shader*. Foi preciso transformá-las em *uniforms* e criar um estado em JavaScript
  (objeto `lights`) sincronizado com o shader a cada quadro, para permitir ligar e desligar cada
  fonte sem recompilar o shader.
- **Luz pontual com atenuação.** Diferente da luz direcional, a pontual depende da posição do
  fragmento. Foi necessário calcular direção e distância por fragmento e aplicar uma atenuação
  quadrática para que a contribuição ficasse visível e localizada em volta da nave.
- **Câmeras que acompanham a nave.** Como a nave oscila, as câmeras de perseguição e superior
  precisam recalcular `eye` e `target` a cada quadro a partir da posição da nave, em vez de valores
  fixos. Foi preciso centralizar isso em `computeCamera(...)`.
- **Mouse só na câmera orbital.** O arrasto do mouse só deve mover a câmera no modo orbital; nos
  demais modos ele é ignorado para não conflitar com o posicionamento automático.
- **Coerência entre câmera e luz da nave.** O holofote segue a nave; foi preciso ajustar sua
  posição e atenuação para que o efeito aparecesse em todas as câmeras, não só na orbital.

## O que ainda falta implementar

Esta entrega cobre visualização e iluminação. Os itens de jogabilidade seguem pendentes:

| Item da proposta | Situação | O que falta |
|------------------|----------|-------------|
| Movimentação da Arwing (W, A, S, D) | Não implementado | Mover a nave pelo teclado e incliná-la nas curvas |
| Cenário rolando ao longo do percurso | Parcial | Repetir e movimentar pista, prédios e obstáculos |
| Cenário urbano de Corneria | Parcial | Mais edifícios, estruturas e obstáculos pelo percurso |
| Naves inimigas | Não implementado | Modelar e animar os inimigos |
| Chefe final (Attack Carrier) | Não implementado | Modelar a nave de guerra e seu comportamento |
| Disparos (tecla Espaço) e mira | Não implementado | Projéteis, mira e disparos contra inimigos |
| Detecção de colisões | Não implementado | Colisões entre tiros, inimigos, obstáculos e a nave |
| Pontuação e vida | Não implementado | Contar pontos, reduzir vida e exibir HUD de jogo |
| Múltiplas câmeras (tecla C) | **Concluído** | — |
| Iluminação | **Concluído** | — |
| Vitória e derrota | Não implementado | Condições de vitória e derrota |
| Ajustes finais | Não implementado | Balanceamento, desempenho e polimento |

## Demonstração do resultado

Roteiro sugerido para a apresentação:

1. Abrir na câmera **Orbital (1)** e girar a cena com o mouse.
2. Pressionar **2, 3 e 4** (ou **C**) para mostrar as outras câmeras e como o ponto de vista muda.
3. Na câmera de **perseguição (2)**, destacar o efeito de perspectiva (torres do fundo menores,
   pista convergindo no horizonte).
4. Pressionar **Z** para desligar o Sol e depois **X** para o Holofote, mostrando a contribuição de
   cada fonte isoladamente.
5. Pressionar **F** para mostrar o efeito da névoa sobre os objetos distantes.

> **Sugestão:** inserir aqui capturas de tela de cada uma das 4 câmeras e uma comparação da cena
> com o Sol ligado vs. desligado, como foi feito na seção de demonstração do relatório anterior.

# 🛡️ Core Defense

Uma unidade central (o núcleo) que atira automaticamente em inimigos que se aproximam de todas
as direções. Primeira fatia do jogo — bem simples de propósito, pra ir crescendo aos poucos.

## Como funciona (v0)

- O núcleo fica parado no centro da tela, com uma barra de vida.
- Inimigos vêm em **ondas**: uma leva nasce nas bordas da tela, e só quando o campo fica limpo
  (todos mortos ou chegaram no núcleo) começa o descanso antes da próxima onda.
- Cada onda tem mais inimigos, nascem mais rápido, e vêm um pouco mais fortes/rápidos que a
  anterior — a dificuldade cresce aos poucos.
- Três tipos de inimigo, cada um com sua cor: **normal** (vermelho, desde a onda 1), **rápido**
  (dourado, frágil, a partir da onda 2) e **tanque** (roxo, bem resistente, a partir da onda 3).
- O núcleo mira e atira sozinho no inimigo mais próximo dentro do alcance.
- Um inimigo que chega perto do núcleo causa dano nele (o quanto depende do tipo) e se sacrifica
  no impacto, explodindo em partículas na cor dele — o mesmo acontece com inimigos abatidos por
  tiro. Um dano no núcleo também pisca a tela de vermelho por um instante, como feedback de impacto.
- Quando o núcleo perde toda a vida, é game over (mostra a onda e as moedas alcançadas) — dá pra
  reiniciar.
- No rodapé, 3 controles com botões **+/−** ajustam **ataque**, **cadência** e **alcance** do
  núcleo na hora (sem custo); um círculo sutil no campo marca o alcance atual.
- Cada abate (por tiro) rende **moedas** — tipos mais difíceis de matar rendem mais.
- Durante o descanso entre ondas, aparece uma **loja** com duas compras: reparar o núcleo (cura
  fixa, custo fixo) e reforçar o núcleo (+HP máximo permanente, fica mais caro a cada compra). Os
  botões desabilitam sozinhos quando faltam moedas ou não há o que curar.

Sem menu inicial, sem som ainda — só o núcleo, os inimigos, os tiros, as ondas, os ajustes manuais
de torre, as moedas por abate e a loja entre ondas.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes do motor (Vitest)
npm run build    # build de produção em dist/
```

## Arquitetura

- `src/game/` — **motor puro** (sem canvas/DOM, testável): `constants` (números ajustáveis),
  `vector` (helpers 2D), `core` (estado inicial), `enemyTypes` (stats/cor/moedas por tipo de
  inimigo), `enemies` (spawn + movimento), `combat` (mira e disparo da torre — lê
  ataque/cadência/alcance de `state.core`), `projectiles` (movimento + colisão + moedas por
  abate), `waves` (progressão de ondas/dificuldade e sorteio de tipo), `upgrades` (ajusta
  ataque/cadência/alcance do núcleo, com limites), `particles` (explosão de partículas na morte de
  inimigos/dano no núcleo), `shop` (compras entre ondas com as moedas: reparar/reforçar o
  núcleo), `step` (orquestra um frame).
- `src/render.js` — desenha o estado atual no canvas (não muta nada).
- `src/main.js` — loop principal (`requestAnimationFrame`), redimensionamento e HUD.
- `src/game/*.test.js` — testes do motor (Vitest).

## Deploy no GitHub Pages

O workflow em `.github/workflows/deploy.yml` faz build e deploy automáticos a cada push na
branch default do repositório.

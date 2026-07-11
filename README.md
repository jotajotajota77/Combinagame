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
  no impacto.
- Quando o núcleo perde toda a vida, é game over (mostra a onda alcançada) — dá pra reiniciar.

Sem menus, sem upgrades ainda — só o núcleo, os inimigos, os tiros e as ondas.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes do motor (Vitest)
npm run build    # build de produção em dist/
```

## Arquitetura

- `src/game/` — **motor puro** (sem canvas/DOM, testável): `constants` (números ajustáveis),
  `vector` (helpers 2D), `core` (estado inicial), `enemyTypes` (stats/cor por tipo de inimigo),
  `enemies` (spawn + movimento), `combat` (mira e disparo da torre), `projectiles` (movimento +
  colisão), `waves` (progressão de ondas/dificuldade e sorteio de tipo), `step` (orquestra um frame).
- `src/render.js` — desenha o estado atual no canvas (não muta nada).
- `src/main.js` — loop principal (`requestAnimationFrame`), redimensionamento e HUD.
- `src/game/*.test.js` — testes do motor (Vitest).

## Deploy no GitHub Pages

O workflow em `.github/workflows/deploy.yml` faz build e deploy automáticos a cada push na
branch default do repositório.

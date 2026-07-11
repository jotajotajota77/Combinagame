# 🛡️ Core Defense

Uma unidade central (o núcleo) que atira automaticamente em inimigos que se aproximam de todas
as direções. Primeira fatia do jogo — bem simples de propósito, pra ir crescendo aos poucos.

## Como funciona (v0)

- O núcleo fica parado no centro da tela, com uma barra de vida.
- Inimigos nascem nas bordas da tela em intervalos e andam em linha reta até o núcleo.
- O núcleo mira e atira sozinho no inimigo mais próximo dentro do alcance.
- Um inimigo que chega perto do núcleo causa dano nele e se sacrifica no impacto.
- Quando o núcleo perde toda a vida, é game over — dá pra reiniciar.

Sem menus, sem upgrades, sem ondas ainda — só o núcleo, os inimigos e os tiros.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes do motor (Vitest)
npm run build    # build de produção em dist/
```

## Arquitetura

- `src/game/` — **motor puro** (sem canvas/DOM, testável): `constants` (números ajustáveis),
  `vector` (helpers 2D), `core` (estado inicial), `enemies` (spawn + movimento), `combat` (mira e
  disparo da torre), `projectiles` (movimento + colisão), `step` (orquestra um frame).
- `src/render.js` — desenha o estado atual no canvas (não muta nada).
- `src/main.js` — loop principal (`requestAnimationFrame`), redimensionamento e HUD.
- `src/game/*.test.js` — testes do motor (Vitest).

## Deploy no GitHub Pages

O workflow em `.github/workflows/deploy.yml` faz build e deploy automáticos a cada push na
branch default do repositório.

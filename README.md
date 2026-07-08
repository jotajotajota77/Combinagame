# 🍬 Combinagame

Um **match-3 aconchegante e sem competição**: sem tempo, sem limite de movimentos, sem "nível
falhou". A ideia é só ir combinando peças, criando gemas especiais e assistindo às animações
satisfatórias — cascatas infinitas, do seu jeito e no seu ritmo.

## Como jogar

- **Arraste numa direção** (swipe) para trocar uma peça com a vizinha — ou toque em duas peças
  vizinhas.
- Combine **3 ou mais** peças da mesma cor para removê-las.
- Formas maiores criam **gemas especiais** (veja abaixo).
- **Duplo-clique** numa gema especial para ativá-la sem precisar trocar.
- Sem jogadas? O tabuleiro **reembaralha sozinho** — ou use o botão _Embaralhar_.
- Escolha de **2 a 8 cores** no seletor 🎨 — cada cor tem uma **forma geométrica própria**
  (círculo, losango, hexágono, quadrado, triângulo, pentágono, estrela, octógono), então dá pra
  jogar reconhecendo pela forma, não só pela cor.

O contador de "peças combinadas" e os _combos_ são só um agrado visual: não há meta nem derrota.

## Gemas especiais

| Como criar | Gema | Efeito |
|---|---|---|
| 4 em linha | **Listrada** | limpa a linha ou a coluna inteira |
| Forma em **T / L** (5 peças, sem 2×2) | **Embrulhada** | explode uma área 3×3 |
| Qualquer forma que contenha um **2×2** | **Peixe** 🐟 | peixes nadam pela tela até os alvos e os explodem |
| **5 em linha** reta | **Bomba de cor** | dispara raios até todas as peças da cor misturada e as destrói |
| **Linha de 5 + perna** (T com braço de 5) | **Roda de coco** | tem cor própria; lança gotas de tinta que pintam todas as peças da cor misturada com a cor dela |

**Toda gema especial dispara ao ser destruída** — se um efeito atinge outra especial, ela também
ativa (efeitos em cadeia). Os **combos entre especiais** seguem o Candy Crush clássico
(listrada+listrada, bomba+bomba limpando o tabuleiro, bomba+especial "promovendo" toda uma cor,
etc.). A bomba de cor e a roda de coco, quando ativadas por duplo-clique, escolhem uma
**cor aleatória**.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes do motor (Vitest)
npm run build    # build de produção em dist/
```

## Instalar no celular (PWA)

O jogo é um **PWA instalável**: abra o site no navegador do celular e use
**"Adicionar à tela inicial"** (Android/Chrome mostra o convite de instalação; no iPhone,
Safari → Compartilhar → _Adicionar à Tela de Início_). Ele abre em tela cheia, com ícone próprio,
e funciona **offline** depois da primeira visita (service worker em `public/sw.js` + manifest em
`public/manifest.webmanifest`).

## Deploy no GitHub Pages

O jogo é 100% estático. O workflow em `.github/workflows/deploy.yml` faz **build e deploy
automáticos** a cada push na branch `main`. Para ativar:

1. No GitHub, vá em **Settings → Pages** e em _Build and deployment_ selecione **GitHub Actions**.
2. Faça merge na `main` — o site publica em `https://<seu-usuario>.github.io/Combinagame/`.

O Vite está configurado com `base: './'`, então os assets carregam corretamente no subcaminho
do Pages sem ajustes extras.

## Arquitetura

- `src/game/` — **motor puro** (sem React, testável): `constants`, `board`, `matches`
  (classificação de formas), `specials` (seleção de células), `resolve` (cascata + combos),
  `gravity`, `moves`, `engine`. Cada movimento produz uma **timeline de passos** que a UI anima.
- `src/` — **camada React**: `App`, `components/Board`, `components/Gem`, `components/Hud`,
  `hooks/useGame` (consome a timeline com delays) e `styles/` (gemas e keyframes em CSS puro).
- `src/game/*.test.js` — testes do motor (formas, especiais, combos, gravidade, reembaralhamento).

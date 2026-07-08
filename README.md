# 🍬 Combinagame

Um **match-3 aconchegante e sem competição**: sem tempo, sem limite de movimentos, sem "nível
falhou". A ideia é só ir combinando peças, criando gemas especiais e assistindo às animações
satisfatórias — cascatas infinitas, do seu jeito e no seu ritmo.

## Como jogar

- **Arraste** (ou **toque em duas peças vizinhas**) para trocá-las de lugar.
- Combine **3 ou mais** peças da mesma cor para removê-las.
- Formas maiores criam **gemas especiais** (veja abaixo).
- **Duplo-clique** numa gema especial para ativá-la sem precisar trocar.
- Sem jogadas? O tabuleiro **reembaralha sozinho** — ou use o botão _Embaralhar_.

O contador de "peças combinadas" e os _combos_ são só um agrado visual: não há meta nem derrota.

## Gemas especiais

| Como criar | Gema | Efeito |
|---|---|---|
| 4 em linha | **Listrada** | limpa a linha ou a coluna inteira |
| Forma em **T / L** (5 peças) | **Embrulhada** | explode uma área 3×3 |
| **Quadrado 2×2** | **Peixe** 🐟 | nada até peças especiais/alvos e as explode |
| **5 em linha** | **Bomba de cor** | remove todas as peças da cor com que é misturada |
| **T grande** (6+ peças) | **Roda de coco** | tem cor própria; converte para a sua cor todas as peças da cor misturada |

Os **combos entre especiais** seguem o Candy Crush clássico (listrada+listrada, bomba+bomba
limpando o tabuleiro, bomba+especial "promovendo" toda uma cor, etc.). A bomba de cor e a roda de
coco, quando ativadas por duplo-clique, escolhem uma **cor aleatória**.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes do motor (Vitest)
npm run build    # build de produção em dist/
```

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

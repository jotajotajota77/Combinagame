// Dimensões do tabuleiro e paleta de cores das gemas comuns.
export const ROWS = 8
export const COLS = 8

// Paleta máxima disponível (formas/cores 0..7). O jogador escolhe quantas usar.
export const MIN_COLORS = 2
export const MAX_COLORS = 8
export const NCOLORS = MAX_COLORS

// Número de cores em uso na partida atual (configurável pelo jogador, 2..8).
export const config = { numColors: 6 }
export function setNumColors(n) {
  config.numColors = Math.max(MIN_COLORS, Math.min(MAX_COLORS, n | 0))
  return config.numColors
}

// Cor sentinela para a bomba de cor (gema 4): nunca participa de matches comuns.
export const BOMB_COLOR = -1

// Tipos de gema especial. Numeração do usuário entre parênteses.
export const SPECIAL = {
  FISH: 'fish', // gema 1 — quadrado 2x2
  STRIPED: 'striped', // gema 2 — 4 em linha
  WRAPPED: 'wrapped', // gema 3 — T/L (5 células)
  BOMB: 'bomb', // gema 4 — 5 em linha (cor do parceiro)
  COCO: 'coco', // gema 5 — T com pernas (6+), converte cor
}

// Direção da listrada: limpa a linha ('row') ou a coluna ('col').
export const DIR = { ROW: 'row', COL: 'col' }

import Chip8 from './chip-8/Chip'

const chip = new Chip8('canvas')
// chip.loadRomFromFile('./chip8-roms/games/Tetris [Fran Dachille, 1991].ch8')

window._chip = chip

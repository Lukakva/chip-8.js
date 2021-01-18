import Chip8 from './chip-8/Chip'

const chip = new Chip8('canvas')
chip.init()
chip.loadRomFromFile('./chip8-roms/programs/Fishie [Hap, 2005].ch8')

window._chip = chip

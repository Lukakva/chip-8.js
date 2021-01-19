import Chip8 from './chip-8/Chip'

const chip = new Chip8({
	canvas: 'canvas',
	keyboard: '#keyboard'
})
chip.init()
chip.loadRomFromFile('./chip8-roms/games/Bowling [Gooitzen van der Wal].ch8')

const buttons = document.querySelectorAll('.button')
for (let i = 0; i < buttons.length; i++) {
	const button = buttons[i]
	button.onmousedown = () => {
		chip.onKeyDown(button.innerText.trim())
	}

	button.onmouseup = () => {
		chip.onKeyUp(button.innerText.trim())
	}
}

setTimeout(() => chip.start(), 1000)

window._chip = chip

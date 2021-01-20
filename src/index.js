import Chip8 from './chip-8/Chip'
import ROMs from './roms'

const chip = new Chip8({
	canvas: 'canvas',
	keyboard: '#keyboard'
})

let lastButton = null
const buttons = document.querySelectorAll('.button')
for (let i = 0; i < buttons.length; i++) {
	const button = buttons[i]
	button.onmousedown = () => {
		button.setAttribute('class', 'button active')
		chip.onKeyDown(button.innerText.trim())

		lastButton = button
	}

	button.onmouseup = () => {
		lastButton = null

		button.setAttribute('class', 'button')
		chip.onKeyUp(button.innerText.trim())
	}
}

document.onmouseup = () => {
	if (lastButton !== null) {
		lastButton.onmouseup()
	}
}

/* Generate options for the ROM selector */
const romsNode = document.querySelector('#roms')
const instructionsNode = document.querySelector('#instructions')
const groups = {}

/* Generate option groups (demos, games, programs) */
ROMs.forEach((rom, index) => {
	const option = document.createElement('option')

	const components = rom.bin.split('/')
	const binary = components.pop()
	// Parent folder
	const group = components.pop()

	// Slice off the extension
	const romName = binary.slice(0, -4)

	option.value = index
	option.innerHTML = romName

	if (!groups.hasOwnProperty(group)) {
		groups[group] = []
	}

	groups[group].push(option)
})

/* Append the optgroups to the Select node */
for (let groupName in groups) {
	const group = groups[groupName]
	const label = groupName[0].toUpperCase() + groupName.slice(1)
	const optgroup = document.createElement('optgroup')

	group.forEach(opt => optgroup.appendChild(opt))
	optgroup.setAttribute('label', label)
	romsNode.appendChild(optgroup)
}

romsNode.onchange = function() {
	chip.pause()
	chip.init()

	const romIndex = this.value
	const rom = ROMs[romIndex]

	chip.loadRomFromFile(rom.bin).then(() => {
		chip.start()
	})

	instructionsNode.innerHTML = rom.txt
}

const keys = [
	'x', // 0
	'1', // 1
	'2', // 2
	'3', // 3
	'q', // 4
	'w', // 5
	'e', // 6
	'a', // 7
	's', // 8
	'd', // 9
	'z', // 10
	'c', // 11
	'4', // 12
	'r', // 13
	'f', // 14
	'v', // 15
]

document.onkeydown = e => {
	if (e.metaKey || e.ctrlKey || e.shiftKey) {
		return
	}

	const key = e.key
	const index = keys.indexOf(key)
	if (index > -1) {
		const value = index.toString(16).toUpperCase()
		const button = document.querySelector(`[data-value='${value}']`)
		if (button) {
			button.onmousedown()
		}
	}
}

document.onkeyup = e => {
	const key = e.key
	const index = keys.indexOf(key)
	if (index > -1) {
		const value = index.toString(16).toUpperCase()
		const button = document.querySelector(`[data-value='${value}']`)
		if (button) {
			button.onmouseup()
		}
	}
}

window._chip = chip

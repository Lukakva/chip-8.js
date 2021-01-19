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
		lastButton = button.innerText.trim()
		chip.onKeyDown(lastButton)
	}
}

document.onmouseup = () => {
	if (lastButton !== null) {
		chip.onKeyUp(lastButton)
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

	const bin = rom.bin
	const txtFile = rom.txt ? rom.bin.slice(0, -4) + '.txt' : null

	chip.loadRomFromFile(bin).then(() => {
		chip.start()
	})

	if (txtFile) {
		const xhr = new XMLHttpRequest()
		xhr.onreadystatechange = () => {
			if (xhr.readyState !== 4) {
				return
			}

			instructionsNode.innerHTML = xhr.responseText || 'No instructions'
		}
		xhr.open('GET', txtFile)
		xhr.send()
	}
}

window._chip = chip

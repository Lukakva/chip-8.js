import ROMs from './roms'

import Chip8 from './chip-8/Chip'
import Decompiler from './chip-8/decompiler'

import './index.css'

const chip = new Chip8({
	canvas: 'canvas',
	keyboard: '#keyboard'
})
chip.init()

let lastButton = null
const buttons = document.querySelectorAll('.button')
const isTouchScreen = 'ontouchstart' in window

function onButtonPress() {
	console.log('Button down')
	this.setAttribute('class', 'button active')
	chip.onKeyDown(this.innerText.trim())

	lastButton = this
}

function onButtonRelease() {
	console.log('Button up')
	lastButton = null

	this.setAttribute('class', 'button')
	chip.onKeyUp(this.innerText.trim())
}

for (let i = 0; i < buttons.length; i++) {
	const button = buttons[i]
	if (isTouchScreen) {
		button.ontouchstart = onButtonPress
		button.ontouchend = onButtonRelease
	} else {
		button.onmousedown = onButtonPress
		button.onmouseup = onButtonRelease
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

	// CHIP-8 doesn't support the instructiosn from the Hires games
	if (group === 'hires') {
		return
	}

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
	chip.init()

	const romIndex = this.value
	const rom = ROMs[romIndex]

	chip.loadRomFromFile(rom.bin).then(() => {
		chip.start()
	})

	instructionsNode.innerHTML = rom.txt

	// So the keyboard is usable
	this.blur()
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

if (!isTouchScreen) {
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

		if (key === 'Escape') {
			if (chip.paused) {
				chip.start()
			} else {
				chip.pause()
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
} else {
	document.querySelector('canvas').addEventListener('touchstart', () => {
		if (chip.paused) {
			chip.start()
		} else {
			chip.pause()
		}
	})
}

window.onblur = e => chip.pause()

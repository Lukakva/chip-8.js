import './index.css'

import ROMs from './roms'
import Chip8 from './chip-8/Chip'

const chip = new Chip8({
	canvas: 'canvas',
	keyboard: '#keyboard'
})
chip.init()

const toggleChip = () => {
	if (chip.paused) {
		chip.start()
	} else {
		chip.pause()
	}
}

const ucfirst = str => str[0].toUpperCase() + str.slice(1)

let lastButton = null
const buttons = document.querySelectorAll('.button')
const romsNode = document.querySelector('#roms')
const instructionsNode = document.querySelector('#instructions')
const isTouchScreen = 'ontouchstart' in window
const Keys = [
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

/* Keyboard interaction */
function onButtonPress() {
	this.setAttribute('class', 'button active')
	chip.onKeyDown(this.innerText.trim())

	lastButton = this
}

function onButtonRelease() {
	lastButton = null

	this.setAttribute('class', 'button')
	chip.onKeyUp(this.innerText.trim())
}

buttons.forEach(button => {
	const press   = isTouchScreen ? 'touchstart' : 'mousedown'
	const release = isTouchScreen ? 'touchend'   : 'mouseup'

	button.addEventListener(press, onButtonPress)
	button.addEventListener(release, onButtonRelease)
})

document.addEventListener('mouseup', () => {
	if (lastButton !== null) {
		lastButton.onmouseup()
	}
})

/* Generate ROM groups (demos, games, programs) */
const groups = {}
ROMs.forEach((rom, index) => {
	// chip-8/games/Game.ch8 (ignore chip-8)
	const [, group, binary] = rom.bin.split('/')
	// This implementation doesn't support the instructios from the Hires games
	if (group === 'hires') {
		return
	}

	if (!groups.hasOwnProperty(group)) {
		groups[group] = []
	}

	// Slice off the extension
	const romName = binary.slice(0, -4)
	groups[group].push({
		index,
		romName
	})
})

/* Append the optgroups to the Select node */
for (let groupName in groups) {
	const groupNode = document.createElement('optgroup')
	const options = groups[groupName]

	options.forEach(option => {
		const optionNode = document.createElement('option')
		optionNode.value = option.index
		optionNode.innerHTML = option.romName

		groupNode.appendChild(optionNode)
	})

	groupNode.setAttribute('label', ucfirst(groupName))
	romsNode.appendChild(groupNode)
}

romsNode.addEventListener('change', function() {
	const rom = ROMs[this.value]

	chip.init()
	chip.loadRomFromFile(rom.bin).then(() => chip.start())

	// Display the instructions for this rom
	instructionsNode.innerHTML = rom.txt

	// So the keyboard is usable
	this.blur()
})

// Returns a button (if any) that represents a physical key that was pressed
function getButtonForEvent(e) {
	if (e.metaKey || e.ctrlKey || e.shiftKey) {
		return false
	}

	const key = e.key
	const index = Keys.indexOf(key)
	if (index > -1) {
		const value = index.toString(16).toUpperCase()
		const button = document.querySelector(`[data-value='${value}']`)
		return button
	}

	return false
}

// Redirects a physical key event to a button mouse event
function redirectKeyboardEvent(event, callback) {
	document.addEventListener(event, e => {
		const button = getButtonForEvent(e)
		if (button) {
			callback.call(button)
		}
	})
}

if (!isTouchScreen) {
	redirectKeyboardEvent('keydown', onButtonPress)
	redirectKeyboardEvent('keyup', onButtonRelease)

	document.addEventListener('keydown', e => {
		if (e.key === 'Escape') {
			toggleChip()
		}
	})
} else {
	const canvas = document.querySelector('canvas')
	canvas.addEventListener('touchstart', toggleChip)
}

window.addEventListener('blur', chip.pause)

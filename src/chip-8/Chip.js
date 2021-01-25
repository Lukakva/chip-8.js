import './AudioContextMonkeyPatch'

import Screen from './Screen'
import { fetchRom, clear } from './Shared'
import Instruction from './Instruction'

const RAM_SIZE = 4 * 1024 // 4 KB
const N_REGISTERS = 16
const STACK_SIZE = 16

/* First 512 bytes were reserved by the Chip8 itself */
const PROGRAM_START = 0x200

const SCREEN_WIDTH = 64
const SCREEN_HEIGHT = 32

const TIMER_SPEED = 60 // 60Hz
const INSTRUCTIONS_PER_CYCLE = 10

class Chip8 {
	constructor(options) {
		this.canvas = document.querySelector(options.canvas)
		if (!this.canvas) {
			throw new Error('Canvas not found:', options.canvas)
		}

		this.pause = this.pause.bind(this)
		this.loadRom = this.loadRom.bind(this)
		this.audioContext = new AudioContext()
	}

	loadFontSet() {
		// A list of sprites for all 16 hex characters (4x5 pixels)
		const font = [
	        0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
	        0x20, 0x60, 0x20, 0x20, 0x70, // 1
	        0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
	        0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
	        0x90, 0x90, 0xF0, 0x10, 0x10, // 4
	        0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
	        0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
	        0xF0, 0x10, 0x20, 0x40, 0x40, // 7
	        0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
	        0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
	        0xF0, 0x90, 0xF0, 0x90, 0x90, // A
	        0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
	        0xF0, 0x80, 0x80, 0x80, 0xF0, // C
	        0xE0, 0x90, 0x90, 0x90, 0xE0, // D
	        0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
	        0xF0, 0x80, 0xF0, 0x80, 0x80  // F
	    ]

	    // Fonts are stored at the beginning of the memory
	    for (let i = 0; i < font.length; i++) {
	    	this.memory[i] = font[i]
	    }
	}

	init() {
		/*
			Initialize the RAM, registers, stack
			If the chip was already initialized, clear everything
		*/
		if (this.inited) {
			clear(this.memory)
			clear(this.registers)
			clear(this.stack)
			clear(this.keyboard)

			this.screen.clear()
		} else {
			this.memory = new Uint8Array(RAM_SIZE)

			/*
				15 general purpose 8-bit registers (V0-VE)
				+ 1 carry flag register (VF)
			*/
			this.registers = new Uint8Array(N_REGISTERS)

			/* The stack (for subroutine calls) */
			this.stack = new Uint16Array(STACK_SIZE)

			/*
				Which keys are pressed
			*/
			this.keyboard = new Uint8Array(16)

			/*
				A class for storing 0s and 1s (black and white)
				but also rendering on canvas
			*/
			this.screen = new Screen({
				width: SCREEN_WIDTH,
				height: SCREEN_HEIGHT,
				canvas: this.canvas,
				// Slowly preparing for the ability to change colors
				onColor: '#ffffff',
				offColor: '#000000',
			})
		}

		/* 16 bit address register (I) */
		this.registerI = 0

		/* Program counter, stack pointer */
		this.pc = PROGRAM_START
		this.sp = 0

		/* Timers (both count down at 60Hz) */
		this.delayTimer = 0
		this.soundTimer = 0

		/* Load the font set into the memory */
		this.loadFontSet()
		this.screen.render()

		this.inited = true
		this.halted = true
		this.paused = false
		this.screenChanged = false
	}

	loadRom(rom) {
		if (rom instanceof Uint8Array === false) {
			throw new Error('loadRom requires a Uint8Array')
		}

		// The allowed space for a program
		const allowedSize = RAM_SIZE - PROGRAM_START
		if (rom.length > allowedSize) {
			throw new Error('ROM too large.')
		}

		for (let i = 0; i < rom.length; i++) {
			this.memory[PROGRAM_START + i] = rom[i]
		}
	}

	/* Retrieves a file and loads it into memory */
	loadRomFromFile(url) {
		return fetchRom(url).then(this.loadRom).catch(e => {
			this.screen.renderFailure(e)
			throw e
		})
	}

	/*
		Fetches an opcode from the memory, based on the program counter.
		An opcode is 2 bytes long, so 2 bytes need to be joined
	*/
	fetchOpcode() {
		const byte1 = this.memory[this.pc]
		const byte2 = this.memory[this.pc + 1]

		// Create a 16 bit integer, containing both bytes
		return (byte1 << 8) | byte2
	}

	executeInstruction(opcode) {
		const instruction = new Instruction(opcode, this)
		instruction.execute()
	}

	/*
		Key: a string containing the value of the button
		(1, 2, 3, 4, ..., F)
	*/
	onKeyDown(key) {
		// Not initialized yet
		if (!this.inited || this.paused) {
			return
		}

		// Since we have a hex keyboard, we can just parse the index
		const index = parseInt(key, 16)
		if (isNaN(index) || index > 0xF) {
			return
		}

		this.keyboard[index] = 1
		if (this.onNextKeyDown instanceof Function) {
			this.onNextKeyDown(index)
			this.onNextKeyDown = null

			this.cycle()
		}
	}

	onKeyUp(key) {
		// Not initialized yet
		if (!this.inited || this.paused) {
			return
		}

		// Since we have a hex keyboard, we can just parse the index
		const index = parseInt(key, 16)
		if (isNaN(index) || index > 0xF) {
			return
		}

		this.keyboard[index] = 0
	}

	startBeeping() {
		if (this.oscillator) {
			return
		}

		const oscillator = this.audioContext.createOscillator()

		oscillator.type = 'square'
		oscillator.frequency.value = 440
		oscillator.connect(this.audioContext.destination)

		oscillator.start(0)
		this.oscillator = oscillator
	}

	stopBeeping() {
		if (this.oscillator) {
			this.oscillator.stop(0)
			this.oscillator.disconnect(this.audioContext.destination)
			this.oscillator = null
		}
	}

	/* A CPU cycle */
	cycle() {
		if (this.paused || this.halted) {
			return
		}

		/*
			We need a 60Hz cycle for timers, but the processor can (and should)
			run much faster than that. I've experimented with cycling
			every millisecond and counting down timers every 16th cycle
			(to simulate 60Hz) but it didn't work.
			(Probably setTimeout is not that accurate)
			So instead the main cycle is 60Hz and the instructions are executed
			at a faster rate
		*/
		for (let i = 0; i < INSTRUCTIONS_PER_CYCLE; i++) {
			const opcode = this.fetchOpcode()

			try {
				this.executeInstruction(opcode)
			} catch (e) {
				this.screen.renderFailure(e)
				throw e
			}
		}

		if (this.screenChanged) {
			this.screen.render()
			this.screenChanged = false
		}

		if (this.delayTimer > 0) {
			this.delayTimer--
		}

		if (this.soundTimer > 0) {
			this.soundTimer--
			this.startBeeping()
		} else {
			this.stopBeeping()
		}

		setTimeout(() => {
			this.cycle()
		}, 1000 / TIMER_SPEED)
	}

	start() {
		if (!this.inited) {
			return console.warn('Unitialized Chip')
		}

		this.halted = false
		this.paused = false

		this.screen.render()
		this.cycle()
	}

	pause() {
		if (!this.inited) {
			return console.warn('Unitialized Chip')
		}

		this.paused = true
		this.stopBeeping()
		this.screen.renderPaused()
	}
}

export default Chip8

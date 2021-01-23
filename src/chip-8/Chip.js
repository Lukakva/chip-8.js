import Screen from './Screen'
import { fetchRom } from './Shared'
import Instruction from './Instruction'

const RAM_SIZE = 4 * 1024 // 4 KB
const N_REGISTERS = 16
const STACK_SIZE = 16

/* First 512 bytes were reserved by the Chip8 itself */
const PROGRAM_START = 0x200

const SCREEN_WIDTH = 64
const SCREEN_HEIGHT = 32

const TIMER_SPEED = 60 // 60Hz
const OPCODES_PER_CYCLE = 10

class Chip8 {
	constructor(options) {
		this.canvas = document.querySelector(options.canvas)
		if (!this.canvas) {
			throw new Error('Canvas not found:', options.canvas)
		}

		this.loadRom = this.loadRom.bind(this)
		this.audioContext = new (AudioContext || webkitAudioContext)
	}

	loadFontSet() {
		// A list of sprites for all 16 hex characters
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
			(in order of the Wikipedia article)
		*/
		this.memory = new Uint8Array(RAM_SIZE)
		this.loadFontSet()

		/*
			15 general purpose 8-bit registers (V0-VE)
			+ 1 carry flag register (VF)
		*/
		this.registers = new Uint8Array(N_REGISTERS)

		/* 16 bit address register (I) */
		this.registerI = 0

		/* Program counter, stack pointer */
		this.pc = PROGRAM_START
		this.sp = 0
		this.halted = true
		this.screenChanged = false

		/* The stack (for subroutine calls) */
		this.stack = new Uint16Array(STACK_SIZE)

		/* Timers (both count down at 60Hz) */
		this.delayTimer = 0
		this.soundTimer = 0

		/*
			A class for storing 0s and 1s (black and white)
			but also rendering on canvas
		*/
		this.screen = new Screen(SCREEN_WIDTH, SCREEN_HEIGHT, this.canvas)
		this.keyboard = new Uint8Array(16)
	}

	/* Just a cool debugging thing */
	visualizeMemory() {
		const memory = this.memory
		for (let i = 0; i < memory.length; i += 2) {
			const opcode = (memory[i] << 8) | (memory[i + 1])
			if (opcode === 0) {
				continue
			}
			console.log(i.toString(16).toUpperCase(), opcode.toString(16).toUpperCase())
		}
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
		Fetches an opcode from the memory, based on the program counter
		an opcode is 2 bytes long, so 2 bytes need to be joined
	*/
	fetchOpcode() {
		const byte1 = this.memory[this.pc]
		const byte2 = this.memory[this.pc + 1]

		// Create a 16 bit integer, containing the both bytes
		return (byte1 << 8) | byte2
	}

	executeOpcode(opcode) {
		const instruction = new Instruction(opcode, this)
		instruction.execute()
	}

	/*
		Key: a string containing the value of the button
		(1, 2, 3, 4, ..., F)
	*/
	onKeyDown(key) {
		// Not initialized yet
		if (!this.keyboard) {
			return
		}

		console.log(key + ' was pressed')
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
		if (!this.keyboard) {
			return
		}

		console.log(key + ' was released')
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
		if (this.halted) {
			return
		}

		// We need a 60Hz cycle for timers, sure, but the
		// Processor itself can (and should) be much faster than that
		for (let i = 0; i < OPCODES_PER_CYCLE; i++) {
			const opcode = this.fetchOpcode()
			try {
				this.executeOpcode(opcode)
			} catch (e) {
				this.screen.renderFailure(e)
				throw e
			}
		}

		if (this.screenChanged) {
			this.screen.render()
			this.screenChanged = false
		}

		this.updateTimers()
		if (this.soundTimer > 0) {
			this.startBeeping()
		} else {
			this.stopBeeping()
		}

		setTimeout(() => {
			this.cycle()
		}, 1000 / TIMER_SPEED)
	}

	updateTimers() {
		if (this.delayTimer > 0) {
			this.delayTimer--
		}

		if (this.soundTimer > 0) {
			this.soundTimer--
		}
	}

	start() {
		this.halted = false
		this.cycle()
	}

	pause() {
		this.halted = true
	}
}

export default Chip8

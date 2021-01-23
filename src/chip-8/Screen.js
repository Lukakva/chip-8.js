/*
	This class doesn't really implement any of the graphics logic
	All of that is still in the Instruction.js file. This is a pure bridge
	between the Chip8 and the Canvas and provides some additional features
	(like rendering error messages on exceptions)
*/

const RESOLUTION = 16

export default class Screen {
	constructor(width, height, canvas) {
		this.height = height
		this.width = width

		this.canvas = canvas
		this.canvas.width = width * RESOLUTION
		this.canvas.height = height * RESOLUTION
		this.canvas.style.imageRendering = 'pixelated'

		this.ctx = canvas.getContext('2d')

		// 1 dimensional Uint8Array, instead of a matrix
		this.pixels = new Uint8Array(height * width)
		this.clear()
	}

	/*
		Retrieves the value of a pixel at X, Y
	*/
	get(x, y) {
		const index = y * this.width + x
		return !!this.pixels[index]
	}

	/*
		Toggles the value of a pixel at X, Y
	*/
	toggle(x, y) {
		const index = y * this.width + x
		if (index < this.pixels.length) {
			this.pixels[index] ^= 1
		}
	}

	clear() {
		for (let i = 0; i < this.pixels.length; i++) {
			this.pixels[i] = 0
		}
	}

	prepareFont() {
		this.ctx.font = (RESOLUTION * 1.9) + 'px monospace'
	}

	/*
		https://stackoverflow.com/a/16599668/7214615
	*/
	getLines(ctx, text, maxWidth) {
	    const words = text.split(' ')
	    const lines = []
	    let currentLine = words[0]

	    for (let i = 1; i < words.length; i++) {
	        const word = words[i]
	        const width = ctx.measureText(currentLine + ' ' + word).width
	        if (width < maxWidth) {
	            currentLine += ' ' + word
	        } else {
	            lines.push(currentLine)
	            currentLine = word
	        }
	    }

	    lines.push(currentLine)
	    return lines
	}

	renderFailure(error) {
		const { canvas, ctx } = this
		const title = 'The emulator aborted with the following error :('

		ctx.fillStyle = 'black'
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		this.prepareFont()
		ctx.fillStyle = 'red'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'top'

		const lines = this.getLines(ctx, error.message, canvas.width - 10)
		lines.unshift(title)

		let x = canvas.width / 2
		let y = (canvas.height / 2) - (lines.length * RESOLUTION * 2.5) / 2

		lines.forEach(line => {
			ctx.fillText(line, x, y)

			y += RESOLUTION * 2.5
		})
	}

	renderPaused() {
		const { canvas, ctx } = this
		let x = canvas.width / 2
		let y = canvas.height / 2

		this.render(true)
		this.prepareFont()

		ctx.filter = 'none'
		ctx.fillStyle = 'white'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'

		ctx.fillText('Emulator is paused. Press Esc to unpause', x, y)
	}

	/*
		A seperate function so that rendering can have a complex logic
		A single pixel is scaled to the value of the RESOLUTION
	*/
	renderPixel(x, y) {
		x *= RESOLUTION
		y *= RESOLUTION

		this.ctx.fillRect(x + 1, y + 1, RESOLUTION - 2, RESOLUTION - 2)
	}

	render(paused) {
		const ctx = this.ctx

		ctx.fillStyle = 'black'
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

		ctx.fillStyle = paused ? 'rgba(255, 255, 255, 0.5)' : 'white'
		if (paused) {
			ctx.filter = 'blur(4px)'
		}

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				// Draw a white pixel where necessary
				if (this.get(x, y)) {
					this.renderPixel(x, y)
				}
			}
		}
	}
}

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
		// this.canvas.style.imageRendering = 'pixelated'

		this.ctx = canvas.getContext('2d')

		this.pixels = new Array(height)
		for (let i = 0; i < height; i++) {
			this.pixels[i] = new Uint8Array(width)
		}
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

		let x = canvas.width / 2
		let y = canvas.height / 2

		ctx.fillStyle = 'black'
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		ctx.font = RESOLUTION + 'px monospace'
		ctx.fillStyle = 'red'
		ctx.textAlign = 'center'

		ctx.fillText(title, x, y)
		y += RESOLUTION

		const lines = this.getLines(ctx, error.message, canvas.width - 10)
		lines.forEach(line => {
			ctx.textBaseline = 'top'
			ctx.fillText(line, x, y)

			y += 20
		})
	}

	/*
		A seperate function so that rendering can have a complex logic
		A single pixel is scaled to the value of the RESOLUTION
	*/
	renderPixel(x, y) {
		x *= RESOLUTION
		y *= RESOLUTION

		this.ctx.fillStyle = 'white'
		this.ctx.fillRect(x + 1, y + 1, RESOLUTION - 2, RESOLUTION - 2)
	}

	render() {
		const ctx = this.ctx

		ctx.fillStyle = 'black'
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

		ctx.fillStyle = 'white'

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				// Draw a white pixel where necessary
				if (this.pixels[y][x] == 1) {
					this.renderPixel(x, y)
				}
			}
		}
	}
}

const fetchRom = url => {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest()
		xhr.open('GET', url)
		xhr.responseType = 'arraybuffer'

		xhr.onreadystatechange = () => {
			if (xhr.readyState !== 4) {
				return
			}

			if (xhr.status !== 200) {
				reject(new Error(url + ' does not exist'))
				return
			}

			try {
				const rom = new Uint8Array(xhr.response)
				resolve(rom)
			} catch (e) {
				reject(e)
			}
		}

		xhr.onerror = e => {
			reject(e)
		}

		xhr.send()
	})
}

const hex = n => {
	let str = n.toString(16).toUpperCase()
	while (str.length < 4) {
		str = '0' + str
	}

	return '0x' + str
}

const clear = arr => {
	for (let i = 0; i < arr.length; i++) {
		arr[i] = 0
	}
}

export { fetchRom, hex, clear }

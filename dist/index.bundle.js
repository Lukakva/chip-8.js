/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/chip-8/Chip.js":
/*!****************************!*\
  !*** ./src/chip-8/Chip.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ });
/* harmony import */ var _Screen__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Screen */ "./src/chip-8/Screen.js");
/* harmony import */ var _Instruction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Instruction */ "./src/chip-8/Instruction.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }



var RAM_SIZE = 4 * 1024; // 4 KB

var N_REGISTERS = 16;
var STACK_SIZE = 16;
/* First 512 bytes were reserved by the Chip8 itself */

var PROGRAM_START = 0x200;
var SCREEN_WIDTH = 64;
var SCREEN_HEIGHT = 32;
var TIMER_SPEED = 60; // 60Hz

var OPCODES_PER_CYCLE = 8;

var Chip8 = /*#__PURE__*/function () {
  function Chip8(options) {
    _classCallCheck(this, Chip8);

    this.canvas = document.querySelector(options.canvas);

    if (!this.canvas) {
      throw new Error('Canvas not found:', options.canvas);
    }

    this.createBeeper();
  }

  _createClass(Chip8, [{
    key: "loadFontSet",
    value: function loadFontSet() {
      // A list of sprites for all 16 hex characters
      var font = [0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
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
      0xF0, 0x80, 0xF0, 0x80, 0x80 // F
      ]; // Fonts are stored at the beginning of the memory

      for (var i = 0; i < font.length; i++) {
        this.memory[i] = font[i];
      }
    }
  }, {
    key: "init",
    value: function init() {
      /*
      	Initialize the RAM, registers, stack
      	(in order of the Wikipedia article)
      */
      this.memory = new Uint16Array(RAM_SIZE);
      this.loadFontSet();
      /*
      	15 general purpose 8-bit registers (V0-VE)
      	+ 1 carry flag register (VF)
      */

      this.registers = new Uint16Array(N_REGISTERS);
      /* 16 bit address register (I) */

      this.registerI = 0;
      /* Program counter, stack pointer */

      this.pc = PROGRAM_START;
      this.sp = 0;
      this.halted = true;
      this.screenChanged = false;
      /* The stack (for subroutine calls) */

      this.stack = new Uint16Array(STACK_SIZE);
      /* Timers (both count down at 60Hz) */

      this.delayTimer = 0;
      this.soundTimer = 0;
      /*
      	A class for storing 0s and 1s (black and white)
      	but also rendering on canvas
      */

      this.screen = new _Screen__WEBPACK_IMPORTED_MODULE_0__.default(SCREEN_WIDTH, SCREEN_HEIGHT, this.canvas);
      this.keyboard = new Uint8Array(16);
    }
    /* Just a cool debugging thing */

  }, {
    key: "visualizeMemory",
    value: function visualizeMemory() {
      var memory = this.memory;

      for (var i = 0; i < memory.length; i += 2) {
        var opcode = memory[i] << 8 | memory[i + 1];

        if (opcode === 0) {
          continue;
        }

        console.log(i.toString(16).toUpperCase(), opcode.toString(16).toUpperCase());
      }
    }
  }, {
    key: "loadRom",
    value: function loadRom(rom) {
      if (rom instanceof Uint8Array === false) {
        throw new Error('loadRom requires a Uint8Array');
      } // The allowed space for a program


      var allowedSize = RAM_SIZE - PROGRAM_START;

      if (rom.length > allowedSize) {
        throw new Error('ROM too large.');
      }

      for (var i = 0; i < rom.length; i++) {
        this.memory[PROGRAM_START + i] = rom[i];
      }
    }
    /* Retrieves a file and loads it into memory */

  }, {
    key: "loadRomFromFile",
    value: function loadRomFromFile(url) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'arraybuffer';

        xhr.onreadystatechange = function () {
          if (xhr.readyState !== 4) {
            return;
          }

          if (xhr.status !== 200) {
            _this.screen.renderFailure(new Error(url + ' does not exist'));

            return;
          }

          try {
            var rom = new Uint8Array(xhr.response);

            _this.loadRom(rom);

            resolve();
          } catch (e) {
            reject(e);
          }
        };

        xhr.onerror = reject;
        xhr.send();
      });
    }
    /*
    	Fetches an opcode from the memory, based on the program counter
    	an opcode is 2 bytes long, so 2 bytes need to be joined
    */

  }, {
    key: "fetchOpcode",
    value: function fetchOpcode() {
      var byte1 = this.memory[this.pc];
      var byte2 = this.memory[this.pc + 1]; // Create a 16 bit integer, containing the both bytes

      return byte1 << 8 | byte2;
    }
  }, {
    key: "executeOpcode",
    value: function executeOpcode(opcode) {
      var instruction = new _Instruction__WEBPACK_IMPORTED_MODULE_1__.default(opcode, this);
      instruction.execute();
    }
    /*
    	Key: a string containing the value of the button
    	(1, 2, 3, 4, ..., F)
    */

  }, {
    key: "onKeyDown",
    value: function onKeyDown(key) {
      console.log(key + ' was pressed'); // Since we have a hex keyboard, we can just parse the index

      var index = parseInt(key, 16);

      if (isNaN(index) || index > 0xF) {
        return;
      }

      this.keyboard[index] = 1;

      if (this.onNextKeyDown instanceof Function) {
        this.onNextKeyDown(index);
        this.onNextKeyDown = null;
        this.cycle();
      }
    }
  }, {
    key: "onKeyUp",
    value: function onKeyUp(key) {
      console.log(key + ' was released'); // Since we have a hex keyboard, we can just parse the index

      var index = parseInt(key, 16);

      if (isNaN(index) || index > 0xF) {
        return;
      }

      this.keyboard[key] = 0;
    }
  }, {
    key: "createBeeper",
    value: function createBeeper() {
      this.audioContext = new (AudioContext || webkitAudioContext)();
    }
  }, {
    key: "beep",
    value: function beep() {
      var audioContext = new (AudioContext || webkitAudioContext)();
      var oscillator = audioContext.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.value = 440;
      oscillator.connect(audioContext.destination);
      oscillator.start(0);
      setTimeout(function () {
        oscillator.stop();
      }, 60);
    }
    /* A CPU cycle */

  }, {
    key: "cycle",
    value: function cycle() {
      var _this2 = this;

      if (this.halted) {
        return;
      } // We need a 60Hz cycle for timers, sure, but the
      // Processor itself can (and should) be much faster than that


      for (var i = 0; i < OPCODES_PER_CYCLE; i++) {
        var opcode = this.fetchOpcode();

        try {
          this.executeOpcode(opcode);
        } catch (e) {
          this.screen.renderFailure(e);
          throw e;
        }
      }

      if (this.soundTimer > 0) {
        this.beep();
      }

      if (this.screenChanged) {
        this.screen.render();
      }

      this.updateTimers();
      setTimeout(function () {
        _this2.cycle();
      }, 1000 / TIMER_SPEED);
    }
  }, {
    key: "updateTimers",
    value: function updateTimers() {
      if (this.delayTimer > 0) {
        this.delayTimer--;
      }

      if (this.soundTimer > 0) {
        this.soundTimer--;
      }
    }
  }, {
    key: "start",
    value: function start() {
      this.halted = false;
      this.cycle();
    }
  }, {
    key: "pause",
    value: function pause() {
      this.halted = true;
    }
  }]);

  return Chip8;
}();

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Chip8);

/***/ }),

/***/ "./src/chip-8/Instruction.js":
/*!***********************************!*\
  !*** ./src/chip-8/Instruction.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ Instruction
/* harmony export */ });
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*
	All instructions are listed in the order of this table
	https://en.wikipedia.org/wiki/CHIP-8#Opcode_table

	Although some of the functions should be next to each other
	(like callSubroutine, returnFromSubroutine)
*/
var hex = function hex(n) {
  return '0x' + n.toString(16).toUpperCase();
};

var Instruction = /*#__PURE__*/function () {
  function Instruction(code, chip) {
    _classCallCheck(this, Instruction);

    this.code = code;
    this.chip = chip;
  }
  /*
  	Opcode: 0NNN
  	Calls machine code routine (RCA 1802 for COSMAC VIP) at address NNN.
  	Not necessary for most ROMs.
  */


  _createClass(Instruction, [{
    key: "doNothing",
    value: function doNothing() {
      this.chip.pc += 2;
    }
    /*
    	Opcode: 00E0
    	Clears the screen (black)
    */

  }, {
    key: "clear",
    value: function clear() {
      var screen = this.chip.screen;

      for (var y = 0; y < screen.height; y++) {
        for (var x = 0; x < screen.width; x++) {
          screen.pixels[y][x] = 0;
        }
      }

      this.chip.pc += 2;
      this.chip.screenChanged = true;
    }
    /*
    	Opcode: 0x00EE
    	Returns from a subroutine
    */

  }, {
    key: "returnFromSubroutine",
    value: function returnFromSubroutine() {
      var chip = this.chip;
      /*
      	Retrieve the program counter at the end of the stack
      	Pop the stack (by decremeting the stack pointer)
      	And move the program counter to the next instruction (+ 2 bytes)
      		A more readable version (just for convenience)
      		chip.sp -= 1
      	chip.pc = chip.stack[chip.sp]
      	chip.pc += 2
      */

      chip.pc = chip.stack[--chip.sp] + 2;
    }
    /*
    	Opcode: 1NNN
    	Jumps to address NNN
    */

  }, {
    key: "jump",
    value: function jump() {
      var NNN = this.code & 0x0FFF;

      if (this.chip.pc === NNN) {
        this.chip.halted = true;
        return;
        throw new Error('Something went wrong. The jump instruction is jumping to the current Program Counter. This will cause an infinite loop. Halting');
      }

      this.chip.pc = NNN;
    }
    /*
    	Opcode: 2NNN
    	Executes the subroutine at NNN
    */

  }, {
    key: "callSubroutine",
    value: function callSubroutine() {
      var nnn = this.code & 0x0FFF;
      var chip = this.chip;

      if (chip.sp >= chip.stack.length) {
        throw new Error('Could not enter a subroutine at ' + hex(nnn) + 'from PC ' + hex(chip.pc) + 'because the stack is full.');
      }

      chip.stack[chip.sp++] = chip.pc;
      chip.pc = nnn;
    }
    /*
    	Opcode: 3XNN
    	Skips the next instruction if the value stored in the register X
    	is equal to the constant NN
    */

  }, {
    key: "skipIfRegisterEquals",
    value: function skipIfRegisterEquals() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var NN = code & 0x00FF;

      if (registers[X] === NN) {
        chip.pc += 4;
      } else {
        chip.pc += 2;
      }
    }
    /*
    	Opcode: 4XNN
    	Skips the next instruction if the value stored in the register X
    	IS NOT equal to the constant NN
    */

  }, {
    key: "skipIfRegisterNotEquals",
    value: function skipIfRegisterNotEquals() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var NN = code & 0x00FF;

      if (registers[X] !== NN) {
        chip.pc += 4;
      } else {
        chip.pc += 2;
      }
    }
    /*
    	Opcode: 5XY0
    	Skips the next instruction if the values stored in registers X and Y
    	are equal to each other
    */

  }, {
    key: "skipIfRegistersEqual",
    value: function skipIfRegistersEqual() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;

      if (registers[X] === registers[Y]) {
        chip.pc += 4;
      } else {
        chip.pc += 2;
      }
    }
    /*
    	Opcode: 6XNN
    	Sets VX to NN.
    */

  }, {
    key: "setRegisterValue",
    value: function setRegisterValue() {
      var chip = this.chip,
          code = this.code;
      var X = (code & 0x0F00) >> 8;
      var NN = code & 0x00FF;
      chip.registers[X] = NN;
      chip.pc += 2;
    }
    /*
    	Opcode: 7XNN
    	Adds NN to VX. (Carry flag is not changed)
    */

  }, {
    key: "addToRegisterValue",
    value: function addToRegisterValue() {
      var chip = this.chip,
          code = this.code;
      var X = (code & 0x0F00) >> 8;
      var NN = code & 0x00FF;
      chip.registers[X] += NN; // Limit to 255 (Mimic a 8bit behavior)

      chip.registers[X] &= 0xFF;
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY0
    	Assignment - Sets VX to the value of VY.
    */

  }, {
    key: "assign",
    value: function assign() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      registers[X] = registers[Y];
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY1
    	Sets VX to VX or VY. (Bitwise OR operation)
    */

  }, {
    key: "bitwiseOr",
    value: function bitwiseOr() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      registers[X] = registers[X] | registers[Y];
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY2
    	Sets VX to VX and VY. (Bitwise AND operation)
    */

  }, {
    key: "bitwiseAnd",
    value: function bitwiseAnd() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      registers[X] = registers[X] & registers[Y];
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY3
    	Sets VX to VX xor VY.
    */

  }, {
    key: "bitwiseXor",
    value: function bitwiseXor() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      registers[X] = registers[X] ^ registers[Y];
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY4
    	Adds VY to VX. VF is set to 1 when there's a carry,
    	and to 0 when there isn't.
    */

  }, {
    key: "add",
    value: function add() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      /*
      	Thankfully JavaScript can operate on ints larger than 8 bits :v
      	If the result is larger than a 8 bit integer (255), we have a carry
      */

      var result = registers[X] + registers[Y];
      var carry = result > 0xFF; // Store the carry in VF Register

      registers[0xF] = carry; // Limit the resulting sum by 255

      registers[X] = result & 0xFF;
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY4
    	VY is subtracted from VX. VF is set to 0 when there's a borrow,
    	and 1 when there isn't.
    */

  }, {
    key: "subtract",
    value: function subtract() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      /*
      	A borrow occurs if X < Y, but instruction requires the VF
      	register to be set to 0 if there is a borrow, so we reverse it
      	to X >= Y
      */

      registers[0xF] = registers[X] >= registers[Y];
      registers[X] -= Y;
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY6
    	Stores the least significant bit of VX in VF
    	and then shifts VX to the right by 1.
    */

  }, {
    key: "shiftRight",
    value: function shiftRight() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4; // Store the least significant bit

      registers[0xF] = registers[X] & 0x1;
      registers[X] >>= 1;
      chip.pc += 2;
    }
    /*
    	Opcode: 8XY7
    	Sets VX to VY minus VX. VF is set to 0 when there's a borrow,
    	and 1 when there isn't.
    */

  }, {
    key: "subtractRegisters",
    value: function subtractRegisters() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4; // Store the least significant bit

      registers[0xF] = registers[Y] >= registers[X];
      registers[X] = registers[Y] - registers[X];
      chip.pc += 2;
    }
    /*
    	Opcode: 8XYE
    	Stores the most significant bit of VX in VF
    	and then shifts VX to the left by 1.
    */

  }, {
    key: "shiftLeft",
    value: function shiftLeft() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4; // Get the most significant bit

      var msb = registers[X] & 1 << 7; // Store 1 if msb is 1

      registers[0xF] = msb > 0;
      registers[X] <<= 1;
      chip.pc += 2;
    }
    /*
    	Opcode: 9XY0
    	Skips the next instruction if VX doesn't equal VY.
    */

  }, {
    key: "skipIfRegistersNotEqual",
    value: function skipIfRegistersNotEqual() {
      var code = this.code,
          chip = this.chip,
          registers = this.chip.registers;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;

      if (registers[X] !== registers[Y]) {
        // 4 instead of 2 (effectively skipping the next instruction)
        chip.pc += 4;
      } else {
        chip.pc += 2;
      }
    }
    /*
    	Opcode: ANNN
    	Sets I to the address NNN.
    */

  }, {
    key: "setMemoryRegister",
    value: function setMemoryRegister() {
      var NNN = this.code & 0x0FFF;
      this.chip.registerI = NNN;
      this.chip.pc += 2;
    }
    /*
    	Opcode: BNNN
    	Jumps to the address NNN plus V0.
    */

  }, {
    key: "jumpV0",
    value: function jumpV0() {
      var NNN = this.code & 0x0FFF;
      this.chip.pc = this.chip.registers[0] + NNN;
    }
    /*
    	Opcode: CXNN
    	Sets VX to the result of a bitwise and operation on a
    	random number (Typically: 0 to 255) and NN.
    */

  }, {
    key: "rand",
    value: function rand() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      var NN = code & 0x00FF;
      var random = Math.floor(Math.random() * 0x100);
      chip.registers[X] = random & NN;
      chip.pc += 2;
    }
    /*
    	Opcode: DXYN
    	Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels
    	and a height of N+1 pixels.
    */

  }, {
    key: "draw",
    value: function draw() {
      /*
      	Each row of 8 pixels is read as bit-coded
      	starting from memory location I
      */
      var code = this.code,
          chip = this.chip;
      var registers = chip.registers,
          screen = chip.screen;
      var pixels = screen.pixels;
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      var N = code & 0x000F;
      var startX = registers[X];
      var startY = registers[Y]; // Indicate if any pixel was flipped from set to unset

      registers[0xF] = 0; // So sometimes the ROM trusts the CPU to not render anything that
      // goes over the screen. Okay :)

      for (var y = 0; y < N && startY + y < screen.height; y++) {
        // A row of 8 pixels (where every bit is a pixel color)
        var row = chip.memory[chip.registerI + y]; // Loop over each pixel value (bit by bit)

        for (var x = 0; x < 8; x++) {
          var mask = 0x80 >> x; // If this pixel should be flipped

          if ((row & mask) > 0) {
            // Was this pixel a 1? It's 0 now. Set the VF register
            if (pixels[startY + y][startX + x]) {
              registers[0xF] = 1;
            }

            pixels[startY + y][startX + x] ^= 1;
          }
        }
      }

      chip.pc += 2;
      chip.screenChanged = true;
    }
    /*
    	Opcode: EX9E
    	Skips the next instruction if the key stored in VX is pressed.
    */

  }, {
    key: "skipIfKeyPressed",
    value: function skipIfKeyPressed() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      var desiredKey = chip.registers[X];

      if (chip.keyboard[desiredKey]) {
        chip.pc += 4;
      } else {
        chip.pc += 2;
      }
    }
    /*
    	Opcode: EX9E
    	Skips the next instruction if the key stored in VX isn't pressed.
    */

  }, {
    key: "skipIfKeyNotPressed",
    value: function skipIfKeyNotPressed() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      var desiredKey = chip.registers[X];

      if (!chip.keyboard[desiredKey]) {
        chip.pc += 4;
      } else {
        chip.pc += 2;
      }
    }
    /*
    	Opcode: FX07
    	Sets VX to the value of the delay timer.
    */

  }, {
    key: "getDelayTimer",
    value: function getDelayTimer() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      chip.registers[X] = chip.delayTimer;
      chip.pc += 2;
    }
    /*
    	Opcode: FX0A
    	A key press is awaited, and then stored in VX.
    	(Blocking operation)
    */

  }, {
    key: "awaitKeyPress",
    value: function awaitKeyPress() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      chip.halted = true;

      chip.onNextKeyDown = function (key) {
        chip.registers[X] = key;
        chip.halted = false;
        chip.pc += 2;
      };
    }
    /*
    	Opcode: FX15
    	Sets the delay timer to VX.
    */

  }, {
    key: "setDelayTimer",
    value: function setDelayTimer() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      chip.delayTimer = chip.registers[X];
      chip.pc += 2;
    }
    /*
    	Opcode: FX18
    	Sets the sound timer to VX.
    */

  }, {
    key: "setSoundTimer",
    value: function setSoundTimer() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      chip.soundTimer = chip.registers[X];
      chip.pc += 2;
    }
    /*
    	Opcode: FX1E
    	Adds VX to I. VF is not affected.
    */

  }, {
    key: "addMem",
    value: function addMem() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      chip.registerI += chip.registers[X]; // Limit to 16 bits

      chip.registerI &= 0xFFFF;
      chip.pc += 2;
    }
    /*
    	Opcode: FX29
    	Sets I to the location of the sprite for the character in VX.
    	Characters 0-F (in hexadecimal) are represented by a 4x5 font.
    */

  }, {
    key: "setCharacterInMemory",
    value: function setCharacterInMemory() {
      var code = this.code,
          chip = this.chip; // Since all characters are a 5 byte sprite
      // We can just multiply the character index by 5
      // to move to the correct memory location

      var X = (code & 0x0F00) >> 8;
      chip.registerI = chip.registers[X] * 0x5;
      chip.pc += 2;
    }
    /*
    	Opcode: FX33
    	Stores the binary-coded decimal representation of VX,
    	with the mostsignificant of three digits at the address in I,
    	the middle digit at I plus 1,
    	and the least significant digit at I plus 2.
    	(In other words, take the decimal representation of VX,
    	place the hundreds digit in memory at location in I,
    	the tens digit at location I+1,
    	and the ones digit at location I+2.)
    */

  }, {
    key: "storeBCD",
    value: function storeBCD() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;
      var N = chip.registers[X];
      var I = chip.registerI;
      chip.memory[I + 0] = N / 100; // 100

      chip.memory[I + 1] = N % 100 / 10; // 10

      chip.memory[I + 2] = N % 10; // 1

      chip.pc += 2;
    }
    /*
    	Opcode: FX55
    	Stores V0 to VX (including VX) in memory starting at address I.
    	The offset from I is increased by 1 for each value written,
    	but I itself is left unmodified.
    	(Meaning the I register is not modified)
    */

  }, {
    key: "dumpRegisters",
    value: function dumpRegisters() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;

      for (var i = 0; i <= X; i++) {
        chip.memory[chip.registerI + i] = chip.registers[i];
      }

      chip.pc += 2;
    }
    /*
    	Opcode: FX65
    	Fills V0 to VX (including VX) with values from memory starting
    	at address I.
    	The offset from I is increased by 1 for each value written,
    	but I itself is left unmodified.
    */

  }, {
    key: "loadRegisters",
    value: function loadRegisters() {
      var code = this.code,
          chip = this.chip;
      var X = (code & 0x0F00) >> 8;

      for (var i = 0; i <= X; i++) {
        chip.registers[i] = chip.memory[chip.registerI + i];
      }

      chip.pc += 2;
    }
  }, {
    key: "getInstructionName",
    value: function getInstructionName() {
      var code = this.code; // Otherwise, opcodes depend on the first hex value (first 4 bits)

      switch (code & 0xF000) {
        case 0x0000:
          {
            switch (code & 0x00FF) {
              case 0xE0:
                {
                  return 'clear';
                }

              case 0xEE:
                {
                  return 'returnFromSubroutine';
                }

              default:
                {
                  return 'doNothing';
                }
            }
          }

        case 0x1000:
          {
            return 'jump';
          }

        case 0x2000:
          {
            return 'callSubroutine';
          }

        case 0x3000:
          {
            return 'skipIfRegisterEquals';
          }

        case 0x4000:
          {
            return 'skipIfRegisterNotEquals';
          }

        case 0x5000:
          {
            return 'skipIfRegistersEqual';
          }

        case 0x6000:
          {
            return 'setRegisterValue';
          }

        case 0x7000:
          {
            return 'addToRegisterValue';
          }

        /*
        	There are a few opcodes beginning with 8, which can be
        	distinguished by the last 4 bits
        */

        case 0x8000:
          {
            // The last 4 bits
            switch (code & 0x000F) {
              case 0x0:
                {
                  return 'assign';
                }

              case 0x1:
                {
                  return 'bitwiseOr';
                }

              case 0x2:
                {
                  return 'bitwiseAnd';
                }

              case 0x3:
                {
                  return 'bitwiseXor';
                }

              case 0x4:
                {
                  return 'add';
                }

              case 0x5:
                {
                  return 'subtract';
                }

              case 0x6:
                {
                  return 'shiftRight';
                }

              case 0x7:
                {
                  return 'subtractRegisters';
                }

              case 0xE:
                {
                  return 'shiftLeft';
                }
            }
          }

        case 0x9000:
          {
            return 'skipIfRegistersNotEqual';
          }

        case 0xA000:
          {
            return 'setMemoryRegister';
          }

        case 0xB000:
          {
            return 'jumpV0';
          }

        case 0xC000:
          {
            return 'rand';
          }

        case 0xD000:
          {
            return 'draw';
          }

        case 0xE000:
          {
            switch (code & 0x00FF) {
              case 0x9E:
                {
                  return 'skipIfKeyPressed';
                }

              case 0xA1:
                {
                  return 'skipIfKeyNotPressed';
                }
            }
          }

        case 0xF000:
          {
            // For F opcodes, the last 2 bits are the identifiers
            switch (code & 0x00FF) {
              case 0x07:
                {
                  return 'getDelayTimer';
                }

              case 0x0A:
                {
                  return 'awaitKeyPress';
                }

              case 0x15:
                {
                  return 'setDelayTimer';
                }

              case 0x18:
                {
                  return 'setSoundTimer';
                }

              case 0x1E:
                {
                  return 'addMem';
                }

              case 0x29:
                {
                  return 'setCharacterInMemory';
                }

              case 0x33:
                {
                  return 'storeBCD';
                }

              case 0x55:
                {
                  return 'dumpRegisters';
                }

              case 0x65:
                {
                  return 'loadRegisters';
                }
            }
          }
      }

      throw new Error('Unknown instruction: ' + hex(code) + '. At PC ' + this.chip.pc);
    }
  }, {
    key: "execute",
    value: function execute() {
      var name = this.getInstructionName();
      console.log('Executing instruction:', name);
      this[name]();
    }
  }]);

  return Instruction;
}();



/***/ }),

/***/ "./src/chip-8/Screen.js":
/*!******************************!*\
  !*** ./src/chip-8/Screen.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ Screen
/* harmony export */ });
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*
	This class doesn't really implement any of the graphics logic
	All of that is still in the Instruction.js file. This is a pure bridge
	between the Chip8 and the Canvas and provides some additional features
	(like rendering error messages on exceptions)
*/
var RESOLUTION = 16;

var Screen = /*#__PURE__*/function () {
  function Screen(width, height, canvas) {
    _classCallCheck(this, Screen);

    this.height = height;
    this.width = width;
    this.canvas = canvas;
    this.canvas.width = width * RESOLUTION;
    this.canvas.height = height * RESOLUTION; // this.canvas.style.imageRendering = 'pixelated'

    this.ctx = canvas.getContext('2d');
    this.pixels = new Array(height);

    for (var i = 0; i < height; i++) {
      this.pixels[i] = new Uint8Array(width);
    }
  }
  /*
  	https://stackoverflow.com/a/16599668/7214615
  */


  _createClass(Screen, [{
    key: "getLines",
    value: function getLines(ctx, text, maxWidth) {
      var words = text.split(' ');
      var lines = [];
      var currentLine = words[0];

      for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width = ctx.measureText(currentLine + ' ' + word).width;

        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }

      lines.push(currentLine);
      return lines;
    }
  }, {
    key: "renderFailure",
    value: function renderFailure(error) {
      var canvas = this.canvas,
          ctx = this.ctx;
      var title = 'The emulator aborted with the following error :(';
      var x = canvas.width / 2;
      var y = canvas.height / 2;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = RESOLUTION + 'px monospace';
      ctx.fillStyle = 'red';
      ctx.textAlign = 'center';
      ctx.fillText(title, x, y);
      y += RESOLUTION;
      var lines = this.getLines(ctx, error.message, canvas.width - 10);
      lines.forEach(function (line) {
        ctx.textBaseline = 'top';
        ctx.fillText(line, x, y);
        y += 20;
      });
    }
    /*
    	A seperate function so that rendering can have a complex logic
    	A single pixel is scaled to the value of the RESOLUTION
    */

  }, {
    key: "renderPixel",
    value: function renderPixel(x, y) {
      x *= RESOLUTION;
      y *= RESOLUTION;
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(x + 1, y + 1, RESOLUTION - 2, RESOLUTION - 2);
    }
  }, {
    key: "render",
    value: function render() {
      var ctx = this.ctx;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = 'white';

      for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
          // Draw a white pixel where necessary
          if (this.pixels[y][x] == 1) {
            this.renderPixel(x, y);
          }
        }
      }
    }
  }]);

  return Screen;
}();



/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _chip_8_Chip__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./chip-8/Chip */ "./src/chip-8/Chip.js");
/* harmony import */ var _roms__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./roms */ "./src/roms.json");


var chip = new _chip_8_Chip__WEBPACK_IMPORTED_MODULE_0__.default({
  canvas: 'canvas',
  keyboard: '#keyboard'
});
var lastButton = null;
var buttons = document.querySelectorAll('.button');

var _loop = function _loop(i) {
  var button = buttons[i];

  button.onmousedown = function () {
    lastButton = button.innerText.trim();
    chip.onKeyDown(lastButton);
  };
};

for (var i = 0; i < buttons.length; i++) {
  _loop(i);
}

document.onmouseup = function () {
  if (lastButton !== null) {
    chip.onKeyUp(lastButton);
  }
};
/* Generate options for the ROM selector */


var romsNode = document.querySelector('#roms');
var instructionsNode = document.querySelector('#instructions');
var groups = {};
/* Generate option groups (demos, games, programs) */

_roms__WEBPACK_IMPORTED_MODULE_1__.forEach(function (rom, index) {
  var option = document.createElement('option');
  var components = rom.bin.split('/');
  var binary = components.pop(); // Parent folder

  var group = components.pop(); // Slice off the extension

  var romName = binary.slice(0, -4);
  option.value = index;
  option.innerHTML = romName;

  if (!groups.hasOwnProperty(group)) {
    groups[group] = [];
  }

  groups[group].push(option);
});
/* Append the optgroups to the Select node */

var _loop2 = function _loop2(groupName) {
  var group = groups[groupName];
  var label = groupName[0].toUpperCase() + groupName.slice(1);
  var optgroup = document.createElement('optgroup');
  group.forEach(function (opt) {
    return optgroup.appendChild(opt);
  });
  optgroup.setAttribute('label', label);
  romsNode.appendChild(optgroup);
};

for (var groupName in groups) {
  _loop2(groupName);
}

romsNode.onchange = function () {
  chip.pause();
  chip.init();
  var romIndex = this.value;
  var rom = _roms__WEBPACK_IMPORTED_MODULE_1__[romIndex];
  var bin = rom.bin;
  var txtFile = rom.txt ? rom.bin.slice(0, -4) + '.txt' : null;
  chip.loadRomFromFile(bin).then(function () {
    chip.start();
  });

  if (txtFile) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }

      instructionsNode.innerHTML = xhr.responseText || 'No instructions';
    };

    xhr.open('GET', txtFile);
    xhr.send();
  }
};

window._chip = chip;

/***/ }),

/***/ "./src/roms.json":
/*!***********************!*\
  !*** ./src/roms.json ***!
  \***********************/
/***/ ((module) => {

module.exports = JSON.parse("[{\"bin\":\"chip8-roms/demos/Maze (alt) [David Winter, 199x].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/demos/Maze [David Winter, 199x].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/demos/Particle Demo [zeroZshadow, 2008].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/demos/Sierpinski [Sergey Naydenov, 2010].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/demos/Sirpinski [Sergey Naydenov, 2010].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/demos/Stars [Sergey Naydenov, 2010].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/demos/Trip8 Demo (2008) [Revival Studios].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/demos/Zero Demo [zeroZshadow, 2007].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/15 Puzzle [Roger Ivie] (alt).ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/15 Puzzle [Roger Ivie].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Addition Problems [Paul C. Moews].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Airplane.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Animal Race [Brian Astle].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Astro Dodge [Revival Studios, 2008].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Biorhythm [Jef Winsor].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Blinky [Hans Christian Egeberg, 1991].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Blinky [Hans Christian Egeberg] (alt).ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Blitz [David Winter].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Bowling [Gooitzen van der Wal].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Breakout (Brix hack) [David Winter, 1997].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Breakout [Carmelo Cortez, 1979].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Brick (Brix hack, 1990).ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Brix [Andreas Gustafsson, 1990].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Cave.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Coin Flipping [Carmelo Cortez, 1978].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Connect 4 [David Winter].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Craps [Camerlo Cortez, 1978].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Deflection [John Fort].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Figures.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Filter.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Guess [David Winter] (alt).ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Guess [David Winter].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Hi-Lo [Jef Winsor, 1978].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Hidden [David Winter, 1996].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Kaleidoscope [Joseph Weisbecker, 1978].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Landing.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Lunar Lander (Udo Pernisz, 1979).ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Mastermind FourRow (Robert Lindley, 1978).ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Merlin [David Winter].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Missile [David Winter].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Most Dangerous Game [Peter Maruhnic].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Nim [Carmelo Cortez, 1978].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Paddles.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Pong (1 player).ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Pong (alt).ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Pong 2 (Pong hack) [David Winter, 1997].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Pong [Paul Vervalin, 1990].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Programmable Spacefighters [Jef Winsor].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Puzzle.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Reversi [Philip Baltzer].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Rocket Launch [Jonas Lindstedt].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Rocket Launcher.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Rocket [Joseph Weisbecker, 1978].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Rush Hour [Hap, 2006] (alt).ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Rush Hour [Hap, 2006].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Russian Roulette [Carmelo Cortez, 1978].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Sequence Shoot [Joyce Weisbecker].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Shooting Stars [Philip Baltzer, 1978].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Slide [Joyce Weisbecker].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Soccer.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Space Flight.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Space Intercept [Joseph Weisbecker, 1978].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Space Invaders [David Winter] (alt).ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Space Invaders [David Winter].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Spooky Spot [Joseph Weisbecker, 1978].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Squash [David Winter].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Submarine [Carmelo Cortez, 1978].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Sum Fun [Joyce Weisbecker].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Syzygy [Roy Trevino, 1990].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Tank.ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Tapeworm [JDR, 1999].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Tetris [Fran Dachille, 1991].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Tic-Tac-Toe [David Winter].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Timebomb.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Tron.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/UFO [Lutz V, 1992].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/Vers [JMN, 1991].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Vertical Brix [Paul Robson, 1996].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Wall [David Winter].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Wipe Off [Joseph Weisbecker].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/Worm V4 [RB-Revival Studios, 2007].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/games/X-Mirror.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/games/ZeroPong [zeroZshadow, 2007].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/hires/Astro Dodge Hires [Revival Studios, 2008].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/hires/Hires Maze [David Winter, 199x].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/hires/Hires Particle Demo [zeroZshadow, 2008].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/hires/Hires Sierpinski [Sergey Naydenov, 2010].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/hires/Hires Stars [Sergey Naydenov, 2010].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/hires/Hires Test [Tom Swan, 1979].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/hires/Hires Worm V4 [RB-Revival Studios, 2007].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/hires/Trip8 Hires Demo (2008) [Revival Studios].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/programs/BMP Viewer - Hello (C8 example) [Hap, 2005].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/programs/Chip8 Picture.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/programs/Chip8 emulator Logo [Garstyciuks].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/programs/Clock Program [Bill Fisher, 1981].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/programs/Delay Timer Test [Matthew Mikolay, 2010].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/programs/Division Test [Sergey Naydenov, 2010].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/programs/Fishie [Hap, 2005].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/programs/Framed MK1 [GV Samways, 1980].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/programs/Framed MK2 [GV Samways, 1980].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/programs/IBM Logo.ch8\",\"txt\":false},{\"bin\":\"chip8-roms/programs/Jumping X and O [Harry Kleinberg, 1977].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/programs/Keypad Test [Hap, 2006].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/programs/Life [GV Samways, 1980].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/programs/Minimal game [Revival Studios, 2007].ch8\",\"txt\":false},{\"bin\":\"chip8-roms/programs/Random Number Test [Matthew Mikolay, 2010].ch8\",\"txt\":true},{\"bin\":\"chip8-roms/programs/SQRT Test [Sergey Naydenov, 2010].ch8\",\"txt\":false}]");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	// startup
/******/ 	// Load entry module
/******/ 	__webpack_require__("./src/index.js");
/******/ 	// This entry module used 'exports' so it can't be inlined
/******/ })()
;
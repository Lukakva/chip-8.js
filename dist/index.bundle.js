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

var OPCODES_PER_CYCLE = 10;

var Chip8 = /*#__PURE__*/function () {
  function Chip8(options) {
    _classCallCheck(this, Chip8);

    this.canvas = document.querySelector(options.canvas);

    if (!this.canvas) {
      throw new Error('Canvas not found:', options.canvas);
    }

    this.audioContext = new (AudioContext || webkitAudioContext)();
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
      this.memory = new Uint8Array(RAM_SIZE);
      this.loadFontSet();
      /*
      	15 general purpose 8-bit registers (V0-VE)
      	+ 1 carry flag register (VF)
      */

      this.registers = new Uint8Array(N_REGISTERS);
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
      // Not initialized yet
      if (!this.keyboard) {
        return;
      }

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
      // Not initialized yet
      if (!this.keyboard) {
        return;
      }

      console.log(key + ' was released'); // Since we have a hex keyboard, we can just parse the index

      var index = parseInt(key, 16);

      if (isNaN(index) || index > 0xF) {
        return;
      }

      this.keyboard[key] = 0;
    }
  }, {
    key: "startBeeping",
    value: function startBeeping() {
      if (this.oscillator) {
        return;
      }

      var oscillator = this.audioContext.createOscillator();
      oscillator.type = 'square';
      oscillator.frequency.value = 440;
      oscillator.connect(this.audioContext.destination);
      oscillator.start(0);
      this.oscillator = oscillator;
    }
  }, {
    key: "stopBeeping",
    value: function stopBeeping() {
      if (this.oscillator) {
        this.oscillator.stop(0);
        this.oscillator.disconnect(this.audioContext.destination);
        this.oscillator = null;
      }
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

      if (this.screenChanged) {
        this.screen.render();
        this.screenChanged = false;
      }

      this.updateTimers();

      if (this.soundTimer > 0) {
        this.startBeeping();
      } else {
        this.stopBeeping();
      }

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
  var str = n.toString(16).toUpperCase();

  while (str.length < 4) {
    str = '0' + str;
  }

  return '0x' + str;
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
      screen.clear();
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
      chip.registers[X] += NN;
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

      var result = registers[X] + registers[Y]; // Store the carry in VF Register

      registers[0xF] = result > 0xFF; // Limit the resulting sum by 255

      registers[X] = result;
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
      var X = (code & 0x0F00) >> 8;
      var Y = (code & 0x00F0) >> 4;
      var N = code & 0x000F;
      var startX = registers[X];
      var startY = registers[Y]; // Indicate if any pixel was flipped from set to unset (collision)

      registers[0xF] = 0; // So sometimes the ROM trusts the CPU to not render anything that
      // goes over the screen. Okay :)

      for (var y = 0; y < N && startY + y < screen.height; y++) {
        // A row of 8 pixels (where every bit is a pixel color)
        var row = chip.memory[chip.registerI + y]; // Loop over each pixel value (bit by bit)

        for (var x = 0; x < 8; x++) {
          var mask = 0x80 >> x; // If this pixel should be flipped

          if ((row & mask) > 0) {
            var pixelX = startX + x;
            var pixelY = startY + y; // Was this pixel a 1? It's 0 now. Set the VF register

            if (screen.get(pixelX, pixelY)) {
              registers[0xF] = 1;
            }

            screen.toggle(pixelX, pixelY);
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
    	Opcode: EXA1
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
                return 'clear';

              case 0xEE:
                return 'returnFromSubroutine';

              default:
                return 'doNothing';
            }
          }

        case 0x1000:
          return 'jump';

        case 0x2000:
          return 'callSubroutine';

        case 0x3000:
          return 'skipIfRegisterEquals';

        case 0x4000:
          return 'skipIfRegisterNotEquals';

        case 0x5000:
          return 'skipIfRegistersEqual';

        case 0x6000:
          return 'setRegisterValue';

        case 0x7000:
          return 'addToRegisterValue';

        /*
        	There are a few opcodes beginning with 8, which can be
        	distinguished by the last 4 bits
        */

        case 0x8000:
          {
            // The last 4 bits
            switch (code & 0x000F) {
              case 0x0:
                return 'assign';

              case 0x1:
                return 'bitwiseOr';

              case 0x2:
                return 'bitwiseAnd';

              case 0x3:
                return 'bitwiseXor';

              case 0x4:
                return 'add';

              case 0x5:
                return 'subtract';

              case 0x6:
                return 'shiftRight';

              case 0x7:
                return 'subtractRegisters';

              case 0xE:
                return 'shiftLeft';
            }
          }

        case 0x9000:
          return 'skipIfRegistersNotEqual';

        case 0xA000:
          return 'setMemoryRegister';

        case 0xB000:
          return 'jumpV0';

        case 0xC000:
          return 'rand';

        case 0xD000:
          return 'draw';

        case 0xE000:
          {
            switch (code & 0x00FF) {
              case 0x9E:
                return 'skipIfKeyPressed';

              case 0xA1:
                return 'skipIfKeyNotPressed';
            }
          }

        case 0xF000:
          {
            // For F opcodes, the last 2 bits are the identifiers
            switch (code & 0x00FF) {
              case 0x07:
                return 'getDelayTimer';

              case 0x0A:
                return 'awaitKeyPress';

              case 0x15:
                return 'setDelayTimer';

              case 0x18:
                return 'setSoundTimer';

              case 0x1E:
                return 'addMem';

              case 0x29:
                return 'setCharacterInMemory';

              case 0x33:
                return 'storeBCD';

              case 0x55:
                return 'dumpRegisters';

              case 0x65:
                return 'loadRegisters';
            }
          }
      }

      throw new Error('Unknown instruction: ' + hex(code) + '. At PC ' + this.chip.pc);
    }
  }, {
    key: "execute",
    value: function execute() {
      var name = this.getInstructionName(); // console.log(hex(this.code), '=', name)

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
    this.canvas.height = height * RESOLUTION;
    this.canvas.style.imageRendering = 'pixelated';
    this.ctx = canvas.getContext('2d'); // 1 dimensional Uint8Array, instead of a matrix

    this.pixels = new Uint8Array(height * width);
    this.clear();
  }
  /*
  	Retrieves the value of a pixel at X, Y
  */


  _createClass(Screen, [{
    key: "get",
    value: function get(x, y) {
      var index = y * this.width + x;
      return !!this.pixels[index];
    }
    /*
    	Toggles the value of a pixel at X, Y
    */

  }, {
    key: "toggle",
    value: function toggle(x, y) {
      var index = y * this.width + x;

      if (index < this.pixels.length) {
        this.pixels[index] ^= 1;
      }
    }
  }, {
    key: "clear",
    value: function clear() {
      for (var i = 0; i < this.pixels.length; i++) {
        this.pixels[i] = 0;
      }
    }
    /*
    	https://stackoverflow.com/a/16599668/7214615
    */

  }, {
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
          if (this.get(x, y)) {
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
    button.setAttribute('class', 'button active');
    chip.onKeyDown(button.innerText.trim());
    lastButton = button;
  };

  button.onmouseup = function () {
    lastButton = null;
    button.setAttribute('class', 'button');
    chip.onKeyUp(button.innerText.trim());
  };
};

for (var i = 0; i < buttons.length; i++) {
  _loop(i);
}

document.onmouseup = function () {
  if (lastButton !== null) {
    lastButton.onmouseup();
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
  chip.loadRomFromFile(rom.bin).then(function () {
    chip.start();
  });
  instructionsNode.innerHTML = rom.txt;
};

var keys = ['x', // 0
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
'v' // 15
];

document.onkeydown = function (e) {
  if (e.metaKey || e.ctrlKey || e.shiftKey) {
    return;
  }

  var key = e.key;
  var index = keys.indexOf(key);

  if (index > -1) {
    var value = index.toString(16).toUpperCase();
    var button = document.querySelector("[data-value='".concat(value, "']"));

    if (button) {
      button.onmousedown();
    }
  }
};

document.onkeyup = function (e) {
  var key = e.key;
  var index = keys.indexOf(key);

  if (index > -1) {
    var value = index.toString(16).toUpperCase();
    var button = document.querySelector("[data-value='".concat(value, "']"));

    if (button) {
      button.onmouseup();
    }
  }
};

window._chip = chip;

/***/ }),

/***/ "./src/roms.json":
/*!***********************!*\
  !*** ./src/roms.json ***!
  \***********************/
/***/ ((module) => {

module.exports = JSON.parse("[{\"bin\":\"chip8-roms/demos/Maze (alt) [David Winter, 199x].ch8\",\"txt\":\"Maze, by David Winter\\n\\nDrawing a random maze like this one consists in drawing random diagonal\\nlines. There are two possibilities: right-to-left line, and left-to-right\\nline. Each line is composed of a 4*4 bitmap. As the lines must form non-\\ncircular angles, the two bitmaps won't be '/' and '\\\\'. The first one\\n(right line) will be a little bit modified. See at the end of this source.\\n\\nThe maze is composed of 16 lines (as the bitmaps are 4 pixels high), each\\nline consists of 32 bitmaps.\\nBitmaps are drawn in random mode. We choose a random value (0 or 1).\\nIf it is 1, we draw a left line bitmap. If it is 0, we draw a right one.\\n\"},{\"bin\":\"chip8-roms/demos/Maze [David Winter, 199x].ch8\",\"txt\":\"Maze, by David Winter\\n\\nDrawing a random maze like this one consists in drawing random diagonal\\nlines. There are two possibilities: right-to-left line, and left-to-right\\nline. Each line is composed of a 4*4 bitmap. As the lines must form non-\\ncircular angles, the two bitmaps won't be '/' and '\\\\'. The first one\\n(right line) will be a little bit modified. See at the end of this source.\\n\\nThe maze is composed of 16 lines (as the bitmaps are 4 pixels high), each\\nline consists of 32 bitmaps.\\nBitmaps are drawn in random mode. We choose a random value (0 or 1).\\nIf it is 1, we draw a left line bitmap. If it is 0, we draw a right one.\\n\"},{\"bin\":\"chip8-roms/demos/Particle Demo [zeroZshadow, 2008].ch8\",\"txt\":\"This is my particledemo for the Chip-8, SuperChip and MegaChip8.\\nWorks on real hardware as well as emulators\\n\\nEnjoy!\\n\\n  zeroZshadow\"},{\"bin\":\"chip8-roms/demos/Sierpinski [Sergey Naydenov, 2010].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/demos/Sirpinski [Sergey Naydenov, 2010].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/demos/Stars [Sergey Naydenov, 2010].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/demos/Trip8 Demo (2008) [Revival Studios].ch8\",\"txt\":\"-----------------------------------------------------------------------------\\n\\t\\t\\t      /////////////////\\n\\t                      //////////////////\\n        \\t              ////          ////\\n\\t               \\t      ////   ///////////\\n\\t                      ////  ///////////\\n                              ////  ////\\n                              ////  ///////////\\n                              ////   //////////\\n  \\t     \\t   \\t\\n  \\t\\t\\t   www.revival-studios.com\\n-----------------------------------------------------------------------------\\nTitle\\t\\t:\\tTrip8 / SuperTrip8 demo\\nAuthor\\t\\t:\\tMartijn Wenting / Revival Studios\\nGenre\\t\\t:\\tDemo\\nSystem\\t\\t:\\tChip-8 / SuperChip8\\nDate\\t\\t:\\t14/10/2008\\nProduct ID\\t:\\tRS-C8004\\n-----------------------------------------------------------------------------\\n\\nAll the contents of this package are (c)Copyright 2008 Revival Studios.\\n\\nThe contents of the package may only be spread in its original form, and may not be\\npublished or distributed otherwise without the written permission of the authors.\\n\\nDescription:\\n------------\\nThe Trip8/SuperTrip8 demo are demo's for the Chip-8 and SuperChip8 systems. The demo consists of an intro, 3D vectorballs, and 4 randomized dot-effects.  \\n\\nWriting a demo for the original Chip-8 interpreter was a real pain, since your framerate basically drops in half for every sprite you need to draw. So even clearing and redrawing a few dots will cause the framerate to drop to near zero :) Originally the demo was going to be bigger and there were much more graphical effects programmed/prototyped, but a lot of these effects turned out to be too much for the original unoptimized Chip-8 interpreters to handle. \\n\\nRunning the Demo:\\n-----------------\\nUse the Megachip emulator or any other Chip-8/SuperChip compatible emulator to run the slideshow.\\n\\nCredits:\\n--------\\nProgramming/Graphics/Design by: Martijn Wenting\\n\\nDistribution:\\n-------------\\nThis package can be freely distributed in its original form.\\nIf you would like to include this slideshow in your rom package, please let me know.\\n\\nWatch out for more releases soon!\\n\\n\\n\\tMartijn Wenting / Revival Studios\\n\\n\"},{\"bin\":\"chip8-roms/demos/Zero Demo [zeroZshadow, 2007].ch8\",\"txt\":\"This is my first program for the CHIP-8, a simple demo with 4 bouncing sprites.\\n\\nEnjoy!\"},{\"bin\":\"chip8-roms/games/15 Puzzle [Roger Ivie] (alt).ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/15 Puzzle [Roger Ivie].ch8\",\"txt\":\"Same than PUZZLE2. Wait for randomization... Instead of moving the item by pressing his associated key, move it UP DOWN LEFT RIGHT with respectively 2 8 4 6. Up and Down are inverted as the game uses the original CHIP8 keyboard.\"},{\"bin\":\"chip8-roms/games/Addition Problems [Paul C. Moews].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Airplane.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Animal Race [Brian Astle].ch8\",\"txt\":\"9. VIP Animal Race\\n\\nAnimal Race is a fun game for one person, with an element of luck - sure to\\nput a smile on your face.  Five different animals race against one another\\nand you have the chance to test your expertise at picking the winner.\\n\\n\\nHow To Play Animal Race\\n\\n1. Load the CHIP-8 interpretor at 0000-01FF\\n   and the game starting at 0200.\\n\\n2. Turn RUN switch on.\\n\\n3. Wait until the animals are lined up and read to start, then select an animal\\n   by pressing a letter A through E.  A mark will appear to the left of the\\n   animal to remind you of the one you have selected.\\n\\n4. Decide how much you want to bet (up to a limit of $9), then press that key.\\n\\n5. After the race is over, press zero (or any key) to start the next race.\\n   Your winnings or losses will be computed and the new total displayed at\\n   the begining of the next race.\\n\\nHints for expert players\\nAll animals move at approximately the same speed, but they start from different\\npositions.  The odds for each animal are related to the starting position but\\ninclude a random element.  Some races favor the player and you should bet up to\\nthe limit on these.  Some races are unfavorable and you should bet carefully\\non these.\\n\\nYou can win the game by accumulating $256 or more.\\n\"},{\"bin\":\"chip8-roms/games/Astro Dodge [Revival Studios, 2008].ch8\",\"txt\":\"-----------------------------------------------------------------------------\\n\\t\\t\\t      /////////////////\\n\\t                      //////////////////\\n        \\t              ////          ////\\n\\t               \\t      ////   ///////////\\n\\t                      ////  ///////////\\n                              ////  ////\\n                              ////  ///////////\\n                              ////   //////////\\n  \\t     \\t   \\t\\n  \\t\\t\\t   www.revival-studios.com\\n-----------------------------------------------------------------------------\\nTitle\\t\\t:\\tAstro Dodge\\nAuthor\\t\\t:\\tMartijn Wenting / Revival Studios\\nGenre\\t\\t:\\tGame\\nSystem\\t\\t:\\tChip8 / SuperChip8\\nDate\\t\\t:\\t18/12/2008\\nProduct ID\\t:\\tRS-C8003\\n-----------------------------------------------------------------------------\\n\\nAll the contents of this package are (c)Copyright 2008 Revival Studios.\\n\\nThe contents of the package may only be spread in its original form, and may not be\\npublished or distributed otherwise without the written permission of the authors.\\n\\nDescription:\\n------------\\nAstro Dodge is an arcade game for the Chip8 and SuperChip8 systems.\\nBoth versions of the game are included in this package.\\n \\nYour goal is to make your way through the asteroids field and dodge the asteroids, scoring points for each asteroid you are able to dodge.\\nButton 2,4,6,8 will move your ship, button 5 will start the game.\\n\\nRunning the game(s):\\n--------------------\\nThe CHIP8 version of the game has been programmed to be compatible with original hardware like the Cosmac VIP and Telmac 1800.\\nUse the Megachip emulator or any other Chip8/SuperChip compatible emulator to run the game(s).\\n\\nCredits:\\n--------\\nProgramming and Graphics by: Martijn Wenting\\n\\nDistribution:\\n-------------\\nThis package can be freely distributed in its original form.\\nIf you would like to include this game in your rom package, please let me know.\\n\\nWatch out for more releases soon!\\n\\n\\n\\tMartijn Wenting / Revival Studios\\n\\n\"},{\"bin\":\"chip8-roms/games/Biorhythm [Jef Winsor].ch8\",\"txt\":\"13. VIP Biorhythm\\n\\nThe theory of Biorhythm states that there are thre predominant cycles that can influence\\nhuman behavior.  These include a 23-day physical cycle, a 28-day emotional cycle and a\\n33-day intellectual cycle.  All three cycles start at birth and continue throughout life.\\n\\nEach cycle consists of a positive and a negative period.  Physical, Emotional and\\nIntellectual aspects are enhanced during positive periods.  Poor performance is\\nindicated by the negative period of a cycle.\\n\\nA critical day occurs on the crossover from the positive to the negative period or\\nvice versa.  A critical day indicates instability in a particular aspect.\\n\\n\\nHow to Use VIP Biorhythm\\n\\n1. Load the CHIP-8 interpreter at 0000-01FF and\\n   the game starting at 0200.\\n\\n2. Turn RUN switch on.\\n\\n3. Enter birthdate using 2-digit month, 2-digit day, and 4-digit year.\\n\\n4. Enter start date using 2-digit month, 2-digit day, and 4-digit year. The start date\\n   indicates the first day of the 32-day Biorhythm chart the program will generate.\\n\\n5. After a period of calculation proportional to the span of time involved, the three\\n   cycle curves will be shown for a 32-day period.  Each horizontal bit position\\n   represents one day in the cycle.  The start day, on the left, and every seventh\\n   day are indicated by week markers.  The first day of a positive or negative period\\n   is a critical day.\\n\\n6. To advance the start date, hold key F down until the desired date is reached.\\n   To decrement the start date, hold key B down.  These functions allow changing the\\n   start date slightly without reentering all the dates and waiting for the calculations\\n   to be preformed.\\n  \\n7. Press Key 0 to clear the screen and enter a new set of dates.\\n\\n   \\n\\n   See VIPG1-13.jpg\\n\\n\\nINTERPRETATION\\n\\n\\n\\t\\t\\tPhysical\\t\\tEmotional\\t\\tIntellectual\\n\\nPositive Period\\t\\tStrong, \\t\\tGood moods, \\t\\tGood Judgement\\n(Up)\\t\\t\\tVigorous\\t\\tCooperative\\t\\tSharp Mentally\\n\\nNegative Period\\t\\tTire easily,\\t\\tLow Enthusiasm,\\t\\tLow attentiveness\\n(Down)\\t\\t\\tLess Stamina\\t\\tFeelings Subdued\\tand concentration\\n\\nCritical Days\\t\\tSusceptible to injury\\temotionally unstable,\\tPoor memory,\\n(Crossover)\\t\\tor Illness,\\t\\tUpset easily\\t\\tProne to mistakes\\n\\t\\t\\tLow endurance\\n\"},{\"bin\":\"chip8-roms/games/Blinky [Hans Christian Egeberg, 1991].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Blinky [Hans Christian Egeberg] (alt).ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Blitz [David Winter].ch8\",\"txt\":\"Blitz, by: David Winter\\n\\nThis game is a BOMBER clone. You are in a plane, and you must destroy the towers of a town. Your plane is flying left to right, and goes down. Use 5 to drop a bomb. The game ends when you crash yourself on a tower...\\n\\n\"},{\"bin\":\"chip8-roms/games/Bowling [Gooitzen van der Wal].ch8\",\"txt\":\"7. VIP Bowling\\n\\nBowling is a great game for recreation and competion requiring skill and a little\\nbit of luck.  This program simulates bowling closely with regular scoring and the\\noption of using three different spins on the ball.\\n\\nHow to play VIP Bowling\\n\\n1. Load the CHIP-8 interpretor at 0000-01FF\\n   and the game starting at 0200.\\n\\n2. Turn RUN switch on.\\n\\n3. Up to 6 persons can compete.  Make the choice by pressing Key 1,2,3,4,5 or 6.\\n   The players will be referred to as A,B,C,D,E and F.\\n\\n4. It is possible to play up to 10 frames in one game.  Make your choice of the\\n   number of frames by pressing Key 1,2,3,4,5,6,7,8,9 or 0 (for 10 frames).\\n\\n5. It is possible to choose 3 ball speeds (Key 1,2 or 3).  The speed option only\\n   affects the ball after it is released.\\n\\n6. At the start of a player's turn, the video will display whose turn it is and\\n   whether he is working on a spare, strike, 2 strikes or nothing.\\n   Release the ball by pressing on of the following keys: Key 1,2,3,5,7,8 or 9.\\n   -Key 5 will cause a straight ball.\\n   -Key 1,2 and 3 will cause the ball to spin up.\\n     -Key 1 before the first pin\\n     -Key 2 after  the first pin\\n     -Key 3 after  the second pin\\n   -Key 7,8 and 9 will cause the ball to spin up.\\n     -Key 7 before the first pin\\n     -Key 8 after  the first pin\\n     -Key 9 after  the second pin\\n\\n7. After the player's turn ends, the video will display whose turn it was, the\\n   frame, and the score.  The next players follows the instructions at 6 above.\\n\\n8. After all players have had their turn in a frame, the video will display the\\n   total of each player and whether he is working on a spare, 1 strike, 2 strikes\\n   or nothing.  It will display the frame number and the total number of frames\\n   to go (unless the last frame was played).\\n   After pressing Any key, player A can start in the next frame.  Continue with\\n   instruction 6 above.\\n\\n9. If all frames in the game have been finished, press any key again.  The player's\\n   who are still working on a spare will recieve 1 more ball, and those working\\n   on 1 or 2 strikes will receive 2 balls.\\n\\n10. After all players have finished the game, the final score will be displayed.\\n\\n\\n    \"},{\"bin\":\"chip8-roms/games/Breakout (Brix hack) [David Winter, 1997].ch8\",\"txt\":\"Breakout (Brix hack), by: David Winter\\n\\nThis game is an &quot;arkanoid&quot; precursor. You have 5 lives, and your goal is the destruction of all the brixs. Use 4 and 6 to move your paddle. The game ends when all the brixs are destroyed.\\n\\nThis game is the same than BRIX, but has graphics looking like the game on the Atari 2600 console.\\n\\n\"},{\"bin\":\"chip8-roms/games/Breakout [Carmelo Cortez, 1979].ch8\",\"txt\":\"Breakout, by: Carmelo Cortez\\n\\nThe game, Breakout, is a variation of the Wipe-Off game.\\nYou have six walls and 20 balls to start. To win you must get through all walls to the top of the screen. At the end of the game the program will show the number of times you hit the walls and will show &quot;FREE!&quot; if you get through.\"},{\"bin\":\"chip8-roms/games/Brick (Brix hack, 1990).ch8\",\"txt\":\"BRICK: a modified version of BRIX, a CHIP-8 game.\\nOriginal BRIX by Andreas Gustafsson.\\nThis one is a solid wall; no air between bricks!\"},{\"bin\":\"chip8-roms/games/Brix [Andreas Gustafsson, 1990].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Cave.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Coin Flipping [Carmelo Cortez, 1978].ch8\",\"txt\":\"Coin Flipping, by: Carmelo Cortez\\n\\nThe game is a Coin FlLpping program. Flip run up and the\\ncomputer starts to flip a coin, and at the same tine shosing heads\\nand tails on the screen, stopping at the value set in VC.\\n\"},{\"bin\":\"chip8-roms/games/Connect 4 [David Winter].ch8\",\"txt\":\"Connect 4, by: David Winter\\n\\nThis game is for two players. The goal is to align 4 coins in the\\ngame area. Each player's coins are colored. When you drop a coin,\\nit is paced on the latest dropped coin in the same column, or at\\nthe bottom if the column is empty. Once the column is full, you\\ncannot place any more coins in it. To select a column, use 4 and 6.\\n\\nTo drop a coin, use 5. There is no winner detection yet. This will\\nbe soon avalaible (Hey! I don't spend my life on CHIP8 !).\\n\"},{\"bin\":\"chip8-roms/games/Craps [Camerlo Cortez, 1978].ch8\",\"txt\":\"Craps, by: Camerlo Cortez\\n\\nTo use the Craps program, press any key to roll dice.\\n7 or 11 wins, 12, 2 or 3 loses on first roll. The second roll must match the first to win, but if you roll a seven you lose. This program could be expanded to include on-the-screen scoring of bets.\\n\"},{\"bin\":\"chip8-roms/games/Deflection [John Fort].ch8\",\"txt\":\"8.  VIP DEFLECTION\\n\\nIn the VIP Deflection game you position mirrors anywhere on the display screen.\\nThe object of the game is to deflect a ball of the mirrors a maximum number of\\ntimes before hitting the target.\\n\\nThe number of deflections times the target number gives you deflection points.\\nThese are added to your previous point total.  If you fail to hit the target you\\nget no points.  The winner of the game is the player who accumulates 257 or\\nmore deflected points.\\n\\nHow to Play VIP Deflection\\n\\n1. Load the CHIP-8 interpretor at 0000-01FF\\n   and the game starting at 0200.\\n\\n2. Turn RUN switch on.\\n\\n3. After the scores appear a letter, the target with a number and a ball.  The\\n   letter signifies the player who will program the mirrors.  This sequence will\\n   be repeated until there is a winner.\\n\\n4. To program the mirrors, select the proper mirror type by using Table 1 (VIP1-8.jpg)\\n   as a guide.  Key 1 will place a horizontal mirror on the board.  Key 2 selects a\\n   vertical mirror, Key 3 a slant-left mirror, Key 4 a slant-right mirror.\\n\\n5. After a mirror has been selected, you may position the mirror by using keys 1\\n   through 4 and 6 through 9 (see Table 2 for movement of a mirror).  Once a\\n   mirror has been selected and positioned, it may be fixed into position by pressing\\n   Key 5.\\n\\n   Table 2 - Mirror Positioning and Ball Direction\\n   Key Selection     |  Positioning and Direction\\n   ------------------+---------------------------\\n         1           |  up and to the left\\n         2           |  up\\n         3           |  up and to the right\\n         4           |  left\\n         5           |  right\\n         7           |  down and to the left\\n         8           |  down\\n         9           |  down and to the right\\n\\n6. You may position up to 10 mirrors on the game board.  After you have the maximum\\n   amount on the board you must press Key 0 to progress to the fire mode.  If you\\n   wish to progress to the fire mode with less than 10 mirrors programmed, you may\\n   do so by pressing Key 0.  You fire the ball in the direction you want by using\\n   Keys 1 through 4 and Keys 6 through 9 (see Table 2).\\n\\n7. After the ball has reached the target or leaves the game board, the player's\\n   score is computed and displayed and a new ball and target appear.\\n\\n\\n\\n\"},{\"bin\":\"chip8-roms/games/Figures.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Filter.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Guess [David Winter] (alt).ch8\",\"txt\":\"Think to a number between 1 and 63. CHIP8 shows you several boards and you have to tell if you see your number in them. Press 5 if so, or another key if not. CHIP8 gives you the number...\\n\"},{\"bin\":\"chip8-roms/games/Guess [David Winter].ch8\",\"txt\":\"Think to a number between 1 and 63. CHIP8 shows you several boards and you have to tell if you see your number in them. Press 5 if so, or another key if not. CHIP8 gives you the number...\\n\"},{\"bin\":\"chip8-roms/games/Hi-Lo [Jef Winsor, 1978].ch8\",\"txt\":\"Hi-Lo, by: Jef Winsor\\n\\nYou have 10 chances to guess the value of a random number between 00 and 99 selected by the program. The number at the right of the screen shows the number of the guess you are using. Enter a two digit number and the computer tells you if you are high or low. Press any key to erase this number and then, try again. If you have failed after ten guesses, press any key and the number will be shown. If you are good you will never need more than seven guesses. \\n\"},{\"bin\":\"chip8-roms/games/Hidden [David Winter, 1996].ch8\",\"txt\":\"                ----------------------------------------\\n                                 HIDDEN!\\n                    Copyright (1996) by David WINTER\\n                ----------------------------------------\\n\\n\\nHIDDEN is a &quot;memory&quot; game. It is very simple to play.\\n\\nThe rules are as follow: your goal is to find all the identical cards\\nin a minimum time.\\n\\nYou are playing in a 4*4 card grid. You can see only two cards at the\\nsame time. Once this time passed, these two cards will remain shown\\nif they are identical, otherwise they will be hidden again.\\n\\nWhen the game is finished, two scores are shown:\\n        SC is your score, corresponding to the number of tries\\n        HI is the best score (smallest number of tries made to finish)\\n\\nThe keys are:\\n\\n        [2] : More DOWN\\n        [4] : Move LEFT\\n        [5] : Show card\\n        [6] : Move RIGHT\\n        [8] : Move UP\\n\\nEnjoy !!!\\n\"},{\"bin\":\"chip8-roms/games/Kaleidoscope [Joseph Weisbecker, 1978].ch8\",\"txt\":\"VIP Kaleidoscope, by: Joseph Weisbecker\\n\\nFour spots appear in a group at the center of the screen. Press keys 2, 4,  6, or 8 to create a pattern. Keep your pattern smaller than 138 key depressions.\\n\\nPush key 0 to terminate pattern entry. Pushing key 0 causes your pattern to be continuously repeated forming a fascinating, changing kaleidoscope display on the screen. A &quot;44444442220&quot; key sequence provides a very nice effect Experiment to\\nfind other nice patterns. \\n\\n\"},{\"bin\":\"chip8-roms/games/Landing.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Lunar Lander (Udo Pernisz, 1979).ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Mastermind FourRow (Robert Lindley, 1978).ch8\",\"txt\":\"\\t\\tMASTERMIND\\n\\t\\t   by\\n\\t      Robert Lindley\\n\\nI have progranmed two versLons of the game Mastermind. This game is distributed by Invicta Plastics, Suite 940, 200 - 5th Ave., New York, NY 10010, and is available most pLaces where toys and games are sold.\\nFor complete details of the game, please refer to their instructions. The information given here refers to this particular VIP iurplementation.\\nThe two versions are essentially the same except that the first has a four number code and the second has a five  nr:mber hidden code selected at random..  In the four number version, the digits one through six are used and in the five  number version the diglts zero through seven are used.\\nWhile the game is running, the other hex keys, except key F, have no effect. Key F is used when you change your mind and want to change your input. This key erases the current partial entry.\\nThe game starts by displaying a series of dashes arranged in rows. As the game progresses, the player attempts to  deduce the hidden code by replacing the dashes with digits entered via the hex keyboard. Each tlme a hex key is used, the selected digit replaces a dash in  one vertical column. This vertical column is one guess of the ten allowed to deduce\\nthe hidden number. When the bottom dash in any column is replaced by a digit,  that try is imidiately scored. This score appears below the current column. If any digit in the column exactly matches the hidden number digit in the same row, a broken bar will appear. then four or five (one for each row in the game) appear, the hidden number has been deduced\\nand it will be revealed at the right end of  the screen. If any digit in the column matches a hidden digit, but in an incorrect erorr, a white bar will appear. Note that the scoring is across all rows. For example, if there are two fives in a column and one of then is in the correct row and there is only one five in the hidden numbers, one broken bar will appear.\\nWhen all allowed ten tries  have been used, the hidden number will be revealed. \\n\\n\"},{\"bin\":\"chip8-roms/games/Merlin [David Winter].ch8\",\"txt\":\"Merlin, by: David Winter\\n\\nThis is the SIMON game. The goal is to remember in which order the squares are lighted. The game begins by lighting 4 random squares, and then asks you to light the squares in the correct order.\\nYou win a level when you give the exact order, and each increasing level shows a additionnal square. The game ends when you light an incorrect square. Keys are 4 and 5 for the two upper squares, then 1 and 2 for the two other ones.\\n\"},{\"bin\":\"chip8-roms/games/Missile [David Winter].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Most Dangerous Game [Peter Maruhnic].ch8\",\"txt\":\"10. VIP Most Dangerous Game\\n\\nVIP Most Dangerous Game pits a hunter against a hunted in a maze.  The hunter must\\nshoot the hunted before either time runs out or the hunted escapes the maze.\\nHowever, neither the hunted nor the hunter can see a wall in the maze until he runs\\ninto it.  There is always at least one path through the maze.\\n\\nHow To Play VIP Most Dangerous Game\\n\\n1. Load the CHIP-8 interpretor at 0000-01FF\\n   and the game starting at 0200.\\n\\n2. Turn RUN switch on.\\n\\n3. Hunted's turn:\\n   When the arrow appears in the lower left, it is the hunted's turn.  Keys 2-4-6-8\\n   control direction (up-left-right-down, respectively).  The hunted continues to\\n   move until a) he makes 5 moves, b) he hits a wall or c) key 0 is pressed.\\n\\n4. Hunter's turn\\n   When the arrow appears in the lower right, it is the hunter's turn.  The hunter's\\n   turn consists of two modes, the move and the shoot.  Keys 2-4-6-8 and 0 control both\\n   modes.  Like the hunted, the hunter continues to move until a) he makes 3 moves,\\n   b) he hits a wall or c) key 0 is pressed.  If he hits the wall, case b), he cannot\\n   fire a bullet.  The hunter may fire one of his bullets using the direction keys\\n   2-4-6-8.  The bullet will travel four squares in the corresponding direction, unless\\n   a wall is encountered.  If the hunter prefers not to use a bullet, he must press key 0.\\n\\n5. Repeat steps 3 and 4 until:\\n   a) The number of turns (upper left on the display) expire.  The hunted wins.\\n   b) The hunter lands on or shoots the hunted.  The hunter wins.\\n   c) The hunted lands on hunter, thereby giving up.  The hunter wins.\\n   d) The hunted reaches the lower right corner of the maze with at least 1 move\\n      remaining in his turn.  The hunted wins, by escaping the maze.\\n\\n6. Variations of VIP Most Dangerous Game may be played by changing certain bytes in\\n   the program.\\n\\nLocation Default Meaning\\n0215\\t 0F\\t Number of turns in the game.\\n0217\\t 06\\t Number of bullets hunter has at start.\\n0219\\t 03\\t Number of moves per turn for the hunter.\\n0221\\t 01\\t Number of squares per move (hunted and hunter).\\n022B\\t 05\\t Number of moves per turn for the hunted.\\n024B\\t 01\\t If zero, walls are invisible.\\n0355\\t 04\\t Number of squares a bullet will go.\\n04E3\\t 70\\t Probability (out of 100Hex) of a wall appearing.\\n04EB\\t FE\\t If FF, a wall may appear at previously tested boundaries.\\n\"},{\"bin\":\"chip8-roms/games/Nim [Carmelo Cortez, 1978].ch8\",\"txt\":\"Nim, by: Carmelo Cortez\\n\\nThe Nim Game is a little less graphic than most games. The player may go first by pressing. &quot;F&quot; key, any other let the computer go first.\\nYou subtract 1, 2 or 3 fron the score. The one who ends up with the  last number loses!\"},{\"bin\":\"chip8-roms/games/Paddles.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Pong (1 player).ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Pong (alt).ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Pong 2 (Pong hack) [David Winter, 1997].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Pong [Paul Vervalin, 1990].ch8\",\"txt\":\"OK. here is PONG version 1.1.  The ball is a little faster in this\\nversion making play a little more realistic.  I know PONG 1.0 was\\njust posted yesterday, but I think this version is significantly\\nbetter, so here it is.\\n\\nUse keys 7 and 4 move left player and / and * move right player.\\n\\nEnjoy!!\\n\\n\"},{\"bin\":\"chip8-roms/games/Programmable Spacefighters [Jef Winsor].ch8\",\"txt\":\"14. VIP Programmable Spacefighters\\n\\nProgrammable Spacefighters is a combat game involving 2 to 8 spaceships competing\\nfor the domination of a contained field in space.  The field of play is a \\ntwo-dimensional representation of an oblong spheroid.\\n\\nThe movement and fire of each spacefighter is controlled by programming a series of\\ncommands into each fighter's instruction storage table.  Once all the spacefighters\\nare programmed, they carry out their commands by sequentially executing a single step\\nat a time.  The play of the game ins divided into rounds.  Each spacefighter may\\nexecute between 1 and 15 commands per round.\\n\\nThe fighters all have the same appearance and capabilities.  Players distinguish\\nbetween fighters by examining the defense strength and position of their fighters\\nat the begining of every round.\\n\\nEach fighter may face in any of 8 directions.  All firing and forward movement\\noccurs in the direction the fighter is currently facing.  As a spacefighter crosses\\noutside the two-dimensional field of play, it wraps around and re-enters on the\\nopposite side of the field.  Laser bursts terminate when they travel outside the\\nfield or hit a target.\\n\\nEach round consists of a selected number of steps.  Each step is executed in 2 parts.\\nDuring the first part, every spacefighter wishing to fire may execute a fire operation.\\nThe defense strength of any fighter which is hit by a laser burst is reduced by 1\\nand a small flash appears.\\n\\nAfter all fighters have had an opportunity to execute fire instructions, the movement\\npart of the step begins.  Any fighter which has had its defense strength reduced to 0\\nis destroyed and a longer flash appears.  The defense strength is changed to a special\\ncode so that the fighter will no longer be programmable or take part in the execution\\nphase.  The destroyed fighter will still be open to examination during the Defense/\\nPosition Check phase.  Fighers having a defense strength greater than 0 may execute\\na movement command if there is one.  Breaking each step into 2 such parts removes any\\nstrategic advantage to moving first.\\n\\nThe nature of the game, in that there are variable parameters and no fixed victory\\nconditions, allows the players a lot of freedom.  Two to eight players can command\\nsingle fighters.  Four or less players can each command multiple fighters.  Two\\nfleets could complete to destroy their opponents' flagship first.  Handicaps can\\nbe implemented through an imbalance of fighters in different fleets.  An odd number\\nof players can play in a free for all or team game.  In a non-combat approach, a full\\ncomplement of space fighters could be programmed to preform in kaleidoscope or other\\ntype formations.\\n\\n\\nHow to Play VIP Programmable Spacefighters\\n\\n1. Load the CHIP-8 interpreter at 0000-01FF and\\n   the game starting at 0200.\\n\\n2. Turn RUN switch on.\\n\\n3. Initalization of Game.\\n   Various parameters are entered at the start of the game to determine the number\\n   of spacefighters and other aspects of play.\\n\\n   S: Enter number of spacefighters.  1 to 8 spacefighters may be used.  The program\\n      will adjust invalid enteries to the nearest valid number.\\n\\n   D: Enter defense strength.  A spacefighter may be hit from 1 to F times by laser\\n      before being destroyed.\\n\\n   E: Enter number of command entries.  A spacefighter may be programmed with 1 to F\\n      commands during the programming phase of each round.\\n\\n   C: Enter clock duration/no clock.  A timer clock 1 to F phorseks in duration may\\n      be selected.  Each phorsek equals 4 seconds.  The clock is not enabled if a 0\\n      is entered.  The clock time is the time allowed for each fighter to be set up.\\n\\n   F: Enter fire power available.  A spacefighter may be allowed to fire 1 to F\\n      laser bursts per round.\\n\\n   A: Enter accumulation/no accumulation.  A spacefighter may be allowed to accumulate\\n      all unused laser bursts by entering 1 to F.  Accumulation is not allowed if a\\n      0 is entered.\\n\\n4. Presentation of Field and Spacefighters.\\n   The two-dimensional representation of the palying fields consists of 10 vertical\\n   by 15 horizontal positons indicated by grid markings around the perimeter.  The\\n   spacefighters will be in their initial positions.\\n\\n5. Defense/Position Check.\\n     Enter number of spacefighter to be examined.\\n     S: Current spacefighter being examined.\\n     D: Defense strength of current spacefighter.\\n     Enter 0 to end defense/position check phase.\\n\\n6. Program Spacefighters.\\n   Surviving spacefighters are programmed in ascending order.  Enter 0 to begin\\n   programming first spacefighter.  Defense strength and position are shown during\\n   programming.\\n     E: indicates number of enteries left after current command.\\n     C: indicates time remaining to program current fighter if clock was entered.\\n\\n    COMMAND   FUNCTION\\n      1        Rotate 45 ccw, Move fwd\\n      2        Move fwd\\n      3        Rotate 45 cw, Move fwd\\n      4        Rotate 45 ccw\\n      5        Fire\\n      6        Rotate 45 cw\\n      B        Erase all commands and reprogram current spacefighter\\n      E        End programming of current spacefighter\\n      7-A,C,D,F  Rest, No operation\\n      0        Rest, Begin programming next spacefighter\\n\\n   Enter 0 to begin programming each successive spacefighter.\\n\\n7. Execute Commands.\\n   Enter 0 after all spacefighters are programmed to start execution of commands.\\n\\n8. The recommended starting point when tryint the game out is with 1 or 2 spacefighters,\\n   any defense, F (15) entries per round, no clock, F (15) fire power and any accumulation\\n      S: 1 or 2\\n      D: 1\\n      E: F\\n      C: 0\\n      F: F\\n      A: 0\\n\\n   Use the above to try out the movement and fire execution of the fighters.  Try\\n   performing loops, figure 8's, tight turns, maximum fire coverage techniques, etc.\\n   Start out simple when first playing the game against an opponent.  \\n   Eight spacefighters can get very complicated.\\n\\n9. Changing different parameters creates very different effects on the play of the game.\\n   The main effect of a large number of fighters is a more complicated game.  A large\\n   number of enteries per round results in a more lively game involving farsighted\\n   planning.  Fewer enteries involves more thinking and reacting to immediate developments\\n   but is not without strategy when there are multiple fighters opposing each other.\\n   The clock provides pressure which can be greatly increased by the moves-to-time ratio.\\n   More fire power increases the importance of movement and positioning.  Accumulation\\n   of fire power can have long range effects if there is low fire power and a large\\n   number of moves per round.\\n\"},{\"bin\":\"chip8-roms/games/Puzzle.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Reversi [Philip Baltzer].ch8\",\"txt\":\"6. VIP REVERSI\\nReversi is a game over 100 years old, which has become popular recently under the\\nname Othello.  The game is played on a 8x8 square, using two kinds of markers.\\nIn VIP Reversi one player has the open markers and the other player the solid\\nmarkers.  The score for either player at any time is the total number of his markers\\non the square.\\n\\nHow to play VIP Reversi\\n\\n1. Load the CHIP-8 interpretor at 0000-01FF\\n   and the game starting at 0200.\\n\\n2. Turn RUN switch on.\\n\\n3. The 8x8 square will be formed and the starting marker configuration shown, having\\n   two of each kind of marker in the center four locations of the square.  The starting\\n   score for each player is shown as 02 above a line of his markers.\\n\\n4. Your VIP indicates the player's turn by blinking that player's score and also blinking\\n   a cursor dot in the 8x8 square.  A player moves the blinking cursor dot in the 8x8\\n   square by pressing the direction keys 1-4 and 6-9 as shown. (VIPG1-6.JPG)\\n\\n5. When the cursor-dot is properly located, the player presses key 5 to place his marker\\n   on the square.  You will find that your VIP will not allow you to make a non-valid\\n   play.  The only placements allowed are onces for which at least one of the other\\n   player's markers is surrounded between an existing marker of your own and your new\\n   marker being placed.  All these markers must be in consecutive positions on the\\n   square and can be in any horizontal, vertical or diagonal direction.  Once a new\\n   marker has been placed, your VIP will change all such surrounded markers of the\\n   other player to your kind and change the scores.\\n\\n6. Sometimes it may not be possible for a player to make a valid move.  If this happens\\n   he must forfeit his move by pressing the &quot;F&quot; key! The game ends when neither player\\n   can play or when the 8x8 square is completely filled with markers.  The goal is to\\n   end the game with the highest score.  Do not be discouraged if during the game you\\n   seem to be losing because this is a game with dramatic reversals!  Develop a winning\\n   strategem and become a champion!!\\n\"},{\"bin\":\"chip8-roms/games/Rocket Launch [Jonas Lindstedt].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Rocket Launcher.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Rocket [Joseph Weisbecker, 1978].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Rush Hour [Hap, 2006] (alt).ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Rush Hour [Hap, 2006].ch8\",\"txt\":\"Rush Hour (v1.1) for CHIP-8 by hap 08-02-08, http://hap.samor.nl/\\nOriginally released on 17-12-06. Version 1.1 improves a few things.\\nBased on a boardgame by Nobuyuki Yoshigahara &quot;Nob&quot; and ThinkFun,\\nhttp://www.thinkfun.com/\\n\\nThis game contains 170 puzzles. Most were taken from the original cardsets,\\nsome were made by me, and some were generated with Michel's PyTraffic,\\nhttp://alpha.uhasselt.be/Research/Algebra/Members/pytraffic . Refer to\\nthe source code for detailed information on this.\\n\\nHOW TO PLAY\\n===========\\n\\nThe goal of the game is to slide the arrow block(s) out of the 6*6 grid.\\nCompleting 10 boards will be awarded with the inclusion of the next boardset(s)\\nas seen from the connections on the boardset select screen, a password will be\\ngiven so you don't have to complete the game in a single session.\\n\\n HEX key   PC key*   Use\\n---------------------------\\n 5         W         up\\n 8         S         down\\n 7         A         left\\n 9         D         right\\n A         Z         ok/hold to slide\\n 1         1         option(in-game)/back\\n\\n* = for interpreters that have the 4*4 keypad at 1234/QWER/ASDF/ZXCV.\\n\"},{\"bin\":\"chip8-roms/games/Russian Roulette [Carmelo Cortez, 1978].ch8\",\"txt\":\"Russian Roulette , by: Carmelo Cortez\\n\\nThis game is called Russian RouLette. Press any key to Spin and pull the Trigger.  \\nA &quot;Click&quot; or &quot;Bang&quot; will show, get ten &quot;clicks&quot; in a row and you win.\"},{\"bin\":\"chip8-roms/games/Sequence Shoot [Joyce Weisbecker].ch8\",\"txt\":\"12. VIP Sequence Shoot\\n\\nYou score points by having the sharp-shooter hit the targets in the proper sequence.\\n\\nHow to Play VIP Sequence Shoot\\n\\n1. Load the CHIP-8 interpreter at 0000-01FF and\\n   the game starting at 0200.\\n\\n2. Turn RUN switch on.\\n\\n3. Pressing the Key C causes the little man to shoot the top target, Key D shoots the\\n   one below it, Key E the next lower and Key F the bottom target.\\n\\n4. One of the four targets flashes and the computer waits for you to shoot it.  When\\n   you press teh correct key, you get one point.  Then two flash, on after the other.\\n   Shoot the one that flashed first, then shoot the other.  This gives you two more\\n   points.  Three targets (when hit in the same order as they flashed) add three\\n   points to your score.\\n\\n5. Each time you shoot such a series of targets in proper sequence, your score\\n   increases by the number of targets you hit.  An the next series you see is longer\\n   by one target.  The maximum length of sequence is 22 targets, that is a score of 254.\\n\\n6. Improper sequencing of shots in any series ends the game.\"},{\"bin\":\"chip8-roms/games/Shooting Stars [Philip Baltzer, 1978].ch8\",\"txt\":\"Shooting Stars, by: Philip Baltzer\\n\\n\"},{\"bin\":\"chip8-roms/games/Slide [Joyce Weisbecker].ch8\",\"txt\":\"5. VIP SLIDE\\n\\nSlide is a two-person game.  Each player tries to slide a &quot;puck&quot; over the high-scoring\\n&quot;spots&quot; without hitting the back wall.\\n\\nHow To Play VIP Slide\\n\\n1. Load the CHIP-8 interpretor at 0000-01FF\\n   and the game starting at 0200.\\n\\n2. Turn RUN switch on.\\n\\n3. The puck moves up and down randomly.  Press &quot;0&quot; key to stop the puck.  The puck\\n   will move towards the spots after you release the key.  The longer you hold the\\n   key down, the further the puck travels (maximum time approximately 2.5 seconds).\\n\\n4. You get 2 points for hitting the first spot, 4 points for either of the next two\\n   spots and 8 points for either of the last two.  The highest score possible is 216\\n   (two spots can be hit on one slide).\\n\\n5. If you hit the back wall, though, you get zero points for that slide, even though\\n   you've hit a spot.\\n\\n6. Each player gets 3 pucks per turn and 6 turns in a game.\\n\"},{\"bin\":\"chip8-roms/games/Soccer.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Space Flight.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Space Intercept [Joseph Weisbecker, 1978].ch8\",\"txt\":\"Space Intercept, by Joseph Weisbecker\\n\\nAt startup, Press 1 to select the large UFO whichh counts 5 points when hit or 2 to select the small UFO which counts 15 points when hit.\\nLaunch your rocket by pressing key 4,5 or 6. You get 15 rockets as shown in the lower right corner of the screen. Your score is shown in the lower left corner of the screen.\\n\"},{\"bin\":\"chip8-roms/games/Space Invaders [David Winter] (alt).ch8\",\"txt\":\"Space Invaders, by: David Winter\\n\\nThe well known game. Destroy the invaders with your ship. Shoot\\nwith 5, move with 4 and 6. Press 5 to begin a game.\\n\\n\"},{\"bin\":\"chip8-roms/games/Space Invaders [David Winter].ch8\",\"txt\":\"Space Invaders, by: David Winter\\n\\nThe well known game. Destroy the invaders with your ship. Shoot\\nwith 5, move with 4 and 6. Press 5 to begin a game.\\n\\n\"},{\"bin\":\"chip8-roms/games/Spooky Spot [Joseph Weisbecker, 1978].ch8\",\"txt\":\"Spooky Spot, by: Joseph Weisbecker\\n\\nNow you can let the computer make your big decisions or predict the future just like governmentt or industry leaders do. \\nYou will see the words YES and NO at the right of the screen. Ask the computer any question that can be answered with YES or NO. Press KEY 0 and the spooky spot will show you the computer's answer. This program replaces your old fashioned mechanical OUIJA board.\\n\"},{\"bin\":\"chip8-roms/games/Squash [David Winter].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Submarine [Carmelo Cortez, 1978].ch8\",\"txt\":\"Submarine, by: Carmelo Cortez\\n\\nThe Sub Game is my favorlte. Press &quot;5&quot; key to fire depth charges at the subs below. \\nYou score 15 points for a small sub and 5 points for the larger. You get 25 depth charges to start.\"},{\"bin\":\"chip8-roms/games/Sum Fun [Joyce Weisbecker].ch8\",\"txt\":\"11. VIP Sum Fun\\n\\nThe object of this game is to add up the three digits\\nwhich appear in the middle of the screen and then hit\\nthe key representing the total as fast as you can.\\n\\nHow to Play VIP Sum FUn\\n\\n1. Load the CHIP-8 interpreter at 0000-01FF and\\n   the game starting at 0200.\\n\\n2. Turn RUN switch on.\\n\\n3. You get twenty sets of three digits per game and\\n   between zero and ten points per set.  The faster you\\n   enter the correct total, the more points you win.\\n\\n4. If you wait more that 3 seconds, you get zero points.\\n   The correct sum is shown above the three digits after\\n   you enter it,  and there is a pause before the next\\n   set appears.\\n\\n5. The score is shown in the upper right-hand corner of\\n   the screen.  The maximum number of points you can score\\n   is 200.  Between 120 and 159 points is above average.\\n   A score of 160 or higher is outstanding.\\n\\n\"},{\"bin\":\"chip8-roms/games/Syzygy [Roy Trevino, 1990].ch8\",\"txt\":\"F = Start the game with borders.\\nE = Start a borderless game.\\n\\n7 = Left, 8 = Go right. 3 = Up, 6 = Down. SYZYGY v0.1\\n\\nOne of the first games I remember playing on a computer was \\ncalled &quot;syzygy&quot; on a now ancient TRS-80 Model 1.  It has since\\nappeared on other computers under various names.  Why it was\\ncalled syzygy, I have no idea (consult Websters).  However, since\\nthe HP48SX has approximately the same memory, graphics and cpu\\npower as my TRS-80 did (something like 16kB, 128x64, and a 1.2Mhz Z80),\\nI thought it would be amusing to play it again.  Now, approximately\\nto my recollection, and with many apologies to the original author,\\nhere is a CHIP48 version of SYZYGY.  Enough drivel.\\n\\nThe object of the game is to seek out &quot;targets&quot;.  You do this with\\nyour syzygy.  Initially small, the syzygy will grow by some amount\\neach time a target is hit.  Eventually, your syzygy will\\nbe so long as to make tougher and tougher to get any points (and easier\\nand easier to get killed).  Confused?  Just try it.\\n\\nAnyways, the syzygy is not allowed to run into anything except targets.\\nIt cannot run into the screen border (if present), or itself (this \\nincludes backing into itself).  Fast and immediate death will result.\\nDon't worry if you die quickly a few times.  The keys take a few \\nminutes to get used to.\\n\\nTo start:     +      start/restart game with border\\n              -      start/restart borderless game\\n       \\nTo play:      9      up\\n              6      down\\n              1      left\\n              2      right\\n\\n[Hint for frustrated beginners: hold left hand on 1 &amp; 2, and right hand on\\n 6 &amp; 9 keys.  Alternate between left hand, right hand, left hand...  -jkh-]\\n\\n\\nFine print (borrowed from Andreas Gustafsson, author of CHIP-48):\\n\\n  SYZYGY is (c) copyright 1990 by Roy Trevino (RTT)\\n\\n  Noncommercial distribution allowed, provided that this\\n  copyright message is preserved, and any modified versions\\n  are clearly marked as such.\\n\\n  SYZYGY, via CHIP-48, makes use of undocumented low-level features\\n  of the HP48SX calculator, and may or may not cause loss of data,\\n  excessive battery drainage, and/or damage to the calcultor\\n  hardware.  The Author takes no responsibility whatsoever for\\n  any damage caused by the use of this program.\\n  \\n  THIS SOFTWARE IS PROVIDED &quot;AS IS&quot; AND WITHOUT ANY EXPRESS OR\\n  IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED\\n  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR\\n  PURPOSE.\\n\\nRoy\\n\\n  --------------------------------------------------------------\\n  Roy Trevino                                        Intel Corp.\\n  E-mail: rtrevino@sedona.intel.com          Tel: (602) 554 2816\\n  UUCP:  decwrl!apple!oliveb!orc!inews!rtrevino@sedona.intel.com\\n\\u001a\"},{\"bin\":\"chip8-roms/games/Tank.ch8\",\"txt\":\"You are in a tank which has 25 bombs. Your goal is to hit 25 times a mobile target. The game ends when all your bombs are shot. If your tank hits the target, you lose 5 bombs. Use 2 4 6 and 8 to move. This game uses the original CHIP8 keyboard, so directions 2 and 8 are swapped.\\n\"},{\"bin\":\"chip8-roms/games/Tapeworm [JDR, 1999].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Tetris [Fran Dachille, 1991].ch8\",\"txt\":\"                               TETRIS\\n                          by Fran Dachille\\n\\nThis is my first release of the famous Tetris game on the HP48S. I was\\ninspired by the lack enjoyable games for our favorite handheld.  [Not since the\\nGoodies Disks have been available!  -jkh-]  This game, though it lacks some of\\nthe whistles and bangs of fancy versions, performs on par with quality arcade\\nversions (nota bene -&gt; SPEED).  At my college, every person who picks up my\\ncalculator is immediately hooked for hours.\\n\\nThis version is written for the CHIP48 game interpreter (c)\\ncopyright 1990 Andreas Gustafsson.\\n\\nThe 4 key is left rotate, 5 - left move, 6 - right move, 7\\n- drop, ENTER - restart, DROP - end.  After every 5 lines, the speed\\nincreases slightly and peaks at 45 lines.\\n\\nThere is room for improvement in this version.  Notably, background\\npictures, a pause key (for now, hold ON), two rotate keys, various\\nstarting skill levels, a B version which starts with randomn blocks,\\nfinishing graphics, and high scores, just to name a few.\\n\\nIn order for improvements, I need to know if there is reasonable\\ndemand.  If this game is worth playing for hours upon hours, please let\\nme know.  If you wish to support the improvements, want future versions,\\nand want to see other games ported to the HP48S, send $5.00 to:\\n\\n          FRAN DACHILLE\\n          WEBB INSTITUTE\\n          GLEN COVE, NY 11542\\n\\n\"},{\"bin\":\"chip8-roms/games/Tic-Tac-Toe [David Winter].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Timebomb.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Tron.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/UFO [Lutz V, 1992].ch8\",\"txt\":\"Here's how to play UFO:\\n\\nYou have a stationary missle launcher at the bottom of the screen. You\\ncan shoot in three directions; left diagonal, straight up, and right\\ndiagonal.. using the keys 4, 5, and 6 respectively.. You try to hit\\none of two objects flying by.. at apparently varying speeds..  Your\\nscore is displayed on your left, the number of missles you have left\\nis displayed on your right. (You get 15)..\\n\\nThis game (&quot;UFO&quot;) is not new.  I have a copy of it from 1977 (!).  It\\nwas one of the original CHIP-8 games on the audio cassette that was\\nincluded when I bought my first computer, the Finnish-made Telmac\\n1800.\\n\\nIt was also the first real program to run under CHIP-48 (it was used\\nas a test case during the development of the CHIP-48 interpreter). The\\nreason I have not posted it to the net myself is that I have no idea\\nabout its copyright status.  I don't even know where it originated\\n(RCA, perhaps?).\\n\\nThe cassette that was bundled with the Telmac 1800 contains more than\\na dozen CHIP-8 programs.  If someone could convince me that these\\nprograms are indeed freely redistributable, the other programs could\\nalso be posted.  Otherwise, perhaps this one shouldn't have been.\\n\"},{\"bin\":\"chip8-roms/games/Vers [JMN, 1991].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Vertical Brix [Paul Robson, 1996].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Wall [David Winter].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Wipe Off [Joseph Weisbecker].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/Worm V4 [RB-Revival Studios, 2007].ch8\",\"txt\":\"-----------------------------------------------------------------------------\\n\\t\\t\\t      /////////////////\\n\\t                      //////////////////\\n        \\t              ////          ////\\n\\t               \\t      ////   ///////////\\n\\t                      ////  ///////////\\n                              ////  ////\\n                              ////  ///////////\\n                              ////   //////////\\n  \\t     \\t   \\t\\n  \\t\\t\\t   www.revival-studios.com\\n-----------------------------------------------------------------------------\\nTitle\\t\\t:\\tSuperWorm V4\\nAuthor\\t\\t:\\tRB (Original game)\\n\\t\\t \\tUpdates and fixes by: Martijn Wenting / Revival Studios\\nGenre\\t\\t:\\tGame\\nSystem\\t\\t:\\tChip-8 / SuperChip8\\nDate\\t\\t:\\t10/08/2007 \\nProduct ID\\t:\\tRS-C8001\\n-----------------------------------------------------------------------------\\n\\nAll the contents of this package are (c)Copyright 2007 Revival Studios.\\nOriginal game: SuperWorm is (c)Copyright 1992 RB\\n\\nThe contents of the package may only be spread in its original form, and may not be\\npublished or distributed otherwise without the written permission of the authors.\\n\\nDescription:\\n------------\\nSuperWorm V4 is an update of the SuperChip8 game: Worm3 by RB.\\nThe original game was only for SuperChip, so i've created a Chip-8 port.\\nIt also includes several speed fixes and a new control system.\\n\\nRunning the game:\\n-----------------\\nUse the Megachip emulator or any other Chip-8/SuperChip compatible emulator to run the game.\\n\\nCredits:\\n--------\\nChip-8 version, Updates and fixes by: Martijn Wenting\\nOriginal game by: RB\\n\\nDistribution:\\n-------------\\nThis package can be freely distributed in its original form.\\nIf you would like to include this game in your rom package, please let me know.\\n\\nWatch out for more releases soon!\\n\\n\\n\\tMartijn Wenting / Revival Studios\\n\\n\"},{\"bin\":\"chip8-roms/games/X-Mirror.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/games/ZeroPong [zeroZshadow, 2007].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/hires/Astro Dodge Hires [Revival Studios, 2008].ch8\",\"txt\":\"-----------------------------------------------------------------------------\\n\\t\\t\\t      /////////////////\\n\\t                      //////////////////\\n        \\t              ////          ////\\n\\t               \\t      ////   ///////////\\n\\t                      ////  ///////////\\n                              ////  ////\\n                              ////  ///////////\\n                              ////   //////////\\n  \\t     \\t   \\t\\n  \\t\\t\\t   www.revival-studios.com\\n-----------------------------------------------------------------------------\\nTitle\\t\\t:\\tAstro Dodge\\nAuthor\\t\\t:\\tMartijn Wenting / Revival Studios\\nGenre\\t\\t:\\tGame\\nSystem\\t\\t:\\tChip8 / SuperChip8\\nDate\\t\\t:\\t18/12/2008\\nProduct ID\\t:\\tRS-C8003\\n-----------------------------------------------------------------------------\\n\\nAll the contents of this package are (c)Copyright 2008 Revival Studios.\\n\\nThe contents of the package may only be spread in its original form, and may not be\\npublished or distributed otherwise without the written permission of the authors.\\n\\nDescription:\\n------------\\nAstro Dodge is an arcade game for the Chip8 and SuperChip8 systems.\\nBoth versions of the game are included in this package.\\n \\nYour goal is to make your way through the asteroids field and dodge the asteroids, scoring points for each asteroid you are able to dodge.\\nButton 2,4,6,8 will move your ship, button 5 will start the game.\\n\\nRunning the game(s):\\n--------------------\\nThe CHIP8 version of the game has been programmed to be compatible with original hardware like the Cosmac VIP and Telmac 1800.\\nUse the Megachip emulator or any other Chip8/SuperChip compatible emulator to run the game(s).\\n\\nCredits:\\n--------\\nProgramming and Graphics by: Martijn Wenting\\n\\nDistribution:\\n-------------\\nThis package can be freely distributed in its original form.\\nIf you would like to include this game in your rom package, please let me know.\\n\\nWatch out for more releases soon!\\n\\n\\n\\tMartijn Wenting / Revival Studios\\n\\n\"},{\"bin\":\"chip8-roms/hires/Hires Maze [David Winter, 199x].ch8\",\"txt\":\"Maze, by David Winter\\n\\nDrawing a random maze like this one consists in drawing random diagonal\\nlines. There are two possibilities: right-to-left line, and left-to-right\\nline. Each line is composed of a 4*4 bitmap. As the lines must form non-\\ncircular angles, the two bitmaps won't be '/' and '\\\\'. The first one\\n(right line) will be a little bit modified. See at the end of this source.\\n\\nThe maze is composed of 16 lines (as the bitmaps are 4 pixels high), each\\nline consists of 32 bitmaps.\\nBitmaps are drawn in random mode. We choose a random value (0 or 1).\\nIf it is 1, we draw a left line bitmap. If it is 0, we draw a right one.\\n\"},{\"bin\":\"chip8-roms/hires/Hires Particle Demo [zeroZshadow, 2008].ch8\",\"txt\":\"This is my particledemo for the Chip-8, Hires Chip-8 (64x64), SuperChip and MegaChip8.\\nWorks on real hardware as well as emulators\\n\\nEnjoy!\\n\\n  zeroZshadow\"},{\"bin\":\"chip8-roms/hires/Hires Sierpinski [Sergey Naydenov, 2010].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/hires/Hires Stars [Sergey Naydenov, 2010].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/hires/Hires Test [Tom Swan, 1979].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/hires/Hires Worm V4 [RB-Revival Studios, 2007].ch8\",\"txt\":\"-----------------------------------------------------------------------------\\n\\t\\t\\t      /////////////////\\n\\t                      //////////////////\\n        \\t              ////          ////\\n\\t               \\t      ////   ///////////\\n\\t                      ////  ///////////\\n                              ////  ////\\n                              ////  ///////////\\n                              ////   //////////\\n  \\t     \\t   \\t\\n  \\t\\t\\t   www.revival-studios.com\\n-----------------------------------------------------------------------------\\nTitle\\t\\t:\\tSuperWorm V4\\nAuthor\\t\\t:\\tRB (Original game)\\n\\t\\t \\tUpdates and fixes by: Martijn Wenting / Revival Studios\\nGenre\\t\\t:\\tGame\\nSystem\\t\\t:\\tChip-8 / Chip-8 Hires / SuperChip8\\nDate\\t\\t:\\t10/08/2007 \\nProduct ID\\t:\\tRS-C8001\\n-----------------------------------------------------------------------------\\n\\nAll the contents of this package are (c)Copyright 2007 Revival Studios.\\nOriginal game: SuperWorm is (c)Copyright 1992 RB\\n\\nThe contents of the package may only be spread in its original form, and may not be\\npublished or distributed otherwise without the written permission of the authors.\\n\\nDescription:\\n------------\\nSuperWorm V4 is an update of the SuperChip8 game: Worm3 by RB.\\nThe original game was only for SuperChip, so i've created a Chip-8 and Hires Chip-8 port.\\nIt also includes several speed fixes and a new control system.\\n\\nRunning the game:\\n-----------------\\nUse the Megachip emulator or any other Chip-8/SuperChip compatible emulator to run the game.\\n\\nCredits:\\n--------\\nChip-8 version, Hires Chip-8 version, Updates and fixes by: Martijn Wenting\\nOriginal game by: RB\\n\\nDistribution:\\n-------------\\nThis package can be freely distributed in its original form.\\nIf you would like to include this game in your rom package, please let me know.\\n\\nWatch out for more releases soon!\\n\\n\\n\\tMartijn Wenting / Revival Studios\\n\\n\"},{\"bin\":\"chip8-roms/hires/Trip8 Hires Demo (2008) [Revival Studios].ch8\",\"txt\":\"-----------------------------------------------------------------------------\\n\\t\\t\\t      /////////////////\\n\\t                      //////////////////\\n        \\t              ////          ////\\n\\t               \\t      ////   ///////////\\n\\t                      ////  ///////////\\n                              ////  ////\\n                              ////  ///////////\\n                              ////   //////////\\n  \\t     \\t   \\t\\n  \\t\\t\\t   www.revival-studios.com\\n-----------------------------------------------------------------------------\\nTitle\\t\\t:\\tTrip8 / SuperTrip8 demo\\nAuthor\\t\\t:\\tMartijn Wenting / Revival Studios\\nGenre\\t\\t:\\tDemo\\nSystem\\t\\t:\\tChip-8 / Chip-8 Hires / SuperChip8\\nDate\\t\\t:\\t14/10/2008\\nProduct ID\\t:\\tRS-C8004\\n-----------------------------------------------------------------------------\\n\\nAll the contents of this package are (c)Copyright 2008 Revival Studios.\\n\\nThe contents of the package may only be spread in its original form, and may not be\\npublished or distributed otherwise without the written permission of the authors.\\n\\nDescription:\\n------------\\nThe Trip8/SuperTrip8 demo are demo's for the Chip-8, Chip-8 Hires and SuperChip8 systems. The demo consists of an intro, 3D vectorballs, and 4 randomized dot-effects.  \\n\\nWriting a demo for the original Chip-8 interpreter was a real pain, since your framerate basically drops in half for every sprite you need to draw. So even clearing and redrawing a few dots will cause the framerate to drop to near zero :) Originally the demo was going to be bigger and there were much more graphical effects programmed/prototyped, but a lot of these effects turned out to be too much for the original unoptimized Chip-8 interpreters to handle. \\nThe 64x64 Hires version of the demo will also work on the original hardware without modification.\\n\\nRunning the Demo:\\n-----------------\\nUse the Megachip emulator or any other Chip-8/SuperChip compatible emulator to run the demo.\\n\\nCredits:\\n--------\\nProgramming/Graphics/Design by: Martijn Wenting\\n\\nDistribution:\\n-------------\\nThis package can be freely distributed in its original form.\\nIf you would like to include this slideshow in your rom package, please let me know.\\n\\nWatch out for more releases soon!\\n\\n\\n\\tMartijn Wenting / Revival Studios\\n\\n\"},{\"bin\":\"chip8-roms/programs/BMP Viewer - Hello (C8 example) [Hap, 2005].ch8\",\"txt\":\"BMP Viewer, 02-06-05, by hap\\nworks with monochrome BMPs only, of course. put the BMP data (headerless) at\\noffset $30. change offset $0 (200) $00ff to $1202 for Chip-8.\"},{\"bin\":\"chip8-roms/programs/Chip8 Picture.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/programs/Chip8 emulator Logo [Garstyciuks].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/programs/Clock Program [Bill Fisher, 1981].ch8\",\"txt\":\"This neat little clock program is the perfect program to run when someone asks: \\n&quot;That's nice, but what can your computer DO?&quot;\\nThe program features &quot;reverse&quot; video numerals on the screen, which is a nice change from the\\nusual white numbers on a black background.\\n\\nInstructions:\\n- Type six digits on the hex keypad for the desired clock starting time, using 23 hour format (ex.173055)\\n- Hit any hex key to start clock running at the above time setting.\\n\"},{\"bin\":\"chip8-roms/programs/Delay Timer Test [Matthew Mikolay, 2010].ch8\",\"txt\":\"Hey guys!\\n\\nHere's another little program I wrote to test out a feature in my game. This\\nprogram allows the user to change the value of the V3 register using the 2 and 8\\nkeys. When the 5 key is pressed, the delay timer starts counting down from the\\nvalue the user placed into the V3 register, and the screen is updated as the\\nvalue changes.\\n\\n-Matt\"},{\"bin\":\"chip8-roms/programs/Division Test [Sergey Naydenov, 2010].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/programs/Fishie [Hap, 2005].ch8\",\"txt\":\"Fishie, used as internal rom for fish n chips\\nby hap, 10-07-05\\n\"},{\"bin\":\"chip8-roms/programs/Framed MK1 [GV Samways, 1980].ch8\",\"txt\":\"Framed MK1, By: G.V. Samways, 1980\\n\\nThis program displays a random movement of dots. You will notice a repetition in the pattern\\nafter a time.\\n\"},{\"bin\":\"chip8-roms/programs/Framed MK2 [GV Samways, 1980].ch8\",\"txt\":\"Framed MK2, By: G.V. Samways, 1980\\n\\nThis program displays a random movement of lines. You will notice a repetition in the pattern\\nafter a time.\\n\"},{\"bin\":\"chip8-roms/programs/IBM Logo.ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/programs/Jumping X and O [Harry Kleinberg, 1977].ch8\",\"txt\":\"\"},{\"bin\":\"chip8-roms/programs/Keypad Test [Hap, 2006].ch8\",\"txt\":\"Keypad Test, by hap, 15-02-06\\n\\npress a chip8 key and the pressed char will light up\\nif you want to do something funny, soft-reset the chip8/emulator over and over,\\nand the sprite layout will become messed up ;p\\n\\nchip8 keypad:\\n1 2 3 c\\n4 5 6 d\\n7 8 9 e\\na 0 b f\\n\\n\"},{\"bin\":\"chip8-roms/programs/Life [GV Samways, 1980].ch8\",\"txt\":\"Life, by: G.V. Samways\\n\\nThis is a display of cell growth, in accordance with the following rules:\\n 1. A cell is born if 3 cells are adjecent to an empty space.\\n 2. A cell lives if 2 or 3 cells are adjacent, and dies otherwise.\\n 3. All events take place simultaneously.\\n \\nTo start the game, you make a pattern by entering the cell coordinates, first\\nthe &quot;Y&quot;from 0-7 downwards, then the &quot;X&quot; from 0-F across. \\nF initialises the program, and the number of scans is entered plus one, so that 1 gives 0 scans\\nto F giving 14, and 0 giving 255. The sit back and watch the colony live, or die.\\n\"},{\"bin\":\"chip8-roms/programs/Minimal game [Revival Studios, 2007].ch8\",\"txt\":\"No instructions\"},{\"bin\":\"chip8-roms/programs/Random Number Test [Matthew Mikolay, 2010].ch8\",\"txt\":\"Hey guys!\\n\\nI don't know if any of you will be interested in this, but I wrote this small\\nprogram while coding my game to test out the random number generator. I wanted\\nto see if there is a chance that zero will show up as the random number, and it\\nturns out it can.\\n\\nAnyway, when you run the program, it brings a random number up on the screen.\\nWhen you press any of the keys, it brings another random number up on the\\nscreen. This goes on until you quit the program.\\n\\nAddress 0x202 holds the C0FF instruction, which commands the CHIP-8 interpreter\\nto set V0 to a random number with the mask 0xFF. This yields 256 different\\npossible numbers (0-255). If C0FF is changed to something like C00A, then the\\nmask will change. This would yield 11 different possible numbers (0-10).\\n\\n-Matt\"},{\"bin\":\"chip8-roms/programs/SQRT Test [Sergey Naydenov, 2010].ch8\",\"txt\":\"No instructions\"}]");

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
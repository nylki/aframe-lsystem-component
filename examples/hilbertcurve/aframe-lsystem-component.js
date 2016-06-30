/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	if (typeof AFRAME === 'undefined') {
	  throw new Error('Component attempted to register before AFRAME was available.');
	}


	// Get the component absolute location to properly
	// init a web worker from there.
	var currentScriptLocation = document.currentScript.src;
	workerScriptLocation = currentScriptLocation.substr(0, currentScriptLocation.lastIndexOf('/') + 1) + 'worker.js';
	// console.log(workerScriptLocation);
	var LSystem = __webpack_require__(1);
	var LSystemStringified = LSystem.toString();
	// console.log(LSystemStringified);

	function workerFunction() {
	  console.log('hello there!');
	  var lsys = new LSystem({});
		var timeout = {};

		onmessage = function(e) {
		  
		  // wait a few ms to start thread, to be able to cancel old tasks
		  clearTimeout(timeout);
		  timeout = setTimeout(function() {
		      lsys.clearProductions();
		      lsys.setAxiom(e.data.axiom);
		      for (let p of e.data.productions) {
		        if(p.parsejs) {
		          lsys.setProduction(p.from, eval(p.to));
		        } else {
		          lsys.setProduction(p.from, p.to);
		        }
		      }
		      console.log(e.data);
		      lsys.iterate(parseInt(e.data.iterations));
		      console.log('iterated!');
		      postMessage({
		        result: lsys.getString(),
		        initial: e.data
		      });
		      
		  }, 20);

		};

		console.log('worker initialized');

	}




	// Build a worker from an anonymous function body
	var blobURL = URL.createObjectURL( new Blob([ '(',
	'var LSystem = ',
	LSystemStringified,

	workerFunction.toString(),

	')()' ], { type: 'application/javascript' } ) );






	/**
	 * Example component for A-Frame.
	 */
	AFRAME.registerComponent('lsystem', {
	  schema: {
	    
	    axiom: {
	      type: 'string',
	      default: 'F'
	    },
	    
	    productions: {
	      default: 'F:FF',
	      // return an array of production tuples ([[from, to], ['F', 'F+F']])
	      parse: function (value) {
	        return value.split(' ').map(function (splitValue) {
	          return splitValue.split('->');
	        })
	      }
	    },
	    
	    baseObjects: {
	      type: 'string',
	      parse: function (value) {
	        return value.split(' ').map(function (splitValue) {
	          return splitValue.split('->');
	        })
	      }
	    },
	    
	    iterations: {
	      type: 'int',
	      default: 2
	    },
	    
	    angle: {
	      type: 'number',
	      default: 45
	    },
	    
	    mergeGeometries: {
	      type: 'boolean',
	      default: true
	    },
	    
	    functionsInProductions: {
	      type: 'boolean',
	      default: true
	    }
	  },

	  /**
	   * Called once when component is attached. Generally for initial setup.
	   */
	  init: function () {
	    if(LSystem === undefined) {
	      LSystem = __webpack_require__(1);
	    }
	    
	    this.X = new THREE.Vector3(1, 0, 0);
	    this.Y = new THREE.Vector3(0, 1, 0);
	    this.Z = new THREE.Vector3(0, 0, 1);
	    this.xPosRotation = new THREE.Quaternion();
	    this.xNegRotation = new THREE.Quaternion();
	    this.yPosRotation = new THREE.Quaternion();
	    this.yNegRotation = new THREE.Quaternion();
	    this.zPosRotation = new THREE.Quaternion();
	    this.zNegRotation = new THREE.Quaternion();
	    this.yReverseRotation = new THREE.Quaternion();
	    this.colors = [0x8c651b, 0x7d9322, 0x3d9322];
	    this.colorIndex = 0;
	    
	    var self = this;
	    
	    this.LSystem = new LSystem({
	      axiom: 'FF+F',
	      productions: {'F': 'FF'},
	      finals: {
					'F': self.pushSegment,
					'+': () => { self.currentSegment.quaternion.multiply(yPosRotation)},
					'-': () => { self.currentSegment.quaternion.multiply(yNegRotation)},
					'&': () => { self.currentSegment.quaternion.multiply(zNegRotation)},
					'^': () => { self.currentSegment.quaternion.multiply(zPosRotation)},
					'\\': () =>{ self.currentSegment.quaternion.multiply(xNegRotation)},
					'<': () => { self.currentSegment.quaternion.multiply(xNegRotation)},
					'/': () => { self.currentSegment.quaternion.multiply(xPosRotation)},
					'>': () => { self.currentSegment.quaternion.multiply(xPosRotation)},
					'|': () => { self.currentSegment.quaternion.multiply(yReverseRotation)},
					'!': () => {
						self.currentSegment.scale.set(self.currentSegment.scale.x, self.currentSegment.scale.y + 0.2, self.currentSegment.scale.z + 0.2);
						colorIndex = Math.min(colors.length - 1, colorIndex + 1);
						for (let face of self.currentSegment.geometry.faces) {
							face.color.setHex(colors[colorIndex]);
						}
						self.currentSegment.geometry.colorsNeedUpdate = true;
					},
					'\'': () => {
						self.currentSegment.scale.set(self.currentSegment.scale.x, self.currentSegment.scale.y - 0.2, self.currentSegment.scale.z - 0.2);
						colorIndex = Math.max(0, colorIndex - 1);
						for (let face of self.currentSegment.geometry.faces) {
							face.color.setHex(colors[colorIndex]);
						}
						self.currentSegment.geometry.colorsNeedUpdate = true;
					},
					'[': () => { self.stack.push(self.currentSegment.clone()) },
					']': () => { self.currentSegment = self.stack.pop() }
				}
	    });
	    
	    this.worker = new Worker(blobURL);
	    this.worker.onmessage = this.onWorkerUpdate;
	    
	  },

	  /**
	   * Called when component is attached and when component data changes.
	   * Generally modifies the entity based on the data.
	   */
	  update: function (oldData) {
	    
	    // var diffData = diff(data, oldData || {});
	    // console.log(diffData);
	    
	    // TODO: Check if only angle changed or axiom or productions
	    //
	    this.LSystem.setAxiom(this.data.axiom);
	    // this.LSystem.clearProductions();
	    for (p of this.data.productions) {
	      this.LSystem.setProduction(p[0], p[1]);
	    }
	    this.LSystem.iterate(this.data.iterations);
	    console.log(this.LSystem.getString());
	    console.log(this.el.object3D);
	    // this.LSystem.final();
	  },
	  
	  pushSegment: function() {
	    let newSegment = this.currentSegment.clone();
	    newSegment.matrixAutoUpdate = false;
	    newSegment.updateMatrix();
	    this.fullModel.geometry.merge(newSegment.geometry, newSegment.matrix);
	    this.currentSegment.translateX(-(lineLength));
	  },
	  
	  updateTurtleGraphics: function() {
			
			colorIndex = 0; // Reset color index
			angle = angleInput.value;
			// Set quaternions based on angle slider
			xPosRotation.setFromAxisAngle( X, (Math.PI / 180) * angle );
			xNegRotation.setFromAxisAngle( X, (Math.PI / 180) * -angle );
			
			yPosRotation.setFromAxisAngle( Y, (Math.PI / 180) * angle );
			yNegRotation.setFromAxisAngle( Y, (Math.PI / 180) * -angle );
			yReverseRotation.setFromAxisAngle( Y, (Math.PI / 180) * 180 );
			
			zPosRotation.setFromAxisAngle( Z, (Math.PI / 180) * angle );
			zNegRotation.setFromAxisAngle( Z, (Math.PI / 180) * -angle );
			
			let geometry = new THREE.CylinderGeometry(lineWidth, lineWidth, lineLength, 3);
			geometry.rotateZ((Math.PI / 180) * 90);
			geometry.translate( -(lineLength/2), 0, 0 );
			for (let face of geometry.faces) {
				face.color.setHex(colors[colorIndex]);
			}
			geometry.colorsNeedUpdate = true;

			this.currentSegment = new THREE.Mesh( geometry );
			this.currentSegment.matrixAutoUpdate = false;
			this.fullModel = new THREE.Mesh(new THREE.Geometry(), material);
	    this.el.setObject3D('mesh', this.fullModel);
			
			lsystem.final();
			requestAnimationFrame(render);
		},
	  
	  updateLSystem: function() {

			// gather info from text fields
			var params = {
				axiom: 		axiomInput.value,
				angle: angleInput.value,
				productions: [],
				iterations: iterationInput.value
			}
			
			for (var i = 0; i < productionList.childNodes.length; i++) {
				let prod = productionList.childNodes[i];
					params.productions.push({
						parsejs: prod.childNodes[2].checked,
						from: prod.childNodes[0].value,
						to: prod.childNodes[1].value,
					})
			}
			
			
			if(Date.now() - worker.startTime > 1000 ) {
				// if we got user input, but worker is running for over a second
				// terminate old worker and start new one.
				worker.terminate();
				initWorker();
			}
			// post params to worker
			worker.startTime = Date.now();
			worker.postMessage(params);
		},
	  
	  
	  onWorkerUpdate: function(e) {
			// Received updated Axiom from worker (which applied productions)
			this.LSystem.setAxiom(e.data.result);
			this.updateTurtleGraphics();
		},

	  /**
	   * Called when a component is removed (e.g., via removeAttribute).
	   * Generally undoes all modifications to the entity.
	   */
	  remove: function () { },

	  /**
	   * Called on each scene tick.
	   */
	  // tick: function (t) { },

	  /**
	   * Called when entity pauses.
	   * Use to stop or remove any dynamic or background behavior such as events.
	   */
	  pause: function () { },

	  /**
	   * Called when entity resumes.
	   * Use to continue or add any dynamic or background behavior such as events.
	   */
	  play: function () { },
	});


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function LSystem({ axiom, productions, finals, branchSymbols, ignoredSymbols, classicParametricSyntax }) {

		// faking default values until better support lands in all browser
		axiom = typeof axiom !== 'undefined' ? axiom : '';
		branchSymbols = typeof branchSymbols !== 'undefined' ? branchSymbols : [];
		ignoredSymbols = typeof ignoredSymbols !== 'undefined' ? ignoredSymbols : [];
		classicParametricSyntax = typeof classicParametricSyntax !== 'undefined' ? classicParametricSyntax : 'false';

		// if using objects in axioms, as used in parametric L-Systems
		this.getString = function (onlySymbols = true) {
			if (typeof this.axiom === 'string') return this.axiom;

			if (onlySymbols === true) {
				return this.axiom.reduce((prev, current) => prev + current.symbol, '');
			} else {
				return JSON.stringify(this.axiom);
			}
		};

		this.setAxiom = function (axiom) {
			this.axiom = axiom;
		};

		this.setProduction = function (A, B) {
			let newProduction = [A, B];
			if (newProduction === undefined) throw new Error('no production specified.');

			if (this.parameters.allowClassicSyntax === true) {
				let transformedProduction = this.transformClassicCSProduction.bind(this)(newProduction);
				this.productions.set(transformedProduction[0], transformedProduction[1]);
			} else {
				this.productions.set(newProduction[0], newProduction[1]);
			}
		};

		// set multiple productions from name:value Object
		this.setProductions = function (newProductions) {
			if (newProductions === undefined) throw new Error('no production specified.');
			this.productions = new Map();

			// TODO: once Object.entries() (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries) is stable, use that in combo instead of awkward for…in.
			for (let condition in newProductions) {
				if (newProductions.hasOwnProperty(condition)) {
					this.setProduction(condition, newProductions[condition]);
				}
			}
		};

		this.setFinal = function (symbol, final) {
			let newFinal = [symbol, final];
			if (newFinal === undefined) {
				throw new Error('no final specified.');
			}
			this.finals.set(newFinal[0], newFinal[1]);
		};

		// set multiple finals from name:value Object
		this.setFinals = function (newFinals) {
			if (newFinals === undefined) throw new Error('no finals specified.');
			this.finals = new Map();
			for (let symbol in newFinals) {
				if (newFinals.hasOwnProperty(symbol)) {
					this.setFinal(symbol, newFinals[symbol]);
				}
			}
		};

		// TODO: implement it!
		this.transformClassicParametricProduction = function (p) {
			return p;
		};

		this.testClassicParametricSyntax = axiom => /\(.+\)/.test(axiom);

		// transforms things like 'A(1,2,5)B(2.5)' to
		// [ {symbol: 'A', params: [1,2,5]}, {symbol: 'B', params:[25]} ]
		// strips spaces
		this.transformClassicParametricAxiom = function (axiom) {

			// Replace whitespaces, then split between square brackets.
			let splitAxiom = axiom.replace(/\s+/g, '').split(/[\(\)]/);
			console.log('parts:', splitAxiom);
			let newAxiom = [];
			// Construct new axiom by getting the params and symbol.
			for (let i = 0; i < splitAxiom.length - 1; i += 2) {
				let params = splitAxiom[i + 1].split(',').map(Number);
				newAxiom.push({ symbol: splitAxiom[i], params: params });
			}
			console.log('parsed axiom:', newAxiom);
		};

		// transform a classic syntax production into valid JS production
		// TODO: Only work on first part pf production P[0]
		// -> this.transformClassicCSCondition
		this.transformClassicCSProduction = function (p) {

			// before continuing, check if classic syntax actually there
			// example: p = ['A<B>C', 'Z']

			// left should be ['A', 'B']
			let left = p[0].match(/(\w+)<(\w)/);

			// right should be ['B', 'C']
			let right = p[0].match(/(\w)>(\w+)/);

			// Not a CS-Production (no '<' or '>'),
			//return original production.
			if (left === null && right === null) {
				return p;
			}

			// indexSymbol should be 'B' in A<B>C
			// get it either from left side or right side if left is nonexistent
			let indexSymbol = left !== null ? left[2] : right[1];

			// double check: make sure that the right and left match got the same indexSymbol (B)
			if (left !== null && right !== null && left[2] !== right[1]) {
				throw new Error('index symbol differs in context sensitive production from left to right check.', left[2], '!==', right[1]);
			}

			// finally build the new (valid JS) production
			// (that is being executed instead of the classic syntax,
			//  which can't be interpreted by the JS engine)
			let transformedFunction = ({ index: _index, part: _part, currentAxiom: _axiom, params: _params }) => {

				let leftMatch = true;
				let rightMatch = true;

				// this can possibly be optimized (see: https://developers.google.com/speed/articles/optimizing-javascript#avoiding-pitfalls-with-closures)
				if (left !== null) {
					leftMatch = this.match({ direction: 'left', match: left[1], index: _index, branchSymbols: '[]', ignoredSymbols: '+-&' });
				}

				// don't match with right side if left already false or no right match necessary
				if (leftMatch === false || leftMatch === true && right === null) return leftMatch ? p[1] : indexSymbol;

				// see left!== null. could be optimized. Creating 3 variations of function
				// so left/right are not checked here, which improves speed, as left/right
				// are in a scope above.
				if (right !== null) {
					rightMatch = this.match({ direction: 'right', match: right[2], index: _index, branchSymbols: '[]', ignoredSymbols: '+-&' });
				}

				return leftMatch && rightMatch ? p[1] : indexSymbol;
			};

			let transformedProduction = [indexSymbol, transformedFunction];

			return transformedProduction;
		};

		this.applyProductions = function () {
			// a axiom can be a string or an array of objects that contain the key/value 'symbol'
			let newAxiom = typeof this.axiom === 'string' ? '' : [];
			let index = 0;
			// iterate all symbols/characters of the axiom and lookup according productions
			for (let part of this.axiom) {
				let symbol = part;

				// Stuff for classic parametric L-Systems: get actual symbol and possible parameters
				// params will be given the production function, if applicable.
				let params = [];
				if (typeof part === 'object' && part.symbol) symbol = part.symbol;
				if (typeof part === 'object' && part.params) params = part.params;

				// default production result is just the original part itself
				let result = part;

				if (this.productions.has(symbol)) {
					let p = this.productions.get(symbol);

					// if p is a function, execute function and append return value
					if (typeof p === 'function') {
						result = p({ index, currentAxiom: this.axiom, part, params });

						/* if p is no function and no iterable, then
	     it should be a string (regular) or object
	     directly return it then as result */
					} else if (typeof p === 'string' || p instanceof String || typeof p === 'object' && p[Symbol.iterator] === undefined) {

							result = p;

							// if p is a list/iterable
						} else if (p[Symbol.iterator] !== undefined && typeof p !== 'string' && !(p instanceof String)) {
								/*
	       go through the list and use
	       the first valid production in that list. (that returns true)
	       This assumes, it's a list of functions.
	       */
								for (let _p of p) {
									let _result = typeof _p === 'function' ? _p({ index, currentAxiom: this.axiom, part, params }) : _p;
									if (_result !== undefined && _result !== false) {
										result = _result;
										break;
									}
								}
							}
				}
				// finally add result to new axiom
				if (typeof newAxiom === 'string') {
					newAxiom += result;
				} else {
					// If result is an array, merge result into new axiom instead of pushing.
					if (result.constructor === Array) {
						Array.prototype.push.apply(newAxiom, result);
					} else {
						newAxiom.push(result);
					}
				}
				index++;
			}

			// finally set new axiom and also return for convenience
			this.axiom = newAxiom;
			return newAxiom;
		};

		// iterate n times
		this.iterate = function (n = 1) {
			this.iterations = n;
			let lastIteration;
			for (let iteration = 0; iteration < n; iteration++, this.iterationCount++) {
				lastIteration = this.applyProductions();
			}
			return lastIteration;
		};

		this.final = function () {
			for (let part of this.axiom) {

				// if we have objects for each symbol, (when using parametric L-Systems)
				// get actual identifiable symbol character
				let symbol = part;
				if (typeof part === 'object' && part.symbol) symbol = part.symbol;

				if (this.finals.has(symbol)) {
					var finalFunction = this.finals.get(symbol);
					var typeOfFinalFunction = typeof finalFunction;
					if (typeOfFinalFunction !== 'function') {
						throw Error('\'' + symbol + '\'' + ' has an object for a final function. But it is __not a function__ but a ' + typeOfFinalFunction + '!');
					}
					// execute symbols function
					finalFunction();
				} else {
					// symbol has no final function
				}
			}
		};

		/*
	 	how to use match():
	  	-----------------------
	 	It is mainly a helper function for context sensitive productions.
	 	If you use the classic syntax, it will by default be automatically transformed to proper
	 	JS-Syntax.
	 	Howerver, you can use the match helper function in your on productions:
	 
	 	index is the index of a production using `match`
	 	eg. in a classic L-System
	 
	 	LSYS = ABCDE
	 	B<C>DE -> 'Z'
	 
	 	the index of the `B<C>D -> 'Z'` production would be the index of C (which is 2) when the
	 	production would perform match(). so (if not using the ClassicLSystem class) you'd construction your context-sensitive production from C to Z like so:
	 
	 	LSYS.setProduction('C', (index, axiom) => {
	 		(LSYS.match({index, match: 'B', direction: 'left'}) &&
	 		 LSYS.match({index, match: 'DE', direction: 'right'}) ? 'Z' : 'C')
	 	})
	 
	 	You can just write match({index, ...} instead of match({index: index, ..}) because of new ES6 Object initialization, see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#New_notations_in_ECMAScript_6
	 	*/

		this.match = function ({ axiom_, match, ignoredSymbols, branchSymbols, index, direction }) {

			let branchCount = 0;
			let explicitBranchCount = 0;
			axiom_ = axiom || this.axiom;
			if (branchSymbols === undefined) branchSymbols = this.branchSymbols !== undefined ? this.branchSymbols : [];
			if (ignoredSymbols === undefined) ignoredSymbols = this.ignoredSymbols !== undefined ? this.ignoredSymbols : [];

			let branchStart, branchEnd, axiomIndex, loopIndexChange, matchIndex, matchIndexChange, matchIndexOverflow;
			// set some variables depending on the direction to match
			if (direction === 'right') {
				loopIndexChange = matchIndexChange = +1;
				axiomIndex = index + 1;
				matchIndex = 0;
				matchIndexOverflow = match.length;
				if (branchSymbols.length > 0) [branchStart, branchEnd] = branchSymbols;
			} else if (direction === 'left') {
				loopIndexChange = matchIndexChange = -1;
				axiomIndex = index - 1;
				matchIndex = match.length - 1;
				matchIndexOverflow = -1;
				if (branchSymbols.length > 0) [branchEnd, branchStart] = branchSymbols;
			} else {
				throw Error(direction, 'is not a valid direction for matching.');
			}

			for (; axiomIndex < axiom_.length && axiomIndex >= 0; axiomIndex += loopIndexChange) {
				// FIXME: what about objects with .symbol
				let axiomSymbol = axiom_[axiomIndex];
				let matchSymbol = match[matchIndex];

				// compare current symbol of axiom with current symbol of match
				if (axiomSymbol === matchSymbol) {

					if (branchCount === 0 || explicitBranchCount > 0) {
						// if its a match and previously NOT inside branch (branchCount===0) or in explicitly wanted branch (explicitBranchCount > 0)

						// if a bracket was explicitly stated in match axiom
						if (axiomSymbol === branchStart) {
							explicitBranchCount++;
							branchCount++;
							matchIndex += matchIndexChange;
						} else if (axiomSymbol === branchEnd) {
							explicitBranchCount = Math.max(0, explicitBranchCount - 1);
							branchCount = Math.max(0, branchCount - 1);
							// only increase match if we are out of explicit branch

							if (explicitBranchCount === 0) {
								matchIndex += matchIndexChange;
							}
						} else {
							matchIndex += matchIndexChange;
						}
					}

					// overflowing matchIndices (matchIndex + 1 for right match, matchIndexEnd for left match )?
					// -> no more matches to do. return with true, as everything matched until here
					// *yay*
					if (matchIndex === matchIndexOverflow) {
						return true;
					}
				} else if (axiomSymbol === branchStart) {
					branchCount++;
					if (explicitBranchCount > 0) explicitBranchCount++;
				} else if (axiomSymbol === branchEnd) {
					branchCount = Math.max(0, branchCount - 1);
					if (explicitBranchCount > 0) explicitBranchCount = Math.max(0, explicitBranchCount - 1);
				} else if ((branchCount === 0 || explicitBranchCount > 0 && matchSymbol !== branchEnd) && ignoredSymbols.includes(axiomSymbol) === false) {
					// not in branchSymbols/branch? or if in explicit branch, and not at the very end of
					// condition (at the ]), and symbol not in ignoredSymbols ? then false
					return false;
				}
			}
		};

		// finally init stuff
		this.parameters = {
			allowClassicSyntax: true
		};

		this.setAxiom(axiom);
		this.productions = new Map();
		if (productions) this.setProductions(productions);
		this.branchSymbols = branchSymbols;
		this.ignoredSymbols = ignoredSymbols;
		this.classicParametricSyntax = classicParametricSyntax;
		if (finals) this.setFinals(finals);

		this.iterationCount = 0;
	}

	// Try to export to be used via require in NodeJS.
	if (true) {
		module.exports = LSystem;
		// module.exports.matchRight = matchRight;
		// module.exports.matchLeft = matchLeft;
	}


/***/ }
/******/ ]);
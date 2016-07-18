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

	var LSystem;

	// As we use webpack for compiling the source, it's used to bundle the
	// web worker into a blob via: https://github.com/webpack/worker-loader
	// Which works without additional changes, besides using `require` inside
	// the worker instead of importScripts().
	var LSystemWorker = __webpack_require__(1);

	/**
	 * Lindenmayer-System component for A-Frame.
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
	          return splitValue.split(':');
	        })
	      }
	    },
	    
	    // A: [blue line, red line, yellow line] B: red line
	    
	    segmentMixins: {
	      type: 'string',
	      parse: function (value) {
	        
	        let fromIndex = 0;
	        let currentIndex = value.indexOf(':', fromIndex);
	        let mixinsForSymbol = new Map();
	        while(currentIndex !== -1) {
	        	fromIndex = currentIndex+1;
	        	let newCurrentIndex = value.indexOf(':', fromIndex);
	        	let symbol = value.slice(currentIndex-1, currentIndex);
	        	let mixinlist = value.slice(currentIndex+1, newCurrentIndex === -1 ? value.length : newCurrentIndex-1).replace(/[\[\]]/g, '').split(',');

	        	mixinsForSymbol.set(symbol, mixinlist)
	        	currentIndex = newCurrentIndex;
	        }
	        return mixinsForSymbol;
	      }
	    },
	    
	    iterations: {
	      type: 'int',
	      default: 1
	    },
	    
	    angle: {
	      default: 90.0
	    },
	    
	    translateAxis: {
	      type: 'string',
	      default: 'y',
	      parse: function(value) {
	        value = value.toLowerCase();
	        if (value === 'x' ) {
	          return new THREE.Vector3(1, 0, 0);
	        } else if (value === 'y') {
	          return new THREE.Vector3(0, 1, 0);
	        } else if (value === 'z') {
	          return new THREE.Vector3(0, 0, 1);
	        } else {
	          throw new Error('translateAxis has to be a string: "x", "y" or "z"');
	        }
	      }
	    },
	    
	    dynamicSegmentLength: {
	      default: true
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
	      LSystem = __webpack_require__(3);
	    }
	    
	    this.sceneEl = document.querySelector('a-scene');
	    
	    let self = this;
	    
	    this.initWorker();
	    
	    this.xPosRotation = new THREE.Quaternion();
	    this.xNegRotation = new THREE.Quaternion();
	    this.yPosRotation = new THREE.Quaternion();
	    this.yNegRotation = new THREE.Quaternion();
	    this.zPosRotation = new THREE.Quaternion();
	    this.zNegRotation = new THREE.Quaternion();
	    this.yReverseRotation = new THREE.Quaternion();
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
	    this.segmentLengthFactor = 1.0;
	    
	    this.LSystem = new LSystem({
	      axiom: 'F',
	      productions: {'F': 'F'},
	      finals: {
	        /* As a default F is already defined as final, new ones get added automatically
	          by parsing the segment mixins. If no segment mixin for any symbol is defined
	          it wont get a final function and therefore not render.
	         */
	        'F': () => {self.pushSegment.bind(self, 'F')()},
	        '+': () => { self.transformationSegment.quaternion.multiply(self.yPosRotation)},
	        '-': () => { self.transformationSegment.quaternion.multiply(self.yNegRotation)},
	        '&': () => { self.transformationSegment.quaternion.multiply(self.zNegRotation)},
	        '^': () => { self.transformationSegment.quaternion.multiply(self.zPosRotation)},
	        '\\': () =>{ self.transformationSegment.quaternion.multiply(self.xNegRotation)},
	        '<': () => { self.transformationSegment.quaternion.multiply(self.xNegRotation)},
	        '/': () => { self.transformationSegment.quaternion.multiply(self.xPosRotation)},
	        '>': () => { self.transformationSegment.quaternion.multiply(self.xPosRotation)},
	        '|': () => { self.transformationSegment.quaternion.multiply(self.yReverseRotation)},
	        '!': () => {
	        self.segmentLengthFactor *=(2/3);
	        self.transformationSegment.scale.set(self.transformationSegment.scale.x*=(2/3), self.transformationSegment.scale.y*=(2/3), self.transformationSegment.scale.z*=(2/3));
	        
	          self.colorIndex++;
	        },
	        '\'': () => {
	          self.segmentLengthFactor *=(3/2);
	          self.transformationSegment.scale.set(self.transformationSegment.scale.x*=(3/2), self.transformationSegment.scale.y*=(3/2), self.transformationSegment.scale.z*=(3/2));
	          self.colorIndex = Math.max(0, self.colorIndex - 1);
	        },
	        '[': () => { self.stack.push(self.transformationSegment.clone()) },
	        ']': () => { self.transformationSegment = self.stack.pop() }
	      }
	    });

	    
	    
	    
	    
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
	    
	    let self = this;

	    this.el.removeObject3D('mesh');
	    
	    if(this.segmentElementGroupsMap !== undefined) {
	      for (let segmentElGroup of this.segmentElementGroupsMap.values()) {
	    
	        segmentElGroup.removeObject3D('mesh');
	        segmentElGroup.innerHTML = '';
	      }
	    }
	    
	    if(oldData.angle && oldData.angle !== this.data.angle) {
	      this.updateTurtleGraphics();
	    } else if(oldData.axiom === undefined || (oldData.axiom && oldData.axiom !== this.data.axiom) || (oldData.productions && JSON.stringify(oldData.productions) !== JSON.stringify(this.data.productions))) {
	      console.log('other stuff');
	      // the following are async:
	      this.updateLSystem();
	      this.updateSegmentMixins();
	      
	    }

	    
	    
	    

	  },
	  
	  // if this.dynamicSegmentLength===true use this function to set the length
	  // depending on segments geometries bbox
	  calculateSegmentLength: function (mixin, geometry) {
	    if(this.segmentLengthMap.has(mixin)) return this.segmentLengthMap.get(mixin);
	    geometry.computeBoundingBox();
	    // TODO FIXME: use proper bounding box values, depending on this.data.translateAxis
	    this.segmentLengthMap.set(mixin, Math.abs(geometry.boundingBox.min.x - geometry.boundingBox.max.x));
	    return this.segmentLengthMap.get(mixin);
	    
	  },
	  
	  initWorker: function() {
	    this.worker = new LSystemWorker();
	    this.worker.onmessage = this.onWorkerUpdate.bind(this);
	  },
	  
	  pushSegment: function(symbol) {
	    let self = this;
	    let currentQuaternion = self.transformationSegment.quaternion.clone();
	    let currentPosition = self.transformationSegment.position.clone();
	    let currentScale = self.transformationSegment.scale.clone();
	    
	    // Cap colorIndex to maximum mixins defined for the symbol.
	    let cappedColorIndex = Math.min(this.colorIndex, this.data.segmentMixins.get(symbol).length-1);
	    
	    let mixin = this.mixinMap.get(symbol + cappedColorIndex);
	    
	    if(this.data.mergeGeometries === false) {
	      let newSegment = document.createElement('a-entity');
	      newSegment.setAttribute('mixin', mixin);
	      
	      newSegment.addEventListener('loaded', function (e) {
	        // Offset child element of object3D, to rotate around end point
	        // IMPORTANT: It may change that A-Frame puts objects into a group

	        let segmentLength = self.segmentLengthMap.get(mixin);

	        newSegment.object3D.children[0].translateOnAxis(self.data.translateAxis, (segmentLength * self.segmentLengthFactor) / 2);
	        newSegment.object3D.quaternion.copy(currentQuaternion);
	        newSegment.object3D.position.copy(currentPosition);
	        newSegment.object3D.scale.copy(currentScale);
	      });
	      
	      this.segmentElementGroupsMap.get(symbol + cappedColorIndex).appendChild(newSegment);

	    } else {
	      let segmentObject3D = this.segmentObjects3DMap.get(symbol + cappedColorIndex);
	      let newSegmentObject3D = segmentObject3D.clone();
	      newSegmentObject3D.quaternion.copy(currentQuaternion);
	      newSegmentObject3D.position.copy(currentPosition);
	      newSegmentObject3D.scale.copy(currentScale);
	      newSegmentObject3D.matrixAutoUpdate = false;
	      newSegmentObject3D.updateMatrix();
	      this.mergeGroups.get(symbol + cappedColorIndex).geometry.merge(newSegmentObject3D.geometry, newSegmentObject3D.matrix);
	    }
	    let segmentLength = this.segmentLengthMap.get(mixin);
	    this.transformationSegment.translateOnAxis(this.data.translateAxis, segmentLength * this.segmentLengthFactor);
	  },
	  
	  updateLSystem: function () {
	    let self = this;
	    
	    // post params to worker
	    let params = {
	      axiom: 		this.data.axiom,
	      productions: this.data.productions,
	      iterations: this.data.iterations
	    }
	      
	    if(Date.now() - this.worker.startTime > 1000 ) {
	      // if we got user input, but worker is running for over a second
	      // terminate old worker and start new one.
	      this.worker.terminate();
	      this.initWorker();
	    }
	      
	    this.worker.startTime = Date.now();
	    this.worker.postMessage(params);
	  },
	  
	  updateSegmentMixins: function () {
	    let self = this;
	    
	    this.el.innerHTML = '';
	    
	    // Map for remembering the elements holding differnt segment types
	    this.segmentElementGroupsMap = new Map();

	    
	    this.mixinMap = new Map();
	    // Construct a map with keys = `symbol + colorIndex` from data.segmentMixins
	    for (let [symbol, mixinList] of this.data.segmentMixins) {
	      for (let i = 0; i < mixinList.length; i++) {
	        this.mixinMap.set(symbol + i, mixinList[i]);
	      }
	    }
	    
	    // Map for buffering geometries for use in pushSegments()
	    // when merging geometries ourselves and not by appending a `mixin` attributes,
	    // as done with `mergeGeometry = false`.
	    this.segmentObjects3DMap = new Map();
	    
	    this.segmentLengthMap = new Map();
	    this.mergeGroups = new Map();
	    
	    this.mixinPromises = [];
	    
	    
	    // Collect mixin info by pre-appending segment elements with their mixin
	    // Then ise the generated geometry etc.
	    if(this.data.segmentMixins && this.data.segmentMixins.length !== 0) {
	      
	      // Go through every symbols segmentMixins as defined by user
	      for (let [symbol, mixinList] of this.data.segmentMixins) {
	        
	        // Set final functions for each symbol that has a mixin defined
	        this.LSystem.setFinal(symbol, () => {self.pushSegment.bind(self, symbol)()});
	        
	        // And iterate the MixinList to buffer the segments or calculate segment lengths…
	        for (let i = 0; i < mixinList.length; i++) {
	          
	          let mixinColorIndex = i;
	          let mixin = mixinList[mixinColorIndex];
	          
	          self.mixinPromises.push(new Promise((resolve, reject) => {
	            // Save mixinColorIndex for async promise below.

	            let segmentElGroup = document.createElement('a-entity');
	            segmentElGroup.setAttribute('id', mixin + '-group-' + mixinColorIndex + Math.floor(Math.random() * 10000));
	            
	            
	            // TODO: Put it all under this.mergeData
	            segmentElGroup.setAttribute('geometry', 'buffer', false);
	            segmentElGroup.setAttribute('mixin', mixin);
	            segmentElGroup.addEventListener('loaded', function (e) {
	              
	              let segmentObject = segmentElGroup.getObject3D('mesh').clone();
	              
	              // Make sure the geometry is actually unique
	              // AFrame sets the same geometry for multiple entities. As we modify
	              // the geometry per entity we need to have unique geometry instances.
	              segmentElGroup.getObject3D('mesh').geometry.dispose();
	              segmentObject.geometry = (segmentObject.geometry.clone());
	              
	              segmentLength = self.calculateSegmentLength(mixin, segmentObject.geometry);
	              
	              // Do some additional stuff like buffering 3D objects / geometry
	              // if we want to merge geometries.
	              if(self.data.mergeGeometries === true) {
	                
	                // Offset geometry by half segmentLength to get the rotation point right.

	                let translation = self.data.translateAxis.clone().multiplyScalar((segmentLength * self.segmentLengthFactor)/2);
	                segmentObject.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( translation.x, translation.y, translation.z ) );

	                self.segmentObjects3DMap.set(symbol + mixinColorIndex, segmentObject );

	              }
	              
	              segmentElGroup.removeObject3D('mesh');
	              resolve();
	            });
	            
	            
	            if(this.segmentElementGroupsMap.has(symbol + mixinColorIndex)) {
	              let previousElGroup = this.segmentElementGroupsMap.get(symbol + mixinColorIndex);
	              this.segmentElementGroupsMap.delete(symbol + mixinColorIndex);
	              this.el.removeChild(previousElGroup);
	            }
	            
	            this.segmentElementGroupsMap.set(symbol + mixinColorIndex, segmentElGroup);
	            this.el.appendChild(segmentElGroup);
	            
	            
	          }));
	        }
	      }
	    }
	  },
	  
	  updateTurtleGraphics: function() {
	    Promise.all(this.mixinPromises).then(() => {
	      // The main segment used for saving transformations (rotation, translation, scale(?))
	      this.transformationSegment = new THREE.Object3D();

	      // set merge groups
	      if(this.data.mergeGeometries === true)
	      for (let [id, segmentObject] of this.segmentObjects3DMap) {
	        this.mergeGroups.set(id, new THREE.Mesh(
	          new THREE.Geometry(), segmentObject.material
	        ));
	        
	      }
	      
	      
	      // We push copies of this.transformationSegment on branch symbols inside this array.
	      this.stack = [];
	      
	      this.colorIndex = 0;
	      this.lineWidth = 0.0005;
	      this.lineLength = 0.125;
	      
	      let angle = this.data.angle;
	      
	      // Set quaternions based on angle slider
	      this.xPosRotation.setFromAxisAngle( this.X, (Math.PI / 180) * angle );
	      this.xNegRotation.setFromAxisAngle( this.X, (Math.PI / 180) * -angle );
	      
	      this.yPosRotation.setFromAxisAngle( this.Y, (Math.PI / 180) * angle );
	      this.yNegRotation.setFromAxisAngle( this.Y, (Math.PI / 180) * -angle );
	      this.yReverseRotation.setFromAxisAngle( this.Y, (Math.PI / 180) * 180 );
	      
	      this.zPosRotation.setFromAxisAngle( this.Z, (Math.PI / 180) * angle );
	      this.zNegRotation.setFromAxisAngle( this.Z, (Math.PI / 180) * -angle );
	      //
	      // this.geometry = new THREE.CylinderGeometry(this.lineWidth, this.lineWidth, self.data.lineLength, 3);
	      // this.geometry.rotateZ((Math.PI / 180) * 90);
	      // this.geometry.translate( -(this.data.segmentLength/2), 0, 0 );
	      // for (let face of this.geometry.faces) {
	      // 	face.color.setHex(this.colors[colorIndex]);
	      // }
	      // this.geometry.colorsNeedUpdate = true;

	      this.LSystem.final();
	      // finally set the merged meshes to be visible.
	      if(this.data.mergeGeometries === true) {
	        for (let tuple of this.segmentElementGroupsMap) {
	          let [symbolWithColorIndex, elGroup] = tuple;
	          
	          let mergeGroup = this.mergeGroups.get(symbolWithColorIndex);
	          // Remove unused element groups inside our element
	          if(mergeGroup.geometry.vertices.length === 0) {
	            this.el.removeChild(elGroup);
	          } else {
	            elGroup.setObject3D('mesh', this.mergeGroups.get(symbolWithColorIndex));
	            elGroup.setAttribute('mixin', this.mixinMap.get(symbolWithColorIndex));
	          }
	        }
	      }
	      
	    });
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
	  remove: function () {
	    
	  },

	  /**
	   * Called on each scene tick.
	   */
	   tick: function (t) {
	    //  console.log(this.parentEl === undefined);
	    //  console.log('\nTICK\n', t);
	   },

	  /**
	   * Called when entity pauses.
	   * Use to stop or remove any dynamic or background behavior such as events.
	   */
	  pause: function () {
	  },

	  /**
	   * Called when entity resumes.
	   * Use to continue or add any dynamic or background behavior such as events.
	   */
	  play: function () {
	  },
	});


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function() {
		return __webpack_require__(2)("/******/ (function(modules) { // webpackBootstrap\n/******/ \t// The module cache\n/******/ \tvar installedModules = {};\n\n/******/ \t// The require function\n/******/ \tfunction __webpack_require__(moduleId) {\n\n/******/ \t\t// Check if module is in cache\n/******/ \t\tif(installedModules[moduleId])\n/******/ \t\t\treturn installedModules[moduleId].exports;\n\n/******/ \t\t// Create a new module (and put it into the cache)\n/******/ \t\tvar module = installedModules[moduleId] = {\n/******/ \t\t\texports: {},\n/******/ \t\t\tid: moduleId,\n/******/ \t\t\tloaded: false\n/******/ \t\t};\n\n/******/ \t\t// Execute the module function\n/******/ \t\tmodules[moduleId].call(module.exports, module, module.exports, __webpack_require__);\n\n/******/ \t\t// Flag the module as loaded\n/******/ \t\tmodule.loaded = true;\n\n/******/ \t\t// Return the exports of the module\n/******/ \t\treturn module.exports;\n/******/ \t}\n\n\n/******/ \t// expose the modules object (__webpack_modules__)\n/******/ \t__webpack_require__.m = modules;\n\n/******/ \t// expose the module cache\n/******/ \t__webpack_require__.c = installedModules;\n\n/******/ \t// __webpack_public_path__\n/******/ \t__webpack_require__.p = \"\";\n\n/******/ \t// Load entry module and return exports\n/******/ \treturn __webpack_require__(0);\n/******/ })\n/************************************************************************/\n/******/ ([\n/* 0 */\n/***/ function(module, exports, __webpack_require__) {\n\n\t// Require instead of importScripts because we use webpack\n\t// with worker-loader for compiling source: https://github.com/webpack/worker-loader\n\tlet LSystem = __webpack_require__(1);\n\tlet lsystem = new LSystem({});\n\tlet timeout = {};\n\n\tonmessage = function(e) {\n\t  // wait a few ms to start thread, to be able to cancel old tasks\n\t  clearTimeout(timeout);\n\t  timeout = setTimeout(function() {\n\t    \n\t      lsystem.setAxiom(e.data.axiom);\n\t      \n\t      lsystem.clearProductions();\n\t      for (let p of e.data.productions) {\n\t        lsystem.setProduction(p[0], p[1]);\n\t      }\n\t      lsystem.iterate(e.data.iterations);\n\t      \n\t      postMessage({\n\t        result: lsystem.getString(),\n\t        initial: e.data\n\t      });\n\t      \n\t  }, 20);\n\n\t};\n\n\n/***/ },\n/* 1 */\n/***/ function(module, exports, __webpack_require__) {\n\n\t'use strict';\n\n\tfunction LSystem({ axiom, productions, finals, branchSymbols, ignoredSymbols, classicParametricSyntax }) {\n\n\t\t// faking default values until better support lands in all browser\n\t\taxiom = typeof axiom !== 'undefined' ? axiom : '';\n\t\tbranchSymbols = typeof branchSymbols !== 'undefined' ? branchSymbols : [];\n\t\tignoredSymbols = typeof ignoredSymbols !== 'undefined' ? ignoredSymbols : [];\n\t\tclassicParametricSyntax = typeof classicParametricSyntax !== 'undefined' ? classicParametricSyntax : 'false';\n\n\t\t// if using objects in axioms, as used in parametric L-Systems\n\t\tthis.getString = function (onlySymbols = true) {\n\t\t\tif (typeof this.axiom === 'string') return this.axiom;\n\t\t\tif (onlySymbols === true) {\n\t\t\t\treturn this.axiom.reduce((prev, current) => {\n\t\t\t\t\tif (current.symbol === undefined) {\n\t\t\t\t\t\tconsole.log('found:', current);\n\t\t\t\t\t\tthrow new Error('L-Systems that use only objects as symbols (eg: {symbol: \\'F\\', params: []}), cant use string symbols (eg. \\'F\\')! Check if you always return objects in your productions and no strings.');\n\t\t\t\t\t}\n\t\t\t\t\treturn prev + current.symbol;\n\t\t\t\t}, '');\n\t\t\t} else {\n\t\t\t\treturn JSON.stringify(this.axiom);\n\t\t\t}\n\t\t};\n\n\t\tthis.setAxiom = function (axiom) {\n\t\t\tthis.axiom = axiom;\n\t\t};\n\n\t\tthis.setProduction = function (A, B) {\n\t\t\tlet newProduction = [A, B];\n\t\t\tif (newProduction === undefined) throw new Error('no production specified.');\n\n\t\t\tif (this.parameters.allowClassicSyntax === true) {\n\t\t\t\tlet transformedProduction = this.transformClassicCSProduction.bind(this)(newProduction);\n\t\t\t\tthis.productions.set(transformedProduction[0], transformedProduction[1]);\n\t\t\t} else {\n\t\t\t\tthis.productions.set(newProduction[0], newProduction[1]);\n\t\t\t}\n\t\t};\n\n\t\t// set multiple productions from name:value Object\n\t\tthis.setProductions = function (newProductions) {\n\t\t\tif (newProductions === undefined) throw new Error('no production specified.');\n\t\t\tthis.clearProductions();\n\n\t\t\t// TODO: once Object.entries() (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries) is stable, use that in combo instead of awkward for…in.\n\t\t\tfor (let condition in newProductions) {\n\t\t\t\tif (newProductions.hasOwnProperty(condition)) {\n\t\t\t\t\tthis.setProduction(condition, newProductions[condition]);\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\tthis.clearProductions = function () {\n\t\t\tthis.productions = new Map();\n\t\t};\n\n\t\tthis.setFinal = function (symbol, final) {\n\t\t\tlet newFinal = [symbol, final];\n\t\t\tif (newFinal === undefined) {\n\t\t\t\tthrow new Error('no final specified.');\n\t\t\t}\n\t\t\tthis.finals.set(newFinal[0], newFinal[1]);\n\t\t};\n\n\t\t// set multiple finals from name:value Object\n\t\tthis.setFinals = function (newFinals) {\n\t\t\tif (newFinals === undefined) throw new Error('no finals specified.');\n\t\t\tthis.finals = new Map();\n\t\t\tfor (let symbol in newFinals) {\n\t\t\t\tif (newFinals.hasOwnProperty(symbol)) {\n\t\t\t\t\tthis.setFinal(symbol, newFinals[symbol]);\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\t// TODO: implement it!\n\t\tthis.transformClassicParametricProduction = function (p) {\n\t\t\treturn p;\n\t\t};\n\n\t\t// TODO: Scaffold classic parametric and context sensitive stuff out of main file\n\t\t// And simply require it here, eg:\n\t\t// this.testClassicParametricSyntax = require(classicSyntax.testParametric)??\n\t\tthis.testClassicParametricSyntax = axiom => /\\(.+\\)/.test(axiom);\n\n\t\t// transforms things like 'A(1,2,5)B(2.5)' to\n\t\t// [ {symbol: 'A', params: [1,2,5]}, {symbol: 'B', params:[25]} ]\n\t\t// strips spaces\n\t\tthis.transformClassicParametricAxiom = function (axiom) {\n\n\t\t\t// Replace whitespaces, then split between square brackets.\n\t\t\tlet splitAxiom = axiom.replace(/\\s+/g, '').split(/[\\(\\)]/);\n\t\t\t// console.log('parts:', splitAxiom)\n\t\t\tlet newAxiom = [];\n\t\t\t// Construct new axiom by getting the params and symbol.\n\t\t\tfor (let i = 0; i < splitAxiom.length - 1; i += 2) {\n\t\t\t\tlet params = splitAxiom[i + 1].split(',').map(Number);\n\t\t\t\tnewAxiom.push({ symbol: splitAxiom[i], params: params });\n\t\t\t}\n\t\t\t// console.log('parsed axiom:', newAxiom)\n\t\t};\n\n\t\t// transform a classic syntax production into valid JS production\n\t\t// TODO: Only work on first part pf production P[0]\n\t\t// -> this.transformClassicCSCondition\n\t\tthis.transformClassicCSProduction = function (p) {\n\n\t\t\t// before continuing, check if classic syntax actually there\n\t\t\t// example: p = ['A<B>C', 'Z']\n\n\t\t\t// left should be ['A', 'B']\n\t\t\tlet left = p[0].match(/(\\w+)<(\\w)/);\n\n\t\t\t// right should be ['B', 'C']\n\t\t\tlet right = p[0].match(/(\\w)>(\\w+)/);\n\n\t\t\t// Not a CS-Production (no '<' or '>'),\n\t\t\t//return original production.\n\t\t\tif (left === null && right === null) {\n\t\t\t\treturn p;\n\t\t\t}\n\n\t\t\t// indexSymbol should be 'B' in A<B>C\n\t\t\t// get it either from left side or right side if left is nonexistent\n\t\t\tlet indexSymbol = left !== null ? left[2] : right[1];\n\n\t\t\t// double check: make sure that the right and left match got the same indexSymbol (B)\n\t\t\tif (left !== null && right !== null && left[2] !== right[1]) {\n\t\t\t\tthrow new Error('index symbol differs in context sensitive production from left to right check.', left[2], '!==', right[1]);\n\t\t\t}\n\n\t\t\t// finally build the new (valid JS) production\n\t\t\t// (that is being executed instead of the classic syntax,\n\t\t\t//  which can't be interpreted by the JS engine)\n\t\t\tlet transformedFunction = ({ index: _index, part: _part, currentAxiom: _axiom, params: _params }) => {\n\n\t\t\t\tlet leftMatch = { result: true };\n\t\t\t\tlet rightMatch = { result: true };\n\n\t\t\t\t// this can possibly be optimized (see: https://developers.google.com/speed/articles/optimizing-javascript#avoiding-pitfalls-with-closures)\n\t\t\t\tif (left !== null) {\n\t\t\t\t\tleftMatch = this.match({ direction: 'left', match: left[1], index: _index, branchSymbols: '[]', ignoredSymbols: '+-&' });\n\t\t\t\t}\n\n\t\t\t\t// don't match with right side if left already false or no right match necessary\n\t\t\t\tif (leftMatch.result === false || leftMatch.result === true && right === null) return leftMatch.result ? p[1] : _part;\n\n\t\t\t\t// see left!== null. could be optimized. Creating 3 variations of function\n\t\t\t\t// so left/right are not checked here, which improves speed, as left/right\n\t\t\t\t// are in a scope above.\n\t\t\t\tif (right !== null) {\n\t\t\t\t\trightMatch = this.match({ direction: 'right', match: right[2], index: _index, branchSymbols: '[]', ignoredSymbols: '+-&' });\n\t\t\t\t}\n\n\t\t\t\t// Match! On a match return either the result of given production function\n\t\t\t\t// or simply return the symbol itself if its no function.\n\t\t\t\tif (leftMatch.result && rightMatch.result) {\n\t\t\t\t\treturn typeof p[1] === 'function' ? p[1]({ index: _index, part: _part, currentAxiom: _axiom, params: _params, leftMatchIndices: leftMatch.matchIndices, rightMatchIndices: rightMatch.matchIndices }) : p[1];\n\t\t\t\t} else {\n\t\t\t\t\treturn _part;\n\t\t\t\t}\n\t\t\t};\n\n\t\t\tlet transformedProduction = [indexSymbol, transformedFunction];\n\n\t\t\treturn transformedProduction;\n\t\t};\n\n\t\tthis.applyProductions = function () {\n\t\t\t// a axiom can be a string or an array of objects that contain the key/value 'symbol'\n\t\t\tlet newAxiom = typeof this.axiom === 'string' ? '' : [];\n\t\t\tlet index = 0;\n\t\t\t// iterate all symbols/characters of the axiom and lookup according productions\n\t\t\tfor (let part of this.axiom) {\n\t\t\t\tlet symbol = part;\n\n\t\t\t\t// Stuff for classic parametric L-Systems: get actual symbol and possible parameters\n\t\t\t\t// params will be given the production function, if applicable.\n\t\t\t\tlet params = [];\n\t\t\t\tif (typeof part === 'object' && part.symbol) symbol = part.symbol;\n\t\t\t\tif (typeof part === 'object' && part.params) params = part.params;\n\n\t\t\t\t// default production result is just the original part itself\n\t\t\t\tlet result = part;\n\n\t\t\t\tif (this.productions.has(symbol)) {\n\t\t\t\t\tlet p = this.productions.get(symbol);\n\n\t\t\t\t\t// if p is a function, execute function and append return value\n\t\t\t\t\tif (typeof p === 'function') {\n\t\t\t\t\t\tresult = p({ index, currentAxiom: this.axiom, part, params });\n\n\t\t\t\t\t\t/* if p is no function and no iterable, then\n\t     it should be a string (regular) or object\n\t     directly return it then as result */\n\t\t\t\t\t} else if (typeof p === 'string' || p instanceof String || typeof p === 'object' && p[Symbol.iterator] === undefined) {\n\n\t\t\t\t\t\t\tresult = p;\n\n\t\t\t\t\t\t\t// if p is a list/iterable\n\t\t\t\t\t\t} else if (p[Symbol.iterator] !== undefined && typeof p !== 'string' && !(p instanceof String)) {\n\t\t\t\t\t\t\t\t/*\n\t       go through the list and use\n\t       the first valid production in that list. (that returns true)\n\t       This assumes, it's a list of functions.\n\t       */\n\t\t\t\t\t\t\t\tfor (let _p of p) {\n\t\t\t\t\t\t\t\t\tlet _result = typeof _p === 'function' ? _p({ index, currentAxiom: newAxiom, part, params }) : _p;\n\t\t\t\t\t\t\t\t\tif (_result !== undefined && _result !== false) {\n\t\t\t\t\t\t\t\t\t\tresult = _result;\n\t\t\t\t\t\t\t\t\t\tbreak;\n\t\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\t// finally add result to new axiom\n\t\t\t\tif (typeof newAxiom === 'string') {\n\t\t\t\t\tnewAxiom += result;\n\t\t\t\t} else {\n\t\t\t\t\t// If result is an array, merge result into new axiom instead of pushing.\n\t\t\t\t\tif (result.constructor === Array) {\n\t\t\t\t\t\tArray.prototype.push.apply(newAxiom, result);\n\t\t\t\t\t} else {\n\t\t\t\t\t\tnewAxiom.push(result);\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tindex++;\n\t\t\t}\n\n\t\t\t// finally set new axiom and also return for convenience\n\t\t\tthis.axiom = newAxiom;\n\t\t\treturn newAxiom;\n\t\t};\n\n\t\t// iterate n times\n\t\tthis.iterate = function (n = 1) {\n\t\t\tthis.iterations = n;\n\t\t\tlet lastIteration;\n\t\t\tfor (let iteration = 0; iteration < n; iteration++, this.iterationCount++) {\n\t\t\t\tlastIteration = this.applyProductions();\n\t\t\t}\n\t\t\treturn lastIteration;\n\t\t};\n\n\t\tthis.final = function () {\n\t\t\tfor (let part of this.axiom) {\n\n\t\t\t\t// if we have objects for each symbol, (when using parametric L-Systems)\n\t\t\t\t// get actual identifiable symbol character\n\t\t\t\tlet symbol = part;\n\t\t\t\tif (typeof part === 'object' && part.symbol) symbol = part.symbol;\n\n\t\t\t\tif (this.finals.has(symbol)) {\n\t\t\t\t\tvar finalFunction = this.finals.get(symbol);\n\t\t\t\t\tvar typeOfFinalFunction = typeof finalFunction;\n\t\t\t\t\tif (typeOfFinalFunction !== 'function') {\n\t\t\t\t\t\tthrow Error('\\'' + symbol + '\\'' + ' has an object for a final function. But it is __not a function__ but a ' + typeOfFinalFunction + '!');\n\t\t\t\t\t}\n\t\t\t\t\t// execute symbols function\n\t\t\t\t\tfinalFunction();\n\t\t\t\t} else {\n\t\t\t\t\t// symbol has no final function\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\t/*\n\t \thow to use match():\n\t  \t-----------------------\n\t \tIt is mainly a helper function for context sensitive productions.\n\t \tIf you use the classic syntax, it will by default be automatically transformed to proper\n\t \tJS-Syntax.\n\t \tHowerver, you can use the match helper function in your on productions:\n\t \n\t \tindex is the index of a production using `match`\n\t \teg. in a classic L-System\n\t \n\t \tLSYS = ABCDE\n\t \tB<C>DE -> 'Z'\n\t \n\t \tthe index of the `B<C>D -> 'Z'` production would be the index of C (which is 2) when the\n\t \tproduction would perform match(). so (if not using the ClassicLSystem class) you'd construction your context-sensitive production from C to Z like so:\n\t \n\t \tLSYS.setProduction('C', (index, axiom) => {\n\t \t\t(LSYS.match({index, match: 'B', direction: 'left'}) &&\n\t \t\t LSYS.match({index, match: 'DE', direction: 'right'}) ? 'Z' : 'C')\n\t \t})\n\t \n\t \tYou can just write match({index, ...} instead of match({index: index, ..}) because of new ES6 Object initialization, see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#New_notations_in_ECMAScript_6\n\t \t*/\n\n\t\tthis.match = function ({ axiom_, match, ignoredSymbols, branchSymbols, index, direction }) {\n\t\t\tlet branchCount = 0;\n\t\t\tlet explicitBranchCount = 0;\n\t\t\taxiom_ = axiom || this.axiom;\n\t\t\tif (branchSymbols === undefined) branchSymbols = this.branchSymbols !== undefined ? this.branchSymbols : [];\n\t\t\tif (ignoredSymbols === undefined) ignoredSymbols = this.ignoredSymbols !== undefined ? this.ignoredSymbols : [];\n\t\t\tlet returnMatchIndices = [];\n\n\t\t\tlet branchStart, branchEnd, axiomIndex, loopIndexChange, matchIndex, matchIndexChange, matchIndexOverflow;\n\t\t\t// set some variables depending on the direction to match\n\t\t\tif (direction === 'right') {\n\t\t\t\tloopIndexChange = matchIndexChange = +1;\n\t\t\t\taxiomIndex = index + 1;\n\t\t\t\tmatchIndex = 0;\n\t\t\t\tmatchIndexOverflow = match.length;\n\t\t\t\tif (branchSymbols.length > 0) [branchStart, branchEnd] = branchSymbols;\n\t\t\t} else if (direction === 'left') {\n\t\t\t\tloopIndexChange = matchIndexChange = -1;\n\t\t\t\taxiomIndex = index - 1;\n\t\t\t\tmatchIndex = match.length - 1;\n\t\t\t\tmatchIndexOverflow = -1;\n\t\t\t\tif (branchSymbols.length > 0) [branchEnd, branchStart] = branchSymbols;\n\t\t\t} else {\n\t\t\t\tthrow Error(direction, 'is not a valid direction for matching.');\n\t\t\t}\n\n\t\t\tfor (; axiomIndex < axiom_.length && axiomIndex >= 0; axiomIndex += loopIndexChange) {\n\t\t\t\t// FIXME: what about objects with .symbol\n\n\t\t\t\tlet axiomSymbol = axiom_[axiomIndex];\n\t\t\t\t// For objects match for objects `symbol`\n\t\t\t\tif (typeof axiomSymbol === 'object') axiomSymbol = axiomSymbol.symbol;\n\t\t\t\tlet matchSymbol = match[matchIndex];\n\n\t\t\t\t// compare current symbol of axiom with current symbol of match\n\t\t\t\tif (axiomSymbol === matchSymbol) {\n\n\t\t\t\t\tif (branchCount === 0 || explicitBranchCount > 0) {\n\t\t\t\t\t\t// if its a match and previously NOT inside branch (branchCount===0) or in explicitly wanted branch (explicitBranchCount > 0)\n\n\t\t\t\t\t\t// if a bracket was explicitly stated in match axiom\n\t\t\t\t\t\tif (axiomSymbol === branchStart) {\n\t\t\t\t\t\t\texplicitBranchCount++;\n\t\t\t\t\t\t\tbranchCount++;\n\t\t\t\t\t\t\tmatchIndex += matchIndexChange;\n\t\t\t\t\t\t} else if (axiomSymbol === branchEnd) {\n\t\t\t\t\t\t\texplicitBranchCount = Math.max(0, explicitBranchCount - 1);\n\t\t\t\t\t\t\tbranchCount = Math.max(0, branchCount - 1);\n\t\t\t\t\t\t\t// only increase match if we are out of explicit branch\n\n\t\t\t\t\t\t\tif (explicitBranchCount === 0) {\n\n\t\t\t\t\t\t\t\tmatchIndex += matchIndexChange;\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\treturnMatchIndices.push(axiomIndex);\n\t\t\t\t\t\t\tmatchIndex += matchIndexChange;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\t// overflowing matchIndices (matchIndex + 1 for right match, matchIndexEnd for left match )?\n\t\t\t\t\t// -> no more matches to do. return with true, as everything matched until here\n\t\t\t\t\t// *yay*\n\t\t\t\t\tif (matchIndex === matchIndexOverflow) {\n\t\t\t\t\t\treturn { result: true, matchIndices: returnMatchIndices };\n\t\t\t\t\t}\n\t\t\t\t} else if (axiomSymbol === branchStart) {\n\t\t\t\t\tbranchCount++;\n\t\t\t\t\tif (explicitBranchCount > 0) explicitBranchCount++;\n\t\t\t\t} else if (axiomSymbol === branchEnd) {\n\t\t\t\t\tbranchCount = Math.max(0, branchCount - 1);\n\t\t\t\t\tif (explicitBranchCount > 0) explicitBranchCount = Math.max(0, explicitBranchCount - 1);\n\t\t\t\t} else if ((branchCount === 0 || explicitBranchCount > 0 && matchSymbol !== branchEnd) && ignoredSymbols.includes(axiomSymbol) === false) {\n\t\t\t\t\t// not in branchSymbols/branch? or if in explicit branch, and not at the very end of\n\t\t\t\t\t// condition (at the ]), and symbol not in ignoredSymbols ? then false\n\t\t\t\t\treturn { result: false, matchIndices: returnMatchIndices };\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\t// finally init stuff\n\t\tthis.parameters = {\n\t\t\tallowClassicSyntax: true\n\t\t};\n\n\t\tthis.setAxiom(axiom);\n\t\tthis.productions = new Map();\n\t\tif (productions) this.setProductions(productions);\n\t\tthis.branchSymbols = branchSymbols;\n\t\tthis.ignoredSymbols = ignoredSymbols;\n\t\tthis.classicParametricSyntax = classicParametricSyntax;\n\t\tif (finals) this.setFinals(finals);\n\n\t\tthis.iterationCount = 0;\n\t\treturn this;\n\t}\n\n\t// Try to export to be used via require in NodeJS.\n\tif (true) {\n\t\tmodule.exports = LSystem;\n\t\t// module.exports.matchRight = matchRight;\n\t\t// module.exports.matchLeft = matchLeft;\n\t}\n\n\n/***/ }\n/******/ ]);", __webpack_require__.p + "c9c64a142fe68b03e2ff.worker.js");
	};

/***/ },
/* 2 */
/***/ function(module, exports) {

	// http://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string

	var URL = window.URL || window.webkitURL;
	module.exports = function(content, url) {
		try {
			try {
				var blob;
				try { // BlobBuilder = Deprecated, but widely implemented
					var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
					blob = new BlobBuilder();
					blob.append(content);
					blob = blob.getBlob();
				} catch(e) { // The proposed API
					blob = new Blob([content]);
				}
				return new Worker(URL.createObjectURL(blob));
			} catch(e) {
				return new Worker('data:application/javascript,' + encodeURIComponent(content));
			}
		} catch(e) {
			return new Worker(url);
		}
	}

/***/ },
/* 3 */
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
				return this.axiom.reduce((prev, current) => {
					if (current.symbol === undefined) {
						console.log('found:', current);
						throw new Error('L-Systems that use only objects as symbols (eg: {symbol: \'F\', params: []}), cant use string symbols (eg. \'F\')! Check if you always return objects in your productions and no strings.');
					}
					return prev + current.symbol;
				}, '');
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
			this.clearProductions();

			// TODO: once Object.entries() (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries) is stable, use that in combo instead of awkward for…in.
			for (let condition in newProductions) {
				if (newProductions.hasOwnProperty(condition)) {
					this.setProduction(condition, newProductions[condition]);
				}
			}
		};

		this.clearProductions = function () {
			this.productions = new Map();
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

		// TODO: Scaffold classic parametric and context sensitive stuff out of main file
		// And simply require it here, eg:
		// this.testClassicParametricSyntax = require(classicSyntax.testParametric)??
		this.testClassicParametricSyntax = axiom => /\(.+\)/.test(axiom);

		// transforms things like 'A(1,2,5)B(2.5)' to
		// [ {symbol: 'A', params: [1,2,5]}, {symbol: 'B', params:[25]} ]
		// strips spaces
		this.transformClassicParametricAxiom = function (axiom) {

			// Replace whitespaces, then split between square brackets.
			let splitAxiom = axiom.replace(/\s+/g, '').split(/[\(\)]/);
			// console.log('parts:', splitAxiom)
			let newAxiom = [];
			// Construct new axiom by getting the params and symbol.
			for (let i = 0; i < splitAxiom.length - 1; i += 2) {
				let params = splitAxiom[i + 1].split(',').map(Number);
				newAxiom.push({ symbol: splitAxiom[i], params: params });
			}
			// console.log('parsed axiom:', newAxiom)
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

				let leftMatch = { result: true };
				let rightMatch = { result: true };

				// this can possibly be optimized (see: https://developers.google.com/speed/articles/optimizing-javascript#avoiding-pitfalls-with-closures)
				if (left !== null) {
					leftMatch = this.match({ direction: 'left', match: left[1], index: _index, branchSymbols: '[]', ignoredSymbols: '+-&' });
				}

				// don't match with right side if left already false or no right match necessary
				if (leftMatch.result === false || leftMatch.result === true && right === null) return leftMatch.result ? p[1] : _part;

				// see left!== null. could be optimized. Creating 3 variations of function
				// so left/right are not checked here, which improves speed, as left/right
				// are in a scope above.
				if (right !== null) {
					rightMatch = this.match({ direction: 'right', match: right[2], index: _index, branchSymbols: '[]', ignoredSymbols: '+-&' });
				}

				// Match! On a match return either the result of given production function
				// or simply return the symbol itself if its no function.
				if (leftMatch.result && rightMatch.result) {
					return typeof p[1] === 'function' ? p[1]({ index: _index, part: _part, currentAxiom: _axiom, params: _params, leftMatchIndices: leftMatch.matchIndices, rightMatchIndices: rightMatch.matchIndices }) : p[1];
				} else {
					return _part;
				}
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
									let _result = typeof _p === 'function' ? _p({ index, currentAxiom: newAxiom, part, params }) : _p;
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
			let returnMatchIndices = [];

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
				// For objects match for objects `symbol`
				if (typeof axiomSymbol === 'object') axiomSymbol = axiomSymbol.symbol;
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
							returnMatchIndices.push(axiomIndex);
							matchIndex += matchIndexChange;
						}
					}

					// overflowing matchIndices (matchIndex + 1 for right match, matchIndexEnd for left match )?
					// -> no more matches to do. return with true, as everything matched until here
					// *yay*
					if (matchIndex === matchIndexOverflow) {
						return { result: true, matchIndices: returnMatchIndices };
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
					return { result: false, matchIndices: returnMatchIndices };
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
		return this;
	}

	// Try to export to be used via require in NodeJS.
	if (true) {
		module.exports = LSystem;
		// module.exports.matchRight = matchRight;
		// module.exports.matchLeft = matchLeft;
	}


/***/ }
/******/ ]);
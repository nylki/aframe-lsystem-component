/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_lindenmayer__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_worker_loader_inline_fallback_false_worker_js__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_worker_loader_inline_fallback_false_worker_js___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_worker_loader_inline_fallback_false_worker_js__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__primitives_a_lsystem_js__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__primitives_a_lsystem_js___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__primitives_a_lsystem_js__);
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}



// As we use webpack for compiling the source, it's used to bundle the
// web worker into a blob via: https://github.com/webpack/worker-loader
// Which works without additional changes, besides using `require` inside
// the worker instead of importScripts().




/**
 * Lindenmayer-System component for A-Frame.
 */
 
 function parseFromTo(value) {
   let flatResult = value.split(/(\w)\s*:\s*/).filter(part => part.length !== 0);
   let result = [];
   for (var i = 0; i < flatResult.length; i+=2) {
     result.push([flatResult[i], flatResult[i+1]]);
   }
   return result;
 }
 
AFRAME.registerComponent('lsystem', {
  schema: {

    axiom: {
      type: 'string',
      default: 'F'
    },

    productions: {
      default: 'F:FF',
      // return an array of production tuples ([[from, to], ['F', 'F+F']])
      parse: (value) => parseFromTo(value).map(([from, to]) => [from, to.replace(/\s/g, '')])
    },

    // A: blue line, red line, yellow line B: red line
    segmentMixins: {
      type: 'string',
      parse: function (value) {
          
        let mixinsForSymbol = new Map();
        let result = parseFromTo(value);
        for (let [from, to] of result) {
          to = to.replace(/[\[\]]/g, '').split(',');
          mixinsForSymbol.set(from, to);
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
        if (value === 'x') {
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
    
    scaleFactor: {
      default: 1.0
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

    this.sceneEl = document.querySelector('a-scene');

    let self = this;

    this.initWorker();

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
    this.xPosRotation = new THREE.Quaternion();
    this.xNegRotation = new THREE.Quaternion();
    this.yPosRotation = new THREE.Quaternion();
    this.yNegRotation = new THREE.Quaternion();
    this.zPosRotation = new THREE.Quaternion();
    this.zNegRotation = new THREE.Quaternion();
    this.yReverseRotation = new THREE.Quaternion();
    this.segmentLengthFactor = 1.0;
    
    let scaleFactor = self.data.scaleFactor;
    
    this.colorIndex = 0;
    this.lineWidth = 0.0005;
    this.lineLength = 0.125;
    
    this.LSystem = new __WEBPACK_IMPORTED_MODULE_0_lindenmayer__["a" /* default */]({
      axiom: 'F',
      productions: {'F': 'F'},
      finals: {
        /* As a default F is already defined as final, new ones get added automatically
          by parsing the segment mixins. If no segment mixin for any symbol is defined
          it wont get a final function and therefore not render.
         */
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
          self.segmentLengthFactor *= scaleFactor;
          self.transformationSegment.scale.set(
          self.transformationSegment.scale.x *= scaleFactor, self.transformationSegment.scale.y *= scaleFactor, self.transformationSegment.scale.z *= scaleFactor
        );
          self.colorIndex++;
        },
        '\'': () => {
          self.segmentLengthFactor *= (1.0 / scaleFactor);
          self.transformationSegment.scale.set(
          self.transformationSegment.scale.x *= (1.0 / scaleFactor), self.transformationSegment.scale.y *= (1.0 / scaleFactor), self.transformationSegment.scale.z *= (1.0 / scaleFactor)
          );
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


    if(this.data.mergeGeometries === false && this.segmentElementGroupsMap !== undefined) {
      for (let segmentElGroup of this.segmentElementGroupsMap.values()) {
        segmentElGroup.removeObject3D('mesh');
        segmentElGroup.innerHTML = '';
      }
    }

    if(Object.keys(oldData).length === 0) {
      this.updateLSystem();
      this.updateSegmentMixins();
      this.updateTurtleGraphics();

    } else {

      let visualChange = false;

      if((oldData.axiom && oldData.axiom !== this.data.axiom) || (oldData.iterations && oldData.iterations !== this.data.iterations) || (oldData.productions && JSON.stringify(oldData.productions) !== JSON.stringify(this.data.productions))) {

        this.updateLSystem();
        visualChange = true;

      }

      if (oldData.segmentMixins !== undefined && JSON.stringify(Array.from(oldData.segmentMixins.entries())) !== JSON.stringify(Array.from(this.data.segmentMixins.entries())) ) {
        this.updateSegmentMixins();
        visualChange = true;


      }

     if(visualChange || oldData.angle && oldData.angle !== this.data.angle) {

      this.updateTurtleGraphics();

    } else {
      // console.log('nothing changed in update?');
      // this.updateLSystem();
      // this.updateSegmentMixins();
    }
  }

  },

  // if this.dynamicSegmentLength===true use this function to set the length
  // depending on segments geometries bbox
  calculateSegmentLength: function (mixin, geometry) {
    if(this.segmentLengthMap.has(mixin)) return this.segmentLengthMap.get(mixin);
    geometry.computeBoundingBox();
    let segmentLength;
    if (this.data.translateAxis.equals(this.X) ) {
      segmentLength = Math.abs(geometry.boundingBox.min.x - geometry.boundingBox.max.x);
    } else if (this.data.translateAxis.equals(this.Y)) {
      segmentLength = Math.abs(geometry.boundingBox.min.y - geometry.boundingBox.max.y);
    } else if (this.data.translateAxis.equals(this.Z)) {
      segmentLength = Math.abs(geometry.boundingBox.min.z - geometry.boundingBox.max.z);
    }
    this.segmentLengthMap.set(mixin, segmentLength);
    return segmentLength;

  },

  initWorker: function() {
    this.worker = new __WEBPACK_IMPORTED_MODULE_1_worker_loader_inline_fallback_false_worker_js___default.a();
  },

  pushSegment: function(symbol) {

    let self = this;
    let currentQuaternion = self.transformationSegment.quaternion.clone();
    let currentPosition = self.transformationSegment.position.clone();
    let currentScale = self.transformationSegment.scale.clone();

    // Cap colorIndex to maximum mixins defined for the symbol.
    let cappedColorIndex = Math.min(this.colorIndex, this.data.segmentMixins.get(symbol).length - 1);

    let mixin = this.mixinMap.get(symbol + cappedColorIndex);

    if(this.data.mergeGeometries === false) {
      let newSegment = document.createElement('a-entity');
      newSegment.setAttribute('mixin', mixin);

      newSegment.addEventListener('loaded', (e) => {
        // Offset child element of object3D, to rotate around end point
        // IMPORTANT: It may change that A-Frame puts objects into a group

        let segmentLength = self.segmentLengthMap.get(mixin);

        newSegment.object3D.children[0].translateOnAxis(self.data.translateAxis, (segmentLength * self.segmentLengthFactor) / 2);
        newSegment.object3D.quaternion.copy(currentQuaternion);
        newSegment.object3D.position.copy(currentPosition);
        newSegment.object3D.scale.copy(currentScale);
      },
      {once: true});
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
      axiom: this.data.axiom,
      productions: this.data.productions,
      iterations: this.data.iterations
    };

    if(Date.now() - this.worker.startTime > 1000 ) {
      // if we got user input, but worker is running for over a second
      // terminate old worker and start new one.
      this.worker.terminate();
      this.initWorker();
    }

    this.worker.startTime = Date.now();

    this.workerPromise = new Promise((resolve, reject) => {

      this.worker.onmessage = (e) => {
        self.LSystem.setAxiom(e.data.result);
        resolve();
      };
    });

    this.worker.postMessage(params);
    return this.workerPromise;
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
    // Then use the generated geometry etc.
    if(this.data.segmentMixins && this.data.segmentMixins.length !== 0) {

      // Go through every symbols segmentMixins as defined by user
      for (let el of this.data.segmentMixins) {
        let [symbol, mixinList] = el;
        // Set final functions for each symbol that has a mixin defined
        this.LSystem.setFinal(symbol, () => {self.pushSegment.bind(self, symbol)();});

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
              // TODO: hm, maybe try to use instanced geometry and offset on object?
              segmentElGroup.getObject3D('mesh').geometry.dispose();
              segmentObject.geometry = (segmentObject.geometry.clone());

              let segmentLength = self.calculateSegmentLength(mixin, segmentObject.geometry);

              // Do some additional stuff like buffering 3D objects / geometry
              // if we want to merge geometries.
              if(self.data.mergeGeometries === true) {

                // Offset geometry by half segmentLength to get the rotation point right.
                let translation = self.data.translateAxis.clone().multiplyScalar((segmentLength * self.segmentLengthFactor)/2);
                
                
                
                
                // IMPORTANT!!!
                // TODO: Try to use pivot object instead of translating geometry
                // this may help in reusing geometry and not needing to clone it (see above)?
                // see: https://github.com/mrdoob/three.js/issues/1364
                //and
                // see: http://stackoverflow.com/questions/28848863/threejs-how-to-rotate-around-objects-own-center-instead-of-world-center
                segmentObject.geometry.translate(translation.x, translation.y, translation.z);
                
                
                
                
                
                
                
                self.segmentObjects3DMap.set(symbol + mixinColorIndex, segmentObject );

              }

              segmentElGroup.removeObject3D('mesh');
              resolve();
            }, {once: true});


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
      // console.log(...this.mixinPromises);
    Promise.all([...this.mixinPromises, this.workerPromise]).then(() => {
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


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Get a list of productions that have identical initiators,
// Output a single stochastic production. Probability per production
// is defined by amount of input productions (4 => 25% each, 2 => 50% etc.)


// These transformers get a classic ABOP snytax as input and return a standardized
// production object in the form of ['F',
// {
//  successor:String/Iterable
//  [alternatively]stochasticSuccessors: Iterable of standardized objects with mandatory weight fields,
//  leftCtx: iterable/string,
//  rightCtx: Iterable/String,
//  condition: Function }]

function transformClassicStochasticProductions(productions) {

  return function transformedProduction() {
    var resultList = productions; // the parser for productions shall create this list
    var count = resultList.length;

    var r = Math.random();
    for (var i = 0; i < count; i++) {
      var range = (i + 1) / count;
      if (r <= range) return resultList[i];
    }

    console.error('Should have returned a result of the list, something is wrong here with the random numbers?.');
  };
};

// TODO: Scaffold classic parametric and context sensitive stuff out of main file
// And simply require it here, eg:
// this.testClassicParametricSyntax = require(classicSyntax.testParametric)??
function testClassicParametricSyntax(axiom) {
  return (/\(.+\)/.test(axiom)
  );
};

// transforms things like 'A(1,2,5)B(2.5)' to
// [ {symbol: 'A', params: [1,2,5]}, {symbol: 'B', params:[25]} ]
// strips spaces
function transformClassicParametricAxiom(axiom) {

  // Replace whitespaces, then split between square brackets.
  var splitAxiom = axiom.replace(/\s+/g, '').split(/[\(\)]/);
  // console.log('parts:', splitAxiom)
  var newAxiom = [];
  // Construct new axiom by getting the params and symbol.
  for (var i = 0; i < splitAxiom.length - 1; i += 2) {
    var params = splitAxiom[i + 1].split(',').map(Number);
    newAxiom.push({ symbol: splitAxiom[i], params: params });
  }
  // console.log('parsed axiom:', newAxiom)
};

function transformClassicCSProduction(p) {

  // before continuing, check if classic syntax actually there
  // example: p = ['A<B>C', 'Z']

  // left should be ['A', 'B']
  var left = p[0].match(/(.+)<(.)/);

  // right should be ['B', 'C']
  var right = p[0].match(/(.)>(.+)/);

  // Not a CS-Production (no '<' or '>'),
  //return original production.
  if (left === null && right === null) {
    return p;
  }

  var predecessor = void 0;
  // create new production object _or_ use the one set by the user
  var productionObject = p[1].successor || p[1].successors ? p[1] : { successor: p[1] };
  if (left !== null) {
    predecessor = left[2];
    productionObject.leftCtx = left[1];
  }
  if (right !== null) {
    predecessor = right[1];
    productionObject.rightCtx = right[2];
  }

  return [predecessor, productionObject];
};

function stringToObjects(string) {
  if (typeof string !== 'string' && string instanceof String === false) return string;
  var transformed = [];
  for (var _iterator = string, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var symbol = _ref;
    transformed.push({ symbol });
  }return transformed;
}

// transform p to {successor: p}
// if applicable also transform strings into array of {symbol: String} objects
// TODO: make more modular! dont have forceObjects in here
function normalizeProductionRightSide(p, forceObjects) {

  if (p.hasOwnProperty('successors')) {
    for (var i = 0; i < p.successors.length; i++) {
      p.successors[i] = normalizeProductionRightSide(p.successors[i], forceObjects);
    }
  } else if (p.hasOwnProperty('successor') === false) {
    p = { successor: p };
  }

  if (forceObjects && p.hasOwnProperty('successor')) {
    p.successor = stringToObjects(p.successor);
  }

  return p;
}

function normalizeProduction(p, forceObjects) {

  p[1] = normalizeProductionRightSide(p[1], forceObjects);
  return p;
}

function LSystem(_ref) {
	var _ref$axiom = _ref.axiom,
	    axiom = _ref$axiom === undefined ? '' : _ref$axiom,
	    productions = _ref.productions,
	    finals = _ref.finals,
	    _ref$branchSymbols = _ref.branchSymbols,
	    branchSymbols = _ref$branchSymbols === undefined ? '' : _ref$branchSymbols,
	    _ref$ignoredSymbols = _ref.ignoredSymbols,
	    ignoredSymbols = _ref$ignoredSymbols === undefined ? '' : _ref$ignoredSymbols,
	    _ref$allowClassicSynt = _ref.allowClassicSyntax,
	    allowClassicSyntax = _ref$allowClassicSynt === undefined ? true : _ref$allowClassicSynt,
	    _ref$classicParametri = _ref.classicParametricSyntax,
	    classicParametricSyntax = _ref$classicParametri === undefined ? false : _ref$classicParametri,
	    _ref$forceObjects = _ref.forceObjects,
	    forceObjects = _ref$forceObjects === undefined ? false : _ref$forceObjects,
	    _ref$debug = _ref.debug,
	    debug = _ref$debug === undefined ? false : _ref$debug;


	// TODO: forceObject to be more intelligent based on other productions??

	this.setAxiom = function (axiom) {
		this.axiom = this.forceObjects ? stringToObjects(axiom) : axiom;
	};

	this.getRaw = function () {
		return this.axiom;
	};

	// if using objects in axioms, as used in parametric L-Systems
	this.getString = function () {
		var onlySymbols = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

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

	this.getStringResult = this.getString;

	this.setProduction = function (from, to) {
		var allowAppendingMultiSuccessors = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

		var newProduction = [from, to];
		if (newProduction === undefined) throw new Error('no production specified.');

		if (to.successor && to.successors) {
			throw new Error('You can not have both a "successor" and a "successors" field in your production!');
		}

		// Apply production transformers and normalizations
		if (this.allowClassicSyntax === true) {
			newProduction = transformClassicCSProduction(newProduction, this.ignoredSymbols);
		}

		newProduction = normalizeProduction(newProduction, this.forceObjects);

		// check wether production is stochastic
		newProduction[1].isStochastic = newProduction[1].successors !== undefined && newProduction[1].successors.every(successor => successor.weight !== undefined);

		if (newProduction[1].isStochastic) {
			// calculate weight sum
			newProduction[1].weightSum = 0;
			for (var _iterator = newProduction[1].successors, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
				var _ref2;

				if (_isArray) {
					if (_i >= _iterator.length) break;
					_ref2 = _iterator[_i++];
				} else {
					_i = _iterator.next();
					if (_i.done) break;
					_ref2 = _i.value;
				}

				var s = _ref2;

				newProduction[1].weightSum += s.weight;
			}
		}

		var symbol = newProduction[0];
		if (allowAppendingMultiSuccessors === true && this.productions.has(symbol)) {

			var existingProduction = this.productions.get(symbol);
			var singleSuccessor = existingProduction.successor;
			var multiSuccessors = existingProduction.successors;

			if (singleSuccessor && !multiSuccessors) {
				// replace existing prod with new obj and add previous successor as first elem
				// to new successors field.
				existingProduction = { successors: [existingProduction] };
			}
			existingProduction.successors.push(newProduction[1]);
			this.productions.set(symbol, existingProduction);
		} else {
			this.productions.set(symbol, newProduction[1]);
		}
	};

	// set multiple productions from name:value Object
	// TODO: ALLOW TUPLE/ARRAY
	this.setProductions = function (newProductions) {
		if (newProductions === undefined) throw new Error('no production specified.');
		this.clearProductions();

		for (var _iterator2 = Object.entries(newProductions), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
			var _ref4;

			if (_isArray2) {
				if (_i2 >= _iterator2.length) break;
				_ref4 = _iterator2[_i2++];
			} else {
				_i2 = _iterator2.next();
				if (_i2.done) break;
				_ref4 = _i2.value;
			}

			var _ref3 = _ref4;
			var from = _ref3[0];
			var to = _ref3[1];

			this.setProduction(from, to, true);
		}
	};

	this.clearProductions = function () {
		this.productions = new Map();
	};

	this.setFinal = function (symbol, final) {
		var newFinal = [symbol, final];
		if (newFinal === undefined) {
			throw new Error('no final specified.');
		}
		this.finals.set(newFinal[0], newFinal[1]);
	};

	// set multiple finals from name:value Object
	this.setFinals = function (newFinals) {
		if (newFinals === undefined) throw new Error('no finals specified.');
		this.finals = new Map();
		for (var symbol in newFinals) {
			if (newFinals.hasOwnProperty(symbol)) {
				this.setFinal(symbol, newFinals[symbol]);
			}
		}
	};

	//var hasWeight = el => el.weight !== undefined;
	this.getProductionResult = function (p, index, part, params) {
		var recursive = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;


		var contextSensitive = p.leftCtx !== undefined || p.rightCtx !== undefined;
		var conditional = p.condition !== undefined;
		var stochastic = false;
		var result = false;
		var precheck = true;

		// Check if condition is true, only then continue to check left and right contexts
		if (conditional && p.condition({ index, currentAxiom: this.axiom, part, params }) === false) {
			precheck = false;
		} else if (contextSensitive) {
			if (p.leftCtx !== undefined && p.rightCtx !== undefined) {
				precheck = this.match({ direction: 'left', match: p.leftCtx, index: index, branchSymbols: '[]' }).result && this.match({ direction: 'right', match: p.rightCtx, index: index, branchSymbols: '[]', ignoredSymbols: ignoredSymbols }).result;
			} else if (p.leftCtx !== undefined) {
				precheck = this.match({ direction: 'left', match: p.leftCtx, index: index, branchSymbols: '[]' }).result;
			} else if (p.rightCtx !== undefined) {
				precheck = this.match({ direction: 'right', match: p.rightCtx, index: index, branchSymbols: '[]' }).result;
			}
		}

		// If conditions and context don't allow product, keep result = false
		if (precheck === false) {
			result = false;
		}

		// If p has multiple successors
		else if (p.successors) {
				// This could be stochastic successors or multiple functions
				// Tread every element in the list as an individual production object
				// For stochastic productions (if all prods in the list have a 'weight' property)
				// Get a random number then pick a production from the list according to their weight

				var currentWeight, threshWeight;
				if (p.isStochastic) {
					threshWeight = Math.random() * p.weightSum;
					currentWeight = 0;
				}
				/*
    go through the list and use
    the first valid production in that list. (that returns true)
    This assumes, it's a list of functions.
    No recursion here: no successors inside successors.
    */
				for (var _iterator3 = p.successors, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
					var _ref5;

					if (_isArray3) {
						if (_i3 >= _iterator3.length) break;
						_ref5 = _iterator3[_i3++];
					} else {
						_i3 = _iterator3.next();
						if (_i3.done) break;
						_ref5 = _i3.value;
					}

					var _p = _ref5;

					if (p.isStochastic) {
						currentWeight += _p.weight;
						if (currentWeight < threshWeight) continue;
					}
					// If currentWeight >= thresWeight, a production is choosen stochastically
					// and evaluated recursively because it , kax also have rightCtx, leftCtx and condition to further inhibit production. This is not standard L-System behaviour though!

					// last true is for recursiv call
					// TODO: refactor getProductionResult to use an object
					var _result = this.getProductionResult(_p, index, part, params, true);
					// console.log(part, p.successors);
					// console.log(result);
					// console.log("\n");
					if (_result !== undefined && _result !== false) {
						result = _result;
						break;
					}
				}
			}
			// if successor is a function, execute function and append return value
			else if (typeof p.successor === 'function') {

					result = p.successor({ index, currentAxiom: this.axiom, part, params });
				} else {
					result = p.successor;
				}

		if (!result) {
			// Allow undefined or false results for recursive calls of this func
			return recursive ? result : part;
		}
		return result;
	};

	this.applyProductions = function () {
		// a axiom can be a string or an array of objects that contain the key/value 'symbol'
		var newAxiom = typeof this.axiom === 'string' ? '' : [];
		var index = 0;

		// iterate all symbols/characters of the axiom and lookup according productions
		for (var _iterator4 = this.axiom, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
			var _ref6;

			if (_isArray4) {
				if (_i4 >= _iterator4.length) break;
				_ref6 = _iterator4[_i4++];
			} else {
				_i4 = _iterator4.next();
				if (_i4.done) break;
				_ref6 = _i4.value;
			}

			var part = _ref6;


			// Stuff for classic parametric L-Systems: get actual symbol and possible parameters
			// params will be given the production function, if applicable.

			var symbol = part.symbol || part;
			var params = part.params || [];

			var result = part;
			if (this.productions.has(symbol)) {
				var p = this.productions.get(symbol);
				result = this.getProductionResult(p, index, part, params);
			}

			// Got result. Now add result to new axiom.
			if (typeof newAxiom === 'string') {
				newAxiom += result;
			} else if (result instanceof Array) {
				// If result is an array, merge result into new axiom instead of pushing.
				Array.prototype.push.apply(newAxiom, result);
			} else {
				newAxiom.push(result);
			}
			index++;
		}

		// finally set new axiom and also return it for convenience.
		this.axiom = newAxiom;
		return newAxiom;
	};

	this.iterate = function () {
		var n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

		this.iterations = n;
		var lastIteration = void 0;
		for (var iteration = 0; iteration < n; iteration++) {
			lastIteration = this.applyProductions();
		}
		return lastIteration;
	};

	this.final = function (externalArg) {
		var index = 0;
		for (var _iterator5 = this.axiom, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
			var _ref7;

			if (_isArray5) {
				if (_i5 >= _iterator5.length) break;
				_ref7 = _iterator5[_i5++];
			} else {
				_i5 = _iterator5.next();
				if (_i5.done) break;
				_ref7 = _i5.value;
			}

			var part = _ref7;


			// if we have objects for each symbol, (when using parametric L-Systems)
			// get actual identifiable symbol character
			var symbol = part;
			if (typeof part === 'object' && part.symbol) symbol = part.symbol;

			if (this.finals.has(symbol)) {
				var finalFunction = this.finals.get(symbol);
				var typeOfFinalFunction = typeof finalFunction;
				if (typeOfFinalFunction !== 'function') {
					throw Error('\'' + symbol + '\'' + ' has an object for a final function. But it is __not a function__ but a ' + typeOfFinalFunction + '!');
				}
				// execute symbols function
				// supply in first argument an details object with current index and part
				// and in the first argument inject the external argument (like a render target)
				finalFunction({ index, part }, externalArg);
			} else {
				// symbol has no final function
			}
			index++;
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

	this.match = function (_ref8) {
		var axiom_ = _ref8.axiom_,
		    match = _ref8.match,
		    ignoredSymbols = _ref8.ignoredSymbols,
		    branchSymbols = _ref8.branchSymbols,
		    index = _ref8.index,
		    direction = _ref8.direction;


		var branchCount = 0;
		var explicitBranchCount = 0;
		axiom_ = axiom_ || this.axiom;
		if (branchSymbols === undefined) branchSymbols = this.branchSymbols !== undefined ? this.branchSymbols : [];
		if (ignoredSymbols === undefined) ignoredSymbols = this.ignoredSymbols !== undefined ? this.ignoredSymbols : [];
		var returnMatchIndices = [];

		var branchStart = void 0,
		    branchEnd = void 0,
		    axiomIndex = void 0,
		    loopIndexChange = void 0,
		    matchIndex = void 0,
		    matchIndexChange = void 0,
		    matchIndexOverflow = void 0;
		// set some variables depending on the direction to match

		if (direction === 'right') {
			loopIndexChange = matchIndexChange = +1;
			axiomIndex = index + 1;
			matchIndex = 0;
			matchIndexOverflow = match.length;
			if (branchSymbols.length > 0) {
				;
				var _branchSymbols = branchSymbols;
				branchStart = _branchSymbols[0];
				branchEnd = _branchSymbols[1];
			}
		} else if (direction === 'left') {
			loopIndexChange = matchIndexChange = -1;
			axiomIndex = index - 1;
			matchIndex = match.length - 1;
			matchIndexOverflow = -1;
			if (branchSymbols.length > 0) {
				;
				var _branchSymbols2 = branchSymbols;
				branchEnd = _branchSymbols2[0];
				branchStart = _branchSymbols2[1];
			}
		} else {
			throw Error(direction, 'is not a valid direction for matching.');
		}

		for (; axiomIndex < axiom_.length && axiomIndex >= 0; axiomIndex += loopIndexChange) {

			var axiomSymbol = axiom_[axiomIndex].symbol || axiom_[axiomIndex];
			var matchSymbol = match[matchIndex];

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

		return { result: false, matchIndices: returnMatchIndices };
	};

	this.ignoredSymbols = ignoredSymbols;
	this.debug = debug;
	this.branchSymbols = branchSymbols;
	this.allowClassicSyntax = allowClassicSyntax;
	this.classicParametricSyntax = classicParametricSyntax;
	this.forceObjects = forceObjects;

	this.setAxiom(axiom);

	this.clearProductions();
	if (productions) this.setProductions(productions);
	if (finals) this.setFinals(finals);

	return this;
}

// Set classic syntax helpers to library scope to be used outside of library context
// for users eg.
LSystem.transformClassicStochasticProductions = transformClassicStochasticProductions;
LSystem.transformClassicCSProduction = transformClassicCSProduction;
LSystem.transformClassicParametricAxiom = transformClassicParametricAxiom;
LSystem.testClassicParametricSyntax = testClassicParametricSyntax;

/* harmony default export */ __webpack_exports__["a"] = (LSystem);

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = function() {
	return __webpack_require__(3)("/******/ (function(modules) { // webpackBootstrap\n/******/ \t// The module cache\n/******/ \tvar installedModules = {};\n/******/\n/******/ \t// The require function\n/******/ \tfunction __webpack_require__(moduleId) {\n/******/\n/******/ \t\t// Check if module is in cache\n/******/ \t\tif(installedModules[moduleId]) {\n/******/ \t\t\treturn installedModules[moduleId].exports;\n/******/ \t\t}\n/******/ \t\t// Create a new module (and put it into the cache)\n/******/ \t\tvar module = installedModules[moduleId] = {\n/******/ \t\t\ti: moduleId,\n/******/ \t\t\tl: false,\n/******/ \t\t\texports: {}\n/******/ \t\t};\n/******/\n/******/ \t\t// Execute the module function\n/******/ \t\tmodules[moduleId].call(module.exports, module, module.exports, __webpack_require__);\n/******/\n/******/ \t\t// Flag the module as loaded\n/******/ \t\tmodule.l = true;\n/******/\n/******/ \t\t// Return the exports of the module\n/******/ \t\treturn module.exports;\n/******/ \t}\n/******/\n/******/\n/******/ \t// expose the modules object (__webpack_modules__)\n/******/ \t__webpack_require__.m = modules;\n/******/\n/******/ \t// expose the module cache\n/******/ \t__webpack_require__.c = installedModules;\n/******/\n/******/ \t// define getter function for harmony exports\n/******/ \t__webpack_require__.d = function(exports, name, getter) {\n/******/ \t\tif(!__webpack_require__.o(exports, name)) {\n/******/ \t\t\tObject.defineProperty(exports, name, {\n/******/ \t\t\t\tconfigurable: false,\n/******/ \t\t\t\tenumerable: true,\n/******/ \t\t\t\tget: getter\n/******/ \t\t\t});\n/******/ \t\t}\n/******/ \t};\n/******/\n/******/ \t// getDefaultExport function for compatibility with non-harmony modules\n/******/ \t__webpack_require__.n = function(module) {\n/******/ \t\tvar getter = module && module.__esModule ?\n/******/ \t\t\tfunction getDefault() { return module['default']; } :\n/******/ \t\t\tfunction getModuleExports() { return module; };\n/******/ \t\t__webpack_require__.d(getter, 'a', getter);\n/******/ \t\treturn getter;\n/******/ \t};\n/******/\n/******/ \t// Object.prototype.hasOwnProperty.call\n/******/ \t__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };\n/******/\n/******/ \t// __webpack_public_path__\n/******/ \t__webpack_require__.p = \"\";\n/******/\n/******/ \t// Load entry module and return exports\n/******/ \treturn __webpack_require__(__webpack_require__.s = 0);\n/******/ })\n/************************************************************************/\n/******/ ([\n/* 0 */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\nObject.defineProperty(__webpack_exports__, \"__esModule\", { value: true });\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_lindenmayer__ = __webpack_require__(1);\n// Require instead of importScripts because we use webpack\n// with worker-loader for compiling source: https://github.com/webpack/worker-loader\n\nlet lsystem = new __WEBPACK_IMPORTED_MODULE_0_lindenmayer__[\"a\" /* default */]({});\nlet timeout = {};\n\nonmessage = function(e) {\n  // wait a few ms to start thread, to be able to cancel old tasks\n  clearTimeout(timeout);\n  timeout = setTimeout(function() {\n    \n      lsystem.setAxiom(e.data.axiom);\n      \n      lsystem.clearProductions();\n      for (let p of e.data.productions) {\n        lsystem.setProduction(p[0], p[1]);\n      }\n      lsystem.iterate(e.data.iterations);\n      \n      postMessage({\n        result: lsystem.getString(),\n        initial: e.data\n      });\n      \n  }, 20);\n\n};\n\n\n/***/ }),\n/* 1 */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n// Get a list of productions that have identical initiators,\n// Output a single stochastic production. Probability per production\n// is defined by amount of input productions (4 => 25% each, 2 => 50% etc.)\n\n\n// These transformers get a classic ABOP snytax as input and return a standardized\n// production object in the form of ['F',\n// {\n//  successor:String/Iterable\n//  [alternatively]stochasticSuccessors: Iterable of standardized objects with mandatory weight fields,\n//  leftCtx: iterable/string,\n//  rightCtx: Iterable/String,\n//  condition: Function }]\n\nfunction transformClassicStochasticProductions(productions) {\n\n  return function transformedProduction() {\n    var resultList = productions; // the parser for productions shall create this list\n    var count = resultList.length;\n\n    var r = Math.random();\n    for (var i = 0; i < count; i++) {\n      var range = (i + 1) / count;\n      if (r <= range) return resultList[i];\n    }\n\n    console.error('Should have returned a result of the list, something is wrong here with the random numbers?.');\n  };\n};\n\n// TODO: Scaffold classic parametric and context sensitive stuff out of main file\n// And simply require it here, eg:\n// this.testClassicParametricSyntax = require(classicSyntax.testParametric)??\nfunction testClassicParametricSyntax(axiom) {\n  return (/\\(.+\\)/.test(axiom)\n  );\n};\n\n// transforms things like 'A(1,2,5)B(2.5)' to\n// [ {symbol: 'A', params: [1,2,5]}, {symbol: 'B', params:[25]} ]\n// strips spaces\nfunction transformClassicParametricAxiom(axiom) {\n\n  // Replace whitespaces, then split between square brackets.\n  var splitAxiom = axiom.replace(/\\s+/g, '').split(/[\\(\\)]/);\n  // console.log('parts:', splitAxiom)\n  var newAxiom = [];\n  // Construct new axiom by getting the params and symbol.\n  for (var i = 0; i < splitAxiom.length - 1; i += 2) {\n    var params = splitAxiom[i + 1].split(',').map(Number);\n    newAxiom.push({ symbol: splitAxiom[i], params: params });\n  }\n  // console.log('parsed axiom:', newAxiom)\n};\n\nfunction transformClassicCSProduction(p) {\n\n  // before continuing, check if classic syntax actually there\n  // example: p = ['A<B>C', 'Z']\n\n  // left should be ['A', 'B']\n  var left = p[0].match(/(.+)<(.)/);\n\n  // right should be ['B', 'C']\n  var right = p[0].match(/(.)>(.+)/);\n\n  // Not a CS-Production (no '<' or '>'),\n  //return original production.\n  if (left === null && right === null) {\n    return p;\n  }\n\n  var predecessor = void 0;\n  // create new production object _or_ use the one set by the user\n  var productionObject = p[1].successor || p[1].successors ? p[1] : { successor: p[1] };\n  if (left !== null) {\n    predecessor = left[2];\n    productionObject.leftCtx = left[1];\n  }\n  if (right !== null) {\n    predecessor = right[1];\n    productionObject.rightCtx = right[2];\n  }\n\n  return [predecessor, productionObject];\n};\n\nfunction stringToObjects(string) {\n  if (typeof string !== 'string' && string instanceof String === false) return string;\n  var transformed = [];\n  for (var _iterator = string, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {\n    var _ref;\n\n    if (_isArray) {\n      if (_i >= _iterator.length) break;\n      _ref = _iterator[_i++];\n    } else {\n      _i = _iterator.next();\n      if (_i.done) break;\n      _ref = _i.value;\n    }\n\n    var symbol = _ref;\n    transformed.push({ symbol });\n  }return transformed;\n}\n\n// transform p to {successor: p}\n// if applicable also transform strings into array of {symbol: String} objects\n// TODO: make more modular! dont have forceObjects in here\nfunction normalizeProductionRightSide(p, forceObjects) {\n\n  if (p.hasOwnProperty('successors')) {\n    for (var i = 0; i < p.successors.length; i++) {\n      p.successors[i] = normalizeProductionRightSide(p.successors[i], forceObjects);\n    }\n  } else if (p.hasOwnProperty('successor') === false) {\n    p = { successor: p };\n  }\n\n  if (forceObjects && p.hasOwnProperty('successor')) {\n    p.successor = stringToObjects(p.successor);\n  }\n\n  return p;\n}\n\nfunction normalizeProduction(p, forceObjects) {\n\n  p[1] = normalizeProductionRightSide(p[1], forceObjects);\n  return p;\n}\n\nfunction LSystem(_ref) {\n\tvar _ref$axiom = _ref.axiom,\n\t    axiom = _ref$axiom === undefined ? '' : _ref$axiom,\n\t    productions = _ref.productions,\n\t    finals = _ref.finals,\n\t    _ref$branchSymbols = _ref.branchSymbols,\n\t    branchSymbols = _ref$branchSymbols === undefined ? '' : _ref$branchSymbols,\n\t    _ref$ignoredSymbols = _ref.ignoredSymbols,\n\t    ignoredSymbols = _ref$ignoredSymbols === undefined ? '' : _ref$ignoredSymbols,\n\t    _ref$allowClassicSynt = _ref.allowClassicSyntax,\n\t    allowClassicSyntax = _ref$allowClassicSynt === undefined ? true : _ref$allowClassicSynt,\n\t    _ref$classicParametri = _ref.classicParametricSyntax,\n\t    classicParametricSyntax = _ref$classicParametri === undefined ? false : _ref$classicParametri,\n\t    _ref$forceObjects = _ref.forceObjects,\n\t    forceObjects = _ref$forceObjects === undefined ? false : _ref$forceObjects,\n\t    _ref$debug = _ref.debug,\n\t    debug = _ref$debug === undefined ? false : _ref$debug;\n\n\n\t// TODO: forceObject to be more intelligent based on other productions??\n\n\tthis.setAxiom = function (axiom) {\n\t\tthis.axiom = this.forceObjects ? stringToObjects(axiom) : axiom;\n\t};\n\n\tthis.getRaw = function () {\n\t\treturn this.axiom;\n\t};\n\n\t// if using objects in axioms, as used in parametric L-Systems\n\tthis.getString = function () {\n\t\tvar onlySymbols = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;\n\n\t\tif (typeof this.axiom === 'string') return this.axiom;\n\t\tif (onlySymbols === true) {\n\t\t\treturn this.axiom.reduce((prev, current) => {\n\t\t\t\tif (current.symbol === undefined) {\n\t\t\t\t\tconsole.log('found:', current);\n\t\t\t\t\tthrow new Error('L-Systems that use only objects as symbols (eg: {symbol: \\'F\\', params: []}), cant use string symbols (eg. \\'F\\')! Check if you always return objects in your productions and no strings.');\n\t\t\t\t}\n\t\t\t\treturn prev + current.symbol;\n\t\t\t}, '');\n\t\t} else {\n\t\t\treturn JSON.stringify(this.axiom);\n\t\t}\n\t};\n\n\tthis.getStringResult = this.getString;\n\n\tthis.setProduction = function (from, to) {\n\t\tvar allowAppendingMultiSuccessors = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;\n\n\t\tvar newProduction = [from, to];\n\t\tif (newProduction === undefined) throw new Error('no production specified.');\n\n\t\tif (to.successor && to.successors) {\n\t\t\tthrow new Error('You can not have both a \"successor\" and a \"successors\" field in your production!');\n\t\t}\n\n\t\t// Apply production transformers and normalizations\n\t\tif (this.allowClassicSyntax === true) {\n\t\t\tnewProduction = transformClassicCSProduction(newProduction, this.ignoredSymbols);\n\t\t}\n\n\t\tnewProduction = normalizeProduction(newProduction, this.forceObjects);\n\n\t\t// check wether production is stochastic\n\t\tnewProduction[1].isStochastic = newProduction[1].successors !== undefined && newProduction[1].successors.every(successor => successor.weight !== undefined);\n\n\t\tif (newProduction[1].isStochastic) {\n\t\t\t// calculate weight sum\n\t\t\tnewProduction[1].weightSum = 0;\n\t\t\tfor (var _iterator = newProduction[1].successors, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {\n\t\t\t\tvar _ref2;\n\n\t\t\t\tif (_isArray) {\n\t\t\t\t\tif (_i >= _iterator.length) break;\n\t\t\t\t\t_ref2 = _iterator[_i++];\n\t\t\t\t} else {\n\t\t\t\t\t_i = _iterator.next();\n\t\t\t\t\tif (_i.done) break;\n\t\t\t\t\t_ref2 = _i.value;\n\t\t\t\t}\n\n\t\t\t\tvar s = _ref2;\n\n\t\t\t\tnewProduction[1].weightSum += s.weight;\n\t\t\t}\n\t\t}\n\n\t\tvar symbol = newProduction[0];\n\t\tif (allowAppendingMultiSuccessors === true && this.productions.has(symbol)) {\n\n\t\t\tvar existingProduction = this.productions.get(symbol);\n\t\t\tvar singleSuccessor = existingProduction.successor;\n\t\t\tvar multiSuccessors = existingProduction.successors;\n\n\t\t\tif (singleSuccessor && !multiSuccessors) {\n\t\t\t\t// replace existing prod with new obj and add previous successor as first elem\n\t\t\t\t// to new successors field.\n\t\t\t\texistingProduction = { successors: [existingProduction] };\n\t\t\t}\n\t\t\texistingProduction.successors.push(newProduction[1]);\n\t\t\tthis.productions.set(symbol, existingProduction);\n\t\t} else {\n\t\t\tthis.productions.set(symbol, newProduction[1]);\n\t\t}\n\t};\n\n\t// set multiple productions from name:value Object\n\t// TODO: ALLOW TUPLE/ARRAY\n\tthis.setProductions = function (newProductions) {\n\t\tif (newProductions === undefined) throw new Error('no production specified.');\n\t\tthis.clearProductions();\n\n\t\tfor (var _iterator2 = Object.entries(newProductions), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {\n\t\t\tvar _ref4;\n\n\t\t\tif (_isArray2) {\n\t\t\t\tif (_i2 >= _iterator2.length) break;\n\t\t\t\t_ref4 = _iterator2[_i2++];\n\t\t\t} else {\n\t\t\t\t_i2 = _iterator2.next();\n\t\t\t\tif (_i2.done) break;\n\t\t\t\t_ref4 = _i2.value;\n\t\t\t}\n\n\t\t\tvar _ref3 = _ref4;\n\t\t\tvar from = _ref3[0];\n\t\t\tvar to = _ref3[1];\n\n\t\t\tthis.setProduction(from, to, true);\n\t\t}\n\t};\n\n\tthis.clearProductions = function () {\n\t\tthis.productions = new Map();\n\t};\n\n\tthis.setFinal = function (symbol, final) {\n\t\tvar newFinal = [symbol, final];\n\t\tif (newFinal === undefined) {\n\t\t\tthrow new Error('no final specified.');\n\t\t}\n\t\tthis.finals.set(newFinal[0], newFinal[1]);\n\t};\n\n\t// set multiple finals from name:value Object\n\tthis.setFinals = function (newFinals) {\n\t\tif (newFinals === undefined) throw new Error('no finals specified.');\n\t\tthis.finals = new Map();\n\t\tfor (var symbol in newFinals) {\n\t\t\tif (newFinals.hasOwnProperty(symbol)) {\n\t\t\t\tthis.setFinal(symbol, newFinals[symbol]);\n\t\t\t}\n\t\t}\n\t};\n\n\t//var hasWeight = el => el.weight !== undefined;\n\tthis.getProductionResult = function (p, index, part, params) {\n\t\tvar recursive = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;\n\n\n\t\tvar contextSensitive = p.leftCtx !== undefined || p.rightCtx !== undefined;\n\t\tvar conditional = p.condition !== undefined;\n\t\tvar stochastic = false;\n\t\tvar result = false;\n\t\tvar precheck = true;\n\n\t\t// Check if condition is true, only then continue to check left and right contexts\n\t\tif (conditional && p.condition({ index, currentAxiom: this.axiom, part, params }) === false) {\n\t\t\tprecheck = false;\n\t\t} else if (contextSensitive) {\n\t\t\tif (p.leftCtx !== undefined && p.rightCtx !== undefined) {\n\t\t\t\tprecheck = this.match({ direction: 'left', match: p.leftCtx, index: index, branchSymbols: '[]' }).result && this.match({ direction: 'right', match: p.rightCtx, index: index, branchSymbols: '[]', ignoredSymbols: ignoredSymbols }).result;\n\t\t\t} else if (p.leftCtx !== undefined) {\n\t\t\t\tprecheck = this.match({ direction: 'left', match: p.leftCtx, index: index, branchSymbols: '[]' }).result;\n\t\t\t} else if (p.rightCtx !== undefined) {\n\t\t\t\tprecheck = this.match({ direction: 'right', match: p.rightCtx, index: index, branchSymbols: '[]' }).result;\n\t\t\t}\n\t\t}\n\n\t\t// If conditions and context don't allow product, keep result = false\n\t\tif (precheck === false) {\n\t\t\tresult = false;\n\t\t}\n\n\t\t// If p has multiple successors\n\t\telse if (p.successors) {\n\t\t\t\t// This could be stochastic successors or multiple functions\n\t\t\t\t// Tread every element in the list as an individual production object\n\t\t\t\t// For stochastic productions (if all prods in the list have a 'weight' property)\n\t\t\t\t// Get a random number then pick a production from the list according to their weight\n\n\t\t\t\tvar currentWeight, threshWeight;\n\t\t\t\tif (p.isStochastic) {\n\t\t\t\t\tthreshWeight = Math.random() * p.weightSum;\n\t\t\t\t\tcurrentWeight = 0;\n\t\t\t\t}\n\t\t\t\t/*\n    go through the list and use\n    the first valid production in that list. (that returns true)\n    This assumes, it's a list of functions.\n    No recursion here: no successors inside successors.\n    */\n\t\t\t\tfor (var _iterator3 = p.successors, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {\n\t\t\t\t\tvar _ref5;\n\n\t\t\t\t\tif (_isArray3) {\n\t\t\t\t\t\tif (_i3 >= _iterator3.length) break;\n\t\t\t\t\t\t_ref5 = _iterator3[_i3++];\n\t\t\t\t\t} else {\n\t\t\t\t\t\t_i3 = _iterator3.next();\n\t\t\t\t\t\tif (_i3.done) break;\n\t\t\t\t\t\t_ref5 = _i3.value;\n\t\t\t\t\t}\n\n\t\t\t\t\tvar _p = _ref5;\n\n\t\t\t\t\tif (p.isStochastic) {\n\t\t\t\t\t\tcurrentWeight += _p.weight;\n\t\t\t\t\t\tif (currentWeight < threshWeight) continue;\n\t\t\t\t\t}\n\t\t\t\t\t// If currentWeight >= thresWeight, a production is choosen stochastically\n\t\t\t\t\t// and evaluated recursively because it , kax also have rightCtx, leftCtx and condition to further inhibit production. This is not standard L-System behaviour though!\n\n\t\t\t\t\t// last true is for recursiv call\n\t\t\t\t\t// TODO: refactor getProductionResult to use an object\n\t\t\t\t\tvar _result = this.getProductionResult(_p, index, part, params, true);\n\t\t\t\t\t// console.log(part, p.successors);\n\t\t\t\t\t// console.log(result);\n\t\t\t\t\t// console.log(\"\\n\");\n\t\t\t\t\tif (_result !== undefined && _result !== false) {\n\t\t\t\t\t\tresult = _result;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t\t// if successor is a function, execute function and append return value\n\t\t\telse if (typeof p.successor === 'function') {\n\n\t\t\t\t\tresult = p.successor({ index, currentAxiom: this.axiom, part, params });\n\t\t\t\t} else {\n\t\t\t\t\tresult = p.successor;\n\t\t\t\t}\n\n\t\tif (!result) {\n\t\t\t// Allow undefined or false results for recursive calls of this func\n\t\t\treturn recursive ? result : part;\n\t\t}\n\t\treturn result;\n\t};\n\n\tthis.applyProductions = function () {\n\t\t// a axiom can be a string or an array of objects that contain the key/value 'symbol'\n\t\tvar newAxiom = typeof this.axiom === 'string' ? '' : [];\n\t\tvar index = 0;\n\n\t\t// iterate all symbols/characters of the axiom and lookup according productions\n\t\tfor (var _iterator4 = this.axiom, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {\n\t\t\tvar _ref6;\n\n\t\t\tif (_isArray4) {\n\t\t\t\tif (_i4 >= _iterator4.length) break;\n\t\t\t\t_ref6 = _iterator4[_i4++];\n\t\t\t} else {\n\t\t\t\t_i4 = _iterator4.next();\n\t\t\t\tif (_i4.done) break;\n\t\t\t\t_ref6 = _i4.value;\n\t\t\t}\n\n\t\t\tvar part = _ref6;\n\n\n\t\t\t// Stuff for classic parametric L-Systems: get actual symbol and possible parameters\n\t\t\t// params will be given the production function, if applicable.\n\n\t\t\tvar symbol = part.symbol || part;\n\t\t\tvar params = part.params || [];\n\n\t\t\tvar result = part;\n\t\t\tif (this.productions.has(symbol)) {\n\t\t\t\tvar p = this.productions.get(symbol);\n\t\t\t\tresult = this.getProductionResult(p, index, part, params);\n\t\t\t}\n\n\t\t\t// Got result. Now add result to new axiom.\n\t\t\tif (typeof newAxiom === 'string') {\n\t\t\t\tnewAxiom += result;\n\t\t\t} else if (result instanceof Array) {\n\t\t\t\t// If result is an array, merge result into new axiom instead of pushing.\n\t\t\t\tArray.prototype.push.apply(newAxiom, result);\n\t\t\t} else {\n\t\t\t\tnewAxiom.push(result);\n\t\t\t}\n\t\t\tindex++;\n\t\t}\n\n\t\t// finally set new axiom and also return it for convenience.\n\t\tthis.axiom = newAxiom;\n\t\treturn newAxiom;\n\t};\n\n\tthis.iterate = function () {\n\t\tvar n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;\n\n\t\tthis.iterations = n;\n\t\tvar lastIteration = void 0;\n\t\tfor (var iteration = 0; iteration < n; iteration++) {\n\t\t\tlastIteration = this.applyProductions();\n\t\t}\n\t\treturn lastIteration;\n\t};\n\n\tthis.final = function (externalArg) {\n\t\tvar index = 0;\n\t\tfor (var _iterator5 = this.axiom, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {\n\t\t\tvar _ref7;\n\n\t\t\tif (_isArray5) {\n\t\t\t\tif (_i5 >= _iterator5.length) break;\n\t\t\t\t_ref7 = _iterator5[_i5++];\n\t\t\t} else {\n\t\t\t\t_i5 = _iterator5.next();\n\t\t\t\tif (_i5.done) break;\n\t\t\t\t_ref7 = _i5.value;\n\t\t\t}\n\n\t\t\tvar part = _ref7;\n\n\n\t\t\t// if we have objects for each symbol, (when using parametric L-Systems)\n\t\t\t// get actual identifiable symbol character\n\t\t\tvar symbol = part;\n\t\t\tif (typeof part === 'object' && part.symbol) symbol = part.symbol;\n\n\t\t\tif (this.finals.has(symbol)) {\n\t\t\t\tvar finalFunction = this.finals.get(symbol);\n\t\t\t\tvar typeOfFinalFunction = typeof finalFunction;\n\t\t\t\tif (typeOfFinalFunction !== 'function') {\n\t\t\t\t\tthrow Error('\\'' + symbol + '\\'' + ' has an object for a final function. But it is __not a function__ but a ' + typeOfFinalFunction + '!');\n\t\t\t\t}\n\t\t\t\t// execute symbols function\n\t\t\t\t// supply in first argument an details object with current index and part\n\t\t\t\t// and in the first argument inject the external argument (like a render target)\n\t\t\t\tfinalFunction({ index, part }, externalArg);\n\t\t\t} else {\n\t\t\t\t// symbol has no final function\n\t\t\t}\n\t\t\tindex++;\n\t\t}\n\t};\n\n\t/*\n \thow to use match():\n  \t-----------------------\n \tIt is mainly a helper function for context sensitive productions.\n \tIf you use the classic syntax, it will by default be automatically transformed to proper\n \tJS-Syntax.\n \tHowerver, you can use the match helper function in your on productions:\n \n \tindex is the index of a production using `match`\n \teg. in a classic L-System\n \n \tLSYS = ABCDE\n \tB<C>DE -> 'Z'\n \n \tthe index of the `B<C>D -> 'Z'` production would be the index of C (which is 2) when the\n \tproduction would perform match(). so (if not using the ClassicLSystem class) you'd construction your context-sensitive production from C to Z like so:\n \n \tLSYS.setProduction('C', (index, axiom) => {\n \t\t(LSYS.match({index, match: 'B', direction: 'left'}) &&\n \t\t LSYS.match({index, match: 'DE', direction: 'right'}) ? 'Z' : 'C')\n \t})\n \n \tYou can just write match({index, ...} instead of match({index: index, ..}) because of new ES6 Object initialization, see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#New_notations_in_ECMAScript_6\n \t*/\n\n\tthis.match = function (_ref8) {\n\t\tvar axiom_ = _ref8.axiom_,\n\t\t    match = _ref8.match,\n\t\t    ignoredSymbols = _ref8.ignoredSymbols,\n\t\t    branchSymbols = _ref8.branchSymbols,\n\t\t    index = _ref8.index,\n\t\t    direction = _ref8.direction;\n\n\n\t\tvar branchCount = 0;\n\t\tvar explicitBranchCount = 0;\n\t\taxiom_ = axiom_ || this.axiom;\n\t\tif (branchSymbols === undefined) branchSymbols = this.branchSymbols !== undefined ? this.branchSymbols : [];\n\t\tif (ignoredSymbols === undefined) ignoredSymbols = this.ignoredSymbols !== undefined ? this.ignoredSymbols : [];\n\t\tvar returnMatchIndices = [];\n\n\t\tvar branchStart = void 0,\n\t\t    branchEnd = void 0,\n\t\t    axiomIndex = void 0,\n\t\t    loopIndexChange = void 0,\n\t\t    matchIndex = void 0,\n\t\t    matchIndexChange = void 0,\n\t\t    matchIndexOverflow = void 0;\n\t\t// set some variables depending on the direction to match\n\n\t\tif (direction === 'right') {\n\t\t\tloopIndexChange = matchIndexChange = +1;\n\t\t\taxiomIndex = index + 1;\n\t\t\tmatchIndex = 0;\n\t\t\tmatchIndexOverflow = match.length;\n\t\t\tif (branchSymbols.length > 0) {\n\t\t\t\t;\n\t\t\t\tvar _branchSymbols = branchSymbols;\n\t\t\t\tbranchStart = _branchSymbols[0];\n\t\t\t\tbranchEnd = _branchSymbols[1];\n\t\t\t}\n\t\t} else if (direction === 'left') {\n\t\t\tloopIndexChange = matchIndexChange = -1;\n\t\t\taxiomIndex = index - 1;\n\t\t\tmatchIndex = match.length - 1;\n\t\t\tmatchIndexOverflow = -1;\n\t\t\tif (branchSymbols.length > 0) {\n\t\t\t\t;\n\t\t\t\tvar _branchSymbols2 = branchSymbols;\n\t\t\t\tbranchEnd = _branchSymbols2[0];\n\t\t\t\tbranchStart = _branchSymbols2[1];\n\t\t\t}\n\t\t} else {\n\t\t\tthrow Error(direction, 'is not a valid direction for matching.');\n\t\t}\n\n\t\tfor (; axiomIndex < axiom_.length && axiomIndex >= 0; axiomIndex += loopIndexChange) {\n\n\t\t\tvar axiomSymbol = axiom_[axiomIndex].symbol || axiom_[axiomIndex];\n\t\t\tvar matchSymbol = match[matchIndex];\n\n\t\t\t// compare current symbol of axiom with current symbol of match\n\t\t\tif (axiomSymbol === matchSymbol) {\n\n\t\t\t\tif (branchCount === 0 || explicitBranchCount > 0) {\n\t\t\t\t\t// if its a match and previously NOT inside branch (branchCount===0) or in explicitly wanted branch (explicitBranchCount > 0)\n\n\t\t\t\t\t// if a bracket was explicitly stated in match axiom\n\t\t\t\t\tif (axiomSymbol === branchStart) {\n\t\t\t\t\t\texplicitBranchCount++;\n\t\t\t\t\t\tbranchCount++;\n\t\t\t\t\t\tmatchIndex += matchIndexChange;\n\t\t\t\t\t} else if (axiomSymbol === branchEnd) {\n\t\t\t\t\t\texplicitBranchCount = Math.max(0, explicitBranchCount - 1);\n\t\t\t\t\t\tbranchCount = Math.max(0, branchCount - 1);\n\t\t\t\t\t\t// only increase match if we are out of explicit branch\n\n\t\t\t\t\t\tif (explicitBranchCount === 0) {\n\n\t\t\t\t\t\t\tmatchIndex += matchIndexChange;\n\t\t\t\t\t\t}\n\t\t\t\t\t} else {\n\t\t\t\t\t\treturnMatchIndices.push(axiomIndex);\n\t\t\t\t\t\tmatchIndex += matchIndexChange;\n\t\t\t\t\t}\n\t\t\t\t}\n\n\t\t\t\t// overflowing matchIndices (matchIndex + 1 for right match, matchIndexEnd for left match )?\n\t\t\t\t// -> no more matches to do. return with true, as everything matched until here\n\t\t\t\t// *yay*\n\t\t\t\tif (matchIndex === matchIndexOverflow) {\n\t\t\t\t\treturn { result: true, matchIndices: returnMatchIndices };\n\t\t\t\t}\n\t\t\t} else if (axiomSymbol === branchStart) {\n\t\t\t\tbranchCount++;\n\t\t\t\tif (explicitBranchCount > 0) explicitBranchCount++;\n\t\t\t} else if (axiomSymbol === branchEnd) {\n\t\t\t\tbranchCount = Math.max(0, branchCount - 1);\n\t\t\t\tif (explicitBranchCount > 0) explicitBranchCount = Math.max(0, explicitBranchCount - 1);\n\t\t\t} else if ((branchCount === 0 || explicitBranchCount > 0 && matchSymbol !== branchEnd) && ignoredSymbols.includes(axiomSymbol) === false) {\n\t\t\t\t// not in branchSymbols/branch? or if in explicit branch, and not at the very end of\n\t\t\t\t// condition (at the ]), and symbol not in ignoredSymbols ? then false\n\t\t\t\treturn { result: false, matchIndices: returnMatchIndices };\n\t\t\t}\n\t\t}\n\n\t\treturn { result: false, matchIndices: returnMatchIndices };\n\t};\n\n\tthis.ignoredSymbols = ignoredSymbols;\n\tthis.debug = debug;\n\tthis.branchSymbols = branchSymbols;\n\tthis.allowClassicSyntax = allowClassicSyntax;\n\tthis.classicParametricSyntax = classicParametricSyntax;\n\tthis.forceObjects = forceObjects;\n\n\tthis.setAxiom(axiom);\n\n\tthis.clearProductions();\n\tif (productions) this.setProductions(productions);\n\tif (finals) this.setFinals(finals);\n\n\treturn this;\n}\n\n// Set classic syntax helpers to library scope to be used outside of library context\n// for users eg.\nLSystem.transformClassicStochasticProductions = transformClassicStochasticProductions;\nLSystem.transformClassicCSProduction = transformClassicCSProduction;\nLSystem.transformClassicParametricAxiom = transformClassicParametricAxiom;\nLSystem.testClassicParametricSyntax = testClassicParametricSyntax;\n\n/* harmony default export */ __webpack_exports__[\"a\"] = (LSystem);\n\n/***/ })\n/******/ ]);", null);
};

/***/ }),
/* 3 */
/***/ (function(module, exports) {

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
    if (!url) {
      throw Error('Inline worker is not supported');
    }
    return new Worker(url);
  }
}


/***/ }),
/* 4 */
/***/ (function(module, exports) {

AFRAME.registerPrimitive('a-lsystem', {
  defaultComponents: {
    lsystem: {
      axiom: 'F',
      productions: 'F:F++F++F++F',
      iterations: 3,
      angle: 60
    }
  },

  mappings: {
    axiom: 'lsystem.axiom',
    productions: 'lsystem.productions',
    segmentMixins: 'lsystem.segmentMixins',
    iterations: 'lsystem.iterations',
    angle: 'lsystem.angle'
  }
});


/***/ })
/******/ ]);
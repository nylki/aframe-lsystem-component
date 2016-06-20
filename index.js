if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

var LSystem;


// As we use webpack for compiling the source, it's used to bundle the
// web worker into a blob via: https://github.com/webpack/worker-loader
// Which works without additional changes, besides using `require` inside
// the worker instead of importScripts().
var LSystemWorker = require("worker?inline!./LSystemWorker.js");

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
    
    segmentMixins: {
      type: 'string',
      parse: function (value) {
        return value.split(' ').map(function (splitValue) {
          return splitValue.split(':');
        })
      }
    },
    
    iterations: {
      type: 'int',
      default: 1
    },
    
    angle: {
      type: 'number',
      default: 45.0
    },
    
    /* For fixed segment length */
    segmentLength: {
      type: 'number',
      default: 1.125
    },
    
    /* Translate a segment, based on it's bonding box, may not be optimal!
      TODO: implementation!
     */
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
      LSystem = require('lindenmayer');
    }
    
    this.sceneEl = document.querySelector('a-scene');
    
    this.stack = [];
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
				'F': () => {self.pushSegment.bind(self, 'F')()},
				'+': () => { self.currentSegment.quaternion.multiply(self.yPosRotation)},
				'-': () => { self.currentSegment.quaternion.multiply(self.yNegRotation)},
				'&': () => { self.currentSegment.quaternion.multiply(self.zNegRotation)},
				'^': () => { self.currentSegment.quaternion.multiply(self.zPosRotation)},
				'\\': () =>{ self.currentSegment.quaternion.multiply(self.xNegRotation)},
				'<': () => { self.currentSegment.quaternion.multiply(self.xNegRotation)},
				'/': () => { self.currentSegment.quaternion.multiply(self.xPosRotation)},
				'>': () => { self.currentSegment.quaternion.multiply(self.xPosRotation)},
				'|': () => { self.currentSegment.quaternion.multiply(self.yReverseRotation)},
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
    
    this.initWorker();
    
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
    console.log('update!!!');
    console.log(this);
    console.log(this.data);
    this.el.removeObject3D('mesh');
    if(this.mixinGroups) {
      for (let group of this.mixinGroups) {
        console.log(group);
        this.el.removeChild(group[1]);
      }
    }
    
    
    // Collect mixin info
    if(this.data.segmentMixins && this.data.segmentMixins.length !== 0) {
      this.mixinIDForSymbol = new Map();
      this.mixinGroups = new Map();
      for (let segmentMixin of this.data.segmentMixins) {
        
        this.mixinIDForSymbol.set(segmentMixin[0], segmentMixin[1]);
        let segmentGroup = document.createElement('a-entity');
        segmentGroup.setAttribute('mixin', segmentMixin[1]);
        segmentGroup.setAttribute('geometry', 'buffer', false);
        segmentGroup.setAttribute('id', segmentMixin[1] + '-group');
        segmentGroup.setAttribute('position', { x: 0, y: 0, z: 0});
        this.mixinGroups.set(segmentMixin[0], segmentGroup);
        this.el.appendChild(segmentGroup);
        
      }
    }
    
    this.LSystem.setAxiom(this.data.axiom);
    
    var params = {
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
    // post params to worker
    this.worker.startTime = Date.now();
    this.worker.postMessage(params);
  },
  
  initWorker: function() {
    this.worker = new LSystemWorker();
    this.worker.onmessage = this.onWorkerUpdate.bind(this);
  },
  
  pushSegment: function(symbol) {
    let self = this;
    // TODO: When no mixins defined, or mixins are very basic, or forced by flag
    // then do a faster geometry merge without creating entities first
    
    // let newSegment = new THREE.Mesh( this.geometry );
    
    // let newSegment = this.currentSegment.clone();
    // newSegment.matrixAutoUpdate = false;
    // newSegment.updateMatrix();
    
    let newSegment = document.createElement('a-entity');
    
    newSegment.setAttribute('mixin', this.mixinIDForSymbol.get(symbol));
    

    let currentQuaternion = this.currentSegment.quaternion.clone();
    let currentPosition = this.currentSegment.position.clone();

    newSegment.addEventListener('loaded', function (e) {
      // Offset child element of object3D, to rotate around end point
      // IMPORTANT: It may change that A-Frame puts objects into a group
      // FIXME: offset all children instead of the first, in case there are multiple
      // geometries in there?!?
      newSegment.object3D.children[0].translateX(-self.data.segmentLength/2);
      
      newSegment.object3D.quaternion.copy(currentQuaternion);
      newSegment.object3D.position.copy(currentPosition);
      newSegment.setAttribute('geometry', 'skipCache', true);
      newSegment.setAttribute('geometry', 'buffer', false);
      newSegment.setAttribute('geometry', 'mergeTo', '#' + self.mixinIDForSymbol.get(symbol) + '-group');

      // newSegment.addEventListener('geometry-merged', function (e) {
      //   console.log('merged.');
      //
      //});
    });

    this.sceneEl.appendChild(newSegment);
    
    
    
    // TODO: if mergeGeometries === false, this.modelGroups.get('symbol').push(newSegment)
    
    // this.modelGroups.get(symbol).geometry.merge(newSegment.geometry, newSegment.matrix);
    
    // ALTERNATIVE MAYBE?: but use new merge api.
    // and define #id of the fullModel to merge into.
    // this.modelGroups.geometry.merge(newSegment.geometry, newSegment.matrix);
    
    this.currentSegment.translateX(-(this.data.segmentLength));
  },
  
  updateTurtleGraphics: function() {
		console.log('updateTurtleGraphics');

		colorIndex = 0; // Reset color index
		angle = this.data.angle;
    this.lineWidth = 0.0005;
    this.lineLength = 0.125;
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

    // TODO: Make currentSegment only an empty shell Object3D, fill with
    // Geometry only when pushing a new segment, then deciding by smybol (F, L, whatever)
    // Bzw. on pushSegment create new THREE.Mesh( chosengeometry ), _copy_ the matrix
    // from currentSegment into it, then merge geometry into according fullModel (eg. branches, leaves) to apply individual materials.
    this.currentSegment = new THREE.Object3D();

		// this.currentSegment.matrixAutoUpdate = false;
    let material = new THREE.MeshLambertMaterial({
      shading: THREE.SmoothShading,
      vertexColors: THREE.FaceColors
    });


		// this.fullModel = new THREE.Mesh(new THREE.Geometry(), material);
    // this.el.setObject3D('mesh', this.fullModel);
		
		this.LSystem.final();
    // TODO: then add all fullModels (branches, leaves) into object3d
    //
    // for (let fullModel of fullModels) {
    //   this.el.object3D.add(fullModel);
    // }
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

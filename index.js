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
      default: false
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
    this.colors = [0x8c651b, 0x7d9322, 0x3d9322];
    this.colorIndex = 0;
    
    
    var self = this;
    
    this.LSystem = new LSystem({
      axiom: 'FF+F',
      productions: {'F': 'FF'},
      finals: {
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
					self.transformationSegment.scale.set(self.transformationSegment.scale.x, self.transformationSegment.scale.y + 0.2, self.transformationSegment.scale.z + 0.2);
					colorIndex = Math.min(colors.length - 1, colorIndex + 1);
					for (let face of self.transformationSegment.geometry.faces) {
						face.color.setHex(colors[colorIndex]);
					}
					self.transformationSegment.geometry.colorsNeedUpdate = true;
				},
				'\'': () => {
					self.transformationSegment.scale.set(self.transformationSegment.scale.x, self.transformationSegment.scale.y - 0.2, self.transformationSegment.scale.z - 0.2);
					colorIndex = Math.max(0, colorIndex - 1);
					for (let face of self.transformationSegment.geometry.faces) {
						face.color.setHex(colors[colorIndex]);
					}
					self.transformationSegment.geometry.colorsNeedUpdate = true;
				},
				'[': () => { self.stack.push(self.transformationSegment.clone()) },
				']': () => { self.transformationSegment = self.stack.pop() }
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
    
    let self = this;
    
    this.el.removeObject3D('mesh');

    // The main segment used for saving transformations (rotation, translation, scale(?))
    this.transformationSegment = new THREE.Object3D();
    
    // We push copies of this.transformationSegment on branch symbols inside this array.
    this.stack = [];
    
    // Map for remembering which mixin belongs to which symbol
    // (parsed further below from element attributes)
    this.mixinIDForSymbol = new Map();
    
    // Map for remembering the elements holding differnt segment types
    this.segmentElGroups = new Map();
    
    // Map for buffering geometries for use in pushSegments()
    // when merging geometries ourselves and not by appending a `mixin` attributes,
    // as done with `mergeGeometry = false`.
    this.segmentObjects3D = new Map();
    
    this.segmentMergeGroups = new Map();
    
    let loadingPromises = [];
    
    while (this.el.firstChild) {
        this.el.removeChild(this.el.firstChild);
    }
    
    // Collect mixin info
    if(this.data.segmentMixins && this.data.segmentMixins.length !== 0) {

      for (let segmentMixin_ of this.data.segmentMixins) {
        // create a copy of current iterated pair for asyncy stuff to work.
        let segmentMixin = segmentMixin_.slice();
        
        this.mixinIDForSymbol.set(segmentMixin[0], segmentMixin[1]);
        let segmentElGroup = document.createElement('a-entity');
        
        // Set final functions for each symbol that has a mixin defined
        this.LSystem.setFinal(segmentMixin[0], () => {self.pushSegment.bind(self, segmentMixin[0])()});
        console.log(this.LSystem.finals);


        loadingPromises.push(new Promise((resolve, reject) => {
          if(this.data.mergeGeometries === true) {
            // TODO: Put it all under this.mergeData
            segmentElGroup.setAttribute('geometry', 'buffer:false;');
            segmentElGroup.setAttribute('mixin', segmentMixin[1]);
            segmentElGroup.addEventListener('loaded', function (e) {
              
              let segmentObject = segmentElGroup.getObject3D('mesh').clone();
              // Offset geometry by half segmentLength to get the rotation point right.
              segmentObject.geometry.translate(-self.data.segmentLength/2, 0, 0);
              self.segmentObjects3D.set(segmentMixin[0], segmentObject);
              self.segmentElGroups.set(segmentMixin[0], segmentElGroup);
              let mergeGroup = new THREE.Mesh(new THREE.Geometry(), segmentElGroup.getObject3D('mesh').material.clone());
              console.log(self.segmentMergeGroups);
              console.log('settting now a key: ', segmentMixin[0]);
              self.segmentMergeGroups.set(segmentMixin[0], mergeGroup);
              console.log(self.segmentMergeGroups);
              
              resolve();
            });
          } else {
            resolve();
          }
          
          segmentElGroup.setAttribute('id', segmentMixin[1] + '-group');
          this.el.appendChild(segmentElGroup);
          this.segmentElGroups.set(segmentMixin[0], segmentElGroup);
          
        }));

      }
    }
    
    var params = {
      axiom: 		this.data.axiom,
      productions: this.data.productions,
      iterations: this.data.iterations
    }

    // post params to worker
    // After all groups have been created, post to the worker.
    
    Promise.all(loadingPromises).then(() => {
      console.log('all groups loaded.');
      if(Date.now() - this.worker.startTime > 1000 ) {
        // if we got user input, but worker is running for over a second
        // terminate old worker and start new one.
        this.worker.terminate();
        this.initWorker();
      }
      
      this.worker.startTime = Date.now();
      this.worker.postMessage(params);
    })

  },
  
  initWorker: function() {
    this.worker = new LSystemWorker();
    this.worker.onmessage = this.onWorkerUpdate.bind(this);
  },
  
  pushSegment: function(symbol) {
    let self = this;
    let currentQuaternion = self.transformationSegment.quaternion.clone();
    let currentPosition = self.transformationSegment.position.clone();
    
    if(this.data.mergeGeometries === false) {
      let newSegment = document.createElement('a-entity');
      newSegment.setAttribute('mixin', this.mixinIDForSymbol.get(symbol));
      newSegment.addEventListener('loaded', function (e) {
        // Offset child element of object3D, to rotate around end point
        // IMPORTANT: It may change that A-Frame puts objects into a group
        newSegment.object3D.children[0].translateX(-self.data.segmentLength/2);
        newSegment.object3D.quaternion.copy(currentQuaternion);
        newSegment.object3D.position.copy(currentPosition);
      });
      
      this.segmentElGroups.get(symbol).appendChild(newSegment);

      
      // IDEA: Keep this here if we decide to use aframes mergeTo feature:
      //
      // newSegment.setAttribute('geometry', 'buffer',  'false');
      // newSegment.setAttribute('geometry', 'skipCache',  'true');
      // newSegment.setAttribute('geometry', 'mergeTo',  self.mixinIDForSymbol.get(symbol) + '-group');
      //  skipCache: true; mergeTo: #' + self.mixinIDForSymbol.get(symbol) + '-group');
    } else {
      // console.log(this.segmentObjects3D.get(symbol));
      let segmentObject = this.segmentObjects3D.get(symbol);
      let newSegmentObject = segmentObject.clone(true);
      
      newSegmentObject.quaternion.copy(currentQuaternion);
      newSegmentObject.position.copy(currentPosition);
      newSegmentObject.matrixAutoUpdate = false;
      newSegmentObject.updateMatrix();
      this.segmentMergeGroups.get(symbol).geometry.merge(newSegmentObject.geometry, newSegmentObject.matrix);
    }
    
    this.transformationSegment.translateX(-(this.data.segmentLength));
  },
  
  updateTurtleGraphics: function() {

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
    console.log(this.segmentMergeGroups);
    console.log(this.segmentElGroups);
		this.LSystem.final();
    // finally set the merged meshes to be visible.
    if(this.data.mergeGeometries === true) {
      for (let elGroup of this.segmentElGroups) {
        elGroup[1].setObject3D('mesh', this.segmentMergeGroups.get(elGroup[0]));
        elGroup[1].setAttribute('mixin', this.mixinIDForSymbol.get(elGroup[0]));
      }
    }


	},
  
  
  onWorkerUpdate: function(e) {
    console.log('update from worker', e);
		// Received updated Axiom from worker (which applied productions)
		this.LSystem.setAxiom(e.data.result);
		this.updateTurtleGraphics();
    console.log('updated turtle graphics');
	},

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () {
    console.log('\nREMOVE\n');
    
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
    console.log('\nPAUSE\n');
  },

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function () {
    console.log('\nPLAY\n');
  },
});

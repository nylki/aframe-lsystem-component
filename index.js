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
      type: 'number',
      default: 90.0
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
      LSystem = require('lindenmayer');
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
        '+': () => { self.transformationSegment.quaternion.multiply(self.xPosRotation)},
        '-': () => { self.transformationSegment.quaternion.multiply(self.xNegRotation)},
        '&': () => { self.transformationSegment.quaternion.multiply(self.zNegRotation)},
        '^': () => { self.transformationSegment.quaternion.multiply(self.zPosRotation)},
        '\\': () =>{ self.transformationSegment.quaternion.multiply(self.yNegRotation)},
        '<': () => { self.transformationSegment.quaternion.multiply(self.yNegRotation)},
        '/': () => { self.transformationSegment.quaternion.multiply(self.yPosRotation)},
        '>': () => { self.transformationSegment.quaternion.multiply(self.yPosRotation)},
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
        }
    }
    this.el.innerHTML = '';
    
    // Map for remembering the elements holding differnt segment types
    this.segmentElementGroupsMap = new Map();


    // The main segment used for saving transformations (rotation, translation, scale(?))
    this.transformationSegment = new THREE.Object3D();

    
    // We push copies of this.transformationSegment on branch symbols inside this array.
    this.stack = [];
    
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
    
    let loadingPromises = [];
    
    
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
          
          loadingPromises.push(new Promise((resolve, reject) => {
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
                segmentObject.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, (segmentLength * self.segmentLengthFactor)/2, 0 ) );
                
                let mergeGroup = new THREE.Mesh(
                  new THREE.Geometry(), segmentElGroup.getObject3D('mesh').material.clone()
                );
                
                self.segmentObjects3DMap.set(symbol + mixinColorIndex, segmentObject );
                self.mergeGroups.set(symbol + mixinColorIndex, mergeGroup);
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
    


    // post params to worker
    // After all groups have been created, post to the worker.
    Promise.all(loadingPromises).then(() => {
      
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
    })

  },
  
  // if this.dynamicSegmentLength===true use this function to set the length
  // depending on segments geometries bbox
  calculateSegmentLength: function (mixin, geometry) {
    if(this.segmentLengthMap.has(mixin)) return this.segmentLengthMap.get(mixin);
    geometry.computeBoundingBox();
    this.segmentLengthMap.set(mixin, Math.abs(geometry.boundingBox.min.y - geometry.boundingBox.max.y));
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

        newSegment.object3D.children[0].translateY((segmentLength * self.segmentLengthFactor) / 2);
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
    this.transformationSegment.translateY(segmentLength * this.segmentLengthFactor);
  },
  
  updateTurtleGraphics: function() {

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

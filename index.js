if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

var LSystem;

// Get the component absolute location to properly
// init a web worker from there.
var currentScriptLocation = document.currentScript.src;
workerScriptLocation = currentScriptLocation.substr(0, currentScriptLocation.lastIndexOf('/') + 1) + 'worker.js';
console.log(workerScriptLocation);


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
      LSystem = require('lindenmayer');
    }
    
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
				'F': self.pushSegment.bind(self),
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
    console.log('before iteration');

    this.updateTurtleGraphics();
  },
  
  pushSegment: function() {
    let newSegment = this.currentSegment.clone();
    newSegment.matrixAutoUpdate = false;
    newSegment.updateMatrix();
    this.fullModel.geometry.merge(newSegment.geometry, newSegment.matrix);
    this.currentSegment.translateX(-(this.lineLength));
  },
  
  updateTurtleGraphics: function() {
		
		colorIndex = 0; // Reset color index
		angle = this.data.angle;
    this.lineWidth = 0.5;
    this.lineLength = 3;
		// Set quaternions based on angle slider
		this.xPosRotation.setFromAxisAngle( this.X, (Math.PI / 180) * angle );
		this.xNegRotation.setFromAxisAngle( this.X, (Math.PI / 180) * -angle );
		
		this.yPosRotation.setFromAxisAngle( this.Y, (Math.PI / 180) * angle );
		this.yNegRotation.setFromAxisAngle( this.Y, (Math.PI / 180) * -angle );
		this.yReverseRotation.setFromAxisAngle( this.Y, (Math.PI / 180) * 180 );
		
		this.zPosRotation.setFromAxisAngle( this.Z, (Math.PI / 180) * angle );
		this.zNegRotation.setFromAxisAngle( this.Z, (Math.PI / 180) * -angle );
		
		let geometry = new THREE.CylinderGeometry(this.lineWidth, this.lineWidth, this.lineLength, 3);
		geometry.rotateZ((Math.PI / 180) * 90);
		geometry.translate( -(this.lineLength/2), 0, 0 );
		for (let face of geometry.faces) {
			face.color.setHex(this.colors[colorIndex]);
		}
		geometry.colorsNeedUpdate = true;

		this.currentSegment = new THREE.Mesh( geometry );
		this.currentSegment.matrixAutoUpdate = false;
    let material = new THREE.MeshLambertMaterial({
      shading: THREE.SmoothShading,
      vertexColors: THREE.FaceColors
    });
		this.fullModel = new THREE.Mesh(new THREE.Geometry(), material);
    this.el.setObject3D('mesh', this.fullModel);
		
    this.LSystem.iterate(this.data.iterations);
		this.LSystem.final();
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

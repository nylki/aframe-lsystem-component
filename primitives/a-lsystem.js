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

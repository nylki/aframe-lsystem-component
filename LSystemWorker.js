// Require instead of importScripts because we use webpack
// with worker-loader for compiling source: https://github.com/webpack/worker-loader
var LSystem = require('lindenmayer');
var lsystem = new LSystem({});
var timeout = {};

onmessage = function(e) {
  
  // wait a few ms to start thread, to be able to cancel old tasks
  clearTimeout(timeout);
  timeout = setTimeout(function() {
    
      lsystem.setAxiom(e.data.axiom);
      
      lsystem.clearProductions();
      for (let p of e.data.productions) {
        lsystem.setProduction(p[0], p[1]);
      }
      lsystem.iterate(e.data.iterations);
      
      postMessage({
        result: lsystem.getString(),
        initial: e.data
      });
      
  }, 20);

};


console.log('worker initialized');

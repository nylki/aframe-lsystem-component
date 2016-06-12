// Require instead of importScripts because we use webpack
// with worker-loaderfor compiling source: https://github.com/webpack/worker-loader
var LSystem = require('lindenmayer');
var lsystem = new LSystem({});
var timeout = {};
console.log('hello');

onmessage = function(e) {
  
  // wait a few ms to start thread, to be able to cancel old tasks
  clearTimeout(timeout);
  timeout = setTimeout(function() {
      lsystem.clearProductions();
      lsystem.setAxiom(e.data.axiom);
      for (let p of e.data.productions) {
        if(p.parsejs) {
          lsystem.setProduction(p.from, eval(p.to));
        } else {
          lsystem.setProduction(p.from, p.to);
        }
      }
      console.log(e.data);
      lsystem.iterate(parseInt(e.data.iterations));
      console.log('iterated!');
      postMessage({
        result: lsystem.getString(),
        initial: e.data
      });
      
  }, 20);

};


console.log('worker initialized');

const path = require('path');


    module.exports = {
        entry: "./index.js",
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: "aframe-lsystem-component.esnext.js"
        },
        module: {
            loaders: [
            ]
        }
    };

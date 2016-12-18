
    module.exports = {
        entry: "./index.js",
        output: {
            path: './dist/',
            filename: "aframe-lsystem-component.js"
        },
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules|dist)/,
                    loader: 'babel-loader',
                    query: {
                        presets: ['es2015']
                    }
                }
            ]
        }
    };

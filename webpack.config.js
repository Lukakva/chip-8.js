const path = require('path');

module.exports = {
    mode: 'production',
    devtool: false,
    watch: true,
    entry: {
        index: './src/index.js',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        environment: {
        	arrowFunction: false,
        	const: false,
        	destructuring: false,
        }
    },
    module: {
		rules: [{
			test: /\.m?js$/,
			exclude: /(node_modules|bower_components)/,
			use: {
				loader: 'babel-loader',
				options: {
					presets: ['@babel/preset-env']
				}
			}
		}]
    }
};

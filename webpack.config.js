const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: 'production',
    devtool: false,
    watch: true,
    entry: {
        index: './src/index.js',
    },
    plugins: [
	    new HtmlWebpackPlugin({
	    	hash: true,
	    	template: './src/index.html',
	    	filename: '../index.html',
	    	minify: {
				collapseWhitespace: true,
				keepClosingSlash: true,
				removeComments: true,
				removeRedundantAttributes: true,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true,
				useShortDoctype: true,
			}
	    })
	],
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
		}, {
			test: /\.css$/,
			use: [{
 				loader: 'style-loader',
 				options: {
 					insert: 'head',
 					injectType: 'singletonStyleTag'
 				}
			}, 'css-loader']
		}]
    }
}

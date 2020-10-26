
const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/index.html', to: 'index.html' }
      ],
    })
  ],
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'apphost', 'build'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env"
            ]
          }
        }
      }
    ]
  }
};


const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/index.html', to: 'index.html' },
        { from: 'src/libs/ammo/ammo.wasm.js', to: 'libs/ammo/ammo.wasm.js' },
        { from: 'src/libs/ammo/ammo.wasm.wasm', to: 'libs/ammo/ammo.wasm.wasm' },
        { from: 'src/icon.png', to: 'icon.png' },
        { from: 'src/index.css', to: 'index.css' },
        { from: 'src/images/', to: 'images/' }
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
        exclude: [
          path.resolve(__dirname, "openbf-default-mods"),
          path.resolve(__dirname, "openbf-api")
        ],
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

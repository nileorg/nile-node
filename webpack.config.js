const path = require('path')

module.exports = {
  entry: './src/module.js',
  output: {
    library: 'NileNode',
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  }
}

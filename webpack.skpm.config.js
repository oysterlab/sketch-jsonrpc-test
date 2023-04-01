const path = require('path');

module.exports = function (config, entry) {
  config.node = entry.isPluginCommand ? false : {
    setImmediate: false
  };
  
  if (!entry.isPluginCommand) {
    config.externals = {
      'sketch': {},
      'sketch/settings': {},
      'sketch/async': {}
    }
  }

  config.resolve.alias = {
    'sketch-renderer': path.resolve(__dirname, './src/renderer/index.tsx'),
    'rpc': path.resolve(__dirname, './src/rpc.ts'),
    'render-rpc': path.resolve(__dirname, './src/render-rpc.ts'),
  }

  config.resolve.extensions = config.resolve.extensions.concat(['.ts', '.tsx']);
  config.module.rules = config.module.rules.concat([
    {
      test: /\.tsx?$/,
      exclude: /node_modules/,
      loader: 'ts-loader'
    },
    {
      test: /\.(html)$/,
      use: [{
          loader: "@skpm/extract-loader",
        },
        {
          loader: "html-loader",
          options: {
            attributes: {
              list: [
                { tag: 'img', attribute: 'src', type: 'src' },
                { tag: 'link', attribute: 'href', type: 'src' }
              ]
            }
          },
        },
      ]
    },
    {
      test: /\.(css)$/,
      use: [{
          loader: "style-loader",
        },
        {
          loader: "css-loader",
        },
      ]
    }
  ]);
}

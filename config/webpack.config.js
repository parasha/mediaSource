const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const htmlWebpackPlugin = require('html-webpack-plugin');

const resolve = dir => path.resolve(__dirname, '../', dir);

const config = {
  entry: resolve('src/main.js'),
  output: {
    path: resolve('dist'),
    filename: 'js/[name].[hash:8].js',
  },
  devServer: {
    host: 'localhost',
    port: '8080',
    // https: true,
    open: true,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              "@babel/plugin-transform-runtime",
              "@babel/plugin-syntax-dynamic-import",
              "@babel/plugin-transform-arrow-functions", 
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-proposal-private-methods"
            ]
          },
        }
      },
      {
        test: /\.less$/,
        exclude: '/node_modules',
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: (loader) => [
                require('postcss-import')({ root: loader.resourcePath }),
                require('postcss-preset-env')(),
                require('cssnano')()
              ]
            }
          },
          'less-loader'
        ]
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path]/[name].[hash:6].[ext]',
              context: 'src/'
            }
          },
        ]
      },
    ]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          chunks: "all",
          test: /[\\/]node_modules[\\/]/,
          name: 'node_modules',
          minChunks: 1, //被不同entry引用次数(import),1次的话没必要提取
          minSize: 0,
          priority: 1,
        },
        common: {
          chunks: "all",
          test: /[\\/]src[\\/]/,
          name: 'common',
          minChunks: 2,
          minSize: 0,
          priority: 1,
        },
      }
    },
    runtimeChunk: {
      name: 'runtime'
    }
  },
  plugins: [
    new VueLoaderPlugin(),
    new webpack.ProvidePlugin({}), // 提供全局变量
    new webpack.HotModuleReplacementPlugin(), //热更新
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "css/[name].[hash:6].css",//都提到build目录下的css目录中
    }),
    new htmlWebpackPlugin({
      inject: true,
      template: resolve('./config/index.html'),
      title: 'vue-next',
    }),
    new webpack.DefinePlugin({
      ENV: process.env.prod ? JSON.stringify('production') : JSON.stringify('development'),
    }),
  ],
  resolve: {
    alias: {
      'vue': '@vue/runtime-dom',
    }
  }
};

module.exports = config;

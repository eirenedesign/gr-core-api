const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const fs = require('fs');
const path = require('path');

const config = {
    entry: {},
    output: {
        path: __dirname + '/dist',
        filename: '[name].[hash].js'
    },
    module: {
        rules: [
            {
                test: /\.jsx$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                'env',
                                {
                                    targets: {
                                        'node': 'current'
                                    }
                                }
                            ],
                            'react'
                        ],
                        plugins: [
                            [
                                'import',
                                {
                                    libraryName: 'antd',
                                    style: true
                                }
                            ]
                        ]
                    }
                },
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                minimize: true
                            }
                        },
                        {
                            loader: 'postcss-loader',
                        }
                    ]
                })
            },
            {
                test: /\.less$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'less-loader'
                ]
            }
        ]
    },
    resolve: {
        extensions: [
            '.js',
            '.jsx'
        ]
    },
    plugins: [
        new ExtractTextPlugin('[name].[hash].css')
    ],
    devServer: {
        disableHostCheck: true
    }
};

const __srcDir = path.resolve('src');
const __templatePath = path.resolve(__srcDir, 'public/index.html');

const routesDir = path.resolve(__srcDir, 'routes');
const routes = fs.readdirSync(routesDir);
routes.forEach((name) =>
{
    config.entry[name] = path.resolve(routesDir, name, 'index.jsx');
    config.plugins.push(new HtmlWebpackPlugin({
        filename: name + '.html',
        template: __templatePath,
        inject: true,
        chunks: [name]
    }));
});

module.exports = config;

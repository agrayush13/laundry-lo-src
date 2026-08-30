const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');

/**
 * The app uses client-side routing, so a static host must serve index.html for
 * every path. Without this, refreshing /cart asks the host for a /cart file
 * that does not exist and it returns 404. `historyApiFallback` only covers the
 * dev server, so the rule has to ship inside the build output.
 */
class EmitHostRewrites {
    apply(compiler) {
        const { Compilation, sources } = compiler.webpack;

        compiler.hooks.thisCompilation.tap('EmitHostRewrites', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'EmitHostRewrites',
                    stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                },
                () => {
                    // Netlify
                    compilation.emitAsset(
                        '_redirects',
                        new sources.RawSource('/*    /index.html    200\n')
                    );
                }
            );
        });
    }
}

/**
 * Copies everything in public/ into the build, keeping filenames intact.
 *
 * index.html is skipped because HtmlWebpackPlugin already renders it from that
 * template. Names must survive untouched: og-image.png is referenced by an
 * absolute URL in the page head, so a content hash would break every social
 * preview. The dev server serves public/ directly, so this only matters for
 * production output.
 */
/**
 * Root-relative urls in CSS point at public/, which is copied verbatim and never
 * hashed. Left to itself css-loader would try to resolve them through the module
 * graph and fail, while these files deliberately keep the stable names used by
 * the document head and manifest.
 */
const cssUrls = { url: { filter: (url) => !url.startsWith('/') } };

class EmitPublicAssets {
    apply(compiler) {
        const { Compilation, sources } = compiler.webpack;
        const publicDir = path.resolve(__dirname, 'public');

        compiler.hooks.thisCompilation.tap('EmitPublicAssets', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'EmitPublicAssets',
                    stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                },
                () => {
                    // Recursive so nested folders such as public/icons ship too.
                    const emitDir = (dir, prefix) => {
                        for (const name of fs.readdirSync(dir)) {
                            if (!prefix && name === 'index.html') {
                                continue;
                            }

                            const file = path.join(dir, name);
                            const assetName = prefix ? `${prefix}/${name}` : name;

                            if (fs.statSync(file).isDirectory()) {
                                emitDir(file, assetName);
                            } else {
                                compilation.emitAsset(
                                    assetName,
                                    new sources.RawSource(fs.readFileSync(file))
                                );
                            }
                        }
                    };

                    emitDir(publicDir, '');
                }
            );
        });
    }
}

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    const styleLoader = isProduction ? MiniCssExtractPlugin.loader : 'style-loader';

    return {
        entry: './src/index.tsx',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isProduction ? '[name].[contenthash].js' : '[name].js',
            chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
            clean: true,
            publicPath: '/',
            // Maps land outside dist/ so the deployable folder carries no sources.
            // Keep build-maps/ for symbolicating production stack traces.
            sourceMapFilename: '../build-maps/[file].map',
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.jsx', '.js'],
        },
        module: {
            rules: [
                {
                    test: /\.[jt]sx?$/,
                    exclude: /node_modules/,
                    use: 'ts-loader',
                },
                {
                    test: /\.css$/,
                    use: [styleLoader, { loader: 'css-loader', options: cssUrls }],
                },
                {
                    test: /\.module\.s[ac]ss$/i,
                    use: [
                        styleLoader,
                        {
                            loader: 'css-loader',
                            options: {
                                modules: {
                                    // css-loader v7 defaults namedExport to true,
                                    // which removes the default export the
                                    // components import as `styles`.
                                    namedExport: false,
                                    localIdentName: isProduction
                                        ? '[hash:base64:6]'
                                        : '[name]__[local]',
                                    exportLocalsConvention: 'camelCaseOnly',
                                },
                                ...cssUrls,
                            },
                        },
                        'sass-loader',
                    ],
                },
                {
                    test: /\.s[ac]ss$/i,
                    exclude: /\.module\.s[ac]ss$/i,
                    use: [styleLoader, { loader: 'css-loader', options: cssUrls }, 'sass-loader'],
                },
                {
                    test: /\.(png|jpe?g|gif|svg)$/i,
                    type: 'asset/resource',
                },
            ],
        },
        plugins: [
            new EmitHostRewrites(),
            new EmitPublicAssets(),
            new HtmlWebpackPlugin({
                template: './public/index.html',
                favicon: './src/assets/laundrylo-appicon-v2.svg',
            }),
            ...(isProduction
                ? [
                      new MiniCssExtractPlugin({
                          filename: '[name].[contenthash].css',
                          chunkFilename: '[name].[contenthash].chunk.css',
                      }),
                  ]
                : []),
            // Dev has no service worker: a stale cache while editing is worse
            // than no offline support.
            ...(isProduction
                ? [
                      new InjectManifest({
                          swSrc: './src/service-worker/sw.ts',
                          swDest: 'service-worker.js',
                          // Source maps are emitted outside dist and must never
                          // be precached; nor should the host rewrite files.
                          exclude: [/\.map$/, /^_redirects$/, /^og-image\.png$/],
                          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                      }),
                  ]
                : []),
        ],
        devServer: {
            static: path.resolve(__dirname, 'public'),
            historyApiFallback: true,
            hot: true,
            port: 3000,
            open: true,
            // The API is reached same-origin so the browser never negotiates
            // CORS in development, and the client needs no environment-specific
            // base URL. Production is expected to proxy /api the same way.
            proxy: [
                {
                    context: ['/api'],
                    target: 'http://localhost:8787',
                },
            ],
        },
        optimization: {
            // Split the framework and icon library out of the app bundle so
            // they stay cached across deploys.
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    react: {
                        test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
                        name: 'react',
                        priority: 20,
                    },
                    icons: {
                        test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
                        name: 'icons',
                        priority: 15,
                    },
                    // The homepage's motion libraries load after first paint and
                    // never on an app route. Left in `vendor` they would be
                    // pulled into the entry, which is exactly what the homepage
                    // is built to avoid.
                    motion: {
                        test: /[\\/]node_modules[\\/](gsap|lenis)[\\/]/,
                        name: 'motion',
                        chunks: 'async',
                        priority: 25,
                    },
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendor',
                        priority: 10,
                    },
                },
            },
            runtimeChunk: 'single',
        },
        // A budget that fails on regressions is more useful than webpack's
        // default warning, while leaving room for the current app shell.
        performance: isProduction
            ? {
                  hints: 'error',
                  maxEntrypointSize: 450 * 1024,
                  maxAssetSize: 5 * 1024 * 1024,
              }
            : false,
        // hidden-source-map still emits .map files for error reporting but omits
        // the sourceMappingURL comment, so browsers do not fetch and expose the
        // original TSX. Upload the maps to the error tracker; do not deploy them.
        devtool: isProduction ? 'hidden-source-map' : 'eval-source-map',
    };
};

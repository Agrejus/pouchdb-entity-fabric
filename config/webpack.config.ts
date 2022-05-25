import * as path from 'path';
import * as webpack from 'webpack';
import * as fs from 'fs';

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath: string) => path.resolve(appDirectory, relativePath);

// Chunking - https://medium.com/hackernoon/the-100-correct-way-to-split-your-chunks-with-webpack-f8a9df5b7758
const config: webpack.Configuration = {
    target: "node",
    // Set the entry to the application chunk which points to index.tsx
    entry: [
        "./src/DataContext.ts",
        "./src/DbSet.ts"
    ],
    // Set the naming convention of our bundles
    output: {
        pathinfo: true,
        filename: "index.js",
        path: path.resolve(__dirname, '../dist'),
        libraryTarget: "commonjs"
    },
    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".js", ".json"],
        // modules: ['../src', 'node_modules']
        modules: ['node_modules', resolveApp('node_modules')]
    },

    // Configure our module loaders
    module: {
        strictExportPresence: true,
        rules: [
            { parser: { requireEnsure: false } },
            {
                test: /\.node$/,
                loader: "node-loader",
            },
            {
                test: /\.(ts|tsx)?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(js|jsx|mjs)$/,
                loader: require.resolve('source-map-loader'),
                enforce: 'pre',
                include: path.resolve(__dirname, '../src'),
            }
        ]
    },

    // Configure any plugins
    plugins: [

    ],

    // Turn off performance hints during development because we don't do any
    // splitting or minification in interest of speed. These warnings become
    // cumbersome.
    performance: {
        hints: false,
    }
};

export default config;
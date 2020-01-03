const path = require("path")
var HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
    mode: "development",
    entry: "./src/index.ts",
    // devtool: "inline-source-map",
    plugins: [
        new HtmlWebpackPlugin({
            // Required
            inject: false,
            // template: require("html-webpack-template"),
            template: "./src/index.ejs",
        }),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: "/node_modules/",
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
    },
    devtool: "source-map",
}

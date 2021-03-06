"use strict";
var babel = require("@babel/core");
var acorn = require("acorn");
var log4js = require("log4js");
var log;
var walk;
var isEs6 = function (ast) {
    var es6NodeFound = false;
    if (ast.body) {
        var visitNode = function (node, state, c) {
            if (!es6NodeFound) {
                walk.base[node.type](node, state, c);
                switch (node.type) {
                    case "ArrowFunctionExpression":
                    case "ClassDeclaration":
                    case "ExportAllDeclaration":
                    case "ExportDefaultDeclaration":
                    case "ExportNamedDeclaration":
                    case "ImportDeclaration":
                        es6NodeFound = true;
                        break;
                    case "VariableDeclaration":
                        if (node.kind === "const" || node.kind === "let") {
                            es6NodeFound = true;
                            break;
                        }
                    default:
                }
            }
        };
        walk.recursive(ast, null, {
            Expression: visitNode,
            Statement: visitNode
        });
    }
    return es6NodeFound;
};
var configure = function (options) {
    options = options || {};
    if (!options.presets || options.presets.length === 0) {
        options.presets = [["@babel/preset-env"]];
    }
    var transform = function (context, callback) {
        if (!context.js) {
            return callback(undefined, false);
        }
        if (isEs6(context.js.ast)) {
            options.filename = context.filename;
            log.debug("Transforming %s", options.filename);
            try {
                context.source = babel.transform(context.source, options).code;
                context.js.ast = acorn.parse(context.source, { sourceType: "module" });
                return callback(undefined, true);
            }
            catch (error) {
                return callback(error, false);
            }
        }
        else {
            return callback(undefined, false);
        }
    };
    var initialize = function (logOptions) {
        log4js.configure({
            appenders: logOptions.appenders,
            categories: {
                default: {
                    appenders: Object.keys(logOptions.appenders),
                    level: logOptions.level
                }
            }
        });
        log = log4js.getLogger("es6-transform.karma-typescript");
        walk = require("acorn-walk");
    };
    return Object.assign(transform, { initialize: initialize });
};
module.exports = configure;
//# sourceMappingURL=transform.js.map
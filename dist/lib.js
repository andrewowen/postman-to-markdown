#!/usr/bin/env node
"use strict";

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _json2md = require("json2md");

var _json2md2 = _interopRequireDefault(_json2md);

var _commander = require("commander");

var _commander2 = _interopRequireDefault(_commander);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

String.prototype.replaceAll = function (search, replacement) {
  return this.split(search).join(replacement);
};

_commander2.default.version("0.0.1").description("A postman collection to markdown generator.").command("* <file>").action(function (file) {
  var filePath = _path2.default.resolve(file);
  var readOptions = { flag: "r+", encoding: "utf8" };
  _fs2.default.readFile(filePath, readOptions, function (err, data) {
    if (err) {
      fatalError(err);
    }

    var obj = JSON.parse(data);
    var res = parseItems(obj);
    var dirName = obj.info.name;
    res.forEach(function (element) {
      var outputPath = _path2.default.resolve(__dirname + "/" + dirName + "/" + element.path.replaceAll(" ", "_").toLowerCase() + ".md");
      mkDirByPathSync(_path2.default.dirname(outputPath));
      _fs2.default.writeFileSync(outputPath, element.data);
    });
  });
}).usage("<file>");
_commander2.default.parse(process.argv);

function parseItems(scope) {
  var pathPrefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";

  var items = [];
  if (scope.item != null) {
    scope.item.forEach(function (element) {
      if (element.item != null) {
        var inner = parseItems(element, pathPrefix + "/" + element.name);
        items = items.concat(inner);
      } else {
        var md = convertItemToMarkdown(element, pathPrefix);
        items.push(md);
      }
    });
  }
  return items;
}

function convertItemToMarkdown(item) {
  var pathPrefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";

  var markdownModel = [{ h1: item.name || "" }, { p: item.request.description || "" }, { h3: "URL" }, { code: { "language": "txt", "content": "/" + item.request.url.path.join("/") || "" } }, { h3: "Method" }, { code: { "language": "txt", "content": item.request.method || "" } }, { h2: "Request" }, { h3: "Headers" }, {
    table: {
      headers: ["key", "value"],
      rows: item.request.header || []
    }
  }, { h3: "Body" }, { code: { "language": "txt", "content": item.request.body.raw || "" } }, { h2: "Response" }];
  console.log(JSON.stringify(markdownModel));
  return {
    path: pathPrefix + "/" + item.name,
    data: (0, _json2md2.default)(markdownModel)
  };
}

function fatalError(err) {
  console.error(err);
  process.exit(1);
}

/**
 * Sourced from https://stackoverflow.com/a/40686853/5172531
 */
function mkDirByPathSync(targetDir) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$isRelativeToScri = _ref.isRelativeToScript,
      isRelativeToScript = _ref$isRelativeToScri === undefined ? false : _ref$isRelativeToScri;

  var sep = _path2.default.sep;
  var initDir = _path2.default.isAbsolute(targetDir) ? sep : "";
  var baseDir = isRelativeToScript ? __dirname : ".";

  return targetDir.split(sep).reduce(function (parentDir, childDir) {
    var curDir = _path2.default.resolve(baseDir, parentDir, childDir);
    try {
      _fs2.default.mkdirSync(curDir);
    } catch (err) {
      if (err.code === "EEXIST") {
        // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === "ENOENT") {
        // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error("EACCES: permission denied, mkdir \"" + parentDir + "\"");
      }

      var caughtErr = ["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1;
      if (!caughtErr || caughtErr && targetDir === curDir) {
        throw err; // Throw if it"s just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}
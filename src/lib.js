#!/usr/bin/env node
import fs from "fs";
import path from "path";
import json2md from "json2md";
import program from "commander";

String.prototype.replaceAll = function (search, replacement) {
  return this.split(search).join(replacement);
}

program.version("0.0.1")
  .description("A postman collection to markdown generator.")
  .command("* <file>")
  .action(file => {
    const filePath = path.resolve(file);
    const readOptions = { flag: "r+", encoding: "utf8" };
    fs.readFile(filePath, readOptions, (err, data) => {
      if (err) { fatalError(err); }

      let obj = JSON.parse(data);
      let res = parseItems(obj);
      let dirName = obj.info.name;
      res.forEach(element => {
        let outputPath = path.resolve(`${__dirname}/${dirName}/${element.path.replaceAll(" ", "_").toLowerCase()}.md`);
        mkDirByPathSync(path.dirname(outputPath));
        fs.writeFileSync(outputPath, element.data);
      });
    })
  })
  .usage("<file>");
program.parse(process.argv);

function parseItems(scope, pathPrefix = "") {
  let items = [];
  if (scope.item != null) {
    scope.item.forEach(element => {
      if (element.item != null) {
        const inner = parseItems(element, `${pathPrefix}/${element.name}`);
        items = items.concat(inner);
      } else {
        let md = convertItemToMarkdown(element, pathPrefix);
        items.push(md);
      }
    });
  }
  return items;
}

function convertItemToMarkdown(item, pathPrefix = "") {
  let markdownModel = [
    { h1: item.name || "" },
    { p: item.request.description || "" },
    { h3: "URL" },
    { code: { "language": "txt", "content": `/${item.request.url.path.join("/")}` || "" } },
    { h3: "Method" },
    { code: { "language": "txt", "content": item.request.method || "" } },
    { h2: "Request" },
    { h3: "Headers" },
    {
      table: {
        headers: ["key", "value"],
        rows: item.request.header || []
      }
    },
    { h3: "Body" },
    { code: { "language": "txt", "content": item.request.body.raw || "" } },
    { h2: "Response" }
  ];
  return {
    path: `${pathPrefix}/${item.name}`,
    data: json2md(markdownModel)
  };
}

function fatalError(err) {
  console.error(err);
  process.exit(1);
}

/**
 * Sourced from https://stackoverflow.com/a/40686853/5172531
 */
function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : "";
  const baseDir = isRelativeToScript ? __dirname : ".";

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === "EEXIST") { // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === "ENOENT") { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir "${parentDir}"`);
      }

      const caughtErr = ["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1;
      if (!caughtErr || caughtErr && targetDir === curDir) {
        throw err; // Throw if it"s just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}

"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var fs_1 = require("fs");
var glob_1 = require("glob");
var ts = require("typescript");
var typescript_1 = require("typescript");
/** visit nodes finding exported classes */
var visitor = function (node) {
    var _a;
    console.log('Node kind -', typescript_1.SyntaxKind[node.kind]);
    if (ts.isImportDeclaration(node)) {
        console.log('Reading node....');
        //return undefined;
    }
    return (_a = ts.forEachChild(node, visitor)) !== null && _a !== void 0 ? _a : node;
};
(0, glob_1.glob)('src/**/*.ts*', function (err, files) {
    var program = ts.createProgram(__spreadArray([], files, true), {
        allowJs: false,
        declaration: false
    });
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var sourceFile = _a[_i];
        var fileName = sourceFile.getSourceFile().fileName;
        if (sourceFile.getSourceFile().fileName.endsWith('app.ts')) {
            var sf = ts.createSourceFile(fileName, (0, fs_1.readFileSync)(fileName).toString(), ts.ScriptTarget.ES2015);
            var updatedSource = ts.visitNode(sf, visitor);
            console.log(updatedSource.getFullText().toString());
            ts.createPrinter({
                noEmitHelpers: true
            }).printFile(updatedSource);
        }
    }
    // files.forEach(file => {
    // 	const sourceFile = program.getSourceFile(file)!;
    // 	// sourceFile.getSourceFile();
    // 	console.log(`File - ${file} has ${sourceFile.statements.length} statements`);
    // 	console.log('Source file is -', sourceFile.getFullText());
    // 	ts.forEachChild(sourceFile, visitor);
    // });
});

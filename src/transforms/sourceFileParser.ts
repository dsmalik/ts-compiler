import { readFileSync } from 'fs';
import { glob } from 'glob';
import * as ts from 'typescript';
import { SyntaxKind } from 'typescript';

/** visit nodes finding exported classes */
const visitor = (node: ts.Node): ts.Node | undefined => {
	console.log('Node kind -', SyntaxKind[node.kind]);
	if (ts.isImportDeclaration(node)) {
		console.log('Reading node....');
		//return undefined;
	}

	return ts.forEachChild(node, visitor) ?? node;
};

glob('src/**/*.ts*', (err, files) => {
	const program = ts.createProgram([...files], {
		allowJs: false,
		declaration: false
	});

	for (const sourceFile of program.getSourceFiles()) {
		const fileName = sourceFile.getSourceFile().fileName;
		if (sourceFile.getSourceFile().fileName.endsWith('app.ts')) {
			const sf = ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES2015);

			const updatedSource = ts.visitNode(sf, visitor);

			console.log(updatedSource.getFullText().toString());
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

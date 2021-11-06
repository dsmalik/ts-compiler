import { ImportDeclaration, ImportSpecifier, LanguageService, Project, SourceFile } from 'ts-morph';
import * as ts from 'typescript';

const project = new Project({
	// tsConfigFilePath: './tsconfig.json'
	skipAddingFilesFromTsConfig: true,
});
project.addSourceFilesAtPaths('src/**/*.ts');

const sourceFiles = project.getSourceFiles();
const typeChecker = project.getTypeChecker();

console.log('Total Source files - ', sourceFiles.length);

const files = [];
const getReferencedFiles = (filePath: string): string[] => {
	const referencedFiles = getReferencedFiles(filePath);
	files.push(referencedFiles);
	if (referencedFiles) {
		referencedFiles.forEach((file) => {
			if (files.length > 20) {
				return [];
			}
			const refFiles = getReferencedFiles(file);
			files.push(refFiles);
			return refFiles;
		});
	}

	return referencedFiles;
};

const languageService = project.getLanguageService();
const basePath = '.';
const imports: Map<string, string> = new Map<string, string>();

let i = 1;

const shouldIgnoreImportDeclaration = (importDeclration: ImportDeclaration) => {
	return false;
};

const getImportInfo = (ni: ImportSpecifier) => {
	return `${ni.getName()} - ${imports.get(ni.getName())} - Text Range - [${ni.getStart()}, ${ni.getEnd()}]`;
};

const getImportsWithAbsolutePaths = (sourceFile: SourceFile, importDeclaration: ImportDeclaration) => {
	const fileImports: Map<string, string> = new Map<string, string>();
	const importLocationsToRemove = new Array<{ start: number; end: number; index: number }>();
	if (shouldIgnoreImportDeclaration(importDeclaration)) {
		return fileImports;
	} else {
		importLocationsToRemove.push({
			start: importDeclaration.getFullStart(),
			end: importDeclaration.getEnd(),
			index: importDeclaration.getChildIndex(),
		});
	}

	const namedImports = importDeclaration.getNamedImports();

	namedImports.forEach((ni) => {
		const importName = ni.getName();

		if (imports.has(importName)) {
			fileImports.set(importName, imports.get(importName)!);
			console.log(`  Cached Import - ${getImportInfo(ni)}`);
		} else {
			const definitions = languageService.getDefinitionsAtPosition(sourceFile, ni.getStart());

			definitions.forEach((def) => {
				if (imports.has(importName)) {
					fileImports.set(importName, imports.get(importName)!);
					console.log(`  Cached Import - ${ni.getName()} - ${imports.get(ni.getName())}`);
				} else {
					console.log(`     Import - ${ni.getName()} - ${def.getSourceFile().getFilePath()}`);
					let importAbsolutePath = '';
					const sourceDirectoryPath = def.getSourceFile().getDirectoryPath();
					if (sourceDirectoryPath.indexOf('node_modules/') > 0) {
						importAbsolutePath =
							sourceDirectoryPath.substring(sourceDirectoryPath.indexOf('node_modules/') + 13) +
							def.getSourceFile().getBaseNameWithoutExtension();

						console.log(`  Import path - ${importName} = ${importAbsolutePath}`);
					} else {
						importAbsolutePath =
							sourceDirectoryPath.substring(sourceDirectoryPath.indexOf('/src') + 1) +
							'/' +
							def.getSourceFile().getBaseNameWithoutExtension();

						console.log(`  Import path - ${importName} = ${importAbsolutePath}`);
					}

					imports.set(importName, importAbsolutePath);
					fileImports.set(importName, imports.get(importName)!);
				}
			});
		}
	});

	return fileImports;
	// // // // // importDeclaration.remove();
}

const getInformation = (filePath: string, ignoreBasePath: boolean = true): [imports: Map<string, string>, sf: SourceFile] => {
	const fileImports: Map<string, string> = new Map<string, string>();

	const sourceFile = project.addSourceFileAtPath(filePath);
	const currentFilePath = sourceFile.getFilePath();
	console.log(`${i++} - Source file to scan - ${sourceFile.getFilePath()}`);

	

	sourceFile.getImportDeclarations().forEach((importDeclaration) => {
		//return handleImportDeclaration(importDeclaration);
		
	});

	// // // // // fileImports.forEach((v, k) => {
	// // // // // 	if (!v) {
	// // // // // 		console.log(`${currentFilePath} - Could not map import - ${k}`);
	// // // // // 	}

	// // // // // 	sourceFile.insertStatements(0, `import {${k}} from '${v}';`);
	// // // // // });

	return [fileImports, sourceFile];
};

export const factory = (/**/) => {
	function visitor(ctx: ts.TransformationContext, sf: ts.SourceFile) {
		const visitor2: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
			return node;
		};

		console.log('============Visiting file - ', sf.fileName);
		const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
			if (ts.isSourceFile(node) && node.getSourceFile().fileName.indexOf('app.spec') > 0) {

				// const [allNamedImports, sf1] = getInformation(node.fileName, false);

				// for (const x of allNamedImports) {
				// 	console.log(`${x[0]} - ${x[1]}`);
				// }

				console.log('manipulating spec file');
				const n = ts.updateSourceFileNode(sf, [
					ts.createImportDeclaration(
						undefined,
						undefined,
						ts.createImportClause(
							undefined,
							ts.createNamedImports([
								ts.createImportSpecifier(undefined, ts.createIdentifier('getName1')),
								ts.createImportSpecifier(undefined, ts.createIdentifier('getName')),
							])
						),
						ts.createLiteral('./libs132')
					),
					// Ensures the rest of the source files statements are still defined.
					...sf.statements,
				]);

				console.log('');
				console.log('New Node is - ', ts.createPrinter().printFile(n));
				console.log('');

				return ts.visitEachChild(n, visitor2, ctx);
			}

			return ts.visitEachChild(node, visitor2, ctx);
		};

		return visitor;
	}

	return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
		return (sf: ts.SourceFile) => {
			// const newSource = ts.factory.updateSourceFile(sf, [
			// 	ts.factory.createImportDeclaration(
			// 		undefined,
			// 		undefined,
			// 		ts.factory.createImportClause(
			// 			false,
			// 			undefined,
			// 			ts.factory.createNamedImports([
			// 				ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('a')),
			// 			])
			// 		),
			// 		ts.factory.createStringLiteral('help')
			// 	),
			// 	// Ensures the rest of the source files statements are still defined.
			// 	...sf.statements,
			// ]);

			return ts.visitNode(sf, visitor(ctx, sf));
		};
	};
};

// sourceFiles.forEach((s) => {
// 	const sourceFile = getInformation(s.getSourceFile().getFilePath(), false);

// 	console.log('Source file - ', sourceFile.print());
// });
// 	// console.log('Checking File - ', s.getSourceFile().getFilePath());
// 	// s.getImportDeclarations().forEach((si) => {
// 	// 	console.log('  Full import text - ', si.getText());
// 	// 	// const l: LanguageService = LanguageService.;
// 	// 	console.log('    Imported member -', si.getImportClause()?.getText());
// 	// 	// si.getModuleSpecifierSourceFile()?.getSourceFile().getImportDeclaration("getName");
// 	// 	si.getModuleSpecifierSourceFile()
// 	// 		?.getReferencedSourceFiles()
// 	// 		.forEach((refFile) => {
// 	// 			console.log('      Referenced file - ', refFile.getFilePath());
// 	// 		});
// 	// 	console.log();
// 	// 	si.getNamedImports().forEach((namedImport) => {
// 	// 		console.log('   Named import -', namedImport.getName());
// 	// 		// console.log('ok  ', namedImport.getImportDeclaration().getSourceFile().getFilePath());
// 	// 		// namedImport.getImportDeclaration().gets
// 	// 		const a = namedImport.getSymbol()?.getAliasedSymbol();
// 	// 		const exports = typeChecker.getDeclaredTypeOfSymbol(a!);
// 	// 		console.log();
// 	// 		namedImport
// 	// 			.getType()
// 	// 			.getSymbol()
// 	// 			?.getDeclarations()
// 	// 			.map((d) => d.getSourceFile())
// 	// 			.forEach((sf) => {
// 	// 				console.log('       Referenced Path is - ', sf.getFilePath());
// 	// 			});
// 	// 	});
// 	// 	// console.log('   Imports -', s.getText());
// 	// 	// console.log('      -----', s.getFullText());
// 	// });
// 	// s.getReferencedSourceFiles().forEach(s => {
// 	//   console.log('   Depends on -', s.getFilePath());
// 	// });
// 	// s.getReferencingSourceFiles().forEach(s => {
// 	//   console.log('   Used by -', s.getFilePath());
// 	// });
// 	// console.log();
// });

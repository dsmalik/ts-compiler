import { ImportDeclaration, ImportSpecifier, Project, SourceFile } from 'ts-morph';
import * as ts from 'typescript';

const project = new Project({
	// tsConfigFilePath: './tsconfig.json'
	skipAddingFilesFromTsConfig: true
});
project.addSourceFilesAtPaths('src/**/*.ts');

const sourceFiles = project.getSourceFiles();

console.log('Total Source files - ', sourceFiles.length);

const files = [];
const getReferencedFiles = (filePath: string): string[] => {
	const referencedFiles = getReferencedFiles(filePath);
	files.push(referencedFiles);
	if (referencedFiles) {
		referencedFiles.forEach(file => {
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
			index: importDeclaration.getChildIndex()
		});
	}

	const namedImports = importDeclaration.getNamedImports();

	namedImports.forEach(ni => {
		const importName = ni.getName();

		if (imports.has(importName)) {
			fileImports.set(importName, imports.get(importName)!);
			console.log(`  TSMORPH - Cached Import - ${getImportInfo(ni)}`);
		} else {
			const definitions = languageService.getDefinitionsAtPosition(sourceFile, ni.getStart());

			definitions.forEach(def => {
				if (imports.has(importName)) {
					fileImports.set(importName, imports.get(importName)!);
					console.log(`  TSMORPH - Cached Import - ${ni.getName()} has path - ${imports.get(ni.getName())}`);
				} else {
					console.log(
						`    TSMORPH - Import - ${ni.getName()} has path - ${def.getSourceFile().getFilePath()}`
					);
					let importAbsolutePath = '';
					const sourceDirectoryPath = def.getSourceFile().getDirectoryPath();
					if (sourceDirectoryPath.indexOf('node_modules/') > 0) {
						importAbsolutePath =
							sourceDirectoryPath + '/' + def.getSourceFile().getBaseNameWithoutExtension();

						//console.log(`  Import path - ${importName} = ${importAbsolutePath}`);
					} else {
						importAbsolutePath =
							sourceDirectoryPath + '/' + def.getSourceFile().getBaseNameWithoutExtension();

						//console.log(`  Import path - ${importName} = ${importAbsolutePath}`);
					}

					imports.set(importName, importAbsolutePath);
					fileImports.set(importName, imports.get(importName)!);
				}
			});
		}
	});

	return fileImports;
};

// Import that we changing to absolute path and need to track so that we can update the symbols
let importNamesToUpdateSymbolFor: string[] = [];

export const factory = (/**/) => {
	function visitor(ctx: ts.TransformationContext, sf: ts.SourceFile) {
		console.log('============Visiting file - ', sf.fileName);
		const sourceFileToScan = project.addSourceFileAtPath(sf.fileName);

		const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
			//// Uncommenting this block fixes the test since we are manually changing identifier to what it transpiles to
			// if (ts.isIdentifier(node)) {
			// 	// For an import with name - getName, it transpiles to getName_1 in require syntax, so the identifier becomes getName_1.getName
			// 	// So doing it manually here instead of changing the symbol which i am looking how to properly?
			// 	const newNode = ts.createIdentifier(
			// 		`${importNamesToUpdateSymbolFor.includes(node.text) ? `${node.text}_1.${node.text}` : node.text}`
			// 	);
			// 	return newNode;
			// }

			if (ts.isImportDeclaration(node)) {
				console.log('  ### Import declaration -', node.getText());

				const importDeclaration = sourceFileToScan.getImportDeclaration(id => id.getText() === node.getText());
				if (importDeclaration) {
					const importsToChange = getImportsWithAbsolutePaths(sourceFileToScan, importDeclaration);
					console.log(`  ### Found ${importsToChange.size} imports to change`);

					const newImports: Map<string, Array<string>> = new Map<string, Array<string>>();

					for (const importToChange of importsToChange) {
						importNamesToUpdateSymbolFor.push(importToChange[0]);
						console.log(`   $$$$$$ Import ${importToChange[0]} - ${importToChange[1]}`);
						if (newImports.has(importToChange[1])) {
							newImports.set(importToChange[1], [
								...newImports.get(importToChange[1])!,
								importToChange[0]
							]);
						} else {
							newImports.set(importToChange[1], [importToChange[0]]);
						}
					}

					const importDeclarationToAdd: ts.ImportDeclaration[] = [];
					for (const newImport of newImports) {
						const importSpecifiers: ts.ImportSpecifier[] = [];
						newImport[1].forEach(imp => {
							importSpecifiers.push(ts.createImportSpecifier(undefined, ts.createIdentifier(imp)));
						});

						if (importSpecifiers.length) {
							const d = ts.createImportDeclaration(
								undefined,
								undefined,
								ts.createImportClause(undefined, ts.createNamedImports(importSpecifiers)),
								ts.createLiteral(newImport[0])
							);
							importDeclarationToAdd.push(d);
						}
					}

					console.log('############################################');
					// Update the Current node by sending new imports
					return [...importDeclarationToAdd];
				} else {
					console.log('  ### Could not find import declaration for - ', node.getText());
				}
			}

			try {
				return ts.visitEachChild(node, visitor, ctx);
			} finally {
				// console.log(ts.createPrinter().printFile(node))
			}
		};

		return visitor;
	}

	return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
		return (sf: ts.SourceFile) => {
			let newS: ts.SourceFile = sf;

			if (sf.fileName.indexOf('app.spec') > 0) {
				try {
					newS = ts.visitNode(sf, visitor(ctx, sf));
					return newS;
				} finally {
					console.log(
						'### Problem here - How to change Symbols for these identifiers?? -',
						importNamesToUpdateSymbolFor
					);
					console.log('Updated source is - ');
					console.log(ts.createPrinter().printFile(newS));
					// console.log('   ________________File updated... -', newS.getFullText());
					// console.log(' Import Symbol to update -', importNamesToUpdateSymbol);
				}
			}

			return sf;
		};
	};
};

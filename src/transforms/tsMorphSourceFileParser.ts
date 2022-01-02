import { Project } from 'ts-morph';

const project = new Project({
	tsConfigFilePath: 'tsconfig.json',
	skipFileDependencyResolution: true
});

project.getSourceFiles().forEach(f => {
	if (f.getFilePath().endsWith('app.ts')) {
		console.log('File - ', f.getFilePath());

		f.getExportSymbols().forEach(s => {
			console.log('  Symbol -', s.getName());
		});
	}
});

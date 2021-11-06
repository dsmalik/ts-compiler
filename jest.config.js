/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	preset: 'ts-jest',
	rootDir: '.',
	testEnvironment: 'node',
	globals: {
		'ts-jest': {
			astTransformers: ['./dist/index.js'],
			tsConfig: 'tsconfig.json',
		},
	},
	moduleFileExtensions: ['ts', 'js'],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest',
	},
	transformIgnorePatterns: ['node_modules/(?!variables/.*)'],
};

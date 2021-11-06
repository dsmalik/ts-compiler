import * as ts from 'typescript';
import { SyntaxKind } from 'typescript';

const scanner = ts.createScanner(ts.ScriptTarget.ES2015, true);

scanner.setText('export const a = 10; const b = ');

let currentToken = scanner.scan();
do {
    const token = currentToken;
    console.log(SyntaxKind[token]);

    currentToken = scanner.scan();
}
while (currentToken != SyntaxKind.EndOfFileToken)

import * as vscode from 'vscode';

export class MethodAnalyzer {
    findMethodStartLine(document: vscode.TextDocument, currentLine: number): number {
        for (let line = currentLine; line >= 0; line--) {
            const text = document.lineAt(line).text.trim();
            if (text.match(/^(public|private|protected)?\s*function\s+\w+/)) {
                return line;
            }
        }
        return currentLine;
    }
}

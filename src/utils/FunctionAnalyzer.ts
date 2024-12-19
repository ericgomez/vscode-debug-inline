import * as vscode from 'vscode';
import { IFunctionAnalyzer } from '../interfaces/DebugTypes';

export class FunctionAnalyzer implements IFunctionAnalyzer {
    findFunctionStartLine(document: vscode.TextDocument, currentLine: number): number {
        for (let line = currentLine; line >= 0; line--) {
            const lineText = document.lineAt(line).text.trim();

            if (lineText.includes('function ') || 
                lineText.match(/function\s*\(/) ||
                lineText.match(/function\(\)/) ||
                lineText.match(/fn\s*\(/)) {
                return line;
            }
        }
        return currentLine;
    }

    isCommentOrEmptyLine(lineText: string): boolean {
        return lineText === '' || 
               lineText.startsWith('//') || 
               lineText.startsWith('/*') || 
               lineText.startsWith('*');
    }
}

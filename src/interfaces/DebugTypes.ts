import * as vscode from 'vscode';

export interface DebugStackFrameInternal {
    id: number;
    source?: {
        path?: string;
    };
    line: number;
}

export interface IFunctionAnalyzer {
    findFunctionStartLine(document: vscode.TextDocument, currentLine: number): number;
    isCommentOrEmptyLine(lineText: string): boolean;
}

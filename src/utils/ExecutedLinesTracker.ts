import * as vscode from 'vscode';
import { DebugStackFrameInternal } from '../interfaces/DebugTypes';
import { FunctionAnalyzer } from './FunctionAnalyzer';

export class ExecutedLinesTracker {
    private executedLines: Map<string, Set<number>> = new Map();
    private functionAnalyzer: FunctionAnalyzer;

    constructor() {
        this.functionAnalyzer = new FunctionAnalyzer();
    }

    async updateExecutedLines(session: vscode.DebugSession, document: vscode.TextDocument) {
        try {
            const threads = await session.customRequest('threads');
            if (!threads?.threads?.length) {
                return;
            }

            const threadId = threads.threads[0].id;
            const stackTrace = await session.customRequest('stackTrace', {
                threadId: threadId,
                startFrame: 0,
                levels: 20
            });

            if (!stackTrace?.stackFrames?.length) {
                return;
            }

            const currentFrame = (stackTrace.stackFrames as DebugStackFrameInternal[]).find(
                frame => frame.source?.path === document.uri.fsPath
            );

            if (currentFrame) {
                const currentLine = currentFrame.line - 1;
                const currentFile = document.uri.fsPath;

                this.executedLines.clear();
                
                let fileLines = this.executedLines.get(currentFile);
                if (!fileLines) {
                    fileLines = new Set<number>();
                    this.executedLines.set(currentFile, fileLines);
                }

                const functionStartLine = this.functionAnalyzer.findFunctionStartLine(document, currentLine);

                for (let line = functionStartLine; line < currentLine; line++) {
                    const lineText = document.lineAt(line).text.trim();
                    
                    if (this.functionAnalyzer.isCommentOrEmptyLine(lineText)) {
                        continue;
                    }
                    
                    fileLines.add(line);
                }
            }
        } catch (error) {
            console.error('Error updating executed lines:', error);
        }
    }

    hasLineBeenExecuted(filePath: string, lineNumber: number): boolean {
        const fileLines = this.executedLines.get(filePath);
        return fileLines ? fileLines.has(lineNumber) : false;
    }
}

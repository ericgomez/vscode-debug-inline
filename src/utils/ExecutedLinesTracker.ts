import * as vscode from 'vscode';
import { MethodAnalyzer } from './MethodAnalyzer';

export class ExecutedLinesTracker {
    private executedLines: Map<string, Set<number>> = new Map();
    private lastSessionId: string | undefined;
    private lastStopLine: number | undefined;
    private lastStopFile: string | undefined;
    private methodAnalyzer: MethodAnalyzer;

    constructor() {
        this.methodAnalyzer = new MethodAnalyzer();
    }

    async updateExecutedLines(session: vscode.DebugSession, document: vscode.TextDocument) {
        try {
            if (this.lastSessionId !== session.id) {
                this.executedLines.clear();
                this.lastSessionId = session.id;
                this.lastStopLine = undefined;
                this.lastStopFile = undefined;
            }

            const threads = await session.customRequest('threads');
            if (!threads || !threads.threads || threads.threads.length === 0) {
                return;
            }

            const threadId = threads.threads[0].id;

            const stackTrace = await session.customRequest('stackTrace', {
                threadId: threadId,
                startFrame: 0,
                levels: 20,
                format: {
                    parameters: true,
                    parameterTypes: true,
                    parameterNames: true,
                    line: true,
                    module: true
                }
            });

            let currentMethodFrame = null;
            for (const frame of stackTrace.stackFrames) {
                if (frame.source && frame.source.path === document.uri.fsPath) {
                    currentMethodFrame = frame;
                    break;
                }
            }

            if (currentMethodFrame) {
                const currentLine = currentMethodFrame.line - 1;
                const currentFile = document.uri.fsPath;

                if (this.lastStopLine !== currentLine || this.lastStopFile !== currentFile) {
                    this.executedLines.clear();
                    this.lastStopLine = currentLine;
                    this.lastStopFile = currentFile;
                }

                const methodStartLine = this.methodAnalyzer.findMethodStartLine(document, currentLine);

                let fileLines = this.executedLines.get(currentFile);
                if (!fileLines) {
                    fileLines = new Set<number>();
                    this.executedLines.set(currentFile, fileLines);
                }

                for (let line = methodStartLine; line < currentLine; line++) {
                    fileLines.add(line);
                }

                for (let i = 1; i < stackTrace.stackFrames.length; i++) {
                    const frame = stackTrace.stackFrames[i];
                    if (frame.source && frame.source.path === currentFile) {
                        const frameLine = frame.line - 1;
                        if (frameLine < currentLine) {
                            fileLines.add(frameLine);
                        }
                    }
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

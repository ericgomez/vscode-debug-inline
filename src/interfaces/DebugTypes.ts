import * as vscode from 'vscode';

export interface DebugStackFrameInternal {
    id: number;
    source?: {
        path?: string;
    };
    line: number;
}

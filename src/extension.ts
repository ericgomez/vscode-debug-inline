import * as vscode from 'vscode';
import { PHPDebugInlineProvider } from './providers/PHPDebugInlineProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Debug Inline is now active');

    const inlineValuesProvider = new PHPDebugInlineProvider();
    
    const disposable = vscode.languages.registerInlineValuesProvider(
        { language: 'php' },
        inlineValuesProvider
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}
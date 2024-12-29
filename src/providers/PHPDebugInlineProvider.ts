import * as vscode from 'vscode';
import { ValueFormatter } from '../utils/ValueFormatter';
import { ExecutedLinesTracker } from '../utils/ExecutedLinesTracker';
import { ThisAnalyzer } from '../utils/ThisAnalyzer';

export class PHPDebugInlineProvider implements vscode.InlineValuesProvider {
    private executedLinesTracker: ExecutedLinesTracker;
    private valueFormatter: ValueFormatter;
    private thisAnalyzer: ThisAnalyzer;

    constructor() {
        this.valueFormatter = new ValueFormatter();
        this.executedLinesTracker = new ExecutedLinesTracker();
        this.thisAnalyzer = new ThisAnalyzer(this.valueFormatter);
    }

    async provideInlineValues(
        document: vscode.TextDocument,
        viewPort: vscode.Range,
        context: vscode.InlineValueContext
    ): Promise<vscode.InlineValue[]> {
        const session = vscode.debug.activeDebugSession;
        if (!session || !['php', 'php-inline-debug'].includes(session.type)) {
            return [];
        }

        try {
            const frameId = context.frameId;
            if (!frameId) {
                return [];
            }

            await this.executedLinesTracker.updateExecutedLines(session, document);

            const scopes = await session.customRequest('scopes', { frameId });
            const variables: vscode.InlineValue[] = [];

            for (const scope of scopes.scopes) {
                const response = await session.customRequest('variables', {
                    variablesReference: scope.variablesReference
                });

                for (let lineNum = viewPort.start.line; lineNum <= viewPort.end.line; lineNum++) {
                    if (!this.executedLinesTracker.hasLineBeenExecuted(document.uri.fsPath, lineNum)) {
                        continue;
                    }

                    const line = document.lineAt(lineNum);
                    const text = line.text;

                    const matches = text.matchAll(/\$[a-zA-Z_]\w*/g);
                    
                    for (const match of matches) {
                        const varName = match[0];
                        const variable = response.variables.find((v: any) => v.name === varName);

                        if (variable) {
                            if (variable.value === 'uninitialized') {
                                continue;
                            }

                            if (varName === '$this') {
                                const thisValues = await this.thisAnalyzer.analyzeThisProperties(
                                    session,
                                    variable,
                                    text,
                                    lineNum
                                );
                                variables.push(...thisValues);
                                continue;
                            }

                            const formattedValue = await this.valueFormatter.formatValue(variable, session);
                            
                            const columnStart = match.index!;
                            const columnEnd = columnStart + varName.length;

                            variables.push(new vscode.InlineValueText(
                                new vscode.Range(lineNum, columnStart, lineNum, columnEnd),
                                `${varName} = ${formattedValue}`
                            ));
                        }
                    }
                }
            }

            return variables;
        } catch (error) {
            console.error('Error providing inline values:', error);
            return [];
        }
    }
}

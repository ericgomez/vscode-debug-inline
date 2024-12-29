import * as vscode from 'vscode';
import { ValueFormatter } from './ValueFormatter';

export class ThisAnalyzer {
    constructor(
        private readonly valueFormatter: ValueFormatter
    ) {}

    public async analyzeThisProperties(
        session: vscode.DebugSession,
        thisVariable: any,
        lineText: string,
        lineNumber: number
    ): Promise<vscode.InlineValue[]> {
        const variables: vscode.InlineValue[] = [];

        if (!thisVariable.variablesReference) {
            return variables;
        }

        try {
            const thisRegex = /\$this->(\w+)\s*=/g;
            const matches = [...lineText.matchAll(thisRegex)];

            if (matches.length === 0) {
                return variables;
            }

            const thisProps = await session.customRequest('variables', {
                variablesReference: thisVariable.variablesReference
            });

            for (const match of matches) {
                const propName = match[1];
                const prop = thisProps.variables.find((v: any) => v.name === propName);
                
                if (prop) {
                    const formattedValue = await this.valueFormatter.formatValue(prop, session);
                    const propMatch = match.index! + '$this->'.length;
                    
                    variables.push(new vscode.InlineValueText(
                        new vscode.Range(lineNumber, propMatch, lineNumber, propMatch + propName.length),
                        `${propName} = ${formattedValue}`
                    ));
                }
            }
        } catch (error) {
            console.error('Error analyzing $this properties:', error);
        }

        return variables;
    }
}

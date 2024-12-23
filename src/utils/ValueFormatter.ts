import * as vscode from 'vscode';

export class ValueFormatter {
    async formatValue(variable: any, session?: vscode.DebugSession, maxDepth: number = 1): Promise<string> {
        const type = variable.type?.toLowerCase() || '';
        const value = variable.value;

        if (!value) {
            return 'null';
        }

        switch (type) {
            case 'array':
                return this.formatArray(variable, session, maxDepth);
            case 'object':
                return this.formatObject(variable, session, maxDepth);
            case 'string':
                return this.formatString(value);
            case 'boolean':
                return value === 'true' ? 'true' : 'false';
            case 'null':
                return 'null';
            case 'integer':
            case 'float':
            case 'double':
                return value;
            default:
                return value;
        }
    }

    private formatString(value: string): string {
        const cleanValue = value.replace(/[\r\n\t\b]/g, '');
        return `${cleanValue}`;
    }

    private async formatArray(variable: any, session?: vscode.DebugSession, maxDepth: number = 1): Promise<string> {
        if (!session || maxDepth <= 0 || !variable.variablesReference) {
            const cleanValue = variable.value.replace(/^array\s*\(/, '[').replace(/\)$/, ']');
            return cleanValue;
        }

        try {
            const response = await session.customRequest('variables', {
                variablesReference: variable.variablesReference
            });

            const items = await Promise.all(response.variables.map(async (v: any) => {
                const value = await this.formatValue(v, session, maxDepth - 1);
                return `${v.name}: ${value}`;
            }));

            return `[${items.join(', ')}]`;
        } catch (error) {
            console.error('Error expanding array:', error);
            return variable.value;
        }
    }

    private async formatObject(variable: any, session?: vscode.DebugSession, maxDepth: number = 1): Promise<string> {
        if (!session || maxDepth <= 0 || !variable.variablesReference) {
            return `{…}`;
        }

        try {
            const response = await session.customRequest('variables', {
                variablesReference: variable.variablesReference
            });

            const items = await Promise.all(response.variables.map(async (v: any) => {
                const value = await this.formatValue(v, session, maxDepth - 1);
                return `${v.name}: ${value}`;
            }));

            return `{${items.join(', ')}}`;
        } catch (error) {
            console.error('Error expanding object:', error);
            return `{…}`;
        }
    }
}

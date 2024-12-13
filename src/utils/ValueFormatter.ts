export class ValueFormatter {
    formatValue(variable: any): string {
        const type = variable.type?.toLowerCase() || '';
        const value = variable.value;

        if (!value) {
            return 'null';
        }

        switch (type) {
            case 'array':
                return this.formatArray(value);
            case 'object':
                return this.formatObject(value);
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
        return cleanValue;
    }

    private formatArray(value: string): string {
        const cleanValue = value.replace(/^array\s*\(/, '[').replace(/\)$/, ']');
        return cleanValue;
    }

    private formatObject(value: string): string {
        const matches = value.match(/^(\w+)#\d+\s*\((.*)\)$/);
        if (matches) {
            const className = matches[1];
            return `${className}{...}`;
        }
        return value;
    }
}

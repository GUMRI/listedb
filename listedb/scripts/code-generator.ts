import { ParsedInterface, ParsedProperty, ParsedEnum, ParsedTypeAlias, ParsedSchema } from './parser.js';
import ts from 'typescript';

// --- Helper Functions ---
const pluralize = (name: string) => name.endsWith('s') ? name + 'es' : name + 's';

// --- Type Translation ---
function translateDslToMainType(p: ParsedProperty): string {
    switch (p.dslType) {
        case 'id':
            return p.dslSubtype === 'uuid' ? 'string' : 'number';
        case 'unique':
        case 'index':
            return p.baseType;
        case 'oneFrom':
            return p.baseType;
        case 'manyFrom':
            return `${p.baseType}[]`;
        case 'logs':
            return `Log<${p.baseType}>[]`;
        case 'now':
        case 'updatedAt':
            return 'string'; // As per user example
        case 'primitive':
            return p.baseType;
        default:
            return 'any';
    }
}

function translateDslToCreateInputType(p: ParsedProperty): string {
    switch (p.dslType) {
        case 'oneFrom':
            return 'string'; // Assume IDs are strings
        case 'manyFrom':
            return 'string[]';
        default:
            return p.baseType;
    }
}

// --- Generator Sections ---

function generateImports(properties: ParsedProperty[]): string {
    const relationTypes = new Set<string>();
    properties.forEach(p => {
        if (p.dslType === 'oneFrom' || p.dslType === 'manyFrom') {
            relationTypes.add(p.baseType);
        }
    });

    let importStatements = `import { Log, QueryInput, listFactory, ListOptions } from '../src/core/types.js';`;
    for (const type of relationTypes) {
        importStatements += `\nimport type { ${type} } from './${type.toLowerCase()}.list.js';`;
    }
    return importStatements;
}

function generateDependencies(parsedInterface: ParsedInterface, schema: ParsedSchema): string {
    const dependencyBlocks: string[] = [];

    // Generate Enums
    parsedInterface.usedEnums.forEach(name => {
        const enumDef = schema.enums.find(e => e.name === name);
        if (enumDef) dependencyBlocks.push(enumDef.node.getText());
    });

    // Generate Type Aliases
    parsedInterface.usedTypeAliases.forEach(name => {
        const typeDef = schema.typeAliases.find(t => t.name === name);
        if (typeDef) dependencyBlocks.push(typeDef.node.getText());
    });

    // Generate Interfaces
    parsedInterface.usedInterfaces.forEach(name => {
        const interfaceDef = schema.interfaces.find(i => i.name === name);
        if (interfaceDef) dependencyBlocks.push(interfaceDef.node.getText());
    });

    return dependencyBlocks.join('\n\n');
}


function generateMainInterface(parsedInterface: ParsedInterface): string {
    let content = `export interface ${parsedInterface.name} {\n`;
    for (const prop of parsedInterface.properties) {
        const optionalMarker = prop.isOptional ? '?' : '';
        content += `  ${prop.name}${optionalMarker}: ${translateDslToMainType(prop)};\n`;
    }
    content += '}';
    return content;
}

function generateCreateInput(parsedInterface: ParsedInterface): string {
    const nonSettableDslTypes: ParsedProperty['dslType'][] = ['id', 'logs', 'now', 'updatedAt'];
    const settableProps = parsedInterface.properties.filter(p => !nonSettableDslTypes.includes(p.dslType));

    let content = `export interface ${parsedInterface.name}CreateInput {\n`;
    for (const prop of settableProps) {
        const optionalMarker = prop.isOptional ? '?' : '';
        content += `  ${prop.name}${optionalMarker}: ${translateDslToCreateInputType(prop)};\n`;
    }
    content += '}';
    return content;
}

function generateListOptions(parsedInterface: ParsedInterface): string {
    const { name, properties } = parsedInterface;
    const options: any = {
        name: pluralize(name.toLowerCase()),
        primary: properties.find(p => p.dslType === 'id')?.name || 'id',
        uniqueFields: properties.filter(p => p.dslType === 'unique' || p.dslType === 'id').map(p => p.name),
        indexesFields: properties.filter(p => p.dslType === 'index').map(p => p.name),
        populations: {},
        methods: {
            uuid: properties.filter(p => p.dslType === 'id' && p.dslSubtype === 'uuid').map(p => p.name),
            autoIncrement: properties.filter(p => p.dslType === 'id' && p.dslSubtype === 'increment').map(p => p.name),
            now: properties.filter(p => p.dslType === 'now').map(p => p.name),
            updatedAt: properties.filter(p => p.dslType === 'updatedAt').map(p => p.name),
            log: properties.filter(p => p.dslType === 'logs').map(p => p.name),
        }
    };

    properties.filter(p => p.dslType === 'oneFrom' || p.dslType === 'manyFrom').forEach(p => {
        options.populations[p.name] = { ref: pluralize(p.baseType.toLowerCase()), method: p.dslType };
    });

    Object.keys(options.methods).forEach(key => {
        if (options.methods[key].length === 0) delete options.methods[key];
    });

    return `const listOptions: ListOptions = ${JSON.stringify(options, null, 2)};`;
}

// --- Main Generator ---

export function generateListFileContent(parsedInterface: ParsedInterface, schema: ParsedSchema): string {
    const interfaceName = parsedInterface.name;
    const listName = interfaceName.toLowerCase();

    const imports = generateImports(parsedInterface.properties);
    const dependencies = generateDependencies(parsedInterface, schema);
    const mainInterface = generateMainInterface(parsedInterface);
    const createInput = generateCreateInput(parsedInterface);

    const otherInputs = `
export type ${interfaceName}UpdateInput = Partial<${interfaceName}CreateInput>;
export type ${interfaceName}QueryInput = QueryInput<${interfaceName}>;
export type ${interfaceName}UniqueQueryInput = { ${
    parsedInterface.properties
        .filter(p => p.dslType === 'id' || p.dslType === 'unique')
        .map(p => `${p.name}?: ${translateDslToMainType(p)}`)
        .join('; ')}
};
    `;

    const listOptions = generateListOptions(parsedInterface);

    const factoryCall = `
export const ${pluralize(listName)}List = listFactory<
  ${interfaceName},
  ${interfaceName}CreateInput,
  ${interfaceName}UpdateInput,
  ${interfaceName}QueryInput,
  ${interfaceName}UniqueQueryInput
>(listOptions);
    `;

    return [imports, dependencies, mainInterface, createInput, otherInputs, listOptions, factoryCall].filter(Boolean).join('\n\n');
}

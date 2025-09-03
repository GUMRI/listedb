import { ParsedInterface, ParsedProperty, ParsedSchema, ParsedEnum } from './parser.js';

// --- Helper Functions ---

function pluralize(name) {
    if (name.endsWith('y')) return name.slice(0, -1) + 'ies';
    if (name.endsWith('s')) return name + 'es';
    return name + 's';
}

function getPrimaryKey(properties) {
    const pk = properties.find(p => p.type.includes('listedb.id'));
    return pk ? pk.name : 'id';
}

function getMethods(properties) {
    const methods = {
        logs: properties.find(p => p.type.includes('listedb.logs'))?.name,
        updatedAt: properties.find(p => p.type.includes('listedb.updatedAt'))?.name,
        now: properties.filter(p => p.type.includes('listedb.now')).map(p => p.name),
        uuid: [],
        autoIncrement: [],
    };
    const idProp = properties.find(p => p.type.includes('listedb.id'));
    if (idProp) {
        if (idProp.type.includes('"uuid"')) methods.uuid.push(idProp.name);
        else if (idProp.type.includes('"increment"')) methods.autoIncrement.push(idProp.name);
    }
    Object.keys(methods).forEach(key => {
        if (!methods[key] || (Array.isArray(methods[key]) && methods[key].length === 0)) delete methods[key];
    });
    return methods;
}

function getSimpleFields(properties, typeSignature) {
    return properties.filter(p => p.type.includes(`listedb.${typeSignature}`)).map(p => `{ ${p.name}: "${p.name}" }`);
}

function getPopulations(properties) {
    const populations = {};
    const relationProps = properties.filter(p => p.type.includes('oneFrom') || p.type.includes('manyFrom'));
    for (const prop of relationProps) {
        const match = prop.type.match(/listedb\.(oneFrom|manyFrom)<(\w+)>/);
        if (match) {
            const [, method, refType] = match;
            populations[prop.name] = { ref: pluralize(refType.toLowerCase()), method };
        }
    }
    return populations;
}

const isUserSettable = (p) => {
    const systemTypes = ['listedb.id', 'listedb.logs', 'listedb.updatedAt', 'listedb.now'];
    return !systemTypes.some(type => p.type.includes(type));
};

function generateInputType(interfaceName, properties, type) {
    let content = `export interface ${interfaceName}${type}Input {\n`;
    const relevantProps = type === 'Query' ? properties : properties.filter(isUserSettable);

    for (const prop of relevantProps) {
        let propType = prop.type.replace(/listedb\.\w+<(\w+)>/g, '$1');
        if (prop.type.includes('oneFrom') || prop.type.includes('manyFrom')) {
            propType = 'string | number';
        }
        const optionalMarker = type === 'Update' || type === 'Query' || prop.isOptional ? '?' : '';
        content += `  ${prop.name}${optionalMarker}: ${propType};\n`;
    }
    content += '}';
    return content;
}

function generateUniqueQueryInput(interfaceName, properties) {
    const uniqueProps = properties.filter(p => p.type.includes('listedb.id') || p.type.includes('listedb.unique'));
    if (uniqueProps.length === 0) {
        // If no unique fields, default to the primary key 'id' if it exists.
        const idProp = properties.find(p => p.name === 'id');
        if (idProp) uniqueProps.push(idProp);
    }

    if (uniqueProps.length === 0) return `export type ${interfaceName}UniqueQueryInput = never;`;

    const types = uniqueProps.map(p => `{ ${p.name}: ${p.type.replace(/listedb\.\w+<(\w+)>/g, '$1')} }`);
    return `export type ${interfaceName}UniqueQueryInput = ${types.join(' | ')};`;
}


// --- Main Generator ---

export function generateListFileContent(parsedInterface, allParsedEnums) {
    const { name: interfaceName, properties } = parsedInterface;
    const listName = interfaceName.toLowerCase();
    const listNamePlural = pluralize(listName);

    const schemaImports = new Set([interfaceName]);
    properties.forEach(p => { allParsedEnums.forEach(e => { if (p.type.includes(e.name)) schemaImports.add(e.name); }); });
    const imports = `
import { listFactory } from "../src/core/list.factory.js";
import type { ${interfaceName} } from "../../listedb.schema.js";
import { ${[...schemaImports].filter(i => i !== interfaceName).join(', ')} } from "../../listedb.schema.js";
    `;

    const createInput = generateInputType(interfaceName, properties, 'Create');
    const updateInput = generateInputType(interfaceName, properties, 'Update');
    const queryInput = generateInputType(interfaceName, properties, 'Query');
    const uniqueQueryInput = generateUniqueQueryInput(interfaceName, properties);

    const primaryKey = getPrimaryKey(properties);
    const uniqueFields = getSimpleFields(properties, 'unique');
    const indexesFields = getSimpleFields(properties, 'index');
    const populations = getPopulations(properties);
    const methods = getMethods(properties);

    const options = `
const options = {
  name: "${listNamePlural}",
  primaryKey: "${primaryKey}",
  uniqueFields: [${uniqueFields.join(', ')}],
  indexesFields: [${indexesFields.join(', ')}],
  populations: ${JSON.stringify(populations, null, 2)},
  methods: ${JSON.stringify(methods, null, 2)},
};
    `;

    const factoryCall = `
export const ${listName}List = listFactory<
  ${interfaceName},
  ${interfaceName}CreateInput,
  ${interfaceName}UpdateInput,
  ${interfaceName}QueryInput,
  ${interfaceName}UniqueQueryInput
>(options);
    `;

    return [imports, createInput, updateInput, queryInput, uniqueQueryInput, options, factoryCall].join('\n\n');
}

import ts from 'typescript';

// --- Structured Interfaces for Parsed Data ---

export type DslType = 'id' | 'unique' | 'index' | 'oneFrom' | 'manyFrom' | 'logs' | 'updatedAt' | 'now' | 'primitive';

export interface ParsedProperty {
  name: string;
  isOptional: boolean;
  dslType: DslType;
  baseType: string;
  dslSubtype?: string;
}

export interface ParsedInterface {
  name: string;
  isMain: boolean; // <-- New flag
  node: ts.InterfaceDeclaration;
  properties: ParsedProperty[];
  usedEnums: string[];
  usedInterfaces: string[];
  usedTypeAliases: string[];
}

export interface ParsedEnum {
  name: string;
  node: ts.EnumDeclaration;
}

export interface ParsedTypeAlias {
    name: string;
    node: ts.TypeAliasDeclaration;
}

export interface ParsedSchema {
  interfaces: ParsedInterface[];
  enums: ParsedEnum[];
  typeAliases: ParsedTypeAlias[];
}

// --- DSL Parsing Logic ---

const dslRegex = /listedb\.(\w+)(?:<([\w"'\[\]]+)>)?/;

function parseDslType(typeStr: string): Omit<ParsedProperty, 'name' | 'isOptional'> {
  const match = typeStr.match(dslRegex);
  if (match) {
    const dslType = match[1] as DslType;
    const genericType = match[2];
    switch (dslType) {
      case 'id':
        return { dslType: 'id', baseType: genericType === '"uuid"' ? 'string' : 'number', dslSubtype: genericType.replace(/"/g, '') };
      case 'unique':
      case 'index':
      case 'oneFrom':
      case 'manyFrom':
      case 'logs':
        return { dslType, baseType: genericType };
      case 'updatedAt':
      case 'now':
        return { dslType, baseType: 'Date' };
      default:
        return { dslType: 'primitive', baseType: typeStr };
    }
  }
  return { dslType: 'primitive', baseType: typeStr };
}

// --- Main Parser ---

export function parseSchema(filePath: string): ParsedSchema {
  const program = ts.createProgram([filePath], { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext });
  const sourceFile = program.getSourceFile(filePath);
  const checker = program.getTypeChecker();

  if (!sourceFile) throw new Error(`Could not find source file: ${filePath}`);

  const enums: ParsedEnum[] = [];
  const typeAliases: ParsedTypeAlias[] = [];
  const interfaceNodes: { name: string; node: ts.InterfaceDeclaration }[] = [];

  // --- Pass 1: Collect all top-level exported definitions ---
  ts.forEachChild(sourceFile, node => {
    if (ts.isEnumDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      enums.push({ name: node.name.getText(sourceFile), node });
    } else if (ts.isTypeAliasDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      typeAliases.push({ name: node.name.getText(sourceFile), node });
    } else if (ts.isInterfaceDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      interfaceNodes.push({ name: node.name.getText(sourceFile), node });
    }
  });

  const allInterfaceNames = interfaceNodes.map(i => i.name);
  const allEnumNames = enums.map(e => e.name);
  const allTypeAliasNames = typeAliases.map(t => t.name);

  // --- Pass 2: Analyze interfaces for properties and dependencies ---
  const interfaces: ParsedInterface[] = interfaceNodes.map(({ name, node }) => {
    const interfaceSymbol = checker.getSymbolAtLocation(node.name);
    if (!interfaceSymbol) return null;

    // <-- New logic to check for 'extends listedb.item' -->
    const isMain = !!node.heritageClauses?.some(clause =>
        clause.types.some(type => type.expression.getText(sourceFile) === 'listedb.item')
    );

    const usedEnums = new Set<string>();
    const usedInterfaces = new Set<string>();
    const usedTypeAliases = new Set<string>();

    const properties: ParsedProperty[] = checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(interfaceSymbol))
      .map(prop => {
        const propTypeNode = prop.valueDeclaration && ts.isPropertySignature(prop.valueDeclaration) ? prop.valueDeclaration.type : null;
        const typeStr = propTypeNode ? propTypeNode.getText(sourceFile) : 'any';

        const checkDep = (depName: string) => new RegExp(`\\b${depName}\\b`).test(typeStr);

        allEnumNames.forEach(name => { if (checkDep(name)) usedEnums.add(name) });
        allTypeAliasNames.forEach(name => { if (checkDep(name)) usedTypeAliases.add(name) });
        allInterfaceNames.forEach(name => { if (name !== interfaceSymbol.name && checkDep(name)) usedInterfaces.add(name) });

        const parsedDsl = parseDslType(typeStr);
        return {
          name: prop.name,
          isOptional: (prop.flags & ts.SymbolFlags.Optional) !== 0,
          ...parsedDsl,
        };
      });

    return {
      name,
      isMain, // <-- Set the flag
      node,
      properties,
      usedEnums: Array.from(usedEnums),
      usedInterfaces: Array.from(usedInterfaces),
      usedTypeAliases: Array.from(usedTypeAliases),
    };
  }).filter((i): i is ParsedInterface => i !== null);

  return { interfaces, enums, typeAliases };
}

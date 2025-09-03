import ts from 'typescript';

// --- New Structured Interfaces for Parsed Data ---

export type DslType = 'id' | 'unique' | 'index' | 'oneFrom' | 'manyFrom' | 'logs' | 'updatedAt' | 'now' | 'primitive';

export interface ParsedProperty {
  name: string;
  isOptional: boolean;
  dslType: DslType;
  baseType: string; // e.g., "string", "User", "ERole[]"
  dslSubtype?: string; // e.g., "uuid" or "increment" for the 'id' dslType
}

export interface ParsedInterface {
  name: string;
  properties: ParsedProperty[];
  usedEnums: string[]; // Names of enums used by this interface
}

export interface ParsedEnum {
  name: string;
  node: ts.EnumDeclaration; // Keep the original node for the generator
}

export interface ParsedSchema {
  interfaces: ParsedInterface[];
  enums: ParsedEnum[];
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
        return { dslType, baseType: 'Date' }; // Will be translated to string later
      default:
        // Fallback for unknown listedb types
        return { dslType: 'primitive', baseType: typeStr };
    }
  }
  // Not a listedb type
  return { dslType: 'primitive', baseType: typeStr };
}

// --- Main Parser ---

export function parseSchema(filePath: string): ParsedSchema {
  const program = ts.createProgram([filePath], { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext });
  const sourceFile = program.getSourceFile(filePath);
  const checker = program.getTypeChecker();

  if (!sourceFile) throw new Error(`Could not find source file: ${filePath}`);

  const schema: ParsedSchema = { interfaces: [], enums: [] };

  // First pass: collect all exported enums
  ts.forEachChild(sourceFile, node => {
    if (ts.isEnumDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      schema.enums.push({ name: node.name.getText(sourceFile), node });
    }
  });

  // Second pass: collect interfaces and analyze properties
  ts.forEachChild(sourceFile, node => {
    if (ts.isInterfaceDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      const interfaceSymbol = checker.getSymbolAtLocation(node.name);
      if (interfaceSymbol) {
        const usedEnums = new Set<string>();
        const properties: ParsedProperty[] = checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(interfaceSymbol))
          .map(prop => {
            const propTypeNode = prop.valueDeclaration && ts.isPropertySignature(prop.valueDeclaration) ? prop.valueDeclaration.type : null;
            const typeStr = propTypeNode ? propTypeNode.getText(sourceFile) : 'any';

            // Check if this property uses an enum
            schema.enums.forEach(en => {
                if (typeStr.includes(en.name)) {
                    usedEnums.add(en.name);
                }
            });

            const parsedDsl = parseDslType(typeStr);
            return {
              name: prop.name,
              isOptional: (prop.flags & ts.SymbolFlags.Optional) !== 0,
              ...parsedDsl,
            };
          });

        schema.interfaces.push({
          name: interfaceSymbol.name,
          properties: properties,
          usedEnums: Array.from(usedEnums),
        });
      }
    }
  });

  return schema;
}

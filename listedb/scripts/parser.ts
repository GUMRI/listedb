import ts from 'typescript';
import path from 'path';

export interface ParsedProperty {
  name: string;
  type: string;
  isOptional: boolean;
}

export interface ParsedInterface {
  name: string;
  properties: ParsedProperty[];
}

export interface ParsedEnum {
  name: string;
  members: string[];
}

export interface ParsedTypeAlias {
    name: string;
    type: string;
}

export interface ParsedSchema {
  interfaces: ParsedInterface[];
  enums: ParsedEnum[];
  typeAliases: ParsedTypeAlias[];
}

/**
 * Parses a TypeScript schema file to extract interfaces, enums, and type aliases.
 * @param filePath The path to the TypeScript schema file.
 * @returns A structured object representing the parsed schema.
 */
export function parseSchema(filePath: string): ParsedSchema {
  const program = ts.createProgram([filePath], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
  });
  const sourceFile = program.getSourceFile(filePath);
  const checker = program.getTypeChecker();

  if (!sourceFile) {
    throw new Error(`Could not find source file: ${filePath}`);
  }

  const schema: ParsedSchema = {
    interfaces: [],
    enums: [],
    typeAliases: [],
  };

  ts.forEachChild(sourceFile, node => {
    if (ts.isInterfaceDeclaration(node) && node.name) {
        const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
        if(isExported) {
            const interfaceSymbol = checker.getSymbolAtLocation(node.name);
            if (interfaceSymbol) {
                const properties = checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(interfaceSymbol))
                    .map(prop => {
                        const declaration = prop.valueDeclaration;
                        let type = 'any';
                        if (declaration && ts.isPropertySignature(declaration) && declaration.type) {
                            type = declaration.type.getText(sourceFile);
                        }
                        return {
                            name: prop.name,
                            type: type,
                            isOptional: (prop.flags & ts.SymbolFlags.Optional) !== 0,
                        };
                    });

                schema.interfaces.push({
                    name: interfaceSymbol.name,
                    properties: properties,
                });
            }
        }
    } else if (ts.isEnumDeclaration(node) && node.name) {
        const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
        if(isExported) {
            schema.enums.push({
                name: node.name.getText(sourceFile),
                members: node.members.map(member => member.name.getText(sourceFile)),
            });
        }
    } else if (ts.isTypeAliasDeclaration(node) && node.name) {
        schema.typeAliases.push({
            name: node.name.getText(sourceFile),
            type: node.type.getText(sourceFile),
        });
    }
  });

  return schema;
}

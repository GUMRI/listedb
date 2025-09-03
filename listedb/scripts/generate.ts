import path from 'path';
import fs from 'fs';
import { parseSchema } from './parser.js';
import { generateListFileContent } from './code-generator.js';

function main() {
  console.log('Running listedb generator...');

  const schemaPath = path.resolve(process.cwd(), 'listedb/listedb.schema.ts');
  const outputPath = path.resolve(process.cwd(), 'listedb/lists');

  console.log(`Parsing schema file: ${schemaPath}`);

  try {
    // Ensure the output directory exists
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    const parsedSchema = parseSchema(schemaPath);
    const mainInterfaces = parsedSchema.interfaces.filter(i => i.isMain);

    console.log('Schema parsed successfully. Found main interfaces to generate:', mainInterfaces.map(i => i.name).join(', '));

    console.log(`\nGenerating list files in ${outputPath}...`);
    for (const iface of mainInterfaces) {
      const listName = iface.name.toLowerCase();
      console.log(`- Generating list for ${iface.name}...`);

      const fileContent = generateListFileContent(iface, parsedSchema);
      const outputFilePath = path.join(outputPath, `${listName}.list.ts`);

      // Write the generated content to the file
      fs.writeFileSync(outputFilePath, fileContent);
      console.log(`  -> Created ${outputFilePath}`);
    }

    console.log('\nCode generation complete.');

  } catch (error) {
    console.error('\nAn error occurred during code generation:');
    console.error(error);
    process.exit(1);
  }
}

main();

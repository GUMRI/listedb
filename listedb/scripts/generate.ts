const path = require('path');
const fs = require('fs');
const { parseSchema } = require('./parser');
const { generateListFileContent } = require('./code-generator');

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
    console.log('Schema parsed successfully. Found interfaces:', parsedSchema.interfaces.map(i => i.name).join(', '));

    console.log(`\nGenerating list files in ${outputPath}...`);
    for (const iface of parsedSchema.interfaces) {
      const listName = iface.name.toLowerCase();
      console.log(`- Generating list for ${iface.name}...`);

      const fileContent = generateListFileContent(iface, parsedSchema.enums);
      const outputFilePath = path.join(outputPath, `${listName}.list.ts`);

      // Write the generated content to the file
      fs.writeFileSync(outputFilePath, fileContent);
      console.log(`  -> Created ${outputFilePath}`);
    }

    console.log('\nCode generation complete.');

  } catch (error) {
    // Since the user will handle execution, we log the error but don't exit hard.
    // This allows them to see the error without stopping a potential chain of commands.
    console.error('\nAn error occurred during code generation:');
    console.error(error);
  }
}

main();

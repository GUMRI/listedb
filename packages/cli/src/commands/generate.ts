import { Command, Flags } from '@oclif/core';
import * as path from 'path';
import * as fs from 'fs';
import { parseSchema } from '../utils/parser.js';
import { generateListFileContent } from '../utils/code-generator.js';

export default class Generate extends Command {
  static description = 'Generate list files from the listedb schema.';

  static examples = [
    `$ listedb generate`,
    `$ listedb generate --schema ./db/schema.ts --output ./src/generated`,
  ];

  static flags = {
    schema: Flags.string({ char: 's', description: 'Path to your schema file.', default: 'listedb.schema.ts' }),
    output: Flags.string({ char: 'o', description: 'Path to the output directory for generated files.', default: 'listedb' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Generate);

    const schemaPath = path.resolve(process.cwd(), flags.schema);
    const outputPath = path.resolve(process.cwd(), flags.output, 'lists');

    this.log(`Reading schema from: ${schemaPath}`);
    if (!fs.existsSync(schemaPath)) {
        this.error(`Schema file not found at ${schemaPath}`, { exit: 1 });
    }

    try {
      // Ensure the output directory exists
      if (!fs.existsSync(outputPath)) {
          fs.mkdirSync(outputPath, { recursive: true });
      }

      const parsedSchema = parseSchema(schemaPath);
      const mainInterfaces = parsedSchema.interfaces.filter(i => i.isMain);

      if (mainInterfaces.length === 0) {
        this.warn('No main interfaces (extending listedb.item) found in schema. No files will be generated.');
        return;
      }

      this.log(`Found ${mainInterfaces.length} main interfaces to generate...`);

      for (const iface of mainInterfaces) {
        const listName = iface.name.toLowerCase();
        this.log(`  -> Generating list for ${iface.name}...`);

        const fileContent = generateListFileContent(iface, parsedSchema);
        const outputFilePath = path.join(outputPath, `${listName}.list.ts`);

        fs.writeFileSync(outputFilePath, fileContent);
        this.log(`     ✔ Created ${outputFilePath}`);
      }

      this.log('\nCode generation complete.');

    } catch (error: any) {
      this.error(error, { exit: 1 });
    }
  }
}

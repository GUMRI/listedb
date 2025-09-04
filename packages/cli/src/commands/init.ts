import { Command } from '@oclif/core';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';

const schemaTemplate = `// Welcome to listedb!
// Define your database schema here.

import { listedb } from '@listedb/core';

// Example of a "main" interface that will become a database list.
// Note that it must extend 'listedb.item'.
export interface User extends listedb.item {
  id: listedb.id<'uuid'>;
  email: listedb.unique<string>;
  name: string;
  age?: listedb.index<number>;
  createdAt: listedb.now;
}

// You can run 'npx listedb generate' to create the list files.
`;

export default class Init extends Command {
  static description = 'Initialize a new listedb project.';

  static examples = [
    `$ listedb init`,
  ];

  async run(): Promise<void> {
    this.log('Initializing new listedb project...');

    // 1. Create listedb.schema.ts
    const schemaPath = path.resolve(process.cwd(), 'listedb.schema.ts');
    if (fs.existsSync(schemaPath)) {
      this.warn('`listedb.schema.ts` already exists. Skipping file creation.');
    } else {
      try {
        fs.writeFileSync(schemaPath, schemaTemplate);
        this.log('✔ Created `listedb.schema.ts`');
      } catch (error: any) {
        this.error(`Failed to create schema file: ${error.message}`, { exit: 1 });
      }
    }

    // 2. Install @listedb/core
    this.log('Installing @listedb/core...');
    const installProcess = exec('npm install @listedb/core');

    installProcess.stdout?.on('data', (data) => {
      // You can uncomment the line below for verbose output during installation
      // this.log(data);
    });

    installProcess.stderr?.on('data', (data) => {
      this.warn(data);
    });

    installProcess.on('close', (code) => {
      if (code === 0) {
        this.log('✔ Installed @listedb/core successfully.');
        this.log('\nProject initialized. You can now define your schema and run `npx listedb generate`.');
      } else {
        this.error('Failed to install @listedb/core. Please try running `npm install @listedb/core` manually.', { exit: 1 });
      }
    });
  }
}

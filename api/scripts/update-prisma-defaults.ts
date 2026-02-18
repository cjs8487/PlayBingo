#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { getDefaultGeneratorSettingsJson } from '@playbingo/shared/DefaultGeneratorSettings';
import { join } from 'path';

const schemaPath = join(__dirname, '../prisma/schema.prisma');

function updatePrismaDefaults() {
    console.log(
        'Updating Prisma schema defaults from GeneratorSettings schema...',
    );

    const defaultJson = getDefaultGeneratorSettingsJson();
    console.log('Generated default:', defaultJson);

    let schema = readFileSync(schemaPath, 'utf8');

    // Update Game generatorSettings default
    schema = schema.replace(
        /generatorSettings\s+Json\s+@default\("[^"]*"\)/g,
        `generatorSettings           Json                          @default("${defaultJson}")`,
    );

    // Update Variant generatorSettings default
    schema = schema.replace(
        /generatorSettings\s+Json\s+@default\("[^"]*"\)/g,
        `generatorSettings Json   @default("${defaultJson}")`,
    );

    writeFileSync(schemaPath, schema);
    console.log('✅ Prisma schema updated with dynamic defaults');
}

if (require.main === module) {
    updatePrismaDefaults();
}

export { updatePrismaDefaults };

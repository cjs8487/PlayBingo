import { readdirSync, writeFileSync } from 'fs';
import { compileFromFile } from 'json-schema-to-typescript';

try {
    const files = readdirSync('./schemas');
    const filesProcessed: string[] = [];

    files.forEach((file) => {
        if (file.match('.json$')) {
            const fileName = file.replace(/.json$/, '');
            console.log(fileName);
            filesProcessed.push(fileName);
            compileFromFile(`./schemas/${fileName}.json`, {
                cwd: './schemas',
            }).then((ts) => {
                writeFileSync(`./types/${fileName}.d.ts`, ts);
            });
        }
    });

    // const index: string[] = [];
    // filesProcessed.forEach((file) => {
    //     index.push(`export * from './${file}';`);
    // });

    // writeFileSync('./types/index.d.ts', `${index.join('\n')}\n`);
    // writeFileSync('../api/src/types/index.d.ts', `${index.join('\n')}\n`);
    // writeFileSync('../web/src/types/index.d.ts', `${index.join('\n')}\n`);
} catch (err) {
    console.log('no schemas');
}

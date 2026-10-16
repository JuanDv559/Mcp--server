
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const instructionsPath = resolve(__dirname, '../instructions.txt');

export async function cargarInstrucciones() {
    return await readFile(instructionsPath, 'utf8');
}

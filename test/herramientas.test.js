import test from 'node:test';
import assert from 'node:assert/strict';
import { ejecutarHerramienta } from '../src/herramientas.js';

test('devuelve el texto de la herramienta MCP', async () => {
    const mcp = {
        async callTool() {
            return {
                content: [{ text: 'Archivo leído correctamente' }]
            };
        }
    };

    const resultado = await ejecutarHerramienta(
        mcp,
        'read_file',
        { path: 'index.js' }
    );

    assert.equal(resultado, 'Archivo leído correctamente');
});

test('combina varios bloques de texto', async () => {
    const mcp = {
        async callTool() {
            return {
                content: [
                    { text: 'Primera línea' },
                    { text: 'Segunda línea' }
                ]
            };
        }
    };

    const resultado = await ejecutarHerramienta(mcp, 'list_files', {});

    assert.equal(resultado, 'Primera línea\nSegunda línea');
});

test('devuelve una cadena vacía si no hay contenido', async () => {
    const mcp = {
        async callTool() {
            return {};
        }
    };

    const resultado = await ejecutarHerramienta(mcp, 'list_files', {});

    assert.equal(resultado, '');
});

test('propaga los errores de la llamada MCP', async () => {
    const mcp = {
        async callTool() {
            throw new Error('Error de conexión MCP');
        }
    };

    await assert.rejects(
        ejecutarHerramienta(mcp, 'read_file', {}),
        /Error de conexión MCP/
    );
});
test('detecta errores devueltos por la herramienta MCP', async () => {
    const mcp = {
        async callTool() {
            return {
                isError: true,
                content: [{ text: 'No se pudo leer el archivo' }]
            };
        }
    };

    await assert.rejects(
        ejecutarHerramienta(mcp, 'read_file', {}),
        /No se pudo leer el archivo/
    );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { lecturaPrevia } from '../src/lectura-previa.js';

test('no llama a MCP si la tarea no identifica un archivo', async () => {
    const mcp = {
        async callTool() {
            assert.fail('No debería llamar a MCP');
        }
    };

    const messages = [];

    await lecturaPrevia(
        mcp,
        'Hola, ¿cómo estás?',
        '/proyecto',
        messages
    );

    assert.deepEqual(messages, []);
});

test('informa cuando no encuentra el archivo solicitado', async (t) => {
    t.mock.method(console, 'log', () => {});

    const mcp = {
        async callTool() {
            return {
                content: [{ text: '' }]
            };
        }
    };

    const messages = [];

    await lecturaPrevia(
        mcp,
        'Revisa el archivo inexistente.js',
        '/proyecto',
        messages
    );

    assert.match(messages[0].content, /No se encontró inexistente\.js/);
    assert.match(messages[0].content, /No inventes su contenido/);
});

test('pide especificar la ruta si hay varios archivos con el mismo nombre', async (t) => {
    t.mock.method(console, 'log', () => {});

    const mcp = {
        async callTool() {
            return {
                content: [
                    {
                        text:
                            '/proyecto/src/index.js\n' +
                            '/proyecto/test/index.js'
                    }
                ]
            };
        }
    };

    const messages = [];

    await lecturaPrevia(
        mcp,
        'Revisa index.js',
        '/proyecto',
        messages
    );

    assert.match(messages[0].content, /Hay varios archivos/);
    assert.match(messages[0].content, /No elijas uno arbitrariamente/);
});

test('propaga errores de MCP durante la búsqueda', async (t) => {
    t.mock.method(console, 'log', () => {});

    const mcp = {
        async callTool() {
            throw new Error('Fallo de búsqueda MCP');
        }
    };

    await assert.rejects(
        lecturaPrevia(
            mcp,
            'Revisa archivo.js',
            '/proyecto',
            [],
        ),
        /Fallo de búsqueda MCP/
    );
});

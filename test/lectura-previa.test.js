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
test('lee el archivo y añade su contenido y estructura a messages', async (t) => {
    t.mock.method(console, 'log', () => {});

    const contenidoArchivo = `
function saludar(nombre) {
    return 'Hola ' + nombre;
}
`;

    const llamadas = [];

    const mcp = {
        async callTool({ name, arguments: args }) {
            llamadas.push({ name, arguments: args });

            if (name === 'search_files') {
                return {
                    content: [{
                        text: '/proyecto/src/ejemplo.js'
                    }]
                };
            }

            if (name === 'read_file') {
                return {
                    content: [{ text: contenidoArchivo }]
                };
            }

            throw new Error(`Herramienta inesperada: ${name}`);
        }
    };

    const messages = [];

    await lecturaPrevia(
        mcp,
        'Revisa src/ejemplo.js',
        '/proyecto',
        messages
    );

    assert.deepEqual(
        llamadas.map(llamada => llamada.name),
        ['search_files', 'read_file']
    );

    assert.equal(
        llamadas[0].arguments.name,
        'ejemplo.js'
    );

    assert.equal(
        llamadas[1].arguments.path,
        '/proyecto/src/ejemplo.js'
    );

    assert.equal(messages.length, 1);
    assert.match(messages[0].content, /Contenido real de/);
    assert.match(messages[0].content, /function saludar/);
    assert.match(messages[0].content, /ESTRUCTURA EXTRAÍDA DEL CÓDIGO/);
    assert.match(messages[0].content, /Responde a la solicitud original/);
});

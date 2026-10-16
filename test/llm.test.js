import test from 'node:test';
import assert from 'node:assert/strict';
import { askQwen } from '../src/llm.js';

test('devuelve el contenido de una respuesta válida', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => {
        return new Response(
            JSON.stringify({
                choices: [
                    { message: { content: 'Conexión correcta' } }
                ]
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    });

    const resultado = await askQwen([
        { role: 'user', content: 'Prueba' }
    ]);

    assert.equal(resultado, 'Conexión correcta');
});

test('identifica errores HTTP', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => {
        return new Response('Servidor no disponible', {
            status: 503
        });
    });

    await assert.rejects(
        askQwen([]),
        /HTTP 503/
    );
});

test('identifica respuestas JSON inválidas', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => {
        return new Response('esto no es JSON', {
            status: 200
        });
    });

    await assert.rejects(
        askQwen([]),
        /JSON válido/
    );
});

test('rechaza respuestas sin contenido de Qwen', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => {
        return new Response(
            JSON.stringify({ choices: [] }),
            { status: 200 }
        );
    });

    await assert.rejects(
        askQwen([]),
        /no contiene texto de Qwen/
    );
});

test('identifica errores de conexión', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => {
        throw new Error('conexión rechazada');
    });

    await assert.rejects(
        askQwen([]),
        /No se pudo conectar con llama-server/
    );
});

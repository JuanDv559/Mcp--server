
import test from 'node:test';
import assert from 'node:assert/strict';
import { analizarEstructura } from '../analizar-estructura.js';

test('detecta herramientas MCP registradas', () => {
    const codigo = `
        server.registerTool("list_files", {});
        server.registerTool("read_file", {});
    `;

    const resultado = analizarEstructura(codigo);

    assert.match(resultado, /list_files/);
    assert.match(resultado, /read_file/);
});

test('detecta funciones declaradas con function', () => {
    const codigo = `
        function saludar() {}
        async function consultar() {}
    `;

    const resultado = analizarEstructura(codigo);

    assert.match(resultado, /saludar/);
    assert.match(resultado, /consultar/);
});

test('detecta funciones flecha asignadas a const y let', () => {
    const codigo = `
        const obtenerDatos = () => {};
        let procesar = async () => {};
    `;

    const resultado = analizarEstructura(codigo);

    assert.match(resultado, /obtenerDatos/);
    assert.match(resultado, /procesar/);
});

test('detecta métodos de fs y pathModule', () => {
    const codigo = `
        fs.readFileSync('archivo.js');
        pathModule.resolve('archivo.js');
    `;

    const resultado = analizarEstructura(codigo);

    assert.match(resultado, /fs\.readFileSync/);
    assert.match(resultado, /pathModule\.resolve/);
});

test('informa cuando no detecta elementos estructurales', () => {
    const resultado = analizarEstructura('const numero = 42;');

    assert.match(resultado, /No detectadas/);
    assert.match(resultado, /No detectados/);
});
test('detecta funciones flecha con parámetros predeterminados', () => {
    const codigo = `
        const buscar = (ruta = process.cwd()) => {};
    `;

    const resultado = analizarEstructura(codigo);

    assert.match(resultado, /buscar/);
});

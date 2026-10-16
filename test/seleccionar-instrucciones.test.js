import test from 'node:test';
import assert from 'node:assert/strict';
import { seleccionarInstrucciones } from '../src/seleccionar-instrucciones.js';
import { cargarInstrucciones } from '../src/instructions.js';

test('carga las instrucciones completas para tareas técnicas', async () => {
    const resultado = await seleccionarInstrucciones(
        'Analiza la estructura del proyecto'
    );

    const instrucciones = await cargarInstrucciones();

    assert.equal(resultado, instrucciones);
});

test('devuelve instrucciones breves para tareas sencillas', async () => {
    const resultado = await seleccionarInstrucciones(
        'Hola, ¿cómo estás?'
    );

    assert.equal(
        resultado,
        'Obedece exactamente la petición del usuario. No añadas explicaciones ni código que no te pidan.'
    );
});


import test from 'node:test';
import assert from 'node:assert/strict';
import { necesitaAnalisis } from '../src/detectar-tipo-tarea.js';

test('detecta solicitudes que requieren análisis', () => {
    const casos = [
        'Enumera las herramientas MCP disponibles',
        'Corrige el error de mi archivo React',
        'Analiza la estructura del proyecto',
        'Refactoriza esta función',
        'Busca dónde se define search_files',
        'Quiero crear una API con Express'

    ];

    for (const tarea of casos) {
        assert.equal(
            necesitaAnalisis(tarea),
            true,
            `Debió detectar análisis: "${tarea}"`
        );
    }
});

test('no activa análisis para mensajes sencillos', () => {
    const casos = [
        'Responde únicamente: agente operativo',
        'Hola, ¿cómo estás?',
        'Gracias',
        '¿Qué hora es?',
        'Explícame qué es la fotosíntesis',
        'Quiero crear una rutina para estudiar'
    ];

    for (const tarea of casos) {
        assert.equal(
            necesitaAnalisis(tarea),
            false,
            `No debió detectar análisis: "${tarea}"`
        );
    }
});

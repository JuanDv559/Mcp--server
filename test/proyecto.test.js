import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { seleccionarProyecto } from '../src/proyecto.js';

test('usa el directorio actual si no se indica --project', () => {
    const resultado = seleccionarProyecto([
        'Hola',
        'mundo'
    ]);

    assert.equal(resultado.directorioProyecto, process.cwd());
    assert.equal(resultado.tarea, 'Hola mundo');
});

test('selecciona el proyecto y separa la tarea', () => {
    const resultado = seleccionarProyecto([
        '--project',
        '~/repositorios/first_project',
        'Analiza',
        'el',
        'código'
    ]);

    assert.equal(
        resultado.directorioProyecto,
        path.resolve('~/repositorios/first_project')
    );

    assert.equal(resultado.tarea, 'Analiza el código');
});

test('rechaza --project sin ruta', () => {
    assert.throws(
        () => seleccionarProyecto(['--project']),
        /Debes indicar una ruta después de --project/
    );
});

test('rechaza una opción como ruta de proyecto', () => {
    assert.throws(
        () => seleccionarProyecto(['--project', '--help']),
        /Debes indicar una ruta después de --project/
    );
});

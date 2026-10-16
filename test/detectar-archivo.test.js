
import test from 'node:test';
import assert from 'node:assert/strict';
import { detectarArchivo } from '../src/detectar-archivo.js';

test('detecta un nombre de archivo', () => {
    assert.equal(
        detectarArchivo('Revisa el archivo index.js'),
        'index.js'
    );
});

test('detecta una ruta relativa', () => {
    assert.equal(
        detectarArchivo('Revisa src/componentes/App.jsx'),
        'src/componentes/App.jsx'
    );
});

test('devuelve la última coincidencia', () => {
    assert.equal(
        detectarArchivo('Compara index.js con server.js'),
        'server.js'
    );
});

test('devuelve null si no hay archivos', () => {
    assert.equal(
        detectarArchivo('Hola, ¿cómo estás?'),
        null
    );
});
test('detecta archivos de configuración y scripts', () => {
    assert.equal(detectarArchivo('Revisa deploy.sh'), 'deploy.sh');
    assert.equal(detectarArchivo('Revisa config.yaml'), 'config.yaml');
    assert.equal(detectarArchivo('Revisa esquema.sql'), 'esquema.sql');
});

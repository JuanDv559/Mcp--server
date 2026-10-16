
import { cargarInstrucciones } from './instructions.js';

export async function seleccionarInstrucciones(tarea) {
    const necesitaAnalisis =
        /\b(código|codigo|archivo|función|funcion|depurar|error|bug|herramienta|mcp|inventario|estructura|carpetas|directorios|archivos del proyecto|lista de archivos|enumera los archivos)\b/i.test(tarea);

    if (necesitaAnalisis) {
        return await cargarInstrucciones();
    }

    return 'Obedece exactamente la petición del usuario. No añadas explicaciones ni código que no te pidan.';
}

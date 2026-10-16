
export function necesitaAnalisis(tarea) {
    return /\b(código|codigo|archivo|función|funcion|depurar|error|bug|herramienta|mcp|inventario|estructura|carpetas|directorios|archivos del proyecto|lista de archivos|enumera los archivos)\b/i.test(tarea);
}

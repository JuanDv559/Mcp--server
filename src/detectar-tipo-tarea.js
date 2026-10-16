
const PATRONES_ANALISIS = [
    /\b(código|codigo|programa|programar|programación|programacion)\b/i,
    /\b(archivo|archivos|carpeta|carpetas|directorio|directorios)\b/i,
    /\b(función|funcion|método|metodo|clase|módulo|modulo)\b/i,
    /\b(depurar|debug|depuración|depuracion|error|bug|fallo|excepción|excepcion)\b/i,
    /\b(herramienta|herramientas|mcp|inventario|estructura)\b/i,
    /\b(implementar|implementar|modificar|refactorizar|optimizar|corregir)\b/i,
    /\b(editar|revisar|analizar|examinar)\b/i,

    /\b(import|export|require|fetch|async|await|npm|node|react|mongodb|express|list_files|read_file|search_files)\b/i,
    /\b(consulta|consultar|buscar|enumera|listar|lista|muéstrame|muestrame)\b/i,
    /\b(proyecto|dependencias|endpoint|api|servidor|base de datos|terminal)\b/i
];

export function necesitaAnalisis(tarea) {
    return PATRONES_ANALISIS.some(patron => patron.test(tarea));
}

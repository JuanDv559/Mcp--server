import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';


function analizarEstructura(codigo) {
    const herramientas = [
        ...codigo.matchAll(
            /server\.registerTool\s*\(\s*["'`]([^"'`]+)["'`]/g
        )
    ].map(m => m[1]);

    const funciones = [
        ...codigo.matchAll(
            /\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g
        )
    ].map(m => m[1]);

    const declaraciones = [
        ...codigo.matchAll(
            /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g
        )
    ].map(m => m[1]);

    const metodos = [
        ...codigo.matchAll(
            /\b(fs|pathModule)\.([A-Za-z_$][\w$]*)\s*\(/g
        )
    ].map(m => `${m[1]}.${m[2]}`);

    return [
        "ESTRUCTURA EXTRAÍDA DEL CÓDIGO",
        "",
        "Herramientas MCP registradas:",
        ...(herramientas.length
            ? herramientas.map(n => `- ${n}`)
            : ["- No detectadas"]),
        "",
        "Funciones declaradas con function:",
        ...(funciones.length
            ? funciones.map(n => `- ${n}`)
            : ["- No detectadas"]),
        "",
        "Declaraciones const/let/var con función flecha:",
        ...(declaraciones.length
            ? declaraciones.map(n => `- ${n}`)
            : ["- No detectadas"]),
        "",
        "Métodos detectados de fs y pathModule:",
        ...(metodos.length
            ? [...new Set(metodos)].map(n => `- ${n}`)
            : ["- No detectados"]),
        "",
        "Nota: extracción basada en patrones de texto; " +
        "debe verificarse contra el código fuente."
    ].join("\n");
}


const archivoActual = fileURLToPath(import.meta.url);
const archivoEjecutado = process.argv[1]
    ? resolve(process.argv[1])
    : '';

if (archivoEjecutado === archivoActual) {
    const archivo = process.argv[2];

    if (!archivo) {
        console.error('Uso: node analizar-estructura.js archivo.js');
        process.exitCode = 1;
    } else {
        const codigo = fs.readFileSync(archivo, 'utf8');
        console.log(analizarEstructura(codigo));
    }
}

export { analizarEstructura };

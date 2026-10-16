
import path from 'node:path';
import { detectarArchivo } from './detectar-archivo.js';
import { analizarEstructura } from '../analizar-estructura.js';
import { ejecutarHerramienta } from './herramientas.js';

export async function lecturaPrevia(
    mcp,
    tarea,
    directorioProyecto,
    messages
) {
    const archivoSolicitado = detectarArchivo(tarea);

    if (!archivoSolicitado) return;

    console.log(`\nBuscando archivo: ${archivoSolicitado}`);

    const resultadoBusqueda = await ejecutarHerramienta(
        mcp,
        'search_files',
        {
            name: path.basename(archivoSolicitado),
            path: directorioProyecto
        }
    );

    console.log(resultadoBusqueda);

    const rutas = resultadoBusqueda
        .split('\n')
        .map(linea => linea.trim())
        .filter(linea =>
            linea.startsWith('/') &&
            !linea.startsWith('Error:')
        );

    const rutaSolicitada = archivoSolicitado.includes('/')
        ? path.resolve(directorioProyecto, archivoSolicitado)
        : null;

    const coincidencias = rutaSolicitada
        ? rutas.filter(ruta => path.resolve(ruta) === rutaSolicitada)
        : rutas;

    if (coincidencias.length === 0) {
        const mensaje = rutaSolicitada
            ? `No se encontró ${archivoSolicitado}.`
            : `No se encontró ${archivoSolicitado}.`;

        messages.push({
            role: 'user',
            content: `${mensaje} No inventes su contenido.`
        });
        return;
    }

    if (!rutaSolicitada && coincidencias.length > 1) {
        messages.push({
            role: 'user',
            content:
                `Hay varios archivos llamados ${archivoSolicitado}:\n` +
                coincidencias.map(ruta => `- ${ruta}`).join('\n') +
                '\nNo elijas uno arbitrariamente. Pide al usuario ' +
                'que especifique la ruta.'
        });
        return;
    }

    const ruta = coincidencias[0];

    console.log(`\nLeyendo: ${ruta}`);

    const contenido = await ejecutarHerramienta(
        mcp,
        'read_file',
        { path: ruta }
    );

    const estructura = analizarEstructura(contenido);

    console.log('\nEstructura detectada:');
    console.log(estructura);

    console.log('\nContenido leído:');
    console.log(contenido);

    messages.push({
        role: 'user',
        content:
            `Contenido real de ${ruta}:\n\n${contenido}\n\n` +
            `Estructura extraída automáticamente:\n\n${estructura}\n\n` +
            'Responde a la solicitud original usando este ' +
            'contenido. No inventes información.'
    });
}

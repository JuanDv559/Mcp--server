
import path from 'node:path';

export function seleccionarProyecto(argumentos) {
    const args = [...argumentos];
    const indiceProyecto = args.indexOf('--project');

    let directorioProyecto = process.cwd();

    if (indiceProyecto !== -1) {
        const rutaProyecto = args[indiceProyecto + 1];

        if (!rutaProyecto || rutaProyecto.startsWith('--')) {
            throw new Error(
                'Debes indicar una ruta después de --project'
            );
        }

        directorioProyecto = path.resolve(rutaProyecto);
        args.splice(indiceProyecto, 2);
    }

    return {
        directorioProyecto,
        tarea: args.join(' ')
    };
}

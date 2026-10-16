
import path from 'node:path';

export async function crearInventario(mcp, directorioProyecto) {
    const archivosIniciales = new Set();
    const pendientes = [directorioProyecto];
    const visitados = new Set();
    const MAX_DIRECTORIOS = 200;

    while (
        pendientes.length > 0 &&
        visitados.size < MAX_DIRECTORIOS
    ) {
        const directorio = pendientes.shift();

        if (visitados.has(directorio)) continue;
        visitados.add(directorio);

        const listado = await mcp.callTool({
            name: 'list_files',
            arguments: { path: directorio }
        });

        const textoListado = (listado.content || [])
            .map(item => item.text || '')
            .join('\n');

        if (listado.isError || textoListado.startsWith('Error:')) {
            archivosIniciales.add(
                `[ERROR] ${directorio}: ${textoListado}`
            );
            continue;
        }

        for (const linea of textoListado.split('\n')) {
            const coincidencia = linea.match(
                /^\[(DIR|FILE)\]\s+(.+)$/
            );

            if (!coincidencia) continue;

            const tipo = coincidencia[1];
            const nombre = coincidencia[2];

            if (nombre === '.git' || nombre === 'node_modules') {
                continue;
            }

            const rutaCompleta = path.join(directorio, nombre);
            const rutaRelativa = path.relative(
                directorioProyecto,
                rutaCompleta
            );

            archivosIniciales.add(
                `[${tipo}] ${rutaRelativa}`
            );

            if (tipo === 'DIR') {
                pendientes.push(rutaCompleta);
            }
        }
    }

    return [...archivosIniciales].join('\n');
}

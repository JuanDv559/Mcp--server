
export async function ejecutarHerramienta(mcp, nombre, argumentos) {
    const resultado = await mcp.callTool({
        name: nombre,
        arguments: argumentos
    });

    const contenido = (resultado.content || [])
        .map(item => item.text || '')
        .join('\n');

    if (resultado.isError) {
        throw new Error(
            contenido || `La herramienta MCP "${nombre}" devolvió un error`
        );
    }

    return contenido;
}


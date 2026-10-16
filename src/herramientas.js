
export async function ejecutarHerramienta(mcp, nombre, argumentos) {
    const resultado = await mcp.callTool({
        name: nombre,
        arguments: argumentos
    });

    return (resultado.content || [])
        .map(item => item.text || '')
        .join('\n');
}

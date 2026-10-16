
from pathlib import Path

archivo = Path("agent.js")
codigo = archivo.read_text()

inicio = codigo.find("// 5. Ciclo de herramientas")
fin = codigo.find("    } catch (error) {", inicio)

if inicio == -1 or fin == -1:
    raise SystemExit("ERROR: no se encontró el bloque esperado.")

nuevo = r'''
    // 5. Lectura previa y ciclo de herramientas
    const MAX_TOOL_CALLS = 5;
    let respuestaFinal = false;

    try {
        // Leer primero el archivo mencionado explícitamente.
        const archivoSolicitado = detectarArchivo(tarea);

        if (archivoSolicitado) {
            console.log(`\nBuscando archivo: ${archivoSolicitado}`);

            const busqueda = await mcp.callTool({
                name: "search_files",
                arguments: {
                    name: archivoSolicitado,
                    path: process.cwd()
                }
            });

            const resultadoBusqueda = (busqueda.content || [])
                .map(item => item.text || "")
                .join("\n");

            console.log(resultadoBusqueda);

            const rutas = resultadoBusqueda
                .split("\n")
                .map(linea => linea.trim())
                .filter(linea =>
                    linea.startsWith("/") &&
                    !linea.startsWith("Error:")
                );

            if (rutas.length > 0) {
                const ruta = rutas[0];

                console.log(`\nLeyendo: ${ruta}`);

                const lectura = await mcp.callTool({
                    name: "read_file",
                    arguments: { path: ruta }
                });

                const contenido = (lectura.content || [])
                    .map(item => item.text || "")
                    .join("\n");

                console.log("\nContenido leído:");
                console.log(contenido);

                messages.push({
                    role: "user",
                    content:
                        `Contenido real de ${ruta}:\n\n${contenido}\n\n` +
                        "Responde a la solicitud original usando este " +
                        "contenido. No inventes información."
                });
            } else {
                messages.push({
                    role: "user",
                    content:
                        `No se encontró ${archivoSolicitado}. ` +
                        "No inventes su contenido."
                });
            }
        }

        for (let intento = 1; intento <= MAX_TOOL_CALLS; intento++) {
            const respuesta = await askQwen(messages);
            const texto = respuesta.trim();

            console.log(`\nRespuesta de Qwen (intento ${intento}):`);
            console.log(texto);

            const decision = parseFirstJson(texto);

            if (!decision || !decision.tool) {
                respuestaFinal = true;
                break;
            }

            const existe = tools.some(
                tool => tool.name === decision.tool
            );

            if (!existe) {
                throw new Error(
                    `Herramienta desconocida: ${decision.tool}`
                );
            }

            const args = { ...(decision.arguments || {}) };

            if (decision.tool === "list_files") {
                args.path = args.path || args.dir || ".";
            }

            if (decision.tool === "read_file") {
                args.path = args.path || args.file;
            }

            if (decision.tool === "search_files") {
                args.name = args.name || args.file || args.query;
                args.path = args.path || args.dir || ".";
            }

            console.log(`\nEjecutando herramienta: ${decision.tool}`);

            const resultado = await mcp.callTool({
                name: decision.tool,
                arguments: args
            });

            const toolResult = (resultado.content || [])
                .map(item => item.text || "")
                .join("\n");

            console.log("\nResultado de MCP:");
            console.log(toolResult);

            messages.push({
                role: "assistant",
                content: texto
            });

            messages.push({
                role: "user",
                content:
                    `Resultado de ${decision.tool}:\n\n${toolResult}\n\n` +
                    "Continúa con la solicitud original. Si necesitas " +
                    "otra herramienta, responde solo con un objeto JSON " +
                    "válido. Si tienes información suficiente, responde " +
                    "directamente en español."
            });
        }

        if (!respuestaFinal) {
            messages.push({
                role: "user",
                content:
                    "Se alcanzó el límite de herramientas. Responde en " +
                    "español usando los resultados disponibles e indica " +
                    "si falta información."
            });

            const final = await askQwen(messages);
            console.log("\nRespuesta final de Qwen:");
            console.log(final);
        }
'''

copia = codigo[:inicio] + nuevo + codigo[fin:]

# Comprobación sencilla antes de escribir.
if "finally {" not in copia or "main().catch(" not in copia:
    raise SystemExit("ERROR: el cierre del programa no está intacto.")

archivo.write_text(copia)
print("Bloque actualizado correctamente.")

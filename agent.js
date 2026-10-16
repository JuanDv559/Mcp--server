import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { analizarEstructura } from './analizar-estructura.js';
import { seleccionarInstrucciones } from './src/seleccionar-instrucciones.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { askQwen } from './src/llm.js';
import { parseFirstJson } from './src/json.js';
import { detectarArchivo } from './src/detectar-archivo.js';
import { crearInventario } from './src/inventario.js';
import { ejecutarHerramienta } from './src/herramientas.js';
import { seleccionarProyecto } from './src/proyecto.js';
import { lecturaPrevia } from './src/lectura-previa.js';





const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



async function main() {

    // ─────────────────────────
    // 1. Conectar con MCP
    // ─────────────────────────

const rutaServidorMCP = path.join(__dirname, 'index.js');

const transport = new StdioClientTransport({
    command: "node",
    args: [rutaServidorMCP]
});

    const mcp = new Client({
        name: "qwen-agent",
        version: "1.0.0"
    });

    await mcp.connect(transport);


    // ─────────────────────────
    // 2. Obtener herramientas
    // ─────────────────────────

    const toolsResponse = await mcp.listTools();

    const tools = toolsResponse.tools;

    console.log("Herramientas disponibles:");

    for (const tool of tools) {
        console.log(`- ${tool.name}`);
    }


    // ─────────────────────────
    // 3. Crear descripción
    //    de las herramientas
    // ─────────────────────────

    const toolDescription = tools.map(tool => {

        return `
Nombre: ${tool.name}
Descripción: ${tool.description}
Entrada: ${JSON.stringify(tool.inputSchema)}
`;

    }).join("\n");


const argumentos = process.argv.slice(2);

const {
    directorioProyecto,
    tarea
} = seleccionarProyecto(argumentos);

console.log(`Proyecto seleccionado: ${directorioProyecto}`);

if (!tarea.trim()) {
    console.log('Uso: node agent.js "Tu instrucción"');
    await mcp.close();
    return;
}

const messages = [
    {
        role: 'system',
        content: await seleccionarInstrucciones(tarea)
    },
    {
        role: 'user',
        content: tarea
    }
];





const necesitaInventario =
    /\b(inventario|estructura|carpetas|directorios|archivos del proyecto|lista de archivos|enumera los archivos)\b/i.test(tarea);

if (necesitaInventario) {
    const inventario = await crearInventario(
        mcp,
        directorioProyecto
    );

    messages[1].content +=
        `\n\nINVENTARIO REAL DEL PROYECTO: ${directorioProyecto}\n\n` +
        inventario +
        '\n\nREGLAS OBLIGATORIAS PARA USAR EL INVENTARIO:\n' +
        '1. Trata cada línea del inventario como una ruta única.\n' +
        '2. No inventes, repitas ni cambies nombres de rutas.\n' +
        '3. Conserva los prefijos de carpeta, como BackEnd/ y FrontEnd/.\n' +
        '4. Distingue [DIR] (directorio) de [FILE] (archivo).\n' +
        '5. Si enumeras rutas, usa únicamente las líneas del inventario.\n' +
        '6. Si no puedes verificar un dato, indícalo explícitamente.';
}



    // 5. Lectura previa y ciclo de herramientas
    const MAX_TOOL_CALLS = 5;
    let respuestaFinal = false;

try{

    await lecturaPrevia(
    mcp,
    tarea,
    directorioProyecto,
    messages
);

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
    args.path = args.path || args.dir || directorioProyecto;
}

            if (decision.tool === "read_file") {
                args.path = args.path || args.file;
            }

            if (decision.tool === "search_files") {
    args.path = args.path || args.dir || directorioProyecto;
}

            console.log(`\nEjecutando herramienta: ${decision.tool}`);

            const toolResult = await ejecutarHerramienta(
    mcp,
    decision.tool,
    args
);

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
    } catch (error) {
        console.error("\nError procesando la tarea:", error.message);
    } finally {
        await mcp.close();
    }
}

main().catch(error => {
    console.error("Error:", error);
});



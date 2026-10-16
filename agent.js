const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const {
    StdioClientTransport
} = require("@modelcontextprotocol/sdk/client/stdio.js");
const { analizarEstructura } = require("./analizar-estructura.js");




async function askQwen(messages) {
    let response;

    try {
        response = await fetch(
            "http://127.0.0.1:8081/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                messages,
                temperature: 0,
                max_tokens: 512
}),
                signal: AbortSignal.timeout(300000)
            }
        );
    } catch (error) {
        throw new Error(
            `No se pudo conectar con llama-server: ${error.message}`
        );
    }

    const body = await response.text();

    if (!response.ok) {
        throw new Error(
            `llama-server respondió HTTP ${response.status}: ${body}`
        );
    }

    let data;

    try {
        data = JSON.parse(body);
    } catch {
        throw new Error(
            `llama-server no devolvió JSON válido: ${body}`
        );
    }

    const contenido = data.choices?.[0]?.message?.content;

    if (typeof contenido !== "string") {
        throw new Error(
            `La respuesta no contiene texto de Qwen: ${body}`
        );
    }

    return contenido;
}

  

function parseFirstJson(text) {
    const start = text.indexOf("{");

    if (start === -1) {
        return null;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i++) {
        const char = text[i];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === "\\") {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }

            continue;
        }

        if (char === '"') {
            inString = true;
        } else if (char === "{") {
            depth++;
        } else if (char === "}") {
            depth--;

            if (depth === 0) {
                try {
                    return JSON.parse(text.slice(start, i + 1));
                } catch {
                    return null;
                }
            }
        }
    }

    return null;
}










async function main() {

    // ─────────────────────────
    // 1. Conectar con MCP
    // ─────────────────────────

    const path = require("path");

const directorioAgente = __dirname;
const rutaServidorMCP = path.join(directorioAgente, "index.js");

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


    // ─────────────────────────
    // 4. Preguntar a Qwen
    // ─────────────────────────



const argumentos = process.argv.slice(2);
const indiceProyecto = argumentos.indexOf("--project");

let directorioProyecto = process.cwd();

if (indiceProyecto !== -1) {
    const rutaProyecto = argumentos[indiceProyecto + 1];

    if (!rutaProyecto || rutaProyecto.startsWith("--")) {
        throw new Error(
            "Debes indicar una ruta después de --project"
        );
    }

    directorioProyecto = path.resolve(rutaProyecto);
    argumentos.splice(indiceProyecto, 2);
}

const tarea = argumentos.join(" ");

console.log(`Proyecto seleccionado: ${directorioProyecto}`);

function detectarArchivo(texto) {
    const coincidencias = texto.match(
        /[\w.-]+(?:\/[\w.-]+)*\.(?:js|cjs|mjs|jsx|ts|tsx|json|html|css|py|md|env)/gi
    );

    if (!coincidencias || coincidencias.length === 0) {
        return null;
    }

    return coincidencias[coincidencias.length - 1];
}


if (!tarea) {
    console.log('Uso: node agent.js "Tu instrucción"');
    await mcp.close();
    return;
}

const messages = [
    {
        role: "system",
        content: `

Eres un asistente experto en programación, JavaScript, Node.js,
React, MongoDB y depuración. Trabajas localmente mediante
herramientas MCP.

OBJETIVO
Ayudar al usuario a comprender, analizar, depurar y mejorar
código basándote en evidencia real.

HERRAMIENTAS
- list_files: lista los archivos de un directorio.
- read_file: lee el contenido de un archivo.
- search_files: busca archivos por nombre.

REGLAS DE USO
1. Si necesitas encontrar un archivo por nombre, utiliza
   search_files.
2. Si necesitas conocer el contenido de un archivo, utiliza
   read_file.
3. Si una búsqueda devuelve una ruta absoluta, utiliza esa
   ruta exacta al leer el archivo.
4. No afirmes haber leído un archivo sin recibir su contenido.
5. Usa los resultados reales de las herramientas. No inventes
   rutas, archivos, funciones, variables ni resultados.
6. Distingue el código observado de tus hipótesis.
7. Si falta información, indícalo claramente.
8. Si necesitas una herramienta, responde con un único objeto
   JSON válido, sin Markdown ni texto adicional.
9. Nunca devuelvas dos objetos JSON en una misma respuesta.
10. Después de recibir los resultados necesarios, responde
    en español, explicando el razonamiento paso a paso.


REGLA OBLIGATORIA SOBRE HERRAMIENTAS:

Las únicas herramientas MCP disponibles son:
- list_files
- read_file
- search_files

No inventes herramientas, funciones registradas ni resultados.
No confundas funciones de JavaScript con herramientas MCP.
Si te preguntan cuáles están registradas, responde usando
exclusivamente el código fuente real de index.js.
Si el archivo ya fue leído y tienes su contenido en el historial,
responde directamente sin volver a buscarlo ni leerlo.



ANÁLISIS DEL CÓDIGO
- Identifica qué hace cada función y cómo se relaciona con
  las demás.
- Distingue las herramientas MCP registradas de las funciones
  normales y de los métodos de bibliotecas externas.
- No clasifiques una llamada como herramienta MCP solo porque
  su nombre contenga "tool" o "register".
- Para identificar herramientas disponibles, comprueba los
  nombres registrados mediante server.registerTool y contrasta
  con las herramientas que devuelve MCP.
- No repitas explicaciones sin aportar información nueva.
- Al depurar, identifica primero la causa probable y después
  propone el cambio mínimo necesario.
- No afirmes que una solución funciona hasta comprobarlo.

- No inventes números de línea. Solo indica líneas si recibiste
  números de línea fiables o si los calculaste del código.
- No confundas herramientas MCP con funciones internas.
- Una herramienta MCP se identifica por su registro en
  server.registerTool y su nombre exacto.
- Describe únicamente las herramientas cuyo registro puedas
  comprobar en el código recibido.
- Si una respuesta anterior contiene un error, corrígelo
  explícitamente.
- Prioriza respuestas breves, concretas y basadas en evidencia.

- No concluyas que no existen funciones internas sin revisar
  el código completo que recibiste.
- En index.js, la función search definida dentro de search_files
  es una función JavaScript interna, no una herramienta MCP.
- Distingue entre:
  a) herramientas registradas con server.registerTool;
  b) funciones JavaScript declaradas con function o const;
  c) métodos de bibliotecas externas.
- Si te preguntan por funciones internas, menciona solo las
  que puedas identificar en el código recibido.

- Resume el inventario por carpetas principales.
- No repitas una misma ruta.
- No inventes archivos ni nombres.
- Si una carpeta aparece muchas veces en el contexto, enumérala una sola vez.
- Si no puedes identificar los archivos principales con certeza,
  indica qué información falta.



REGLAS PARA ANALIZAR INVENTARIOS:
1. No inventes archivos, rutas ni cantidades.
2. Distingue la raíz del proyecto de las subcarpetas.
3. Una carpeta es principal solo si está directamente en la raíz.
4. Cuando enumeres archivos, conserva sus rutas relativas completas.
5. No afirmes cantidades exactas salvo que las hayas contado.
6. Selecciona como máximo cinco archivos importantes que aparezcan
   literalmente en el inventario.
7. Si no puedes justificar la importancia de un archivo solo por
   su nombre, di que es una selección preliminar.
8. No reproduzcas el inventario completo si te piden un resumen.




REGLAS DE EVIDENCIA:
- Distingue archivos de directorios.
- El listado de un directorio solo confirma los nombres mostrados.
- No sugieras qué archivos podría contener una carpeta.
- No uses expresiones como "puede contener" para completar información desconocida.
- Para enumerar archivos principales, inspecciona los directorios mediante list_files.
- Si no has inspeccionado una carpeta, indica que su contenido es desconocido.
- Basa cada afirmación en resultados reales de las herramientas MCP.




FORMATO DE RESPUESTA
Cuando expliques código:
1. Qué hace.
2. Cómo funciona.
3. Ejemplo concreto.
4. Errores o mejoras posibles, si son relevantes.

Si no necesitas herramientas, responde directamente.

`




    },
    {
        role: "user",
        content: tarea
    }
];



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
        name: "list_files",
        arguments: { path: directorio }
    });

    const textoListado = (listado.content || [])
        .map(item => item.text || "")
        .join("\n");

    if (listado.isError || textoListado.startsWith("Error:")) {
        archivosIniciales.push(
            `[ERROR] ${directorio}: ${textoListado}`
        );
        continue;
    }

    for (const linea of textoListado.split("\n")) {
        const coincidencia = linea.match(/^\[(DIR|FILE)\]\s+(.+)$/);

        if (!coincidencia) continue;

        const tipo = coincidencia[1];
        const nombre = coincidencia[2];

        if (nombre === ".git" || nombre === "node_modules") {
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

        if (tipo === "DIR") {
            pendientes.push(rutaCompleta);
        }
    }
}

messages.push({
    role: "user",
    content:
        `Inventario real del proyecto ${directorioProyecto}:\n\n` +
        [...archivosIniciales].join("\n") +
        "\n\nUsa exclusivamente este inventario para afirmar qué " +
        "archivos y directorios existen. No inventes rutas. " +
        "Si el inventario está incompleto, indícalo."
});


    
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
                    path: directorioProyecto
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

                    const estructura = analizarEstructura(contenido);

console.log("\nEstructura detectada:");
console.log(estructura);

                console.log("\nContenido leído:");
                console.log(contenido);

                messages.push({
                    role: "user",
                    content:
                        `Contenido real de ${ruta}:\n\n${contenido}\n\n` +
`Estructura extraída automáticamente:\n\n${estructura}\n\n` +
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
    args.path = args.path || args.dir || directorioProyecto;
}

            if (decision.tool === "read_file") {
                args.path = args.path || args.file;
            }

            if (decision.tool === "search_files") {
    args.path = args.path || args.dir || directorioProyecto;
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
    } catch (error) {
        console.error("\nError procesando la tarea:", error.message);
    } finally {
        await mcp.close();
    }
}

main().catch(error => {
    console.error("Error:", error);
});



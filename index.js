const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const fs = require("fs/promises");
const pathModule = require("path");


const server = new McpServer({
    name: "termux-tools",
    version: "1.0.0"
});

server.registerTool(
    "list_files",
    {  description: "Lista los archivos de un directorio",
        inputSchema: {
    path: z.string().describe("Ruta del directorio")
}
    },
    async ({ path: dirPath }) => {
        try {
            const files = await fs.readdir(dirPath, {
                withFileTypes: true
            });

            const result = files.map(file =>
                `${file.isDirectory() ? "[DIR]" : "[FILE]"} ${file.name}`
            );

            return {
                content: [
                    {
                        type: "text",
                        text: result.join("\n")
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }
);


server.registerTool(
    "read_file",
    {
        description: "Lee el contenido de un archivo de texto para analizar código",
        inputSchema: {
            path: z.string().describe("Ruta del archivo que se quiere leer")
        }
    },
    async ({ path: filePath }) => {
        try {
            const content = await fs.readFile(filePath, "utf8");

            return {
                content: [
                    {
                        type: "text",
                        text: content
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error al leer el archivo: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

);


server.registerTool(
    "search_files",
    {
        description: "Busca archivos por nombre dentro de un directorio y sus subdirectorios",
        inputSchema: {
            name: z.string().describe("Nombre o fragmento del nombre del archivo"),
            path: z.string().optional().describe("Directorio desde el que buscar")
        }
    },
    async ({ name, path: rootPath }) => {
    rootPath = pathModule.resolve(rootPath || process.cwd());
        try {
            const matches = [];
            const maxResults = 50;
            const maxDepth = 8;

            async function search(dir, depth) {
                if (depth > maxDepth || matches.length >= maxResults) {
                    return;
                }

                const entries = await fs.readdir(dir, {
                    withFileTypes: true
                });

                for (const entry of entries) {
                    if (matches.length >= maxResults) break;

                    if (entry.name === "node_modules" ||
                        entry.name === ".git") {
                        continue;
                    }

                    const fullPath = pathModule.resolve(dir, entry.name);

                    if (entry.isDirectory()) {
                        await search(fullPath, depth + 1);
                    } else if (
                        entry.name.toLowerCase().includes(name.toLowerCase())
                    ) {
                        matches.push(fullPath);
                    }
                }
            }

            // Usa el módulo path de Node.js para construir rutas.
            await search(rootPath, 0);

            return {
                content: [{
                    type: "text",
                    text: matches.length
                        ? matches.join("\n")
                        : "No se encontraron archivos coincidentes."
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Error al buscar archivos: ${error.message}`
                }],
                isError: true
            };
        }
    }
);






const transport = new StdioServerTransport();

server.connect(transport);

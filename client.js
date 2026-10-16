import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';


async function main() {
    const transport = new StdioClientTransport({
        command: "node",
        args: ["index.js"]
    });

    const client = new Client({
        name: "termux-client",
        version: "1.0.0"
    });

    await client.connect(transport);

    const tools = await client.listTools();

    console.log("Herramientas disponibles:");
    console.log(tools.tools.map(tool => tool.name));

    const result = await client.callTool({
        name: "list_files",
        arguments: {
            path: "."
        }
    });

    console.log("\nResultado:");
    console.log(result.content[0].text);

    await client.close();
}

main().catch(error => {
    console.error("Error:", error);
    process.exit(1);
});

import { config } from './config.js';


export async function askQwen(messages) {
    let response;

    try {
        response = await fetch(
            `${config.llm.baseUrl}/v1/chat/completions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages,
                    temperature: config.llm.temperature,
                    max_tokens: config.llm.maxTokens
                }),
                signal: AbortSignal.timeout(config.llm.timeout)
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


export function detectarArchivo(texto) {
    const coincidencias = texto.match(
        /[\w.-]+(?:\/[\w.-]+)*\.(?:cjs|mjs|jsx|tsx|js|ts|json|html|css|py|md|env|sh|yaml|yml|sql|xml)\b/gi
    );

    if (!coincidencias || coincidencias.length === 0) {
        return null;
    }

    return coincidencias[coincidencias.length - 1];
}


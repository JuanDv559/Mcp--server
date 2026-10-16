
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parse } from 'acorn';

function analizarEstructura(codigo) {
    const herramientas = [];
    const funciones = [];
    const declaraciones = [];
    const metodos = [];
    const clases = [];
    const metodosClase = [];

    let ast;

    try {
        ast = parse(codigo, {
            ecmaVersion: 'latest',
            sourceType: 'module',
            allowHashBang: true
        });
    } catch (error) {
        return [
            'No se pudo analizar la sintaxis JavaScript.',
            `Error: ${error.message}`
        ].join('\n');
    }

    function recorrer(nodo) {
        if (!nodo || typeof nodo !== 'object') return;

        if (Array.isArray(nodo)) {
            nodo.forEach(recorrer);
            return;
        }

        if (nodo.type === 'FunctionDeclaration' && nodo.id) {
            funciones.push(nodo.id.name);
        }

        if (nodo.type === 'ClassDeclaration' && nodo.id) {
    clases.push(nodo.id.name);
        }

       if (
           nodo.type === 'MethodDefinition' &&
           nodo.kind === 'method'
          ) {
           let nombre;

        if (nodo.key.type === 'Identifier') {
            nombre = nodo.key.name;
        } else if (nodo.key.type === 'PrivateIdentifier') {
            nombre = nodo.key.name;
        } else if (nodo.computed && nodo.key.type === 'Literal'){
            nombre = String(nodo.key.value);
        } else if (
            nodo.computed &&
            nodo.key.type === 'BinaryExpression' &&
            nodo.key.operator === '+' &&
            nodo.key.left.type === 'Literal' &&
            nodo.key.right.type === 'Literal'
        ) {
            nombre = String(nodo.key.left.value) +
            String(nodo.key.right.value);
        } else if (nodo.computed) {
            nombre = '[nombre calculado]';
        }
        if (nombre) {
        metodosClase.push(nombre);
         }
         }
                if (
            nodo.type === 'PropertyDefinition' &&
            nodo.value &&
            ['ArrowFunctionExpression', 'FunctionExpression']
                .includes(nodo.value.type)
        ) {
            let nombre;

            if (nodo.key.type === 'Identifier') {
                nombre = nodo.key.name;
            } else if (
                nodo.computed &&
                nodo.key.type === 'Literal'
            ) {
                nombre = String(nodo.key.value);
            }

            if (nombre) {
                metodosClase.push(nombre);
            }
        }



        if (
            nodo.type === 'VariableDeclarator' &&
            nodo.id.type === 'Identifier' &&
            nodo.init &&
            ['ArrowFunctionExpression', 'FunctionExpression']
                .includes(nodo.init.type)
        ) {
            declaraciones.push(nodo.id.name);
        }

        if (
            nodo.type === 'CallExpression' &&
            nodo.callee.type === 'MemberExpression' &&
            !nodo.callee.computed &&
            nodo.callee.object.type === 'Identifier' &&
            nodo.callee.object.name === 'server' &&
            nodo.callee.property.name === 'registerTool' &&
            nodo.arguments[0]?.type === 'Literal' &&
            typeof nodo.arguments[0].value === 'string'
        ) {
            herramientas.push(nodo.arguments[0].value);
        }

        if (
            nodo.type === 'CallExpression' &&
            nodo.callee.type === 'MemberExpression' &&
            !nodo.callee.computed &&
            nodo.callee.object.type === 'Identifier' &&
            ['fs',                  'pathModule'].includes(nodo.callee.object.name) &&
            nodo.callee.property.type === 'Identifier'
        ) {
            metodos.push(
                        `${nodo.callee.object.name}.${nodo.callee.property.name}`
            );
        }

        for (const [clave, valor] of Object.entries(nodo)) {
            if (
                clave === 'start' ||
                clave === 'end' ||
                clave === 'loc'
            ) continue;

            if (valor && typeof valor === 'object') {
                recorrer(valor);
            }
        }
    }

    recorrer(ast);

    return [
        'ESTRUCTURA EXTRAÍDA DEL CÓDIGO',
        '',
        'Herramientas MCP registradas:',
        ...(herramientas.length
            ? herramientas.map(n => `- ${n}`)
            : ['- No detectadas']),
        '',
        'Funciones declaradas con function:',
        ...(funciones.length
            ? funciones.map(n => `- ${n}`)
            : ['- No detectadas']),
        '',

        '',
         'Clases declaradas:',
        ...(clases.length
         ? clases.map(n => `- ${n}`)
        : ['- No detectadas']),
        '',
        'Métodos de clase:',
        ...(metodosClase.length
        ? [...new Set(metodosClase)].map(n => `- ${n}`)
        : ['- No detectados']),

        'Declaraciones const/let/var con función flecha:',
        ...(declaraciones.length
            ? declaraciones.map(n => `- ${n}`)
            : ['- No detectadas']),
        '',
        'Métodos detectados de fs y pathModule:',
        ...(metodos.length
            ? [...new Set(metodos)].map(n => `- ${n}`)
            : ['- No detectados']),
        '',
        'Nota: extracción basada en AST de Acorn.'
    ].join('\n');
}

const archivoActual = fileURLToPath(import.meta.url);
const archivoEjecutado = process.argv[1]
    ? resolve(process.argv[1])
    : '';

if (archivoEjecutado === archivoActual) {
    const archivo = process.argv[2];

    if (!archivo) {
        console.error('Uso: node analizar-estructura.js archivo.js');
        process.exitCode = 1;
    } else {
        const codigo = fs.readFileSync(archivo, 'utf8');
        console.log(analizarEstructura(codigo));
    }
}

export { analizarEstructura };


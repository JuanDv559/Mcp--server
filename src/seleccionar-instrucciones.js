
import { cargarInstrucciones } from './instructions.js';
import { necesitaAnalisis } from './detectar-tipo-tarea.js';

export async function seleccionarInstrucciones(tarea) {
    if (necesitaAnalisis(tarea)) {
        return await cargarInstrucciones();
    }

    return 'Obedece exactamente la petición del usuario. No añadas explicaciones ni código que no te pidan.';
}

import * as tareasService from "../services/tareas.service.js";
import { validateMateriaIdParam, validateTareaListQuery } from "../validators/tareas.validator.js";
import { sendSuccess } from "../utils/api-response.js"; // ajusta el path según tu proyecto

/**
 * Controlador para listar las tareas de una materia específica del usuario autenticado.
 *
 * @async
 * @function listTareasByMateria
 * @param {import('express').Request} request - Objeto de solicitud de Express. Se espera `request.params.materiaId`, `request.query` con los filtros y `request.user.id`.
 * @param {import('express').Response} response - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para pasar el control al siguiente middleware en caso de error.
 *
 * @returns {Promise<void>} Envía una respuesta 200 con el listado de tareas y los metadatos de paginación, o delega el error al middleware correspondiente.
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario (propagado por el servicio).
 */
export async function listTareasByMateria(request, response, next) {
    try {
        const materiaId = validateMateriaIdParam(request.params.materiaId);
        const filters = validateTareaListQuery(request.query);
        const result = await tareasService.listTareasByMateria(request.user.id, materiaId, filters);
        return sendSuccess(response, result.data, 200, result.meta);
    } catch (error) {
        return next(error);
    }
}

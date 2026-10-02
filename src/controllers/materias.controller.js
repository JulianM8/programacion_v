import * as materiasService from "../services/materias.service.js";
import { sendNoContent, sendSuccess } from "../utils/api-response.js";

import {
    validateCreateMateria,
    validateMateriaId,
    validateMateriaListQuery,
    validatePatchMateria
} from "../validators/materias.validator.js";


/**
 * Controlador para listar las materias del usuario autenticado, aplicando filtros y paginación.
 *
 * @async
 * @function listMaterias
 * @param {import('express').Request} request - Objeto de solicitud de Express. Se espera `request.query` con los filtros y `request.user.id` con el ID del usuario autenticado.
 * @param {import('express').Response} response - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para pasar el control al siguiente middleware en caso de error.
 *
 * @returns {Promise<void>} Envía una respuesta 200 con el listado de materias y los metadatos de paginación, o delega el error al middleware correspondiente.
 */
export async function listMaterias(request, response, next) {
    try {
        const filters = validateMateriaListQuery(request.query);
        const result = await materiasService.listMaterias(request.user.id, filters);
        return sendSuccess(response, result.data, 200, result.meta);
    } catch (error) {
        return next(error);
    }
}

/**
 * Controlador para obtener una materia específica del usuario autenticado a partir de su ID.
 *
 * @async
 * @function getMaterias
 * @param {import('express').Request} request - Objeto de solicitud de Express. Se espera `request.params.id` con el ID de la materia y `request.user.id` con el ID del usuario autenticado.
 * @param {import('express').Response} response - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para pasar el control al siguiente middleware en caso de error.
 *
 * @returns {Promise<void>} Envía una respuesta 200 con los datos de la materia, o delega el error al middleware correspondiente.
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario.
 */
export async function getMaterias(request, response, next) {
    try {
        const id = validateMateriaId(request.params.id);
        const result = await materiasService.getMateriaById(id, request.user.id);
        return sendSuccess(response, result);
    } catch (error) {
        return next(error);
    }
}

/**
 * Controlador para crear una nueva materia asociada al usuario autenticado.
 *
 * @async
 * @function createMateria
 * @param {import('express').Request} request - Objeto de solicitud de Express. Se espera `request.body` con los datos de la materia y `request.user.id` con el ID del usuario autenticado.
 * @param {import('express').Response} response - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para pasar el control al siguiente middleware en caso de error.
 *
 * @returns {Promise<void>} Envía una respuesta 201 con la materia creada, o delega el error al middleware correspondiente.
 *
 * @throws {HttpError} Código 409 (DUPLICATE_CODE) si el código ya está registrado para el usuario.
 * @throws {HttpError} Código 409 (DUPLICATE_NAME) si el nombre ya está registrado para el usuario.
 */
export async function createMateria(request, response, next) {
    try {
        const payload = validateCreateMateria(request.body);
        const materia = await materiasService.createMateria(request.user.id, payload);
        return sendSuccess(response, materia, 201);
    } catch (error) {
        return next(error);
    }
}

/**
 * Controlador para reemplazar por completo los datos de una materia existente del usuario autenticado.
 *
 * @async
 * @function replaceMateria
 * @param {import('express').Request} request - Objeto de solicitud de Express. Se espera `request.params.id` con el ID de la materia, `request.body` con los nuevos datos y `request.user.id` con el ID del usuario autenticado.
 * @param {import('express').Response} response - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para pasar el control al siguiente middleware en caso de error.
 *
 * @returns {Promise<void>} Envía una respuesta 200 con la materia actualizada, o delega el error al middleware correspondiente.
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario.
 * @throws {HttpError} Código 409 (DUPLICATE_CODE) si el código ya está registrado para el usuario.
 * @throws {HttpError} Código 409 (DUPLICATE_NAME) si el nombre ya está registrado para el usuario.
 */
export async function replaceMateria(request, response, next) {
    try {
        const id = validateMateriaId(request.params.id);
        const payload = validateCreateMateria(request.body);
        const materia = await materiasService.replaceMateria(id, request.user.id, payload);
        return sendSuccess(response, materia);
    } catch (error) {
        return next(error);
    }
}

/**
 * Controlador para actualizar parcialmente los datos de una materia existente del usuario autenticado.
 *
 * @async
 * @function updateMateria
 * @param {import('express').Request} request - Objeto de solicitud de Express. Se espera `request.params.id` con el ID de la materia, `request.body` con los datos parciales y `request.user.id` con el ID del usuario autenticado.
 * @param {import('express').Response} response - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para pasar el control al siguiente middleware en caso de error.
 *
 * @returns {Promise<void>} Envía una respuesta 200 con la materia actualizada, o delega el error al middleware correspondiente.
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario (propagado por el servicio).
 * @throws {HttpError} Código 409 (DUPLICATE_CODE) si el código ya está registrado para el usuario (propagado por el servicio).
 * @throws {HttpError} Código 409 (DUPLICATE_NAME) si el nombre ya está registrado para el usuario (propagado por el servicio).
 */
export async function updateMateria(request, response, next) {
    try {
        const id = validateMateriaId(request.params.id);
        const payload = validatePatchMateria(request.body);
        const materia = await materiasService.updateMateria(id, request.user.id, payload);
        return sendSuccess(response, materia);
    } catch (error) {
        return next(error);
    }
}

/**
 * Controlador para eliminar una materia existente del usuario autenticado.
 *
 * @async
 * @function deleteMateria
 * @param {import('express').Request} request - Objeto de solicitud de Express. Se espera `request.params.id` con el ID de la materia y `request.user.id` con el ID del usuario autenticado.
 * @param {import('express').Response} response - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para pasar el control al siguiente middleware en caso de error.
 *
 * @returns {Promise<void>} Envía una respuesta 204 sin contenido si la eliminación fue exitosa, o delega el error al middleware correspondiente.
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario.
 */
export async function deleteMateria(request, response, next) {
    try {
        const id = validateMateriaId(request.params.id);
        await materiasService.removeMateria(id, request.user.id);
        return sendNoContent(response);
    } catch (error) {
        return next(error);
    }
}
/**
 * Controlador para listar los eventos asociados a una materia específica del usuario autenticado.
 * @async
 * @function listEventosByMateria
 * @param {import('express').Request} request - Objeto de solicitud de Express. Se espera `request.params.id` con el ID de la materia y `request.user.id` con el ID del usuario autenticado.
 * @param {import('express').Response} response - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para pasar el control al siguiente middleware en caso de error.
 * @returns {Promise<void>} Envía una respuesta 200 con el listado de eventos asociados a la materia, o delega el error al middleware correspondiente.
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario.
 */
export async function listEventosByMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const eventos = await materiasService.listEventosByMateria(
      id,
      request.user.id
    );

    return sendSuccess(response, eventos);
  } catch (error) {
    return next(error);
  }
}

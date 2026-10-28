import * as recordatoriosService from "../services/recordatorios.service.js";
import { sendNoContent, sendSuccess } from "../utils/api-response.js";

import {
  validateCreateRecordatorio,
  validatePatchRecordatorio,
  validateRecordatorioId,
  validateRecordatorioListQuery
} from "../validators/recordatorios.validator.js";

/**
 * Lista los recordatorios del usuario autenticado, con filtros, orden y paginación.
 * GET /api/v1/recordatorios
 *
 * @async
 * @function listRecordatorios
 * @param {import('express').Request} request - Usa `request.query` y `request.user.id`.
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} HTTP 200 con `data` y `meta`.
 */
export async function listRecordatorios(request, response, next) {
  try {
    const filters = validateRecordatorioListQuery(request.query);
    const result = await recordatoriosService.listRecordatorios(request.user.id, filters);
    return sendSuccess(response, result.data, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}

/**
 * Obtiene un recordatorio del usuario por su ID.
 * GET /api/v1/recordatorios/:id
 *
 * @async
 * @function getRecordatorio
 * @param {import('express').Request} request - Usa `request.params.id` y `request.user.id`.
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} HTTP 200 con el recordatorio.
 * @throws {HttpError} 400 (INVALID_ID) o 404 (RECORDATORIO_NOT_FOUND).
 */
export async function getRecordatorio(request, response, next) {
  try {
    const id = validateRecordatorioId(request.params.id);
    const result = await recordatoriosService.getRecordatorioById(id, request.user.id);
    return sendSuccess(response, result);
  } catch (error) {
    return next(error);
  }
}

/**
 * Crea un recordatorio para una tarea del usuario.
 * POST /api/v1/recordatorios
 *
 * @async
 * @function createRecordatorio
 * @param {import('express').Request} request - Usa `request.body` y `request.user.id`.
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} HTTP 201 con el recordatorio creado.
 * @throws {HttpError} 422 (VALIDATION_ERROR) o 404 (TAREA_NOT_FOUND).
 */
export async function createRecordatorio(request, response, next) {
  try {
    const payload = validateCreateRecordatorio(request.body);
    const recordatorio = await recordatoriosService.createRecordatorio(request.user.id, payload);
    return sendSuccess(response, recordatorio, 201);
  } catch (error) {
    return next(error);
  }
}

/**
 * Reemplaza por completo un recordatorio del usuario.
 * PUT /api/v1/recordatorios/:id
 *
 * @async
 * @function replaceRecordatorio
 * @param {import('express').Request} request - Usa `request.params.id`, `request.body` y `request.user.id`.
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} HTTP 200 con el recordatorio actualizado.
 * @throws {HttpError} 400, 404 (RECORDATORIO_NOT_FOUND / TAREA_NOT_FOUND) o 422.
 */
export async function replaceRecordatorio(request, response, next) {
  try {
    const id = validateRecordatorioId(request.params.id);
    const payload = validateCreateRecordatorio(request.body);
    const recordatorio = await recordatoriosService.replaceRecordatorio(id, request.user.id, payload);
    return sendSuccess(response, recordatorio);
  } catch (error) {
    return next(error);
  }
}

/**
 * Actualiza parcialmente un recordatorio del usuario.
 * PATCH /api/v1/recordatorios/:id
 *
 * @async
 * @function updateRecordatorio
 * @param {import('express').Request} request - Usa `request.params.id`, `request.body` y `request.user.id`.
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} HTTP 200 con el recordatorio actualizado.
 * @throws {HttpError} 400, 404 (RECORDATORIO_NOT_FOUND / TAREA_NOT_FOUND) o 422.
 */
export async function updateRecordatorio(request, response, next) {
  try {
    const id = validateRecordatorioId(request.params.id);
    const payload = validatePatchRecordatorio(request.body);
    const recordatorio = await recordatoriosService.updateRecordatorio(id, request.user.id, payload);
    return sendSuccess(response, recordatorio);
  } catch (error) {
    return next(error);
  }
}

/**
 * Elimina un recordatorio del usuario.
 * DELETE /api/v1/recordatorios/:id
 *
 * @async
 * @function deleteRecordatorio
 * @param {import('express').Request} request - Usa `request.params.id` y `request.user.id`.
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} HTTP 204 sin contenido.
 * @throws {HttpError} 400 (INVALID_ID) o 404 (RECORDATORIO_NOT_FOUND).
 */
export async function deleteRecordatorio(request, response, next) {
  try {
    const id = validateRecordatorioId(request.params.id);
    await recordatoriosService.removeRecordatorio(id, request.user.id);
    return sendNoContent(response);
  } catch (error) {
    return next(error);
  }
}
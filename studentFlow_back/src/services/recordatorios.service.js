import * as recordatoriosRepository from "../repositories/recordatorios.repositorio.js";
import { HttpError } from "../utils/http-error.js";

/**
 * Obtiene el listado paginado de recordatorios del usuario, aplicando los filtros indicados.
 *
 * @async
 * @function listRecordatorios
 * @param {string|number} userId - Usuario dueño de las materias de las tareas.
 * @param {Object} filters - Filtros y paginación ya validados.
 * @returns {Promise<{data: Array, meta: {page: number, limit: number, total: number, pages: number}}>}
 */
export async function listRecordatorios(userId, filters) {
  const { recordatorios, total } = await recordatoriosRepository.findAllByUserId(userId, filters);

  return {
    data: recordatorios,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

/**
 * Obtiene un recordatorio por su ID, validando que pertenezca al usuario.
 *
 * @async
 * @function getRecordatorioById
 * @param {string|number} id - ID del recordatorio.
 * @param {string|number} userId - ID del usuario.
 * @returns {Promise<Object>} El recordatorio.
 * @throws {HttpError} Código 404 (RECORDATORIO_NOT_FOUND) si no existe o es de otro usuario.
 */
export async function getRecordatorioById(id, userId) {
  const recordatorio = await recordatoriosRepository.findByIdAndUserId(id, userId);

  if (!recordatorio) {
    throw new HttpError(404, "RECORDATORIO_NOT_FOUND", "El recordatorio no fue encontrado");
  }

  return recordatorio;
}

/**
 * Comprueba que la tarea exista y pertenezca al usuario. La tabla tarea no se modifica.
 *
 * @async
 * @function ensureTareaDelUsuario
 * @param {string|number} tareaId - ID de la tarea.
 * @param {string|number} userId - ID del usuario.
 * @returns {Promise<void>}
 * @throws {HttpError} Código 404 (TAREA_NOT_FOUND) si la tarea no existe o es de otro usuario.
 */
async function ensureTareaDelUsuario(tareaId, userId) {
  const exists = await recordatoriosRepository.existsTareaForUser(tareaId, userId);

  if (!exists) {
    throw new HttpError(404, "TAREA_NOT_FOUND", "La tarea no fue encontrada");
  }
}

/**
 * Crea un recordatorio para una tarea del usuario.
 *
 * @async
 * @function createRecordatorio
 * @param {string|number} userId - ID del usuario.
 * @param {Object} recordatorio - Datos validados.
 * @returns {Promise<Object>} El recordatorio creado.
 * @throws {HttpError} Código 404 (TAREA_NOT_FOUND) si la tarea no existe o es de otro usuario.
 */
export async function createRecordatorio(userId, recordatorio) {
  await ensureTareaDelUsuario(recordatorio.tareaId, userId);
  return recordatoriosRepository.createRecordatorio(userId, recordatorio);
}

/**
 * Reemplaza por completo un recordatorio del usuario.
 *
 * @async
 * @function replaceRecordatorio
 * @param {string|number} id - ID del recordatorio.
 * @param {string|number} userId - ID del usuario.
 * @param {Object} recordatorio - Datos completos validados.
 * @returns {Promise<Object>} El recordatorio actualizado.
 * @throws {HttpError} Código 404 (RECORDATORIO_NOT_FOUND) si no existe o es de otro usuario.
 * @throws {HttpError} Código 404 (TAREA_NOT_FOUND) si la nueva tarea no existe o es de otro usuario.
 */
export async function replaceRecordatorio(id, userId, recordatorio) {
  await getRecordatorioById(id, userId);
  await ensureTareaDelUsuario(recordatorio.tareaId, userId);
  return recordatoriosRepository.updateRecordatorio(id, userId, recordatorio);
}

/**
 * Actualiza parcialmente un recordatorio del usuario.
 *
 * @async
 * @function updateRecordatorio
 * @param {string|number} id - ID del recordatorio.
 * @param {string|number} userId - ID del usuario.
 * @param {Object} partialRecordatorio - Campos validados a cambiar.
 * @returns {Promise<Object>} El recordatorio actualizado.
 * @throws {HttpError} Código 404 (RECORDATORIO_NOT_FOUND) si no existe o es de otro usuario.
 * @throws {HttpError} Código 404 (TAREA_NOT_FOUND) si se cambia a una tarea que no existe o es de otro usuario.
 */
export async function updateRecordatorio(id, userId, partialRecordatorio) {
  await getRecordatorioById(id, userId);

  if (partialRecordatorio.tareaId !== undefined) {
    await ensureTareaDelUsuario(partialRecordatorio.tareaId, userId);
  }

  return recordatoriosRepository.patchRecordatorio(id, userId, partialRecordatorio);
}

/**
 * Elimina un recordatorio del usuario.
 *
 * @async
 * @function removeRecordatorio
 * @param {string|number} id - ID del recordatorio.
 * @param {string|number} userId - ID del usuario.
 * @returns {Promise<void>}
 * @throws {HttpError} Código 404 (RECORDATORIO_NOT_FOUND) si no existe o es de otro usuario.
 */
export async function removeRecordatorio(id, userId) {
  await getRecordatorioById(id, userId);
  await recordatoriosRepository.deleteRecordatorio(id, userId);
}


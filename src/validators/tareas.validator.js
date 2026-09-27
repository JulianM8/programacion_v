
import { HttpError } from "../utils/http-error.js";

/**
 * Valida el identificador de una materia recibido en los parámetros de ruta.
 * Reutiliza la misma regla que `validateMateriaId` de materias.
 *
 * @function validateMateriaIdParam
 * @param {string|number} materiaId - Identificador a validar (usualmente `request.params.materiaId`).
 *
 * @returns {number} El identificador convertido a número entero.
 *
 * @throws {HttpError} Código 400 (INVALID_ID) si el identificador no es un entero mayor o igual a 1.
 */
export function validateMateriaIdParam(materiaId) {
  const parsedId = Number(materiaId);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new HttpError(400, "INVALID_ID", "El identificador de materia no es válido.");
  }

  return parsedId;
}

/**
 * Valida y normaliza los parámetros de consulta (query params) para el listado de tareas
 * de una materia, incluyendo filtros y paginación.
 *
 * @function validateTareaListQuery
 * @param {Object} query - Objeto de query params de la petición (usualmente `request.query`).
 * @param {string} [query.estado] - Filtro por estado de la tarea ("pendiente", "en_progreso", "entregada" o "cancelada").
 * @param {string} [query.prioridad] - Filtro por prioridad de la tarea ("baja", "media" o "alta").
 * @param {string} [query.page] - Número de página solicitada (por defecto 1).
 * @param {string} [query.limit] - Cantidad de registros por página (por defecto 20, máximo 100).
 * @param {string} [query.sort] - Campo por el cual ordenar los resultados.
 * @param {string} [query.order] - Dirección del ordenamiento ("asc" o "desc").
 *
 * @returns {Object} Objeto con los filtros validados y normalizados (estado, prioridad, sort, order, page, limit).
 *
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'page' no es un entero mayor o igual a 1.
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'limit' no es un entero entre 1 y 100.
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'estado' no es uno de los valores permitidos por `tarea_estado_enum`.
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'prioridad' no es uno de los valores permitidos por `tarea_prioridad_enum`.
 */
export function validateTareaListQuery(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'page' debe ser un entero mayor o igual a 1.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'limit' debe ser un entero entre 1 y 100.");
  }

  const estadosValidos = ["pendiente", "en_progreso", "entregada", "cancelada"];
  const prioridadesValidas = ["baja", "media", "alta"];

  if (query.estado !== undefined && !estadosValidos.includes(query.estado)) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo 'estado' debe ser uno de: ${estadosValidos.join(", ")}.`);
  }

  if (query.prioridad !== undefined && !prioridadesValidas.includes(query.prioridad)) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo 'prioridad' debe ser uno de: ${prioridadesValidas.join(", ")}.`);
  }

  return {
    estado: query.estado,
    prioridad: query.prioridad,
    sort: query.sort,
    order: query.order,
    page,
    limit
  };
}

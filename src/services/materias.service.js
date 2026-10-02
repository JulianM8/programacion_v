import * as materiasRepository from "../repositories/materias.repositorio.js";
import { HttpError } from "../utils/http-error.js";

/**
 * Obtiene el listado paginado de materias pertenecientes a un usuario, aplicando los filtros indicados.
 *
 * @async
 * @function listMaterias
 * @param {string|number} userId - Identificador único del usuario dueño de las materias.
 * @param {Object} filters - Filtros y parámetros de paginación para la consulta.
 * @param {number} filters.page - Número de página solicitada.
 * @param {number} filters.limit - Cantidad de registros por página.
 *
 * @returns {Promise<Object>} Objeto con los datos de las materias y la información de paginación.
 * @returns {Array} return.data - Listado de materias encontradas.
 * @returns {Object} return.meta - Metadatos de paginación (page, limit, total, pages).
 */
export async function listMaterias(userId, filters) {
  const { materias, total } = await materiasRepository.findAllByUserId(userId, filters);

  // Retornar los datos de las materias y la información de paginación
  return {
    data: materias,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

/**
 * Obtiene una materia específica a partir de su ID, validando que pertenezca al usuario indicado.
 *
 * @async
 * @function getMateriaById
 * @param {string|number} id - Identificador único de la materia a buscar.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 *
 * @returns {Promise<Object>} La materia encontrada.
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario.
 */
export async function getMateriaById(id, userId) {
  const materia = await materiasRepository.findByIdAndUserId(id, userId);
  if (!materia) {
    throw new HttpError(404, "MATERIA_NOT_FOUND", "La materia no fue encontrada");
  }
  return materia;
}

/**
 * Crea una nueva materia para un usuario, validando previamente que el código y el nombre sean únicos.
 *
 * @async
 * @function createMateria
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {Object} materia - Datos de la materia a crear.
 * @param {string} [materia.codigo] - Código identificador de la materia (opcional).
 * @param {string} [materia.nombre] - Nombre de la materia (opcional).
 *
 * @returns {Promise<Object>} La materia recién creada.
 *
 * @throws {HttpError} Código 409 (DUPLICATE_CODE) si el código ya está registrado para el usuario.
 * @throws {HttpError} Código 409 (DUPLICATE_NAME) si el nombre ya está registrado para el usuario.
 */
export async function createMateria(userId, materia) {
  await ensureUniqueFields(userId, materia);
  return materiasRepository.createMateria(userId, materia);
}

/** 
* Valida que el código y el nombre de una materia sean únicos para un usuario específico.
* 
* @async
* @function ensureUniqueFields
* @param {string|number} userId - Identificador único del usuario dueño de la materia.
* @param {Object} materia - Objeto que contiene los datos de la materia a validar.
* @param {string} [materia.codigo] - Código identificador de la materia (opcional).
* @param {string} [materia.nombre] - Nombre de la materia (opcional).
* @param {string|number} [excludeId] - ID de una materia existente a excluir de la validación (útil en actualizaciones).
* 
* @returns {Promise} No retorna ningún valor si las validaciones son exitosas.
* 
* @throws {HttpError} Código 409 (DUPLICATE_CODE) si el código ya está registrado para el usuario.
* @throws {HttpError} Código 409 (DUPLICATE_NAME) si el nombre ya está registrado para el usuario.
*/

async function ensureUniqueFields(userId, materia, excludeId) {
  if (materia.codigo) {
    const duplicatedCode = await materiasRepository.existsByCode(userId, materia.codigo, excludeId);

    if (duplicatedCode) {
      throw new HttpError(409, "DUPLICATE_CODE", "Ya existe una materia con ese código.");
    }
  }

  if (materia.nombre) {
    const duplicatedName = await materiasRepository.existsByName(userId, materia.nombre, excludeId);

    if (duplicatedName) {
      throw new HttpError(409, "DUPLICATE_NAME", "Ya existe una materia con ese nombre.");
    }
  }
}

/**
 * Reemplaza por completo los datos de una materia existente, validando que pertenezca al usuario
 * y que el código y el nombre sigan siendo únicos (excluyendo la propia materia).
 *
 * @async
 * @function replaceMateria
 * @param {string|number} id - Identificador único de la materia a reemplazar.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {Object} materia - Nuevos datos completos de la materia.
 * @param {string} [materia.codigo] - Código identificador de la materia (opcional).
 * @param {string} [materia.nombre] - Nombre de la materia (opcional).
 *
 * @returns {Promise<Object>} La materia actualizada.
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario.
 * @throws {HttpError} Código 409 (DUPLICATE_CODE) si el código ya está registrado para el usuario.
 * @throws {HttpError} Código 409 (DUPLICATE_NAME) si el nombre ya está registrado para el usuario.
 */
export async function replaceMateria(id, userId, materia) {
  await getMateriaById(id, userId);
  await ensureUniqueFields(userId, materia, id);
  return materiasRepository.updateMateria(id, userId, materia);
}

/**
 * Actualiza parcialmente los datos de una materia existente, validando que pertenezca al usuario
 * y que el código y el nombre sigan siendo únicos (excluyendo la propia materia).
 *
 * @async
 * @function updateMateria
 * @param {string|number} id - Identificador único de la materia a actualizar.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {Object} partialMateria - Datos parciales de la materia a actualizar.
 * @param {string} [partialMateria.codigo] - Código identificador de la materia (opcional).
 * @param {string} [partialMateria.nombre] - Nombre de la materia (opcional).
 *
 * @returns {Promise<Object>} La materia actualizada.
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario.
 * @throws {HttpError} Código 409 (DUPLICATE_CODE) si el código ya está registrado para el usuario.
 * @throws {HttpError} Código 409 (DUPLICATE_NAME) si el nombre ya está registrado para el usuario.
 */
export async function updateMateria(id, userId, partialMateria) {
  await getMateriaById(id, userId);
  await ensureUniqueFields(userId, partialMateria, id);
  return materiasRepository.patchMateria(id, userId, partialMateria);
}

/**
 * Elimina una materia existente, validando previamente que pertenezca al usuario indicado.
 *
 * @async
 * @function removeMateria
 * @param {string|number} id - Identificador único de la materia a eliminar.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 *
 * @returns {Promise<void>} No retorna ningún valor si la eliminación es exitosa.
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario.
 */
export async function removeMateria(id, userId) {
  await getMateriaById(id, userId);
  await materiasRepository.deleteMateria(id, userId);
}
/**
 * Obtiene el listado de eventos asociados a una materia específica, validando que la materia pertenezca al usuario.
 * @async
 * @function listEventosByMateria
 * @param {string|number} id - Identificador único de la materia.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 *
 * @returns {Promise<Array>} El listado de eventos asociados a la materia.
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario.
 */
export async function listEventosByMateria(id, userId) {
  return materiasRepository.findEventosByMateriaAndUserId(id, userId);
}



import * as materiasService from "../services/materias.service.js";
import * as tareasRepositorio from "../repositories/tareas.repositorio.js";

/**
 * Obtiene el listado paginado de tareas pertenecientes a una materia específica del usuario,
 * validando primero que la materia exista y le pertenezca.
 *
 * @async
 * @function listTareasByMateria
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {string|number} materiaId - Identificador único de la materia cuyas tareas se desean listar.
 * @param {Object} filters - Filtros y parámetros de paginación para la consulta.
 * @param {number} filters.page - Número de página solicitada.
 * @param {number} filters.limit - Cantidad de registros por página.
 *
 * @returns {Promise<Object>} Objeto con los datos de las tareas y la información de paginación.
 * @returns {Array} return.data - Listado de tareas encontradas.
 * @returns {Object} return.meta - Metadatos de paginación (page, limit, total, pages).
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario (propagado por `materiasService.getMateriaById`).
 */
export async function listTareasByMateria(userId, materiaId, filters) {
  // Verifica que la materia exista y pertenezca al usuario antes de listar sus tareas
  await materiasService.getMateriaById(materiaId, userId);

  const { tareas, total } = await tareasRepositorio.findAllByMateriaId(materiaId, filters);

  return {
    data: tareas,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}


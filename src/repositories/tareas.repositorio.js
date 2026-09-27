import { pool } from "../config/database.js";

const sortableFields = {
  fecha_entrega: "t.fecha_entrega",
  prioridad: "t.prioridad",
  estado: "t.estado",
  titulo: "t.titulo"
};

/**
 * Normaliza el criterio de ordenamiento para el listado de tareas.
 *
 * @function normalizeTareaSort
 * @param {string} sort - Nombre del campo por el cual ordenar (debe existir en `sortableFields`).
 * @param {string} order - Dirección del ordenamiento ("asc" o "desc").
 *
 * @returns {string} Fragmento SQL con la columna y dirección de ordenamiento (ej. "t.fecha_entrega ASC").
 */
function normalizeTareaSort(sort, order) {
  const column = sortableFields[sort] || sortableFields.fecha_entrega;
  const direction = String(order).toUpperCase() === "DESC" ? "DESC" : "ASC";

  return `${column} ${direction}`;
}

/**
 * Mapea una fila cruda de la base de datos a un objeto de tarea con propiedades en camelCase.
 *
 * @function mapTarea
 * @param {Object} row - Fila obtenida directamente de la base de datos.
 *
 * @returns {Object} Objeto de tarea normalizado.
 */
function mapTarea(row) {
  return {
    id: row.id,
    materiaId: row.materiaId,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fechaEntrega: row.fechaEntrega,
    horaEntrega: row.horaEntrega,
    prioridad: row.prioridad,
    estado: row.estado,
    cargaEstimadaMinutos: row.cargaEstimadaMinutos,
    porcentajeAvance: row.porcentajeAvance,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

/**
 * Obtiene todas las tareas asociadas a una materia específica, aplicando filtros opcionales,
 * ordenamiento y paginación, junto con el total de registros que cumplen las condiciones.
 *
 * @async
 * @function findAllByMateriaId
 * @param {string|number} materiaId - Identificador único de la materia a la que pertenecen las tareas.
 * @param {Object} [filters={}] - Filtros, ordenamiento y paginación a aplicar en la consulta.
 * @param {string} [filters.estado] - Si se especifica, filtra las tareas por su estado.
 * @param {string} [filters.prioridad] - Si se especifica, filtra las tareas por su prioridad.
 * @param {string} [filters.sort] - Campo por el cual ordenar los resultados.
 * @param {string} [filters.order] - Dirección del ordenamiento ("asc" o "desc").
 * @param {number} filters.page - Número de página solicitada (usado para calcular el offset).
 * @param {number} filters.limit - Cantidad máxima de registros a retornar por página.
 *
 * @returns {Promise<Object>} Objeto con las tareas encontradas y el total de registros.
 * @returns {Array<Object>} return.tareas - Listado de tareas mapeadas.
 * @returns {number} return.total - Cantidad total de tareas que cumplen las condiciones (sin paginar).
 */
export async function findAllByMateriaId(materiaId, filters = {}) {
  const conditions = ["t.id_materia = ?"];
  const params = [materiaId];

  if (filters.estado) {
    conditions.push("t.estado = ?");
    params.push(filters.estado);
  }

  if (filters.prioridad) {
    conditions.push("t.prioridad = ?");
    params.push(filters.prioridad);
  }

  // Contar el total de tareas que cumplen con las condiciones
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM tarea t
     WHERE ${conditions.join(" AND ")}`,
    params
  );

  // Normalizar el ordenamiento y calcular el límite y el offset para la paginación
  const orderBy = normalizeTareaSort(filters.sort, filters.order);
  const limit = filters.limit;
  const offset = (filters.page - 1) * limit;

  // Ejecutar la consulta para obtener las tareas con los filtros y la paginación
  const [rows] = await pool.execute(
    `SELECT
       t.id_tarea AS id,
       t.id_materia AS materiaId,
       t.titulo,
       t.descripcion,
       DATE_FORMAT(t.fecha_entrega, '%Y-%m-%d') AS fechaEntrega,
       t.hora_entrega AS horaEntrega,
       t.prioridad,
       t.estado,
       t.carga_estimada_minutos AS cargaEstimadaMinutos,
       t.porcentaje_avance AS porcentajeAvance,
       DATE_FORMAT(t.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
       DATE_FORMAT(t.updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
     FROM tarea t
     WHERE ${conditions.join(" AND ")}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    tareas: rows.map(mapTarea),
    total: countRows[0].total
  };
}

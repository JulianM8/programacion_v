import {pool} from "../config/database.js";

// Mapeo de campos para ordenar
const sortableFields = {
    id: "m.id_materia",
    nombre: "m.nombre",
    codigo: "m.codigo",
    creditos: "m.creditos",
    color: "m.color",
    activa: "m.activa",
    createdAt: "m.created_at",
    updatedAt: "m.updated_at",

};

/**
 * Normaliza el criterio de ordenamiento a partir de un campo y una dirección, validando
 * que el campo sea uno de los permitidos y por defecto ordenando por "nombre".
 *
 * @function normalizeSort
 * @param {string} sort - Nombre del campo por el cual se desea ordenar (debe existir en `sortableFields`).
 * @param {string} order - Dirección del ordenamiento ("asc" o "desc", no sensible a mayúsculas/minúsculas).
 *
 * @returns {string} Fragmento SQL con la columna y dirección de ordenamiento, listo para usar en un `ORDER BY` (ej. "nombre ASC").
 */
function normalizeSort(sort, order) {
    const column = sortableFields[sort] || sortableFields.nombre;
    const direction = String(order).toUpperCase() === "desc" ? "DESC" : "ASC";

    return `${column} ${direction}`;
}

/**
 * Mapea una fila de la base de datos a un objeto de materia con propiedades en camelCase.
 *
 * @function mapMateria
 * @param {Object} row - Fila obtenida directamente de la base de datos.
 * @param {string|number} row.id - Identificador único de la materia.
 * @param {string} row.nombre - Nombre de la materia.
 * @param {string} row.codigo - Código identificador de la materia.
 * @param {number} row.creditos - Cantidad de créditos de la materia.
 * @param {string} row.color - Color asociado a la materia.
 * @param {boolean|number} row.activa - Indica si la materia está activa.
 * @param {string|Date} row.created_at - Fecha de creación del registro.
 * @param {string|Date} row.updated_at - Fecha de última actualización del registro.
 *
 * @returns {Object} Objeto de materia con las propiedades normalizadas (id, nombre, codigo, creditos, color, activa, createdAt, updatedAt).
 */
function mapMateria(row) {
    return {
        id: row.id,
        nombre: row.nombre,
        codigo: row.codigo,
        creditos: row.creditos,
        color: row.color,
        activa: row.activa,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/**
 * Obtiene todas las materias de un usuario aplicando filtros opcionales, ordenamiento y paginación,
 * junto con el total de registros que cumplen las condiciones.
 *
 * @async
 * @function findAllByUserId
 * @param {string|number} userId - Identificador único del usuario dueño de las materias.
 * @param {Object} [filters={}] - Filtros, ordenamiento y paginación a aplicar en la consulta.
 * @param {boolean} [filters.activa] - Si se especifica, filtra las materias por su estado activo/inactivo.
 * @param {string} [filters.search] - Texto de búsqueda que se compara contra el nombre y el código de la materia.
 * @param {string} [filters.sort] - Campo por el cual ordenar los resultados (debe existir en `sortableFields`).
 * @param {string} [filters.order] - Dirección del ordenamiento ("asc" o "desc").
 * @param {number} filters.page - Número de página solicitada (usado para calcular el offset).
 * @param {number} filters.limit - Cantidad máxima de registros a retornar por página.
 *
 * @returns {Promise<Object>} Objeto con las materias encontradas y el total de registros.
 * @returns {Array<Object>} return.materias - Listado de materias mapeadas.
 * @returns {number} return.total - Cantidad total de materias que cumplen las condiciones (sin paginar).
 */
export async function findAllByUserId(userId, filters = {}) {
  const conditions = ["m.id_usuario = ?"];
  const params = [userId];

  if (typeof filters.activa === "boolean") {
    conditions.push("m.activa = ?");
    params.push(filters.activa ? 1 : 0);
  }

  if (filters.search) {
    conditions.push("(m.nombre LIKE ? OR m.codigo LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
// Contar el total de filas que cumplen con las condiciones
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM materia m
     WHERE ${conditions.join(" AND ")}`,
    params
  );
// Normalizar el ordenamiento y calcular el límite y el offset para la paginación
  const orderBy = normalizeSort(filters.sort, filters.order);
  const limit = filters.limit;
  const offset = (filters.page - 1) * limit;

// Ejecutar la consulta para obtener las materias con los filtros y la paginación
  const [rows] = await pool.execute(
    `SELECT
       m.id_materia AS id,
       m.id_usuario AS usuarioId,
       m.nombre,
       m.codigo,
       m.color,
       m.creditos,
       m.activa,
       m.created_at AS createdAt,
       m.updated_at AS updatedAt
     FROM materia m
     WHERE ${conditions.join(" AND ")}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
// Retornar las materias mapeadas y el total de filas
  return {
    materias: rows.map(mapMateria),
    total: countRows[0].total
  };
}

/**
 * Busca una materia por su ID, validando que pertenezca al usuario indicado.
 *
 * @async
 * @function findByIdAndUserId
 * @param {string|number} id - Identificador único de la materia a buscar.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 *
 * @returns {Promise<Object|null>} La materia mapeada si existe y pertenece al usuario, o `null` en caso contrario.
 */
export async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `SELECT
       m.id_materia AS id,
       m.id_usuario AS usuarioId,
       m.nombre,
       m.codigo,
       m.color,
       m.creditos,
       m.activa,
       m.created_at AS createdAt,
       m.updated_at AS updatedAt
     FROM materia m
     WHERE m.id_materia = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return rows[0] ? mapMateria(rows[0]) : null;
}

/**
 * Inserta una nueva materia en la base de datos, asociada a un usuario específico.
 *
 * @async
 * @function createMateria
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {Object} materia - Datos de la materia a insertar.
 * @param {string} materia.nombre - Nombre de la materia.
 * @param {string} materia.codigo - Código identificador de la materia.
 * @param {string} materia.color - Color asociado a la materia.
 * @param {number} materia.creditos - Cantidad de créditos de la materia.
 * @param {boolean} [materia.activa] - Indica si la materia está activa (se guarda como 1 o 0).
 *
 * @returns {Promise<Object|null>} La materia recién creada, obtenida mediante `findByIdAndUserId`.
 */
export async function createMateria(userId, materia) {
  const [result] = await pool.execute(
    `INSERT INTO materia (id_usuario, nombre, codigo, color, creditos, activa)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      materia.nombre,
      materia.codigo,
      materia.color,
      materia.creditos,
      materia.activa ? 1 : 0
    ]
  );

  return findByIdAndUserId(result.insertId, userId);
}

/**
 * Verifica si ya existe una materia con el código indicado para un usuario específico,
 * excluyendo opcionalmente una materia por su ID (útil en actualizaciones).
 *
 * @async
 * @function existsByCode
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {string} codigo - Código a verificar.
 * @param {string|number} [excludeId] - ID de una materia existente a excluir de la búsqueda.
 *
 * @returns {Promise<boolean>} `true` si ya existe una materia con ese código para el usuario, `false` en caso contrario.
 */
export async function existsByCode(userId, codigo, excludeId) {
  const params = [userId, codigo];
  let sql = "SELECT 1 FROM materia WHERE id_usuario = ? AND codigo = ?";

  if (excludeId) {
    sql += " AND id_materia <> ?";
    params.push(excludeId);
  }

  sql += " LIMIT 1";

  const [rows] = await pool.execute(sql, params);
  return rows.length > 0;
}

/**
 * Verifica si ya existe una materia con el nombre indicado para un usuario específico,
 * excluyendo opcionalmente una materia por su ID (útil en actualizaciones).
 *
 * @async
 * @function existsByName
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {string} nombre - Nombre a verificar.
 * @param {string|number} [excludeId] - ID de una materia existente a excluir de la búsqueda.
 *
 * @returns {Promise<boolean>} `true` si ya existe una materia con ese nombre para el usuario, `false` en caso contrario.
 */
export async function existsByName(userId, nombre, excludeId) {
  const params = [userId, nombre];
  let sql = "SELECT 1 FROM materia WHERE id_usuario = ? AND nombre = ?";

  if (excludeId) {
    sql += " AND id_materia <> ?";
    params.push(excludeId);
  }

  sql += " LIMIT 1";

  const [rows] = await pool.execute(sql, params);
  return rows.length > 0;
}

/**
 * Actualiza parcialmente los campos de una materia existente, construyendo dinámicamente
 * la sentencia SQL solo con los campos provistos. Si no se envía ningún campo, retorna
 * la materia sin realizar ninguna actualización.
 *
 * @async
 * @function patchMateria
 * @param {string|number} id - Identificador único de la materia a actualizar.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {Object} partialMateria - Campos a actualizar (todos opcionales).
 * @param {string} [partialMateria.nombre] - Nuevo nombre de la materia.
 * @param {string} [partialMateria.codigo] - Nuevo código de la materia.
 * @param {string} [partialMateria.color] - Nuevo color de la materia.
 * @param {number} [partialMateria.creditos] - Nueva cantidad de créditos de la materia.
 * @param {boolean} [partialMateria.activa] - Nuevo estado activo/inactivo de la materia (se guarda como 1 o 0).
 *
 * @returns {Promise<Object|null>} La materia actualizada, obtenida mediante `findByIdAndUserId`.
 */
export async function patchMateria(id, userId, partialMateria) {
  const fields = [];
  const params = [];

  if (partialMateria.nombre !== undefined) {
    fields.push("nombre = ?");
    params.push(partialMateria.nombre);
  }

  if (partialMateria.codigo !== undefined) {
    fields.push("codigo = ?");
    params.push(partialMateria.codigo);
  }

  if (partialMateria.color !== undefined) {
    fields.push("color = ?");
    params.push(partialMateria.color);
  }

  if (partialMateria.creditos !== undefined) {
    fields.push("creditos = ?");
    params.push(partialMateria.creditos);
  }

  if (partialMateria.activa !== undefined) {
    fields.push("activa = ?");
    params.push(partialMateria.activa ? 1 : 0);
  }

  if (fields.length === 0) {
    return findByIdAndUserId(id, userId);
  }

  params.push(id, userId);

  await pool.execute(
    `UPDATE materia
     SET ${fields.join(", ")}
     WHERE id_materia = ? AND id_usuario = ?`,
    params
  );

  return findByIdAndUserId(id, userId);
}

/**
 * Elimina una materia de la base de datos, validando que pertenezca al usuario indicado.
 *
 * @async
 * @function deleteMateria
 * @param {string|number} id - Identificador único de la materia a eliminar.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 *
 * @returns {Promise<boolean>} `true` si la materia fue eliminada exitosamente, `false` si no se encontró ninguna fila que coincidiera.
 */
export async function deleteMateria(id, userId) {
  const [result] = await pool.execute(
    "DELETE FROM materia WHERE id_materia = ? AND id_usuario = ?",
    [id, userId]
  );

  return result.affectedRows > 0;
}

/**
 * Obtiene todas las tareas asociadas a una materia específica, validando que la materia
 * pertenezca al usuario indicado.
 *
 * @async
 * @function findTareasByMateriaAndUserId
 * @param {string|number} id - Identificador único de la materia.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 *
 * @returns {Promise<Array>} El listado de tareas asociadas a la materia.
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario.
 */
export async function findTareasByMateriaAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `SELECT
       t.id_tarea AS id,
       t.id_materia AS materiaId,
       t.titulo,
       t.descripcion,
       DATE_FORMAT(t.fecha_entrega, '%Y-%m-%d') AS fechaEntrega,
       DATE_FORMAT(t.hora_entrega, '%H:%i') AS horaEntrega,
       t.prioridad,
       t.estado,
       t.carga_estimada_minutos AS cargaEstimadaMinutos,
       t.porcentaje_avance AS porcentajeAvance,
       DATE_FORMAT(t.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
       DATE_FORMAT(t.updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
     FROM tarea t
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE m.id_materia = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return rows;
}

/**
 * Obtiene todas los eventos asociados a una materia específica, validando que la materia
 * pertenezca al usuario indicado.
 *
 * @async
 * @function findEventosByMateriaAndUserId
 * @param {string|number} id - Identificador único de la materia.
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 *
 * @returns {Promise<Array>} El listado de eventos asociados a la materia.
 *
 * @throws {HttpError} Código 404 (MATERIA_NOT_FOUND) si la materia no existe o no pertenece al usuario.
 */
export async function findEventosByMateriaAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `SELECT
       e.id_evento AS id,
       e.id_materia AS materiaId,
       e.titulo,
       e.descripcion,
       DATE_FORMAT(e.fecha, '%Y-%m-%d') AS fecha,
       DATE_FORMAT(e.hora_inicio, '%H:%i') AS horaInicio,
       DATE_FORMAT(e.hora_fin, '%H:%i') AS horaFin,
       e.tipo,
       DATE_FORMAT(e.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
       DATE_FORMAT(e.updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
     FROM evento e
     INNER JOIN materia m ON m.id_materia = e.id_materia
     WHERE m.id_materia = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return rows;
}







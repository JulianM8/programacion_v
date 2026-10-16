import { HttpError } from "../utils/http-error.js";


/**
 * Convierte un valor arbitrario a booleano, aceptando `true`/`false` como booleanos
 * o como cadenas de texto (sin distinguir mayúsculas/minúsculas).
 *
 * @function parseBoolean
 * @param {*} value - Valor a convertir. Puede ser `undefined`, un booleano o una cadena de texto.
 *
 * @returns {boolean|undefined} `true` o `false` según corresponda, o `undefined` si el valor original era `undefined`.
 *
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si el valor no es `undefined`, booleano, ni la cadena "true"/"false".
 */
function parseBoolean(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new HttpError(422, "VALIDATION_ERROR", "El filtro 'activa' debe ser true o false.");
}

/**
 * Convierte un valor a un entero positivo o cero, retornando `null` si el valor no fue provisto.
 *
 * @function parsePositiveInteger
 * @param {*} value - Valor a convertir. Puede ser `undefined`, `null`, cadena vacía, número o cadena numérica.
 * @param {string} fieldName - Nombre del campo, usado para construir el mensaje de error.
 *
 * @returns {number|null} El valor convertido a entero, o `null` si el valor original era `undefined`, `null` o cadena vacía.
 *
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si el valor no es un entero mayor o igual a cero.
 */
function parsePositiveInteger(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser un entero positivo o cero.`);
  }

  return parsed;
}

/**
 * Valida que un valor sea una cadena de texto no vacía y retorna su versión recortada (trim).
 *
 * @function normalizeString
 * @param {*} value - Valor a validar y normalizar.
 * @param {string} fieldName - Nombre del campo, usado para construir el mensaje de error.
 *
 * @returns {string} La cadena de texto recortada (sin espacios al inicio ni al final).
 *
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si el valor no es una cadena de texto o si está vacío tras recortarlo.
 */
function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' es obligatorio.`);
  }

  return value.trim();
}

/**
 * Valida que un color tenga formato hexadecimal válido (#RRGGBB).
 *
 * @function validateColor
 * @param {string} color - Valor del color a validar.
 *
 * @returns {void} No retorna ningún valor si el color es válido.
 *
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si el color no cumple con el formato hexadecimal #RRGGBB.
 */
function validateColor(color) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'color' debe tener formato hexadecimal #RRGGBB.");
  }
}

/**
 * Valida y normaliza los parámetros de consulta (query params) para el listado de materias,
 * incluyendo filtros, ordenamiento y paginación.
 *
 * @function validateMateriaListQuery
 * @param {Object} query - Objeto de query params de la petición (usualmente `request.query`).
 * @param {string} [query.page] - Número de página solicitada (por defecto 1).
 * @param {string} [query.limit] - Cantidad de registros por página (por defecto 20, máximo 100).
 * @param {string} [query.activa] - Filtro por estado activo/inactivo ("true" o "false").
 * @param {string} [query.search] - Texto de búsqueda para filtrar por nombre o código.
 * @param {string} [query.sort] - Campo por el cual ordenar los resultados.
 * @param {string} [query.order] - Dirección del ordenamiento ("asc" o "desc").
 *
 * @returns {Object} Objeto con los filtros validados y normalizados (activa, search, sort, order, page, limit).
 *
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'page' no es un entero mayor o igual a 1.
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'limit' no es un entero entre 1 y 100.
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'activa' no es un booleano válido (propagado por `parseBoolean`).
 */
export function validateMateriaListQuery(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'page' debe ser un entero mayor o igual a 1.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'limit' debe ser un entero entre 1 y 100.");
  }

  return {
    activa: parseBoolean(query.activa),
    search: typeof query.search === "string" ? query.search.trim() : "",
    sort: query.sort,
    order: query.order,
    page,
    limit
  };
}

/**
 * Valida que el identificador de una materia sea un entero positivo válido.
 *
 * @function validateMateriaId
 * @param {string|number} id - Identificador a validar (usualmente proveniente de `request.params.id`).
 *
 * @returns {number} El identificador convertido a número entero.
 *
 * @throws {HttpError} Código 400 (INVALID_ID) si el identificador no es un entero mayor o igual a 1.
 */
export function validateMateriaId(id) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new HttpError(400, "INVALID_ID", "El identificador de materia no es válido.");
  }

  return parsedId;
}

/**
 * Valida y normaliza el cuerpo de la petición para la creación (o reemplazo completo) de una materia,
 * exigiendo todos los campos obligatorios.
 *
 * @function validateCreateMateria
 * @param {Object} body - Cuerpo de la petición (usualmente `request.body`).
 * @param {string} body.nombre - Nombre de la materia (obligatorio).
 * @param {string} body.codigo - Código identificador de la materia (obligatorio).
 * @param {string} body.color - Color de la materia en formato hexadecimal #RRGGBB (obligatorio).
 * @param {number} [body.creditos] - Cantidad de créditos de la materia.
 * @param {boolean} [body.activa] - Estado activo/inactivo de la materia (por defecto `true` si no se envía).
 *
 * @returns {Object} Objeto con los datos validados y normalizados de la materia (nombre, codigo, color, creditos, activa).
 *
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'nombre', 'codigo' o 'color' están vacíos o no son cadenas de texto (propagado por `normalizeString`).
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'color' no tiene formato hexadecimal válido (propagado por `validateColor`).
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'creditos' no es un entero positivo o cero (propagado por `parsePositiveInteger`).
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'activa' no es un booleano válido (propagado por `parseBoolean`).
 */
export function validateCreateMateria(body) {
  const nombre = normalizeString(body.nombre, "nombre");
  const codigo = normalizeString(body.codigo, "codigo");
  const color = normalizeString(body.color, "color");
  const creditos = parsePositiveInteger(body.creditos, "creditos");
  const activa = body.activa === undefined ? true : parseBoolean(body.activa);

  validateColor(color);

  return {
    nombre,
    codigo,
    color,
    creditos,
    activa
  };
}

/**
 * Valida y normaliza el cuerpo de la petición para la actualización parcial de una materia,
 * incluyendo en el resultado únicamente los campos que fueron enviados.
 *
 * @function validatePatchMateria
 * @param {Object} body - Cuerpo de la petición (usualmente `request.body`).
 * @param {string} [body.nombre] - Nuevo nombre de la materia.
 * @param {string} [body.codigo] - Nuevo código de la materia.
 * @param {string} [body.color] - Nuevo color de la materia en formato hexadecimal #RRGGBB.
 * @param {number} [body.creditos] - Nueva cantidad de créditos de la materia.
 * @param {boolean} [body.activa] - Nuevo estado activo/inactivo de la materia.
 *
 * @returns {Object} Objeto con únicamente los campos válidos y normalizados que fueron enviados en el cuerpo de la petición.
 *
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'nombre' o 'codigo' están vacíos o no son cadenas de texto (propagado por `normalizeString`).
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'color' está vacío, no es una cadena de texto o no tiene formato hexadecimal válido (propagado por `normalizeString` y `validateColor`).
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'creditos' no es un entero positivo o cero (propagado por `parsePositiveInteger`).
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si 'activa' no es un booleano válido (propagado por `parseBoolean`).
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si no se envía ningún campo válido para actualizar.
 */
export function validatePatchMateria(body) {
  const payload = {};

  if (body.nombre !== undefined) {
    payload.nombre = normalizeString(body.nombre, "nombre");
  }

  if (body.codigo !== undefined) {
    payload.codigo = normalizeString(body.codigo, "codigo");
  }

  if (body.color !== undefined) {
    payload.color = normalizeString(body.color, "color");
    validateColor(payload.color);
  }

  if (body.creditos !== undefined) {
    payload.creditos = parsePositiveInteger(body.creditos, "creditos");
  }

  if (body.activa !== undefined) {
    payload.activa = parseBoolean(body.activa);
  }

  if (Object.keys(payload).length === 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "No se enviaron campos válidos para actualizar.");
  }

  return payload;
}



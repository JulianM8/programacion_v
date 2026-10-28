import { HttpError } from "../utils/http-error.js";

const CANAL_POR_DEFECTO = "in_app";
const MENSAJE_MAX = 255; // VARCHAR(255) en el DER

/**
 * Convierte un valor a booleano aceptando booleanos o las cadenas "true"/"false".
 *
 * @function parseBoolean
 * @param {*} value - Valor a convertir.
 * @param {string} fieldName - Nombre del campo, para el mensaje de error.
 * @returns {boolean|undefined} El booleano, o `undefined` si el valor era `undefined`.
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si no es un booleano válido.
 */
function parseBoolean(value, fieldName) {
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

  throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser true o false.`);
}

/**
 * Convierte un valor a entero mayor o igual a 1.
 *
 * @function parseId
 * @param {*} value - Valor a convertir.
 * @param {string} fieldName - Nombre del campo, para el mensaje de error.
 * @returns {number} El entero.
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si no es un entero mayor o igual a 1.
 */
function parseId(value, fieldName) {
  const parsed = typeof value === "string" && value.trim() === "" ? NaN : Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser un entero mayor o igual a 1.`);
  }

  return parsed;
}

/**
 * Valida que un valor sea texto no vacío y devuelve la versión recortada (trim).
 *
 * @function normalizeString
 * @param {*} value - Valor a validar.
 * @param {string} fieldName - Nombre del campo.
 * @returns {string} Texto recortado.
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si no es texto o queda vacío.
 */
function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' es obligatorio.`);
  }

  return value.trim();
}

/**
 * Valida el mensaje: obligatorio y de máximo 255 caracteres.
 *
 * @function normalizeMensaje
 * @param {*} value - Mensaje recibido.
 * @returns {string} Mensaje recortado.
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si está vacío o supera 255 caracteres.
 */
function normalizeMensaje(value) {
  const mensaje = normalizeString(value, "mensaje");

  if (mensaje.length > MENSAJE_MAX) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo 'mensaje' no puede superar ${MENSAJE_MAX} caracteres.`);
  }

  return mensaje;
}

/**
 * Valida el canal. Es un ENUM en la base de datos; aquí solo se comprueba el formato
 * (texto en minúsculas con guion bajo, p. ej. "in_app") y MySQL valida que el valor exista.
 *
 * @function normalizeCanal
 * @param {*} value - Canal recibido.
 * @returns {string} Canal en minúsculas.
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si no tiene un formato válido.
 */
function normalizeCanal(value) {
  const canal = normalizeString(value, "canal").toLowerCase();

  if (!/^[a-z][a-z0-9_]{0,29}$/.test(canal)) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'canal' no es válido.");
  }

  return canal;
}

/**
 * Valida una fecha (YYYY-MM-DD) que exista en el calendario.
 *
 * @function parseFecha
 * @param {*} value - Valor recibido.
 * @param {string} fieldName - Nombre del campo.
 * @returns {string} La fecha como "YYYY-MM-DD".
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si el formato o la fecha no son válidos.
 */
function parseFecha(value, fieldName) {
  const text = typeof value === "string" ? value.trim() : "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (!match || !isRealDate(Number(match[1]), Number(match[2]), Number(match[3]))) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe tener formato YYYY-MM-DD.`);
  }

  return text;
}

/** Comprueba que año, mes y día formen una fecha real (rechaza 2026-02-31). */
function isRealDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Valida y normaliza fecha y hora. Acepta "YYYY-MM-DD HH:mm[:ss]" o "YYYY-MM-DDTHH:mm[:ss]"
 * (el formato de un input datetime-local), sin zona horaria.
 *
 * @function normalizeFechaHora
 * @param {*} value - Valor recibido.
 * @returns {string} La fecha y hora como "YYYY-MM-DD HH:mm:ss".
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si el formato o el valor no son válidos.
 */
function normalizeFechaHora(value) {
  const text = typeof value === "string" ? value.trim() : "";
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(text);

  if (match) {
    const [, year, month, day, hour, minute, second = "00"] = match;

    if (
      isRealDate(Number(year), Number(month), Number(day))
      && Number(hour) <= 23
      && Number(minute) <= 59
      && Number(second) <= 59
    ) {
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
  }

  throw new HttpError(
    422,
    "VALIDATION_ERROR",
    "El campo 'fechaHora' debe tener formato YYYY-MM-DD HH:mm:ss (o YYYY-MM-DDTHH:mm)."
  );
}

/**
 * Valida y normaliza los parámetros de consulta del listado: filtros, orden y paginación.
 *
 * @function validateRecordatorioListQuery
 * @param {Object} query - `request.query`.
 * @param {string} [query.page] - Página (por defecto 1).
 * @param {string} [query.limit] - Registros por página (por defecto 20, máximo 100).
 * @param {string} [query.leido] - "true" o "false".
 * @param {string} [query.canal] - Canal de envío.
 * @param {string} [query.tareaId] - ID de tarea.
 * @param {string} [query.materiaId] - ID de materia.
 * @param {string} [query.desde] - Fecha inicial YYYY-MM-DD.
 * @param {string} [query.hasta] - Fecha final YYYY-MM-DD.
 * @param {string} [query.search] - Texto a buscar en mensaje o título de la tarea.
 * @param {string} [query.sort] - Campo de orden.
 * @param {string} [query.order] - "asc" o "desc".
 * @returns {Object} Filtros validados.
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si algún parámetro no es válido.
 */
export function validateRecordatorioListQuery(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'page' debe ser un entero mayor o igual a 1.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'limit' debe ser un entero entre 1 y 100.");
  }

  const filters = {
    leido: parseBoolean(query.leido, "leido"),
    canal: query.canal === undefined || query.canal === "" ? undefined : normalizeCanal(query.canal),
    tareaId: query.tareaId === undefined || query.tareaId === "" ? undefined : parseId(query.tareaId, "tareaId"),
    materiaId: query.materiaId === undefined || query.materiaId === "" ? undefined : parseId(query.materiaId, "materiaId"),
    desde: query.desde === undefined || query.desde === "" ? undefined : parseFecha(query.desde, "desde"),
    hasta: query.hasta === undefined || query.hasta === "" ? undefined : parseFecha(query.hasta, "hasta"),
    search: typeof query.search === "string" ? query.search.trim() : "",
    sort: query.sort,
    order: query.order,
    page,
    limit
  };

  if (filters.desde && filters.hasta && filters.desde > filters.hasta) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'desde' no puede ser posterior a 'hasta'.");
  }

  return filters;
}

/**
 * Valida que el identificador de un recordatorio sea un entero mayor o igual a 1.
 *
 * @function validateRecordatorioId
 * @param {string|number} id - Identificador (usualmente `request.params.id`).
 * @returns {number} El identificador como número.
 * @throws {HttpError} Código 400 (INVALID_ID) si no es válido.
 */
export function validateRecordatorioId(id) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new HttpError(400, "INVALID_ID", "El identificador de recordatorio no es válido.");
  }

  return parsedId;
}

/**
 * Valida el cuerpo para crear (POST) o reemplazar (PUT) un recordatorio.
 * Obligatorios: tareaId, mensaje y fechaHora. Opcionales: canal ("in_app") y leido (false).
 *
 * @function validateCreateRecordatorio
 * @param {Object} body - `request.body`.
 * @returns {{tareaId: number, mensaje: string, fechaHora: string, canal: string, leido: boolean}}
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si algún campo no es válido.
 */
export function validateCreateRecordatorio(body = {}) {
  return {
    tareaId: parseId(body.tareaId, "tareaId"),
    mensaje: normalizeMensaje(body.mensaje),
    fechaHora: normalizeFechaHora(body.fechaHora),
    canal: body.canal === undefined ? CANAL_POR_DEFECTO : normalizeCanal(body.canal),
    leido: body.leido === undefined ? false : parseBoolean(body.leido, "leido")
  };
}

/**
 * Valida el cuerpo de una actualización parcial (PATCH): solo se incluyen los campos enviados.
 *
 * @function validatePatchRecordatorio
 * @param {Object} body - `request.body`.
 * @returns {Object} Solo los campos válidos enviados (tareaId, mensaje, fechaHora, canal, leido).
 * @throws {HttpError} Código 422 (VALIDATION_ERROR) si algún campo no es válido o no se envió ninguno.
 */
export function validatePatchRecordatorio(body = {}) {
  const payload = {};

  if (body.tareaId !== undefined) {
    payload.tareaId = parseId(body.tareaId, "tareaId");
  }

  if (body.mensaje !== undefined) {
    payload.mensaje = normalizeMensaje(body.mensaje);
  }

  if (body.fechaHora !== undefined) {
    payload.fechaHora = normalizeFechaHora(body.fechaHora);
  }

  if (body.canal !== undefined) {
    payload.canal = normalizeCanal(body.canal);
  }

  if (body.leido !== undefined) {
    payload.leido = parseBoolean(body.leido, "leido");
  }

  if (Object.keys(payload).length === 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "No se enviaron campos válidos para actualizar.");
  }

  return payload;
}

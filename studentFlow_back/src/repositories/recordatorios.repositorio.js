import { pool } from "../config/database.js";

const sortableFields = {
  id: "r.id_recordatorio",
  mensaje: "r.mensaje",
  fechaHora: "r.fecha_hora",
  canal: "r.canal",
  leido: "r.leido",
  tarea: "t.titulo",
  materia: "m.nombre",
  createdAt: "r.created_at"
};

function normalizeSort(sort, order) {
  const column = sortableFields[sort] || sortableFields.fechaHora;
  const direction = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";
  return `${column} ${direction}`;
}

function mapRecordatorio(row) {
  return {
    id: row.id,
    tareaId: row.tareaId,
    tarea: row.tarea,
    materiaId: row.materiaId,
    materia: row.materia,
    mensaje: row.mensaje,
    fechaHora: row.fechaHora,
    canal: row.canal,
    leido: Boolean(row.leido),
    createdAt: row.createdAt
  };
}

const fromClause = `
  FROM recordatorio r
  INNER JOIN tarea t ON t.id_tarea = r.id_tarea
  INNER JOIN materia m ON m.id_materia = t.id_materia
`;

const selectClause = `
  SELECT
    r.id_recordatorio AS id,
    r.id_tarea AS tareaId,
    t.titulo AS tarea,
    m.id_materia AS materiaId,
    m.nombre AS materia,
    r.mensaje,
    DATE_FORMAT(r.fecha_hora, '%Y-%m-%d %H:%i:%s') AS fechaHora,
    r.canal,
    r.leido,
    DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
`;

export async function findAllByUserId(userId, filters = {}) {
  const conditions = ["m.id_usuario = ?"];
  const params = [userId];

  if (typeof filters.leido === "boolean") {
    conditions.push("r.leido = ?");
    params.push(filters.leido ? 1 : 0);
  }

  if (filters.canal) {
    conditions.push("r.canal = ?");
    params.push(filters.canal);
  }

  if (filters.search) {
    conditions.push("(r.mensaje LIKE ? OR t.titulo LIKE ? OR m.nombre LIKE ?)");
    const search = `%${filters.search}%`;
    params.push(search, search, search);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total ${fromClause} ${where}`,
    params
  );

  const limit = filters.limit;
  const offset = (filters.page - 1) * limit;
  const [rows] = await pool.execute(
    `${selectClause}
     ${fromClause}
     ${where}
     ORDER BY ${normalizeSort(filters.sort, filters.order)}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    recordatorios: rows.map(mapRecordatorio),
    total: Number(countRows[0].total)
  };
}

export async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `${selectClause}
     ${fromClause}
     WHERE r.id_recordatorio = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return rows[0] ? mapRecordatorio(rows[0]) : null;
}

export async function taskBelongsToUser(tareaId, userId) {
  const [rows] = await pool.execute(
    `SELECT 1
     FROM tarea t
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE t.id_tarea = ? AND m.id_usuario = ?
     LIMIT 1`,
    [tareaId, userId]
  );

  return rows.length > 0;
}

export async function createRecordatorio(userId, recordatorio) {
  const [result] = await pool.execute(
    `INSERT INTO recordatorio (id_tarea, mensaje, fecha_hora, canal, leido)
     VALUES (?, ?, ?, ?, ?)`,
    [
      recordatorio.tareaId,
      recordatorio.mensaje,
      recordatorio.fechaHora,
      recordatorio.canal,
      recordatorio.leido ? 1 : 0
    ]
  );

  return findByIdAndUserId(result.insertId, userId);
}

export async function updateRecordatorio(id, userId, recordatorio) {
  const fields = [];
  const params = [];

  if (recordatorio.tareaId !== undefined) {
    fields.push("id_tarea = ?");
    params.push(recordatorio.tareaId);
  }
  if (recordatorio.mensaje !== undefined) {
    fields.push("mensaje = ?");
    params.push(recordatorio.mensaje);
  }
  if (recordatorio.fechaHora !== undefined) {
    fields.push("fecha_hora = ?");
    params.push(recordatorio.fechaHora);
  }
  if (recordatorio.canal !== undefined) {
    fields.push("canal = ?");
    params.push(recordatorio.canal);
  }
  if (recordatorio.leido !== undefined) {
    fields.push("leido = ?");
    params.push(recordatorio.leido ? 1 : 0);
  }

  if (fields.length > 0) {
    params.push(id, userId);
    await pool.execute(
      `UPDATE recordatorio r
       INNER JOIN tarea t ON t.id_tarea = r.id_tarea
       INNER JOIN materia m ON m.id_materia = t.id_materia
       SET ${fields.join(", ")}
       WHERE r.id_recordatorio = ? AND m.id_usuario = ?`,
      params
    );
  }

  return findByIdAndUserId(id, userId);
}

export async function deleteRecordatorio(id, userId) {
  const [result] = await pool.execute(
    `DELETE r
     FROM recordatorio r
     INNER JOIN tarea t ON t.id_tarea = r.id_tarea
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE r.id_recordatorio = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return result.affectedRows > 0;
}
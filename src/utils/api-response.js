// Función para enviar una respuesta exitosa
export function sendSuccess(response, data, statusCode = 200, meta) {

  // Creamos el objeto que vamos a enviar al cliente
  const payload = {
    // Indica que la operación fue exitosa
    success: true,

    // Contiene los datos de la respuesta
    data
  };

  // Si existe información adicional en "meta",
  // la agregamos a la respuesta
  if (meta) {
    payload.meta = meta;
  }

  // Envía la respuesta con el código HTTP indicado
  // y la convierte a formato JSON
  return response.status(statusCode).json(payload);
}


// Función para enviar una respuesta sin contenido
export function sendNoContent(response) {

  // Envía el código HTTP 204 y no devuelve información
  return response.status(204).send();
}
// Importa la función que comprueba la conexión con la base de datos
import { checkDatabaseConnection } from "../config/database.js";

// Importa la función que envía respuestas exitosas
import { sendSuccess } from "../utils/api-response.js";


// Función que se ejecuta cuando se llama a:
// GET /api/v1/health
export async function getHealth(_request, response, next) {

  try {

    // Comprueba que la base de datos esté conectada
    await checkDatabaseConnection();


    // Si la conexión funciona, envía una respuesta exitosa
    return sendSuccess(response, {
      status: "ok",
      database: "connected"
    });


  } catch (error) {

    // Si ocurre un error, lo envía al middleware
    // encargado de manejar errores
    return next(error);
  }
}
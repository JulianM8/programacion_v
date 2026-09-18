import express from "express";
import healthRouter from "./routes/health.routes.js";
import materiasRouter from "./routes/materias.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { attachTemporaryUser } from "./middlewares/request-context.middleware.js";

// Crea la aplicación Express
const app = express();

// Permite recibir datos en formato JSON
app.use(express.json());

// Permite recibir datos en formato URL-encoded
app.use(attachTemporaryUser);

// Usa las rutas de health en /api/v1/health
app.use("/api/v1/health", healthRouter);

// Usa las rutas de materias en /api/v1/materias
app.use("/api/v1/materias", materiasRouter);

// Maneja las rutas que no existen
app.use(notFoundHandler);

// Maneja los errores de la aplicación
app.use(errorHandler);

// Exporta la aplicación para usarla en otro archivo
export default app;
// Importa Router de Express para crear rutas
import { Router } from "express";

// Importa la función que se ejecutará cuando
// alguien entre a la ruta de Health
import { getHealth } from "../controllers/health.controller.js";

// Crea un router (agrupar y organizar rutas)
const router = Router();

// Define una ruta GET (para acceder a la base de datos) y ejecuta getHealth
router.get("/", getHealth);

// Exporta el router para poderlo utilizar 
export default router;
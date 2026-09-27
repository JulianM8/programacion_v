import { Router } from "express";

import {
    listTareasByMateria
} from "../controllers/tareas.controller.js";


const router = Router();

//http://localhost:3000/api/v1/materias/:materiaId/tareas
router.get("/materias/:materiaId/tareas", listTareasByMateria);

export default router;


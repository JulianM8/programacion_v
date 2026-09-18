import { Router } from "express";

import {
    listMaterias,
    getMaterias,
    createMateria,
    replaceMateria,
    updateMateria,
    deleteMateria
} from "../controllers/materias.controller.js";

const router = Router();

//http://localhost:3000/api/materias
router.get("/", listMaterias);
router.get("/:id", getMaterias);
router.post("/", createMateria);
router.put("/:id", replaceMateria);
router.patch("/:id", updateMateria);
router.delete("/:id", deleteMateria);

export default router;
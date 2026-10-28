import { Router } from "express";

import {
  listRecordatorios,
  getRecordatorio,
  createRecordatorio,
  replaceRecordatorio,
  updateRecordatorio,
  deleteRecordatorio
} from "../controllers/recordatorios.controller.js";

const router = Router();

// http://localhost:3000/api/v1/recordatorios
router.get("/", listRecordatorios);
router.get("/:id", getRecordatorio);
router.post("/", createRecordatorio);
router.put("/:id", replaceRecordatorio);
router.patch("/:id", updateRecordatorio);
router.delete("/:id", deleteRecordatorio);

export default router;

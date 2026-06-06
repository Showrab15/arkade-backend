import { Router } from "express";
import { getAllDistricts, getAllDivisions, getDistrictsByDivision } from "../controllers/locationController";


const router = Router();

router.get("/divisions",           getAllDivisions);
router.get("/districts",           getAllDistricts);
router.get("/districts/:divisionId", getDistrictsByDivision);

export default router;
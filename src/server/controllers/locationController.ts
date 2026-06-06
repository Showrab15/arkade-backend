import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import { getCollection } from "../db.js";

const divisionsCollection = getCollection("divisions");
const districtsCollection = getCollection("districts");

/**
 * GET /api/divisions
 */
export const getAllDivisions = async (req: Request, res: Response) => {
  try {
    const data = await divisionsCollection.find({}).toArray();

    return sendSuccess(res, "Successfully retrieved all divisions.", {
      data,
      total: data.length,
    });
  } catch (error) {
    return sendError(res, "Failed to retrieve divisions.", error, 500);
  }
};

/**
 * GET /api/districts
 */
export const getAllDistricts = async (req: Request, res: Response) => {
  try {
    const data = await districtsCollection.find({}).toArray();

    return sendSuccess(res, "Successfully retrieved all districts.", {
      data,
      total: data.length,
    });
  } catch (error) {
    return sendError(res, "Failed to retrieve districts.", error, 500);
  }
};

/**
 * GET /api/districts/:divisionId
 */
export const getDistrictsByDivision = async (req: Request, res: Response) => {
  const { divisionId } = req.params;

  try {
    const data = await districtsCollection
      .find({ division_id: divisionId })
      .toArray();

    if (data.length === 0) {
      return sendError(res, "No districts found for this division ID.", null, 404);
    }

    return sendSuccess(res, "Successfully retrieved districts for division.", {
      data,
      total: data.length,
    });
  } catch (error) {
    return sendError(res, "Failed to retrieve districts.", error, 500);
  }
};
import { Request, Response } from "express";
import { getCollection } from "../db.js";
import { sendSuccess, sendError, sendValidationError } from "../utils/response.js";

const newslettersCollection = getCollection("newsletters");

/**
 * Public: Subscribe to Newsletter (No auth required)
 */
export const subscribeNewsletter = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return sendValidationError(res, "Invalid email address supplied.", {
      email: "A valid email address is required to subscribe (e.g., mail@brand.com)."
    });
  }

  try {
    const existingSub = await newslettersCollection.findOne({ email: email.toLowerCase().trim() });
    if (existingSub) {
      return sendSuccess(res, "You are already subscribed to our newsletter! Thank you.", existingSub);
    }

    const newSub = {
      email: email.toLowerCase().trim(),
      subscribedAt: new Date().toISOString()
    };

    await newslettersCollection.insertOne(newSub);
    return sendSuccess(res, "Successfully subscribed to our newsletter!", newSub, 201);
  } catch (error) {
    return sendError(res, "Newsletter subscription failed.", error, 500);
  }
};

/**
 * Admin Only: Get all subscribed newsletter emails
 */
export const getSubscribers = async (req: Request, res: Response) => {
  try {
    const subscribers = await newslettersCollection.find().toArray();
    return sendSuccess(res, "Retrieved newsletter subscribers successfully.", subscribers);
  } catch (error) {
    return sendError(res, "Failed to retrieve subscribers list.", error, 500);
  }
};

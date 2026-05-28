import { Request, Response } from "express";
import { getCollection } from "../db.js";
import { sendSuccess, sendError, sendValidationError } from "../utils/response.js";

const contactsCollection = getCollection("contacts");

/**
 * Public: Submit a support/contact inquiry form
 */
export const submitContactForm = async (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body;

  // Manual validation checks
  const errors: Record<string, string> = {};
  if (!name || name.trim() === "") errors.name = "Name field is mandatory.";
  if (!email || !email.includes("@")) errors.email = "A valid business email is mandatory.";
  if (!phone || phone.trim() === "") errors.phone = "Phone number is mandatory.";
  if (!subject || subject.trim() === "") errors.subject = "Subject description is mandatory.";
  if (!message || message.trim() === "") errors.message = "Message details are mandatory.";

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, "Contact Form submission validation failed", errors);
  }

  try {
    const newMessage = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: "unseen" as const, // default initial status
      createdAt: new Date().toISOString()
    };

    const result = await contactsCollection.insertOne(newMessage);
    return sendSuccess(res, "Contact message submitted successfully! We will get in touch soon.", {
      messageId: result.insertedId,
      ...newMessage
    }, 201);
  } catch (error) {
    return sendError(res, "Failed to register support request.", error, 500);
  }
};

/**
 * Admin Only: Retrieve all support contact forms
 */
export const getContactMessages = async (req: Request, res: Response) => {
  try {
    const messages = await contactsCollection.find().sort({ createdAt: -1 }).toArray();
    return sendSuccess(res, "Retrieved all contact inquiries.", messages);
  } catch (error) {
    return sendError(res, "Failed to retrieve support messages.", error, 500);
  }
};

/**
 * Admin Only: Update inquiry message status
 */
export const updateMessageStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["unseen", "read", "replied"];
  if (!status || !validStatuses.includes(status)) {
    return sendValidationError(res, "Invalid message status assignment.", {
      status: `Status must be one of: ${validStatuses.join(", ")}`
    });
  }

  try {
    const message = await contactsCollection.findOne({ _id: id });
    if (!message) {
      return sendError(res, "Support inquiry not found.", null, 404);
    }

    await contactsCollection.updateOne(
      { _id: id },
      { $set: { status, updatedAt: new Date().toISOString() } }
    );

    return sendSuccess(res, `Support message status marked as [${status}] successfully.`, {
      messageId: id,
      status
    });
  } catch (error) {
    return sendError(res, "Failed to update inquiry status.", error, 500);
  }
};

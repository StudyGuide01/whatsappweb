import { asyncHandler } from "express-async-handler";
import statusService from "../services/status.service.js";
import { response } from "../utils/responseHandler.js";
import StatusModel from "../model/status.model.js";

export const createStatus = asyncHandler(async (req, res) => {
  try {
    const { content, messageType } = req.body;
    const userId = req.userId;
    const file = req.file;

    const data = {
      content,
      messageType,
      userId,
    };

    const result = await statusService.statusCreateService(data, file);
    return response(res, 201, "Status Create Successfully", result);
  } catch (error) {
    console.log("Message Controller While create status", error);
    return response(res, 500, "Internal server error");
  }
});



export const getStatus = asyncHandler(async (req, res) => {
  try {
    const status = await StatusModel.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "userName profile.picture")
      .populate("viewers", "userName profile.picture")
      .lean().sort({createdAt: - 1});

      return response(res, 200,'Status retrive successfully',status)
  } catch (error) {
    console.log("Message Controller While getting status", error);
    return response(res, 500, "Internal server error");
  }
});

export const viewStatus = asyncHandler(async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.userId;

    const status = await StatusModel.findById(statusId)
      .populate("user", "userName profile.picture")
      .populate("viewers", "userName profile.picture");

    if (!status) {
      return response(res, 404, "Status not found");
    }

    if (!status.viewers.includes(userId)) {
      status.viewers.push(userId);
      await status.save();
    }

    const updatedStatus = await StatusModel.findById(statusId)
      .populate("user", "userName profile.picture")
      .populate("viewers", "userName profile.picture")
      .lean();

    return response(res, 200, "Status viewed successfully", updatedStatus);
  } catch (error) {
    console.log("Status Controller While viewing status", error);
    return response(res, 500, "Internal server error");
  }
});


// Delete Status 

export const deleteStatus = asyncHandler(async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.userId; // Middleware se aane wali userId

    // 1. Status ko find karein
    const status = await StatusModel.findById(statusId);

    // 2. Check karein status exist karta hai ya nahi
    if (!status) {
      return response(res, 404, "Status not found");
    }

    // 3. Authorization check: Kya ye status isi user ka hai?
    // status.user ko string me convert karna zaroori hai comparison ke liye
    if (status.user.toString() !== userId) {
      return response(res, 403, "Not authorized to delete this status");
    }

    // 4. Status delete karein
    await StatusModel.findByIdAndDelete(statusId);

    return response(res, 200, "Status deleted successfully");
  } catch (error) {
    console.log("Status Controller While deleting status", error);
    return response(res, 500, "Internal server error");
  }
});
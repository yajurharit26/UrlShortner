import { generate as generateUrlcode } from "generate-password";

import { UrlPayloadType, UrlType } from "../types";
import Url from "../models/UrlModel";

// Base URL for shortened links
const BASE_URL = process.env.BASE_URL || "https://urlshortner-x99b.onrender.com/api/url";

//create
export const createUrl = async (payload: UrlPayloadType) => {
  if (!payload.originalLink || !payload.userId)
    throw new Error("Missing required paramaters");
  try {
    let url = new Url(payload);

    //create urlcode
    const urlCode = generateUrlcode({
      length: 8,
      uppercase: true,
    });

    url.urlCode = urlCode;
    url.shortenedUrl = `${BASE_URL}/${urlCode}`;

    url = await url.save();

    return url;
  } catch (error) {
    console.error("Error creating URL:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create URL");
  }
};

//get
export const getUrlByUrlCode = async (urlCode: string) => {
  try {
    let data = await Url.findOne({ urlCode });
    
    // Log the result for debugging
    console.log(`URL lookup result for ${urlCode}:`, data ? 'Found' : 'Not found');
    
    if (!data) {
      throw new Error("URL not found");
    }
    
    // Update visit count
    data.visitCount = data.visitCount + 1;
    
    // Save the updated data and return it
    const updatedData = await Url.findOneAndUpdate(
      { urlCode: urlCode }, 
      { visitCount: data.visitCount }, 
      { new: true }
    );
    
    return updatedData;
  } catch (error) {
    console.error("Error getting URL:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to get URL");
  }
};

export const updateUrlCode = async (payload: Partial<UrlType>) => {
  if (!payload.urlCode) throw new Error("Invalid urlCode");
  try {
    let data = await Url.findOne({ urlCode: payload.urlCode });
    if (!data) {
      throw new Error("URL not found");
    }

    //editable column restriction
    const editableColumn: Array<Partial<keyof UrlType>> = [
      "name",
      "originalLink",
    ];

    Object.keys(payload).forEach((key: any) => {
      if (editableColumn.includes(key)) {
        data[key] = payload[key];
      }
    });

    return await Url.findOneAndUpdate({ urlCode: payload.urlCode }, data, { new: true });
  } catch (error) {
    console.error("Error updating URL:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update URL");
  }
};

export const deleteUrlByUrlCode = async (urlCode: string) => {
  try {
    const deleted = await Url.deleteOne({ urlCode });
    return "Deleted successfully";
  } catch (error) {
    console.error("Error deleting URL:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete URL");
  }
};

export const getUrlsForUser = async (userId: string) => {
  try {
    const urls = await Url.find({ userId: userId }).exec();
    // Add shortenedUrl field if missing in any entries
    for (const url of urls) {
      if (!url.shortenedUrl) {
        url.shortenedUrl = `${BASE_URL}/${url.urlCode}`;
        await url.save();
      }
    }
    return urls;
  } catch (error) {
    console.error("Error getting URLs for user:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to get URLs");
  }
};

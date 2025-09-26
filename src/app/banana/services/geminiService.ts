import type { GeneratedContent } from "../types";
import { STELLAR_CONFIG, getStellarToken } from "./stellarService";

export async function editImage(
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  maskBase64: string | null,
  secondaryImage: { base64: string; mimeType: string } | null
): Promise<GeneratedContent> {
  try {
    let fullPrompt = prompt;

    // Build the content array for OpenRouter API
    const content: any[] = [
      {
        type: "text",
        text: fullPrompt,
      },
      {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64ImageData}`,
        },
      },
    ];

    // Add mask image if provided
    if (maskBase64) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${maskBase64}`,
        },
      });
      fullPrompt = `Apply the following instruction only to the masked area of the image: "${prompt}". Preserve the unmasked area.`;
      // Update the text content with the modified prompt
      content[0].text = fullPrompt;
    }

    // Add secondary image if provided (for multi-image transformations)
    if (secondaryImage) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${secondaryImage.mimeType};base64,${secondaryImage.base64}`,
        },
      });
    }

    const requestBody = {
      model: "google/gemini-2.5-flash-image-preview",
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      max_tokens: 1000,
    };

    // Get stellar token for authentication
    const stellarToken = getStellarToken();
    if (!stellarToken) {
      throw new Error(
        "No stellar token found. Please provide a stellar token in the URL parameters (?stellar=your-token)."
      );
    }

    // Make simplified API call with stellar token
    const response = await fetch(STELLAR_CONFIG.API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": stellarToken,
        "HTTP-Referer":
          typeof window !== "undefined" ? window.location.origin : "",
        "X-Title": "ROZO Banana",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Invalid stellar token. Please check your access token."
        );
      }
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const result: GeneratedContent = { imageUrl: null, text: null };

    // Process the response from OpenRouter
    if (data.choices && data.choices.length > 0) {
      const choice = data.choices[0];

      if (choice.message) {
        // Get text content
        if (choice.message.content) {
          result.text = choice.message.content;
        }

        // Get image content from the images array
        if (choice.message.images && choice.message.images.length > 0) {
          const imageData = choice.message.images[0];
          if (
            imageData.type === "image_url" &&
            imageData.image_url &&
            imageData.image_url.url
          ) {
            result.imageUrl = imageData.image_url.url;
          }
        }
      }
    }

    // If no image was returned, check for errors
    if (!result.imageUrl) {
      let errorMessage =
        "The model did not return an image. It might have refused the request. Please try a different image or prompt.";

      if (data.choices && data.choices[0]?.finish_reason === "safety") {
        errorMessage =
          "The request was blocked for safety reasons. Please modify your prompt or image.";
      } else if (
        data.choices &&
        data.choices[0]?.finish_reason === "content_filter"
      ) {
        errorMessage =
          "The content was filtered. Please try a different prompt or image.";
      }

      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    console.error("Error calling Stellar API:", error);
    if (error instanceof Error) {
      let errorMessage = error.message;
      try {
        // Try to parse error message if it's JSON
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error && parsedError.error.message) {
          // Add user-friendly messages for common errors
          if (parsedError.error.status === "rate_limit_exceeded") {
            errorMessage =
              "You've exceeded the rate limit. Please wait a moment before trying again.";
          } else if (
            parsedError.error.code === 500 ||
            parsedError.error.status === "internal_server_error"
          ) {
            errorMessage =
              "An unexpected server error occurred. This might be a temporary issue. Please try again in a few moments.";
          } else if (parsedError.error.status === "insufficient_quota") {
            errorMessage =
              "Insufficient quota. Please check your account balance.";
          } else {
            errorMessage = parsedError.error.message;
          }
        }
      } catch (e) {
        // Not a JSON string, use the original message
      }
      throw new Error(errorMessage);
    }
    throw new Error(
      "An unknown error occurred while communicating with the API."
    );
  }
}

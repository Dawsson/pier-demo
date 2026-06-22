import { z } from "zod";

const messageResponseSchema = z
  .object({
    message: z.string(),
  })
  .passthrough();

const nestedErrorResponseSchema = z
  .object({
    error: messageResponseSchema,
  })
  .passthrough();

export function httpErrorMessage(body: unknown) {
  const messageResponse = messageResponseSchema.safeParse(body);
  if (messageResponse.success) {
    return messageResponse.data.message;
  }

  const nestedErrorResponse = nestedErrorResponseSchema.safeParse(body);
  return nestedErrorResponse.success ? nestedErrorResponse.data.error.message : undefined;
}

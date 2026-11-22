import { z } from "zod";

export const createProjectValidation = z.object({
  body: z.object({
    workspaceId: z.string().min(1),
    name: z.string().min(2).max(120),
    description: z.string().max(1000).optional(),
  }),
});

export const updateProjectValidation = z.object({
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(["active", "archived", "completed"]).optional(),
  }),
});

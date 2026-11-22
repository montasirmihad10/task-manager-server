import { z } from "zod";

const workspaceRoleEnum = z.enum(["admin", "manager", "member"]);

export const createWorkspaceValidation = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    description: z.string().max(500).optional(),
  }),
});

export const updateWorkspaceValidation = z.object({
  body: z.object({
    name: z.string().min(2).max(80).optional(),
    description: z.string().max(500).optional(),
  }),
});

export const inviteMemberValidation = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(["manager", "member"]).default("member"),
  }),
});

export const updateMemberRoleValidation = z.object({
  body: z.object({
    role: workspaceRoleEnum,
  }),
});


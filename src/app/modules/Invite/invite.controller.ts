import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JwtPayload } from "../../interface/global";
import { inviteServices } from "./invite.service";

const getParam = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

const create = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await inviteServices.createInviteLink(
    req.body.workspaceId || getParam(req.params.id),
    String(user.user),
    req.body,
  );
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Invite link created",
    data: result,
  });
});

const list = catchAsync(async (req, res) => {
  const result = await inviteServices.listInvites(
    String(req.query.workspaceId || req.params.id),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Invites retrieved",
    data: result,
  });
});

const preview = catchAsync(async (req, res) => {
  const result = await inviteServices.getInviteByToken(
    getParam(req.params.token),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Invite preview",
    data: result,
  });
});

const accept = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await inviteServices.acceptInvite(
    getParam(req.params.token),
    String(user.user),
  );
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Invite accepted",
    data: result,
  });
});

const revoke = catchAsync(async (req, res) => {
  const result = await inviteServices.revokeInvite(getParam(req.params.inviteId));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Invite revoked",
    data: result,
  });
});

const createWithCredentials = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await inviteServices.createWithCredentials(
    req.body.workspaceId,
    String(user.user),
    req.body,
  );
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: "Member invited with temporary login credentials",
    data: result,
  });
});

export const inviteControllers = {
  create,
  createWithCredentials,
  list,
  preview,
  accept,
  revoke,
};

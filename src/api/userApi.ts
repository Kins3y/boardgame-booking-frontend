import { api } from "./client";

export type CurrentUser = {
  id: number;
  email: string;
  nickname: string;
  admin_badge: string | null;
};

export async function updateMyNickname(
  nickname: string
): Promise<CurrentUser> {
  const response = await api.patch("/user/me/nickname", {
    nickname
  });

  return response.data;
}

export async function updateMyPassword(
  oldPassword: string,
  newPassword: string,
  newPasswordConfirm: string
): Promise<void> {
  await api.patch("/user/me/password", {
    old_password: oldPassword,
    new_password: newPassword,
    new_password_confirm: newPasswordConfirm
  });
}
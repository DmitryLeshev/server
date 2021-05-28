({
  access: "public",
  method: async ({ login, password, fullName }) => {
    console.log("auth/register");
    const hash = await common.util.hashPassword(password);
    await application.auth.registerUser(login, hash, fullName);
    const token = await context.client.startSession();
    return { status: "success", token };
  },
});

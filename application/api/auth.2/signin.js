({
  access: "public",
  method: async ({ login, password }) => {
    const user = await application.auth.getUser(login);
    const hash = user ? user.password : undefined;
    const valid = await common.util.validatePassword(password, hash);
    if (!user || !valid) throw new Error("Incorrect login or password");
    console.log(`Logged user: ${login}`);
    const token = await context.client.startSession(user.systemUserId);

    console.debug({ user, hash, valid, token, context });
    return { status: "logged", token };
  },
});

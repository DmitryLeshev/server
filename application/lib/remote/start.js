async () => {
  if (application.worker.id === "W1") {
    console.debug("Connect to client");
  }
  // const Client = common.server;
  // const client = new Client(config.remote.url);
  // lib.remote.client = client;
  // client.socket.on("error", () => {
  //   if (application.worker.id === "W1") {
  //     console.warn(`Can not connect to ${client.url}`);
  //   }
  // });
  // try {
  //   await client.load("example");
  // } catch {
  //   if (application.worker.id === "W1") {
  //     console.warn('Can not load client interface: "example"');
  //   }
  // }
};

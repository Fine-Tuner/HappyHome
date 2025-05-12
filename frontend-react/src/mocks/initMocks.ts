export async function initMocks() {
  if (import.meta.env.PROD) {
    return;
  }

  const { worker } = await import("./browser");
  await worker.start({
    onUnhandledRequest: "bypass",
  });
}

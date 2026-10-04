export function logInfo(message, fields = {}) {
  console.log(JSON.stringify({ level: "info", message, ...fields }));
}

export function logError(message, error, fields = {}) {
  console.error(
    JSON.stringify({
      level: "error",
      message,
      errorName: error?.name,
      errorCode: error?.code,
      errorMessage: error?.message,
      ...fields,
    }),
  );
}

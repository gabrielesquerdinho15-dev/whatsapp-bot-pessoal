function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export async function sendZApiText(params: { phone: string; message: string }) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const instanceToken = process.env.ZAPI_INSTANCE_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !instanceToken) {
    return { ok: false, skipped: true, reason: "Missing Z-API credentials" as const };
  }

  const response = await fetch(
    `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientToken ? { "Client-Token": clientToken } : {})
      },
      body: JSON.stringify({
        phone: normalizePhone(params.phone),
        message: params.message
      })
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : `Z-API send failed with status ${response.status}`
    );
  }

  return { ok: true, data };
}

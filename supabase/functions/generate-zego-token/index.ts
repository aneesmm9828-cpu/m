// supabase/functions/generate-zego-token/index.ts
//
// ZegoCloud "token04" generator — Supabase Edge Function (Deno).
// Logic verified byte-for-byte against ZEGOCLOUD's official repo:
// https://github.com/ZEGOCLOUD/zego_server_assistant/blob/master/token/nodejs/server/zegoServerAssistant.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- Official token04 algorithm (do not modify) ----------

function RndNum(a: number, b: number): number {
  return Math.ceil((a + (b - a)) * Math.random());
}

function makeRandomIv(): string {
  const str = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += str.charAt(Math.floor(Math.random() * str.length));
  }
  return result;
}

function getAlgorithm(key: Buffer): string {
  switch (key.length) {
    case 16: return "aes-128-cbc";
    case 24: return "aes-192-cbc";
    case 32: return "aes-256-cbc";
  }
  throw new Error("Invalid key length: " + key.length);
}

function aesEncrypt(plainText: string, key: string, iv: string): Buffer {
  const cipher = crypto.createCipheriv(getAlgorithm(Buffer.from(key)), key, iv);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(plainText), cipher.final()]);
}

function generateToken04(
  appId: number,
  userId: string,
  secret: string,
  effectiveTimeInSeconds: number,
  payload = ""
): string {
  if (!appId || typeof appId !== "number") throw new Error("appID invalid");
  if (!userId || typeof userId !== "string") throw new Error("userId invalid");
  if (!secret || secret.length !== 32) throw new Error("secret must be a 32 byte string");
  if (!effectiveTimeInSeconds || typeof effectiveTimeInSeconds !== "number") throw new Error("effectiveTimeInSeconds invalid");

  const createTime = Math.floor(Date.now() / 1000);
  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce: RndNum(-2147483648, 2147483647),
    ctime: createTime,
    expire: createTime + effectiveTimeInSeconds,
    payload: payload || "",
  };

  const plainText = JSON.stringify(tokenInfo);
  const iv = makeRandomIv();
  const encryptBuf = aesEncrypt(plainText, secret, iv);

  const expireBuf = Buffer.alloc(8);
  expireBuf.writeBigInt64BE(BigInt(tokenInfo.expire));

  const ivLenBuf = Buffer.alloc(2);
  ivLenBuf.writeUInt16BE(iv.length);

  const encLenBuf = Buffer.alloc(2);
  encLenBuf.writeUInt16BE(encryptBuf.length);

  const buf = Buffer.concat([
    expireBuf,
    ivLenBuf,
    Buffer.from(iv),
    encLenBuf,
    encryptBuf,
  ]);

  return "04" + buf.toString("base64");
}

// ---------- HTTP handler ----------

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { userId, roomId, effectiveTimeInSeconds = 3600 } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const APP_ID = Number(Deno.env.get("ZEGO_APP_ID"));
    const SERVER_SECRET = Deno.env.get("ZEGO_SERVER_SECRET") ?? "";

    if (!APP_ID || SERVER_SECRET.length !== 32) {
      return new Response(
        JSON.stringify({ error: "ZEGO_APP_ID / ZEGO_SERVER_SECRET not configured correctly" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let payload = "";
    if (roomId) {
      payload = JSON.stringify({
        room_id: roomId,
        privilege: { 1: 1, 2: 1 },
        stream_id_list: null,
      });
    }

    const token = generateToken04(APP_ID, userId, SERVER_SECRET, effectiveTimeInSeconds, payload);

    return new Response(
      JSON.stringify({ token, appId: APP_ID, userId, roomId: roomId ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

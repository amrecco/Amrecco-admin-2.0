import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function optionalEnv(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

function isProbablyEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Allow UI to send these, but also allow env defaults
    const defaultTo = optionalEnv("DEFAULT_TO"); // optional
    const subjectPrefix = optionalEnv("DEFAULT_SUBJECT_PREFIX"); // optional, e.g. "Amrecco | "
    const signature = optionalEnv("DEFAULT_SIGNATURE"); // optional, appended to text

    const toRaw: string = (body?.to ?? defaultTo ?? "").trim();
    const subjectRaw: string = String(body?.subject ?? "").trim();
    const textRaw: string = String(body?.text ?? "").trim();

    if (!toRaw) {
      return NextResponse.json(
        { error: "Missing recipient email. Provide `to` or set DEFAULT_TO in env." },
        { status: 400 }
      );
    }

    // support multiple recipients separated by comma
    const toList = toRaw.split(",").map((s) => s.trim()).filter(Boolean);
    if (toList.length === 0 || toList.some((e) => !isProbablyEmail(e))) {
      return NextResponse.json(
        { error: "Invalid `to` email address (or list)." },
        { status: 400 }
      );
    }

    // If you want subject/body to be required always, keep this strict.
    // Otherwise, you can set defaults in env.
    if (!subjectRaw) {
      return NextResponse.json(
        { error: "Missing subject." },
        { status: 400 }
      );
    }

    if (!textRaw) {
      return NextResponse.json(
        { error: "Missing email body text." },
        { status: 400 }
      );
    }

    const subject = `${subjectPrefix}${subjectRaw}`.trim();

    const text =
      signature && !textRaw.includes(signature)
        ? `${textRaw}\n\n${signature}`.trim()
        : textRaw;

    // SMTP env (required)
    const host = requireEnv("SMTP_HOST");
    const port = Number(requireEnv("SMTP_PORT"));
    const user = requireEnv("SMTP_USER");
    const pass = requireEnv("SMTP_PASS");
    const from = requireEnv("SMTP_FROM"); // e.g. "Recruiting <recruiting@yourdomain.com>"

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from,
      to: toList.join(", "),
      subject,
      text,
    });

    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to send email" },
      { status: 500 }
    );
  }
}

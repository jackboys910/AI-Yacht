"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import { Eyebrow } from "./eyebrow";
import { emailConfig, siteConfig } from "@/lib/site";
import {
  buildHtml,
  buildSubject,
  buildText,
  type ApplicationData,
} from "@/lib/application-email";

const fieldClass =
  "w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:border-[color:var(--gold)] focus:bg-white/[0.09] disabled:opacity-60";

type Status = "idle" | "sending" | "sent" | "error";

export function Apply() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = new FormData(event.currentTarget);
    const data: ApplicationData = {
      name: String(form.get("name") ?? "").trim(),
      contact: String(form.get("contact") ?? "").trim(),
      niche: String(form.get("niche") ?? "").trim(),
      goal: String(form.get("goal") ?? "").trim(),
    };

    setStatus("sending");
    try {
      await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        {
          subject: buildSubject(data),
          html: buildHtml(data),
          text: buildText(data),
          mail_to: emailConfig.recipient,
          send_to: emailConfig.recipient,
          from_name: siteConfig.name,
          from: emailConfig.recipient,
        },
        { publicKey: emailConfig.publicKey },
      );
      setStatus("sent");
    } catch (error) {
      console.error("[AI Yacht] application send failed", error);
      setStatus("error");
    }
  }

  return (
    <section
      id="apply"
      className="relative overflow-hidden bg-primary py-20 text-white sm:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px 400px at 80% 20%, #0F7A6B33, transparent)",
        }}
      />

      <div className="container-narrow relative grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <Eyebrow tone="light">Application</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
            Book a 15-minute call.
          </h2>
          <p className="mt-6 max-w-md text-white/80">
            We don&apos;t accept applications without a short conversation —
            it&apos;s part of the selection. Usually after the call it becomes
            clear to both sides.
          </p>

          <div className="mt-10 space-y-3 text-sm text-white/70">
            {[
              "We reply within 24 hours.",
              "No spam — only about this trip.",
              "Only 6 seats — priority by application date.",
            ].map((line) => (
              <div key={line} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--gold)]" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md sm:p-10">
          {status === "sent" ? (
            <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[color:var(--gold)] text-[color:var(--gold-foreground)]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    d="M5 12l5 5L20 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="mt-6 font-display text-2xl">Application sent</h3>
              <p className="mt-3 max-w-sm text-sm text-white/75">
                We&apos;ll get in touch within 24 hours to arrange a short call.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field
                label="Name"
                name="name"
                placeholder="What should we call you?"
                required
                disabled={status === "sending"}
              />
              <Field
                label="Telegram / WhatsApp"
                name="contact"
                placeholder="@username or +1…"
                required
                disabled={status === "sending"}
              />
              <Field
                label="Line of business"
                name="niche"
                placeholder="Briefly: what you do"
                required
                disabled={status === "sending"}
              />
              <Field
                label="What do you want to get out of the week?"
                name="goal"
                placeholder="A couple of sentences — freeform"
                textarea
                disabled={status === "sending"}
              />

              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-2 w-full rounded-full bg-[color:var(--gold)] px-6 py-4 text-base font-semibold text-[color:var(--gold-foreground)] shadow-elegant transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "sending"
                  ? "Sending…"
                  : "Book a 15-minute call"}
              </button>

              {status === "error" && (
                <p className="text-center text-xs text-[color:var(--gold)]">
                  Something went wrong while sending. Please try again, or write
                  to us at {emailConfig.recipient}.
                </p>
              )}

              <p className="text-center text-xs text-white/50">
                By clicking the button you agree to be contacted via the details
                above.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  textarea,
  disabled,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  textarea?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-widest text-white/60">
        {label}
      </span>
      {textarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          className={fieldClass}
        />
      ) : (
        <input
          name={name}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={fieldClass}
        />
      )}
    </label>
  );
}

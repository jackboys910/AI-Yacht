"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Localized } from "@/lib/content/types";
import { sendOrganizerInvite, type InviteResult } from "@/lib/organizer-invite";
import { Select, SecondaryButton } from "../fields";
import { useAdmin } from "../i18n";

/**
 * The owner's button for С-12: tell the organizer the panel exists.
 *
 * Deliberately not automatic. Writing an address on a trip is something the
 * owner does while still thinking about it — a letter that went out the
 * moment the field lost focus would reach people the trip was not offered to
 * yet, and there is no unsending. So the letter goes when it is asked for,
 * and the trip remembers that it went.
 *
 * `organizerInvitedAt` is never written from here. The Worker writes it after
 * the send, and the panel's own save merges rather than replaces, so a stamp
 * the form knows nothing about survives the next save untouched.
 */
export function OrganizerInvite({
  tripId,
  email,
  invitedAt,
  name,
}: {
  /** Null while the trip has never been saved: there is nothing to write about. */
  tripId: string | null;
  email?: string;
  invitedAt?: string;
  /**
   * The organizer's name, when the trip names a person from the directory.
   *
   * Both halves, not one: a letter in Russian should greet them by the
   * Russian spelling, and which language the letter is in is decided below.
   */
  name?: Localized<string>;
}) {
  const { locale: panelLocale, t } = useAdmin();
  const [language, setLanguage] = useState<Locale>(panelLocale);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);

  // What the letter's own record says, with what just happened taking
  // precedence: the trip the form is holding was read before the send.
  const sentAt =
    result?.kind === "sent" || result?.kind === "already" ? result.at : invitedAt;

  async function send() {
    setBusy(true);
    setResult(null);
    try {
      setResult(
        await sendOrganizerInvite({
          tripId: tripId as string,
          locale: language,
          name: name?.[language]?.trim() || name?.en?.trim() || name?.ru?.trim(),
          // Pressing the button again, with a letter already on record, can
          // only mean a second copy is wanted — the first one went to spam,
          // or the address was read out wrong over the phone.
          resend: Boolean(invitedAt),
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-[color:var(--muted)]/40 p-4">
      <p className="text-sm font-medium">{t.tripForm.invite.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {t.tripForm.invite.explain}
      </p>

      {!email ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t.tripForm.invite.needsEmail}
        </p>
      ) : !tripId ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t.tripForm.invite.saveFirst}
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs text-muted-foreground">
            {sentAt
              ? t.tripForm.invite.wentAt(sentAt.slice(0, 16).replace("T", " "))
              : t.tripForm.invite.neverSent}
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-52">
              {/* The person wrote their idea in one language, and that is the
                  one they get an answer in. The owner read the idea, so he is
                  the one who knows which. */}
              <Select<Locale>
                id="invite-language"
                label={t.tripForm.invite.language}
                value={language}
                options={[
                  { value: "en", label: "English" },
                  { value: "ru", label: "Русский" },
                ]}
                onChange={setLanguage}
              />
            </div>
            <SecondaryButton disabled={busy} onClick={() => void send()}>
              {busy
                ? t.tripForm.invite.sending
                : sentAt
                  ? t.tripForm.invite.resend
                  : t.tripForm.invite.send}
            </SecondaryButton>
          </div>

          {result && <Outcome result={result} />}
        </>
      )}
    </div>
  );
}

function Outcome({ result }: { result: InviteResult }) {
  const { t } = useAdmin();

  switch (result.kind) {
    case "sent":
      return (
        <Line tone="good">
          {t.tripForm.invite.sent(result.at.slice(0, 16).replace("T", " "))}
          {result.to && ` → ${result.to}`}
        </Line>
      );
    case "already":
      return (
        <Line tone="warn">
          {t.tripForm.invite.already(result.at.slice(0, 16).replace("T", " "))}
        </Line>
      );
    case "absent":
      return <Line tone="warn">{t.tripForm.invite.absent}</Line>;
    case "unconfigured":
      return <Line tone="warn">{t.tripForm.invite.unconfigured}</Line>;
    case "noOrganizer":
      return <Line tone="warn">{t.tripForm.invite.needsEmail}</Line>;
    case "failed":
      return (
        <Line tone="bad">
          {t.tripForm.invite.failed}
          {result.detail && (
            <span className="mt-1 block break-all text-xs opacity-80">
              {result.detail}
            </span>
          )}
        </Line>
      );
  }
}

function Line({
  tone,
  children,
}: {
  tone: "good" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const colour =
    tone === "good"
      ? "text-[color:var(--teal)]"
      : tone === "warn"
        ? "text-amber-700"
        : "text-red-600";

  return (
    <p role="status" className={`mt-3 text-sm ${colour}`}>
      {children}
    </p>
  );
}

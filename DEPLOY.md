# Deploying AI Yacht to Cloudflare

This site is a **static export**: `next build` writes plain HTML, CSS, JS and
images into `out/`. Cloudflare serves those files straight from its edge
network — there is no Node server to run, no cold starts, and asset requests
are not billed. The free plan is sufficient.

Deployment is **manual on purpose**: nothing ships until someone opens the
Actions tab and presses a button.

---

## 1. Prerequisites

| What | Why | Who has it |
| ---- | --- | ---------- |
| A GitHub repository | Holds the code and runs the deploy workflow | You create it |
| A Cloudflare account | Hosts the site and manages DNS | Probably the manager already has one |
| The domain | What visitors type | See [§6](#6-the-domain) |

---

## 2. Push the code to GitHub

The local repository is already initialised and committed. Create an empty
repository on GitHub (**no** README, **no** .gitignore — the repo already has
both), then:

```bash
cd F:\Yacht
git remote add origin https://github.com/<user-or-org>/ai-yacht.git
git push -u origin main
```

---

## 3. Get your Cloudflare Account ID

1. Log in at <https://dash.cloudflare.com>.
2. In the left sidebar click **Compute (Workers)** → **Workers & Pages**.
3. Look at the right-hand sidebar: **Account ID** with a copy button.
   (It is also the long hex string in the dashboard URL:
   `dash.cloudflare.com/`**`<account-id>`**`/workers`.)
4. Copy it.

---

## 4. Create an API token

1. Click your profile icon (top right) → **Profile** → **API Tokens**.
   Direct link: <https://dash.cloudflare.com/profile/api-tokens>
2. **Create Token**.
3. Find the **Edit Cloudflare Workers** template → **Use template**.
4. Under **Account Resources**, pick the account you copied the ID from.
5. Under **Zone Resources**, choose **All zones** (or specifically the zone for
   your domain once it exists). This permission is what lets the deploy attach
   the Worker to a custom domain.
6. **Continue to summary** → **Create Token**.
7. **Copy the token now.** Cloudflare shows it exactly once.

> Never commit this token. It goes into GitHub secrets only.

---

## 5. Add the secrets to GitHub

In your GitHub repository:

**Settings** → **Secrets and variables** → **Actions** → **New repository
secret**. Add two:

| Name | Value |
| ---- | ----- |
| `CLOUDFLARE_API_TOKEN` | the token from §4 |
| `CLOUDFLARE_ACCOUNT_ID` | the Account ID from §3 |

### First deploy

1. Go to the **Actions** tab.
2. Select **Deploy to Cloudflare** in the left list.
3. Press **Run workflow**.
4. Choose the **branch** you want to ship and the environment:
   - `production` — publishes live
   - `preview` — uploads a version you can inspect without touching the live URL
5. **Run workflow**.

When it finishes the site is live at
`https://ai-yacht.<your-subdomain>.workers.dev`. Open that URL and check it
before attaching a real domain.

---

## 6. The domain

### What I found about `nazarov.net`

I queried the registry directly. As of 18 September 2026:

| Field | Value |
| ----- | ----- |
| Status | **Already registered** — not available to buy |
| Registered on | 2 August 2007 |
| Expires | 2 August 2027 |
| Registrar | RU-CENTER (Regional Network Information Center, JSC) |
| Nameservers | `ns3-l2.nic.ru`, `ns4-l2.nic.ru`, `ns8-l2.nic.ru`, `ns4-cloud.nic.ru`, `ns8-cloud.nic.ru` |
| Lock | `clientTransferProhibited` |

It has been held since 2007 and its DNS is on nic.ru, **not** Cloudflare. So
there are three possible situations — confirm which one applies before doing
anything else.

#### Case A — the manager already owns it

Most likely if he asked for this specific name. Ask him for **one** of:

- **Preferred:** an invitation to his Cloudflare account. He goes to
  **Manage Account** → **Members** → **Invite**, enters your email, and gives
  you the **Administrator** role (or at minimum *Workers Admin* + *DNS*).
  You then create the token in §4 from within his account.
- Or: he creates the API token himself (§4) and sends it to you privately.
- Or: he does §7 and §8 himself while you watch.

Also ask **which registrar account** holds the domain, because the nameservers
must be changed there (§7).

#### Case B — it belongs to a stranger

Then it must be bought from the current holder. `clientTransferProhibited` is
just the standard anti-hijack lock; the owner can unlock it to transfer. Check
who it is:

```bash
# Windows PowerShell
Invoke-RestMethod https://rdap.verisign.com/net/v1/domain/nazarov.net
```

Buying a 19-year-old `.net` from its owner is a negotiation, not a checkout —
budget time, or pick a different name.

#### Case C — a different domain

Anything works. Cheapest path: register it **through Cloudflare Registrar**
(Domain Registration → Register Domains), which sells at wholesale cost and
puts the domain on Cloudflare DNS instantly — §7 then becomes unnecessary.

---

## 7. Point the domain at Cloudflare

Skip this if the domain is already on Cloudflare (check: does it appear in the
dashboard's **Websites** list?).

1. In the Cloudflare dashboard press **+ Add** → **Connect a domain**.
2. Type the domain, **Continue**.
3. Choose the **Free** plan, **Continue**.
4. Cloudflare scans the existing DNS records and shows them. Review the list —
   **keep any MX records**, or the owner's email stops working. Then
   **Continue**.
5. Cloudflare shows **two nameservers**, e.g.
   `alice.ns.cloudflare.com` and `bob.ns.cloudflare.com`. Copy both.
6. Go to the registrar and replace the existing nameservers with those two.
   For RU-CENTER: log in at <https://www.nic.ru> → **Домены** → click the
   domain → **DNS-серверы и зона** → **Изменить DNS-серверы** → delete the
   five `nic.ru` entries → add the two Cloudflare ones → save.
7. Back in Cloudflare press **Check nameservers**.

Propagation is usually 5–30 minutes but the registry allows up to 24 hours.
Cloudflare emails you when the zone goes **Active**.

> ⚠️ Moving nameservers moves **all** DNS for that domain — mail, subdomains,
> everything. If the domain is already in use, copy every existing record into
> Cloudflare *before* switching, not after.

---

## 8. Attach the domain to the Worker

Once the zone is **Active** in Cloudflare:

1. **Compute (Workers)** → **Workers & Pages** → click **ai-yacht**.
2. **Settings** tab → **Domains & Routes** → **Add** → **Custom domain**.
3. Enter `nazarov.net`, **Add domain**.
4. Repeat for `www.nazarov.net` if you want the www version to work too.

Cloudflare creates the DNS records and issues the TLS certificate
automatically — usually under a minute, occasionally a few minutes. No
certificate files to manage, HTTPS is on by default.

Finally, update the domain in the code so metadata and the footer stop saying
the old name:

```ts
// src/lib/site.ts
domain: "nazarov.net",
url: "https://nazarov.net",
```

Commit, push, and run the workflow again.

---

## 9. Allow the domain in EmailJS

**The form will silently fail until you do this.** EmailJS blocks requests from
domains that are not on its allow-list.

1. Log in to <https://dashboard.emailjs.com> with the manager's account.
2. **Account** → **Security**.
3. Under the allowed-origins / API settings, add:
   - `https://nazarov.net`
   - `https://www.nazarov.net`
   - `https://ai-yacht.<your-subdomain>.workers.dev` (for testing)
4. Save, then submit the form on the live site and confirm the email lands at
   `support@ctmass.com`.

### If the email arrives as raw HTML

This is the problem you hit before. The `template_epduqer` template escapes its
variable. Fix it in the EmailJS dashboard:

1. **Email Templates** → `template_epduqer`.
2. Switch the content editor to **Code / HTML** mode.
3. Make sure the body uses **three** braces — `{{{html}}}` — not `{{html}}`.

Handlebars escapes `{{html}}` by design (that is what turns `<div>` into
`&lt;div&gt;`), so a formatted email arrives as a wall of tags. Triple braces
insert the value raw. Nothing in this repository can override that — it is a
template-side setting.

---

## 10. Routine deploys

After the initial setup, shipping a change is:

```bash
git push
```

then **Actions** → **Deploy to Cloudflare** → **Run workflow** → pick the
branch → **Run**.

The workflow installs dependencies, lints, builds, checks that `out/index.html`
exists, and only then deploys.

### Rolling back

**Workers & Pages** → **ai-yacht** → **Deployments**. Every deploy is kept.
Find the last good one and press **Rollback**. It takes seconds and needs no
rebuild.

---

## Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| Workflow fails on the deploy step with `Authentication error` | Token is wrong, expired, or scoped to another account | Recreate the token (§4), update the secret |
| `workers.dev` URL works, custom domain gives 522/error | Zone is not Active yet, or the custom domain was never added | Check §7 and §8 |
| Form shows "Something went wrong" | Domain missing from the EmailJS allow-list | §9 |
| Email arrives as HTML source | `{{html}}` instead of `{{{html}}}` in the EmailJS template | §9 |
| Images missing after deploy | `out/` was not rebuilt | Rerun the workflow; the build step regenerates `out/` |
| Old content still showing | Cloudflare edge cache | **Caching** → **Configuration** → **Purge Everything** |

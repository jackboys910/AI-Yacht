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

**Confirmed: the domain belongs to the manager**, registered at nic.ru.

Its DNS does not currently resolve at all — every lookup (A, MX, TXT, www)
returns `SERVFAIL`, because the nic.ru nameservers hold no zone for it. So
there is **no website and no email on it today**, and moving it to Cloudflare
cannot break anything.

**Do not transfer it to another registrar** (GoDaddy or anyone else). A
transfer takes 5–7 days, costs a year's renewal and changes nothing that
matters: Cloudflare works with any registrar. The domain stays at nic.ru; only
its nameservers change (§7).

### What the manager needs to do

1. **Create a free Cloudflare account** at
   <https://dash.cloudflare.com/sign-up> (email + password, no card) and
   confirm the email.
2. **Invite you:** **Manage Account** → **Members** → **Invite** → your email
   → role **Administrator** → send. The account stays his; you get a normal
   login of your own. (Alternative if he would rather not touch Cloudflare:
   you create the account and invite *him* as **Super Administrator**.)
3. **Change two nameservers at nic.ru** when you send them (§7, step 6) — or
   do it together on a screen-share. He does not need to share his nic.ru
   password.

### Logging in as the invited member

Cloudflare emails you an invitation. Accept it — sign in, or sign up with the
same email address it was sent to. At <https://dash.cloudflare.com> the
account switcher (top-left) now lists the manager's account; select it before
doing §3 onward.

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

The code already uses `nazarov.net` for canonical URLs, hreflang tags and the
footer (`src/lib/site.ts`). If the domain ever changes, edit it there, commit,
push and run the workflow again.

---

## 9. EmailJS

Both forms (AI Yacht application, IT Solutions inquiry) send through the
CTMASS EmailJS account to `support@ctmass.com`. Out of the box they use the
shared `template_epduqer`, which CTMASS also uses. Every request passes:

| Variable | Contents |
| -------- | -------- |
| `subject` | e.g. `AI Yacht — new application from Anna` |
| `html` | the branded email body |
| `text` | plain-text version |
| `mail_to` | `support@ctmass.com` |
| `from_name` | `AI Yacht` or `AI Yacht · IT Solutions` |
| `reply_to` | the client's email (IT inquiries only) |

### Recommended: a dedicated template for this site

This leaves CTMASS's own emails untouched, fixes the raw-HTML problem for this
site regardless of how the shared template is set up, and locks the recipient.

1. Log in at <https://dashboard.emailjs.com>.
2. **Email Templates** → **Create New Template**.
3. **Subject:** `{{subject}}`
4. **Content:** press **Edit Content** → switch to the **Code** editor →
   delete everything → type exactly `{{{html}}}` (three braces) → apply.
5. Right-hand fields:
   - **To Email:** `support@ctmass.com` — typed literally, *not*
     `{{mail_to}}`. The public key is visible in the browser, so a template
     that takes its recipient from the request could be abused to send mail
     anywhere.
   - **From Name:** `{{from_name}}`
   - **From Email:** keep *Use Default Email Address*.
   - **Reply To:** `{{reply_to}}` — pressing *Reply* on an IT inquiry then
     answers the client directly.
6. **Save**. Open the template's **Settings** tab and copy its **Template ID**
   (you may rename it, e.g. `template_aiyacht`).
7. In GitHub: **Settings** → **Secrets and variables** → **Actions** →
   **Variables** tab → **New repository variable**:
   `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` = that ID. The deploy workflow already
   reads it; run the workflow again.
8. Use the template editor's **Test It** button, or submit a form on the live
   site, and check the result in `support@ctmass.com`.

### If the email arrives as raw HTML

Handlebars escapes `{{html}}` by design — that is what turns `<div>` into
`&lt;div&gt;`, so a formatted email arrives as a wall of tags. The template
must use **triple** braces, `{{{html}}}`. That is a template-side setting;
nothing in this repository can override it. The dedicated template above has
it right from the start.

### Other things to check in the dashboard

- **Account → Security:** if domain restrictions are switched on, add
  `https://nazarov.net`, `https://www.nazarov.net` and your
  `*.workers.dev` URL. If there are none, nothing to do.
- **Email Services:** the service marked as default must be connected
  (the site calls `default_service`, EmailJS's alias for it).
- **Usage / plan:** each form submission is one email against the monthly
  quota.

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
| Form shows "Something went wrong" | EmailJS rejected the request: domain restriction, quota, or disconnected service | §9 — the browser console logs EmailJS's exact reason |
| Email arrives as HTML source | `{{html}}` instead of `{{{html}}}` in the EmailJS template | §9 |
| Images missing after deploy | `out/` was not rebuilt | Rerun the workflow; the build step regenerates `out/` |
| Old content still showing | Cloudflare edge cache | **Caching** → **Configuration** → **Purge Everything** |

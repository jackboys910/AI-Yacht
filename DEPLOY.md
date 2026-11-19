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
certificate files to manage.

### Turn on "Always Use HTTPS" — one switch, and it is off by default

HTTPS works out of the box, but plain `http://nazarov.net` also works, and
that is not the same thing: a visitor who types the address without the scheme,
or follows an old link, gets the site over an unencrypted connection instead of
being sent to the secure one. Т-03 asks for the redirect, and it is a zone
setting rather than anything in this repository — the Worker never sees a page
request (`run_worker_first` lists only `/api/*`), so no code here can answer
it.

1. Cloudflare dashboard → pick the **nazarov.net** zone.
2. **SSL/TLS** → **Edge Certificates**.
3. **Always Use HTTPS** → switch it **on**.
4. While there: **Minimum TLS Version** 1.2, and **Automatic HTTPS Rewrites**
   on. Both are one switch each and neither can break a static site.

Check it with `curl -I http://nazarov.net/`: the answer must be `301` with a
`Location: https://nazarov.net/`, not `200`.

The code already uses `nazarov.net` for canonical URLs, hreflang tags and the
footer (`src/lib/site.ts`). If the domain ever changes, edit it there, commit,
push and run the workflow again.

---

## 8a. Worker secrets

The Worker holds five secrets. Each one exists because the value must never
reach a browser, and each is set the same way: Cloudflare dashboard →
**Workers & Pages** → the worker → **Settings** → **Variables and Secrets** →
**Add** → type **Secret**. **Production only** — the deploy workflow publishes
straight to production and nothing here uses the preview environment.

One endpoint needs nothing from this section: `/api/videos` reads the public
YouTube feed for the video block, and it exists only because YouTube answers
Cloudflare and refuses the build runner. Nothing to set, nothing to rotate.

| Secret | What it lets the Worker do | Without it |
| --- | --- | --- |
| `GITHUB_TOKEN` | start a site rebuild | the panel says the rebuild is not set up |
| `TURNSTILE_SECRET` | prove a form submission came from a browser | forms are accepted unchecked |
| `FIREBASE_SERVICE_ACCOUNT` | write collections that browsers may not write to | the idea form, the subscription and "I'm interested" answer "not switched on yet" |
| `EMAILJS_PRIVATE_KEY` | send mail server-side | the idea, the subscription and the Solutions enquiry are saved, no email goes out; the organizer's letter cannot be sent |
| `FACEBOOK_CAPI_TOKEN` | report events to the advertising account from the server | no advertising counters anywhere: no pixel in the page, no cookie banner, `/api/capi` answers 503 |

### Turnstile

Two keys, and only one of them is public.

**Site key — `0x4AAAAAAF2CxPlP_RK6WRkZ`.** It travels to every visitor's
browser inside the widget, so it lives in the repository rather than in a
secret. Widget `nazarov.net`, mode Managed.

**Secret key** goes in as `TURNSTILE_SECRET`.

Until it is set, the Worker accepts submissions without checking them and says
so: the answer to a successful submission carries `"checked": false`, which
is visible in the browser's network tab. **An unprotected write endpoint on a
live site collects spam within hours**, so the secret goes in before the forms
are announced anywhere.

### Firebase service account

`/api/suggestion` writes to `adventureSuggestions`, a collection
`firestore.rules` keeps shut to every browser — it holds email addresses and
what people wrote about themselves to be allowed on a trip. A service account
is how the Worker gets past a rule that is there to stop browsers.

`/api/subscription` — the page behind the Unsubscribe link — needs it to read
and change a subscriber by their key, which is another collection no browser
may touch. It holds no secret of its own: the key in the link is the whole of
the authority, which is why it is 256 random bits rather than an email
address.

`/api/solutions` needs it because §6.6 asks for an enquiry to be **saved**
as well as emailed, and `solutionsInquiries` holds a name, an address and a
phone number for every business that ever asked for a quote — another
collection no browser may read or write.

`/api/interested` needs it for the same reason and for one more. It writes
`interested` and `subscribers`, both shut to browsers, and it also
writes `counters`, which is the one collection browsers may *read*: the
number of people interested in a trip is printed on the page. Counting happens
in the Worker, from the records, precisely because a counter a browser could
write is a counter anyone could write any number into.

Click by click:

1. <https://console.firebase.google.com/project/nazarov-net/settings/serviceaccounts/adminsdk>
2. **Generate new private key** → **Generate key**. A `.json` file downloads.
3. Open that file in a text editor and copy **the whole thing**, from the first
   `{` to the last `}`.
4. In the Cloudflare dashboard add a secret named `FIREBASE_SERVICE_ACCOUNT`
   and paste the JSON in as the value. Not one field of it — all of it. The
   private key inside has line breaks, and pasting the whole document is what
   keeps them intact.
5. Delete the downloaded file. It is a key to the database, and a copy of it
   in Downloads is a copy somebody else can find.

The key can be revoked and reissued on the same page at any time; doing so
only means setting the secret again.

### EmailJS private key

`EMAILJS_PRIVATE_KEY` is what lets the Worker send through EmailJS's REST
API. A private key in a page would let anyone send mail from this account,
which is why the Worker sends and the page does not. It is in the EmailJS
dashboard under **Account → General → Private Key**.

Six things need it. `/api/suggestion` writes to the owner and answers the
author of an idea, `/api/solutions` writes to support@ctmass.com and answers
whoever asked for a project (П-17), `/api/subscribe` greets a new subscriber (Н-05),
`/api/interested` greets whoever presses the button on a trip — the press
puts them on the list of that trip's direction — `/api/announce` sends the
announcement of a new trip to everyone on that list, and `/api/organizer-invite`
sends an organizer the letter
that explains the panel (С-12) — that one addresses somebody who is not the
owner, which a key visible in the browser may never do, because the template's
recipient is pinned to the owner's own mailbox precisely to keep it harmless.
Without the secret the panel's **Send the letter** button says sending is not
set up, rather than pretending the letter went.

Everything else about EmailJS — service id, template id, public key, the
recipient address — is public and lives in `wrangler.jsonc`.

---

### Facebook pixel and the Conversions API

Two values, and the pair is deliberate: §11.1 of the spec explains that
browser events are lost to ad blockers and to Apple's limits often enough
that advertising cannot tell which clicks became subscribers. So every event
goes twice — from the page and from the Worker — with one shared id, and
Facebook keeps one copy.

**Nothing of Facebook exists on the site until both values are set.** No
script, no cookie, and no cookie banner either: asking permission for
something that is not happening would be the one banner worse than none.
That is also how П-20 is passed — open the site for the first time with the
network tab open and there is not a single request to facebook.com before
the banner is answered.

In the client's Meta Business account:

1. <https://business.facebook.com> → **Events Manager** → **Connect data
   sources** → **Web** → **Meta Pixel** → **Connect**.
2. Name it `nazarov.net`, enter the domain, **Continue**. Choose
   **Conversions API** (not "Meta Pixel only") when asked how to connect.
3. Copy the **pixel ID** — a 15-16 digit number. It is public.
4. **Settings** tab of that data source → **Conversions API** → **Generate
   access token**. Copy it once; it is not shown again.

Then, in two places:

- **GitHub** → **Settings** → **Secrets and variables** → **Actions** →
  **Variables** → **New repository variable**:
  `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` = the pixel id. A variable, not a secret —
  it travels to every visitor in the page.
- **`wrangler.jsonc`** → `vars.FACEBOOK_PIXEL_ID` = the same id, committed.
  And the token as a **secret** named `FACEBOOK_CAPI_TOKEN`, through
  **Workers & Pages** → **ai-yacht** → **Settings** → **Variables and
  Secrets**.

Run the deploy workflow again. To watch events arrive: **Events Manager** →
the pixel → **Test Events**, copy the code it shows and set it as the Worker
variable `FACEBOOK_TEST_EVENT_CODE` — then **remove it**, because while it is
set every event is marked as a test and none of them counts.

What the four events are called in Events Manager: `Subscribe`,
`Interested` (custom), `SubmitApplication` and `Lead` for a Solutions
enquiry. Meta Pixel Helper in Chrome shows the browser half; the server half
appears in Events Manager with "Server" beside it, and the two must not
double — if a subscription shows up twice, the event ids are not matching and
that is a bug, not a setting.

---

## 9. EmailJS

Every form on the site sends through the CTMASS EmailJS account, out of the
box through the shared `template_epduqer`, which CTMASS also uses. Every
request passes:

| Variable | Contents |
| -------- | -------- |
| `subject` | e.g. `nazarov.net · Anna wants to come — Grenadines` |
| `html` | the branded email body |
| `text` | plain-text version |
| `mail_to`, `send_to` | **who this letter is for** — see below |
| `from_name` | `Nazarov` or `Nazarov · IT Solutions` |
| `reply_to` | the writer's email, where there is one to answer |

### Who each letter is addressed to

This is no longer one mailbox, and that matters for the template.

| Form | Letters |
| --- | --- |
| Join a trip | the owner, the trip's organizer, and a receipt to the applicant |
| Suggest an adventure | the owner, and a confirmation to the author |
| Subscribe | a welcome to the subscriber |
| Announcement to subscribers | one letter per subscriber of the trip's direction, each in their own language |
| I'm interested | a welcome to the new subscriber, and nothing at all when the address is already on that list |
| Organizer invitation | the organizer |
| Solutions enquiry | support@ctmass.com, and a receipt to whoever asked |

Every letter addressed to **the owner** also goes to whoever is listed in
`EMAILJS_COPY_TO` (a plain value in `wrangler.jsonc`, and
`NEXT_PUBLIC_EMAILJS_COPY_TO` for the forms that send from the page). It is
`george.jackboys@gmail.com` today. Letters to applicants, organizers and
subscribers are never copied — that is somebody else's mail. Several addresses
separated by commas; an empty value switches the copies off; the default lives
in `src/lib/email/recipients.ts`.


### Before the first announcement

The mailing refuses to start until two things are true, and both are
deliberate.

**The sender's postal address.** American law (CAN-SPAM) wants it in every
mailing, so `/api/announce` answers 409 while it is empty rather than sending
something unlawful. Fill it in the panel: **Settings → The site → Sender's
postal address**. A street address, a PO box or a registered agent's address —
whatever the business can be reached at.

**The unsubscribe page** is live (item 3.3): every letter links to
`/unsubscribe/?key=…`, the key is written on every subscriber, and the page
lets somebody leave in one press or keep only the directions they still want.

The mailing goes out in batches of a dozen with the panel open, because a
Worker request may only make so many outgoing requests and EmailJS refuses a
burst. Who has been written to is recorded as it happens: closing the tab
stops the mailing and nothing else — reopening the trip offers to carry on,
and nobody is written to twice.

### Recommended: a dedicated template for this site

This leaves CTMASS's own emails untouched, fixes the raw-HTML problem for this
site regardless of how the shared template is set up, and locks the recipient.

1. Log in at <https://dashboard.emailjs.com>.
2. **Email Templates** → **Create New Template**.
3. **Subject:** `{{subject}}`
4. **Content:** press **Edit Content** → switch to the **Code** editor →
   delete everything → type exactly `{{{html}}}` (three braces) → apply.
5. Right-hand fields:
   - **To Email:** `{{send_to}}`. This has to come from the request now:
     the site writes to applicants, organizers and subscribers as well as to
     the owner, and a template with one address typed into it sends all of
     them to that address instead — the applicant gets nothing and the owner
     gets four copies of the same evening.

     The earlier advice here was the opposite, and it was right while every
     letter went to the owner: the public key travels to the browser, so a
     template that takes its recipient from the request can be used to send
     mail elsewhere. What holds that off instead is **Account → Security →
     allowed origins** (below) — only nazarov.net may use the key — and the
     fact that every letter is now sent by the Worker with the private key,
     from an address nobody can read out of a page. Item 4.2 moved the last
     page-side send, the Solutions form, behind `/api/solutions`; the
     browser SDK is gone from the site altogether.
   - **From Name:** `{{from_name}}`
   - **From Email:** keep *Use Default Email Address*.
   - **Reply To:** `{{reply_to}}` — pressing *Reply* on a Solutions enquiry
     then answers the client directly.
6. **Save**. Open the template's **Settings** tab and copy its **Template ID**
   (you may rename it, e.g. `template_aiyacht`).
7. In GitHub: **Settings** → **Secrets and variables** → **Actions** →
   **Variables** tab → **New repository variable**:
   `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` = that ID. The deploy workflow already
   reads it; run the workflow again.
8. Use the template editor's **Test It** button, or submit a form on the live
   site, and check the result in `support@ctmass.com` — and in
   `george.jackboys@gmail.com`, which should have the same letter. If the
   copy is missing while the owner's letter arrived, the template is still
   sending to a typed-in address rather than to `{{send_to}}`.

### If the email arrives as raw HTML

Handlebars escapes `{{html}}` by design — that is what turns `<div>` into
`&lt;div&gt;`, so a formatted email arrives as a wall of tags. The template
must use **triple** braces, `{{{html}}}`. That is a template-side setting;
nothing in this repository can override it. The dedicated template above has
it right from the start.

### Other things to check in the dashboard

- **Account → Security:** switch the domain restrictions **on** and add
  `https://nazarov.net`, `https://www.nazarov.net` and your
  `*.workers.dev` URL. With the recipient coming from the request this is
  what stops the public key being used to send mail from somewhere else.
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

### Changing dependencies: write the lock file with npm 12

The runner installs with `npm ci`, and `npm ci` refuses to run at all if
`package-lock.json` does not match `package.json`. Two npm versions disagree
about what "match" means here, and that disagreement has already broken one
deploy:

* **npm 11** (what Node 24.13 ships, and what a Windows machine is likely to
  have) does not record the dependencies of packages built for another
  platform. `@img/sharp-wasm32` is one of those — it is `cpu: wasm32` — so its
  `@emnapi/runtime` never reaches the lock.
* **npm 12** (what Node 24.22 on the runner ships) does look inside them, finds
  `@emnapi/runtime@1.11.3` and `@emnapi/core@1.11.3` missing, and stops with
  `EUSAGE … Missing: … from lock file`.

So an `npm install` on Windows can produce a lock file that works perfectly
here and cannot be installed on the runner. After adding or removing any
dependency, regenerate the lock with the runner's npm:

```bash
npx -y npm@12 install --package-lock-only --allow-remote=all
```

and check it the way the runner will, in a directory holding nothing but
`package.json` and the new lock, so the local `node_modules` cannot paper over
a gap:

```bash
npx -y npm@12 ci --dry-run
```

`added N packages` means the lock is sound. Anything about being out of sync
means the deploy would fail at its first step.

### Rolling back

**Workers & Pages** → **ai-yacht** → **Deployments**. Every deploy is kept.
Find the last good one and press **Rollback**. It takes seconds and needs no
rebuild.

---

## 11. Backups and restore (Т-04)

Two scripts, no cloud setup. Google's own scheduled export needs the Blaze
plan, a storage bucket and a format only Google reads back; this database is a
few hundred documents, so a folder of JSON is both cheaper and easier to put
back.

### Taking a copy

```bash
FIREBASE_SERVICE_ACCOUNT="$(cat ~/Downloads/nazarov-net-firebase-adminsdk.json)" \
  node scripts/firestore-backup.mjs
```

It asks the database which collections exist — so a collection added later is
included without anybody editing the script — and writes `backup/<date>/`:
one file per collection plus `manifest.json` with the counts.

The documents are saved in Firestore's own shape, where a number says whether
it is an integer or a double. That is what makes the restore exact rather than
a guess.

**What it does not copy: the photographs.** They are objects in Cloud Storage
with their own durability, and copying a few hundred megabytes every night to
guard against a risk Google already carries is the wrong trade. Every image's
address is inside the documents that *are* copied, so a lost bucket is a known
list of files to put back rather than a mystery.

**Where the files go matters.** They hold addresses and what people wrote
about themselves. Keep them where the database itself would be kept — not in
a shared folder, not in the repository (`backup/` is in `.gitignore`).

### Putting it back

Rehearse first. With no flags the script writes nothing and only says what it
holds:

```bash
node scripts/firestore-restore.mjs backup/2026-11-19
```

Then, into a **test** project — the rehearsal that proves the copy is good:

```bash
FIREBASE_SERVICE_ACCOUNT="$(cat key.json)" \
  node scripts/firestore-restore.mjs backup/2026-11-19 --project nazarov-test --force
```

`--force` without `--project` is refused on purpose: the point of a rehearsal
is not restoring over the live site, and a default of "the live one" is how a
rehearsal becomes an incident. One collection at a time with
`--only trips,interests`.

The restore merges and keeps ids: a document the backup does not have is left
alone, and a field added since the backup is not deleted. Clearing a
collection first is a different operation with a different risk, and these
scripts do not do it.

### A test project for the rehearsal

1. <https://console.firebase.google.com> → **Add project** → name it
   `nazarov-test` → no Analytics.
2. **Firestore Database** → **Create database** → production mode, any region.
3. **Project settings** → **Service accounts** → **Generate new private key**.
4. Restore into it with the command above, then look at the data in the
   console. Delete the project when done; it costs nothing while it sits
   there, but it holds a copy of real people's data.

### If you want it to happen by itself

A scheduled copy means the database — addresses and all — is written to
GitHub's artifact storage every night. That is a decision about personal
data, not a technical step, so it is yours to make rather than mine: the file
below is not in the repository. If you want it, create
`.github/workflows/backup.yml` with this content, then add the
service-account JSON as a repository **secret** named
`FIREBASE_SERVICE_ACCOUNT` (**Settings** → **Secrets and variables** →
**Actions** → **New repository secret**).

```yaml
name: Back up Firestore

on:
  schedule:
    # 02:00 UTC — an hour after the nightly deploy, so a backup is never
    # taken in the middle of a build.
    - cron: "0 2 * * *"
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: node scripts/firestore-backup.mjs
        env:
          FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          FIREBASE_PROJECT_ID: nazarov-net
          BACKUP_DIR: backup
      - uses: actions/upload-artifact@v4
        with:
          name: firestore-${{ github.run_id }}
          path: backup/
          retention-days: 90
          if-no-files-found: error
```

The artifact is private to this repository, which is the same audience as the
database itself, and it expires after ninety days. Download a copy from the
run's page under **Artifacts**.

The alternative, if a nightly copy off-site is not wanted: run the backup
script by hand before anything risky — before a restore, before a change to
the rules, before deleting anybody — which is when a copy is actually needed.

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

# Checking Shop Minis submission status without a person (FRA-50)

Read-only investigation. Nothing was submitted, cancelled, or logged in.
CLI inspected: `@shopify/shop-minis-cli` 0.3.26 (`node_modules/@shopify/shop-minis-cli/build/…`),
`@shopify/cli-kit` 3.94.3. On the first `npm ci` in this worktree (empty `node_modules`) the install completed with no proxy error. A rerun with `node_modules` already present and a read-only filesystem fails with `EROFS` on `node_modules/.bin`, which is a sandbox quirk and not a proxy problem.

## Help output

```
$ npx shop-minis --help
Usage: shop-minis [options] [command]

CLI for Shop Minis development

Options:
  -V, --version                   output the version number
  -h, --help                      display help for command

Commands:
  create [options] [mini name]    Create a new Shop Mini.
  dev [options]                   Start a local development server.
  submit [options]                Submit your Shop Mini for review.
  cancel-submission [options]     Cancel a pending or testing submission.
  check-submission [options]      Check the status of your submissions.
  upgrade [options]               Upgrade your Shop Mini configuration to the
                                  latest version.
  info [options]                  Get relevant version info about OS, toolchain
                                  and libraries
  setup [options]                 Set up a new Mini.
  doctor [options]                Diagnose and fix common Node.js, iOS and
                                  Android issues.
  api-keys                        Manage API keys for your Shop Mini.
  reports                         Manage reports for your Shop Mini.
  enable [options]                Enable your Shop Mini.
  disable [options]               Disable your Shop Mini.
  dashboard                       Launch the Shop Minis dashboard.
  build [options]                 Build the Mini for production
  features [options]              Manage enabled features.
  install [options] [dependency]  Install a dependency, check existing
                                  dependencies, or fix dependency issues.
  verify-build [options]          Verify the Mini production build and
                                  deterministic checks
  help [command]                  display help for command
```

```
$ npx shop-minis check-submission --help
Usage: shop-minis check-submission [options]

Check the status of your submissions.

Options:
  --verbose   Print debugging messages.
  -h, --help  display help for command

$ npx shop-minis setup --help
Usage: shop-minis setup [options]

Set up a new Mini.

Options:
  --regenerate-key  Regenerate the API key for an existing Mini and update the
                    .env file. (default: false)
  -h, --help        display help for command
```

## Running it with no key (safe: fails before any network call)

```
$ npx shop-minis check-submission
│  Shop Minis API key is not set.
│  Your Mini is already configured, but the API key is missing from your .env file.
│  Next steps
│    • Run npx shop-minis setup --regenerate-key to generate a new API key for your Mini.
```

## Answers

**How check-submission authenticates: a static API key, not OAuth.**
- It reads env var `SHOP_MINIS_API_KEY`: `build/commands/config.js:90`. `dotenv.config()` at
  `config.js:6` loads it from `.env` in the current directory.
- It is sent as `Authorization: Bearer <key>` to `https://server.shop.app/minis/admin-api/alpha/graphql.json`
  (`build/data/gql-client.js:9-17`, URL at `config.js:88-89`).
- With no key it aborts before any request (`build/utils/common-tasks.js:10-29`); a 401 gives
  "Your Shop Minis Admin API key is invalid" (`common-tasks.js:35-43`).
- `check-submission` calls `assertNetworkAndAuth()` then `getSubmissions()`
  (`build/commands/check-submission/index.js:19-20`). It never opens a browser or Shopify CLI session.

**Where credentials are stored.**
- Day to day: plain text `SHOP_MINIS_API_KEY=…` in `<mini dir>/.env`, written by
  `setEnvConfigValue` (`build/commands/dev/utils/env-config.js:10-31`). `.env` is gitignored (`.gitignore:4`).
  The `SHOP_MINIS_API_KEY` env var also works, since it is read from `process.env`.
- Only `setup` / `api-keys` use a Shopify login. That session is stored by cli-kit's `conf` store, project
  `shopify-cli-kit` (`@shopify/cli-kit/dist/private/node/conf-store.js:12`, `session/store.js:7-9`).
  By the `conf`/`env-paths` defaults (`node_modules/conf/dist/source/index.js:81,91`) this is probably
  `~/.config/shopify-cli-kit-nodejs/config.json` on Linux. That path is inferred, not run.

**Can it work headless on Linux? Yes for check-submission, once a key exists.**
- Status checks need only the API key: no login, no browser, no device code.
- Creating the key needs a Partner login (`setup`, `setup --regenerate-key`, `api-keys generate`; see
  `commands/setup/index.js:73,159,237`, `data/partners/query.js:7`, `api-keys/generate.js:23`).
  That login is a **device-code flow** (`cli-kit/dist/private/node/session.js:198-202`):
  it prints `User verification code: …` and `Open this link to start the auth process: <url>`
  (`private/node/session/device-authorization.js:57-60`) when not a TTY or in a cloud environment.
  The URL can be opened on a phone. But in CI (`isCI()`), it throws instead
  (`device-authorization.js:53-55`), so run it from a real terminal or non-CI shell, not the minion sandbox.
- cli-kit also supports a token from the environment (`SHOPIFY_APP_AUTOMATION_TOKEN`,
  `cli-kit/dist/public/node/session.js:78-86`; `SHOPIFY_CLI_PARTNERS_TOKEN` in `constants.js`).
  I did not verify that either works with Shop Minis, so don't rely on them.

**Which Partner permission it needs.**
- `check-submission` needs no Partner permission itself. It needs only a valid key for that Mini.
- The CLI source does not name a permission for creating the key. The check is server side
  (`apiKeyGenerate` takes a `partnersAccessToken`: `data/api-keys/api-keys-generate.js:3-14`).
  The person must be in the Partner organization that owns the Mini, with access to it. The minimum
  role is **unknown from the code**; confirm on partners.shopify.com.

**Is check-submission read only? Yes.**
- It sends one GraphQL **query** `Submissions(first: 10)` (`build/data/get-submissions.js:4-26`).
  It then only renders output (`check-submission/index.js:21-56`). Writes are in `submit` and
  `cancel-submission` (`data/create-submission.js`, `data/cancel-submission.js`).
- Side effect: loading the CLI creates `.minis-cache/` in the current directory (`config.js:92-97`;
  gitignored).
- The key is not read-only by scope: the same bearer token is used by `submit` / `cancel-submission`.
  Keep it out of any agent environment that could run those.

## Smallest one-time step for a host-side factory command

A person, once, on a machine with a browser (Mitch's laptop or the host), in the tea-picker checkout:

1. `npx shop-minis setup --regenerate-key`. Log in via the printed link or code, using an account in
   the Partner org that owns the Mini. This writes `SHOP_MINIS_API_KEY` to that checkout's `.env`.
   (`manifest.json` already has the uuid and handle, so this goes down the regenerate path.)
   It first calls `logout()` (`setup/index.js:352`) and replaces any existing key.
2. Keep that `.env` on the host, outside any worktree or the sandbox.

After that, the factory runs `cd <host tea-picker checkout> && npx shop-minis check-submission`
on the host, with no login. It is expected to print `Status: …`, the description, `Reference: …` (compare
with Z7KQ1W) and the submit date. Do not use the `--regenerate-key` form again unless the key is revoked.
The factory command should call only `check-submission` (never `submit`/`cancel-submission`).

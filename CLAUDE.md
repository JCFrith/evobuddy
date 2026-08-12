## GitHub, Vercel, and Supabase Delivery Architecture

Use GitHub, Vercel, and Supabase together.

### Responsibilities

GitHub is the source of truth for:

- Application source code
- Supabase migrations
- Supabase configuration
- Seed data
- Tests
- Documentation
- 3D asset manifests
- CI configuration

Vercel is responsible for:

- Hosting the Next.js application
- Hosting the Progressive Web App
- Running Server Components
- Running Server Actions
- Running Route Handlers
- Handling trusted authentication endpoints
- Validating games
- Advancing pet simulation
- Processing XP and evolution
- Creating Preview deployments
- Deploying Production from the main branch
- Managing scoped environment variables

Supabase is responsible for:

- Application user authentication
- Persistent sessions
- PostgreSQL data
- Row Level Security
- Avatar state
- XP history
- Game history
- Evolution history
- Account recovery records
- Optional storage of versioned 3D models, textures, and environment assets

Do not require application users to have GitHub or Vercel accounts.

Do not use Vercel Authentication as the application’s nickname-and-PIN login system. Vercel Authentication may be used only to protect development, staging, or Preview deployments.

Continue using Supabase Auth for application users.

### Nickname-and-PIN Request Flow

The visible login form contains:

- Login nickname
- Numeric PIN

The login request must be sent to a trusted Vercel server endpoint.

The Vercel endpoint must:

1. Normalize the nickname.
2. Rate-limit the request.
3. Generate the internal authentication alias using a server-only HMAC secret.
4. Authenticate against Supabase Auth.
5. Establish a secure cookie-based session using the current official Supabase SSR package.
6. Return only the safe application session result.
7. Never return the internal authentication alias.
8. Never log the PIN.
9. Never expose Supabase server secrets.

Supabase remains the authoritative identity provider and database authorization layer.

### GitHub Workflow

Create a GitHub repository with:

- A protected `main` branch
- Feature branches
- Pull-request-based changes
- Required CI checks
- Versioned Supabase migrations
- A committed package lockfile
- Dependabot configuration
- A code ownership file where useful

Create `.github/workflows/ci.yml`.

CI must run:

- Dependency installation using the lockfile
- Linting
- Type checking
- Unit tests
- Integration tests
- Production build
- Security-sensitive configuration checks

Run Playwright end-to-end tests in an appropriate separate workflow.

Do not place application secrets in the repository.

### Vercel Git Integration

Connect the GitHub repository directly to Vercel.

Configure:

- Pull requests and non-production branches as Preview deployments
- `main` as the Production branch
- Automatic Production deployment after an approved merge
- Preview deployment protection
- Fork deployment protection
- Separate Development, Preview, and Production environment variables
- Production deployment only after required GitHub checks pass

Every pull request must receive a unique Vercel Preview URL.

### Supabase Environment Isolation

Never connect Preview deployments to the Production Supabase database.

Use one of the following:

1. Supabase Preview branches synchronized with GitHub and Vercel; or
2. Separate Supabase development, staging, and production projects.

Preferred configuration:

- Local development uses a local Supabase instance or development project.
- Pull requests use isolated Supabase Preview branches.
- Staging uses a persistent staging branch or project.
- Production uses the Production Supabase project.

Preview environments must use fake seed users and synthetic avatar data.

Never copy children’s production data into a Preview environment.

Each environment must have separate:

- Supabase URL
- Supabase publishable key
- Supabase secret key
- Auth alias secret
- Recovery-code secret
- Rate-limit secret
- Application URL
- Redirect URLs

### Vercel Environment Variables

Configure these as public browser variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Configure these as server-only sensitive variables:

- `SUPABASE_SECRET_KEY`
- `AUTH_ALIAS_SECRET`
- `RECOVERY_CODE_SECRET`
- `RATE_LIMIT_SECRET`

Never prefix a server secret with `NEXT_PUBLIC_`.

Never commit `.env`, `.env.local`, Supabase secret keys, database passwords, or HMAC secrets.

Provide only safe placeholders in `.env.example`.

### Database Deployment

Store all database schema changes in:

`supabase/migrations/`

Store safe development seed content in:

`supabase/seed.sql`

Database migrations must:

- Be reviewed in pull requests
- Be tested against an isolated environment
- Pass Supabase security advisors where available
- Preserve existing user progress
- Avoid destructive production operations without an explicit migration plan
- Include Row Level Security policies
- Include rollback or recovery documentation for high-risk changes

Never apply an experimental migration directly to Production.

### Preview Validation

For each pull request:

1. Run GitHub Actions.
2. Create or select an isolated Supabase Preview environment.
3. Apply the branch migrations.
4. Seed synthetic test users.
5. Deploy the application to a Vercel Preview URL.
6. Run smoke tests.
7. Run authentication tests.
8. Run Row Level Security isolation tests.
9. Run avatar persistence tests.
10. Run mobile and desktop checks.
11. Report the Preview URL and test status on the pull request.

### Production Release

Production deployment must occur only after:

- Required GitHub checks pass
- The pull request is approved
- Database migrations are reviewed
- The Preview deployment works
- Row Level Security tests pass
- The production build succeeds

After merging to `main`:

1. Apply approved Production database migrations.
2. Deploy the Production Vercel application.
3. Run post-deployment health checks.
4. Test sign-in.
5. Test one read and one safe write.
6. Verify that no Preview credentials are present.
7. Verify that the service-role or secret key is unavailable to browser code.
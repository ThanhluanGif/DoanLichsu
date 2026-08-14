# Production configuration preflight

Run the preflight before submitting the production handoff manifest:

```bash
npm run production:config:preflight -- --env-file /secure/runtime.env
```

The checker accepts only a real operator-supplied production-shaped environment:
`NODE_ENV=production`, an official HTTPS origin, an absolute database path, a
non-placeholder `SESSION_SECRET` of at least 32 characters, an `APP_VERSION`,
and disabled demo seeding. It rejects localhost/example/tunnel origins,
relative database paths and placeholder secrets.

The report never stores or prints secret values, never writes the database and
always leaves `releaseAllowed=false` and `publicBeta=false`. A passing shape is
only a prerequisite for the existing production handoff and external evidence
validators; it is not an official deployment, uptime observation, security
review, Council sign-off or Public Beta approval.

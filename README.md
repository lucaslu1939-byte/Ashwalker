# Ashwalker

A holistic healing companion app: an AI coach paraphrasing wellness philosophy, plus (in future modules) diet plans, grocery lists, a frequency/breathwork player, and a tracker/journal.

This repo currently contains **Module 1 only**: the AI coach's disclaimer/consent screen, intake conversation, and ongoing chat. See `/root/.claude/plans/i-want-to-build-cozy-sun.md` for the full module plan (context, decisions, architecture, build order).

## Structure

- `app/` — Expo (React Native) mobile app
- `proxy/` — Cloudflare Worker that holds the Anthropic API key and relays chat requests
- `docs/` — disclaimer/consent copy and other reference docs

## Status

Wellness-only positioning — not medical advice. See `docs/disclaimer-text.md`.

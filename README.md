# Typing Games

This is a collection of small web-based games for helping children from age 3+ learn letters and numbers.

## Running

You'll need to install Node packages and run the Next.js dev server:

```bash
npm install
npm run dev
```

## Production Build (Docker)

Build and run as a static site served by nginx:

```bash
make build-prd   # Build Docker image
make start-prd   # Run on port 80 (Ctrl-C to stop)
```

## Todo

- Per game settings
  - Disable speech of word and number
  - Disable pictures for counting (to recognise word)
- Pre-render better AI voice for letters, numbers and words (provide standard wav/mp3/opus downloads so browsers cache)


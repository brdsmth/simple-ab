# SimpleAB

A/B testing platform built with React, Express, and Prisma.

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Setup

1. **Install dependencies**
```bash
npm run install:all
```

2. **Setup database**
```bash
npm run db:push
```

3. **Start the app**
```bash
npm run dev:all
```

4. **Start SDK server and demo site**
```bash
# In separate terminals:
cd sdk && python3 -m http.server 9000
cd test-website && python3 -m http.server 8888
```

The app will be running at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- SDK Server: http://localhost:9000
- Demo site: http://localhost:8888

### First Steps

1. **Create an account** at http://localhost:3000
2. **Create a project** to get your API key
3. **Create an experiment** with variants
4. **Set experiment to RUNNING** status
5. **Add the SDK** to your website:

```html
<script src="http://localhost:9000/dist/simpleab.js"></script>
<script>
  SimpleAB.init({
    apiKey: 'your-api-key-here',
    apiUrl: 'http://localhost:3001/api',
    enableLogging: true
  });
</script>
```

### Variant Configuration

Variants support flexible modifications:

```json
{
  "selector": "#my-button",
  "style": {
    "background-color": "#ff0000",
    "color": "white"
  },
  "text": "New Button Text"
}
```

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + TypeScript + Prisma
- **Database**: SQLite (development) / PostgreSQL (production)
- **SDK**: Vanilla JavaScript for client-side integration

## Development

- `npm run dev:all` - Start frontend and backend
- `npm run db:push` - Update database schema
- `npm run db:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint

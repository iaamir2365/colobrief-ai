# ColoBrief AI

An AI-powered Ulcerative Colitis symptom tracking and analysis platform built for FutureAI Global Hackathon 2026.

## Inspiration

I am a solo developer. I had  no venture capital, and no massive engineering team. I built this entire prototype using "AI-assisted development"—pairing raw human empathy with modern AI intelligence.

I wanted to build something that respects a patient’s energy. When you are in the middle of a painful flare, you do not have the strength to type into complex databases or slide virtual meters. With ColoBrief AI, you don't have to.

You simply click a button and speak. You tell the app how your day was in your own words, with all your vulnerability and raw emotion.

The AI does the rest. It listens, gets the context of your voice, automatically populates the clinical metrics, and formats your daily struggles into a beautifully structured, doctor-ready SBAR report. It acts as a "Clinical Translator"—taking your human voice and translating it into the precise medical language your gastroenterologist needs to provide safer, more accurate care.

Why this Matters:

This is a prototype, yes. But it is a prototype that proves the future of healthcare doesn't belong to corporate giants—it belongs to patients who refuse to let others suffer the way they did.

By utilizing the power of AI-assisted development, I was able to turn my own personal pain into a working, full-stack application designed to restore dignity, ease, and safety to millions of patients managing chronic gut illness worldwide.

ColoBrief AI is a bridge between the quiet struggles of a patient at home and the busy clinical world of a doctor. It is my story, but it is built to help write better, healthier futures for everyone fighting UC.

## What ColoBrief AI does

- **Symptom Logging**: Track daily UC symptoms including pain level, stool frequency, stool type, stress level, and more
- **Voice Input**: Click a button and speak your day's experience in your own words
- **AI-Powered Extraction**: AI automatically extracts clinical metrics from your natural language
- **AI-Powered Analysis**: Get insights and clinical summaries using GLM-4.7-Flash
- **Doctor Handout Generation**: Generate printable SBAR-format clinical summaries for consultations
- **Trend Visualization**: View symptom trends and patterns over time
- **Email Verification**: Secure authentication with email verification
- **Dark Mode Support**: Beautiful dark and light theme
- **Mobile-Friendly**: Responsive design for all devices

## How I built it

- **Framework**: Next.js 16
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Database**: Prisma ORM + SQLite
- **AI**: ZhiPu GLM-4.7-Flash API
- **Email**: Mailtrap
- **Authentication**: JWT

## Challenges I ran into

- Building a complex app solo with limited time
- Integrating AI models smoothly into the workflow
- Designing an intuitive user interface that respects patient energy levels during flares
- Ensuring clinical accuracy while maintaining a compassionate user experience

## Accomplishments that we're proud of

- Building a full-stack prototype completely solo with AI-assisted development
- Creating a voice-first interface that's easy to use even during painful flares
- Generating clinically structured SBAR reports from natural language
- Making a tool that could truly help other patients like me

## What I learned

- AI-assisted development is incredibly powerful for solo builders
- Patients' needs should be at the center of healthcare design
- Simplicity is key—especially for users with limited energy
- Voice-first interfaces can make a huge difference in accessibility

## What's next for ColoBrief AI

- Add more advanced symptom trend analysis
- Integrate with wearable devices for additional data
- Support more chronic health conditions
- Add patient-doctor messaging features
- Build mobile apps for iOS and Android
- Improve AI accuracy and personalization

## Getting Started

### Prerequisites

- Node.js 18+
- Bun or npm
- Mailtrap account (for email verification)
- ZhiPu API key (for AI features)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd workspace-8bdfb114-3a7c-44a1-91a0-29142d98c976
```

2. **Install dependencies**

```bash
bun install
# or
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials:

- `ZAI_API_KEY`: Your ZhiPu API key (get from https://open.bigmodel.cn)
- `MAILTRAP_TOKEN`: Your Mailtrap API token
- `MAILTRAP_SENDER_EMAIL`: Your Mailtrap sender email
- `JWT_SECRET`: A secure secret key for JWT tokens

4. **Set up the database**

```bash
bun run db:generate
bun run db:push
```

5. **Run the development server**

```bash
bun run dev
```

Open http://localhost:3000 to view the app.

## Project Structure

```
├── src/
│   ├── app/              # Next.js App Router pages & API routes
│   ├── components/       # React components
│   │   ├── colobrief/    # Project-specific components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utility functions (auth, db, email, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand state management
│   └── types/            # TypeScript type definitions
├── prisma/               # Prisma schema
├── public/               # Static assets
└── download/             # Project screenshots
```

## Available Scripts

- `bun run dev`: Start development server on port 3000
- `bun run build`: Build for production
- `bun run start`: Start production server
- `bun run lint`: Run ESLint
- `bun run db:generate`: Generate Prisma client
- `bun run db:push`: Push schema changes to database
- `bun run db:migrate`: Create and apply database migrations
- `bun run db:reset`: Reset the database

## Screenshots

Check out the `download/` directory for detailed screenshots of the app in action!

## FutureAI Global Hackathon 2026

This project was built for the FutureAI Global Hackathon 2026. Learn more at [https://futureai.lokeshloki.in](https://futureai.lokeshloki.in).

### Tracks

- 🤖 AI Agents & Automation
- 🎨 Generative AI
- 🏥 Healthcare AI
- 📚 Education AI
- ⚡ Productivity AI
- 🌱 Sustainability AI
- 🌍 Open Innovation

## License

MIT

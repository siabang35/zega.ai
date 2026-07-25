# ZEGA AI — Enterprise Autonomous Agent Orchestration Platform

![ZEGA AI Banner](https://img.shields.io/badge/ZEGA.AI-Enterprise%20Platform-ff6b35?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38BDF8?style=for-the-badge&logo=tailwindcss)

**ZEGA AI** is a state-of-the-art enterprise landing page and dashboard designed for autonomous agent orchestration, real-time analytics, and high-performance workflow automation.

---

## 🌟 Key Features & Visual Engineering

- **Rotating Border Beam Animations**: Enterprise feature cards with continuous rotating conic-gradient beam effects (`conic-gradient`, `spin-beam`).
- **Proportional Liquid Water Wave Filling CTA**: Dynamic dual-layer SVG water wave filling animation with vibrant ZEGA gradient tones.
- **Interactive Agent Orchestration Orbit**: Dynamic orbit ring visualization representing autonomous AI agents in real-time execution.
- **Real-Time Analytics & Chart.js Integration**: Interactive analytics panels powered by Chart.js (Visitor Overview, Utilization, Performance Metrics).
- **Seamless Light & Dark Mode**: Adaptive color tokens providing maximum reading comfort in both Light and Dark themes.
- **Fully Responsive Architecture**: Fluid layout scaling from mobile viewports to ultra-wide desktop displays.

---

## 🛠️ Technology Stack

- **Core**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), Vanilla CSS Keyframe Animations
- **Visualizations**: [Chart.js](https://www.chartjs.org/) + `react-chartjs-2`
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Deployment

### Deploy to Vercel

This repository includes a pre-configured `vercel.json` for instant 1-click deployment on [Vercel](https://vercel.com).

#### Option A: Vercel CLI
```bash
npm i -g vercel
vercel
```

#### Option B: Vercel Dashboard
1. Push your code to GitHub / GitLab / Bitbucket.
2. Import the project in Vercel.
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy**.

---

## 📁 Project Structure

```
ZEGA/
├── src/
│   ├── app/
│   │   └── App.tsx           # Main ZEGA AI Application & Components
│   ├── styles/
│   │   └── globals.css       # Design System Tokens & Keyframe Animations
│   └── main.tsx              # React Entrypoint
├── public/                   # Static Assets
├── package.json              # Dependencies & Scripts
├── tsconfig.json             # TypeScript Configuration
└── README.md                 # Documentation
```

---

## 📄 License

Copyright © 2026 ZEGA AI. All rights reserved.
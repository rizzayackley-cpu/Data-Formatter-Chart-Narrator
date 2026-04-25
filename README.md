# Data Formatter & Chart Narrator

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Recharts](https://img.shields.io/badge/Charts-Recharts-8884d8)](https://recharts.org/)

A practical web app for **data cleaning, visualization, comparison, and insight generation**.  
Upload your file, configure fields, and get chart + metric + summary outputs in one workflow.

---

## Why This Project

- Fast onboarding: upload CSV/Excel and start analyzing right away.
- Clear workflows: supports both **Chart Analysis** and **Data Analysis**, each with **Single** and **Compare** modes.
- Explainable outputs: combines charts, metric tables, and narrative insights.
- Extensible architecture: built around `datasets[]` and isolated view states for future multi-dataset scenarios.

---

## Key Features

- **File Import**
  - Supports `.csv`, `.xlsx`, `.xls`
- **Data Processing**
  - Data preview + cleaning flow
  - Schema inference for numeric/date/categorical/text fields
- **Chart Analysis**
  - Single chart mode (configuration + preview + insights)
  - Compare mode (independent left/right chart configuration)
- **Data Analysis**
  - Field profiling and grouped aggregation
  - Metric-driven data comparison (delta, % change, structure, trend)
- **UX & Reliability**
  - Empty/error/incompatible state handling
  - Language switching (Chinese / English)

---

## Demo / Screenshots

> Add screenshots for better GitHub homepage presentation.

- `docs/images/workbench-overview.png`
- `docs/images/chart-compare.png`
- `docs/images/data-compare.png`

If you do not have screenshots yet, keep this section as a TODO.

---

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Start development server

```bash
npm run dev
```

Open the local URL shown in terminal (usually `http://localhost:5173/`).

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build (optional)

```bash
npm run preview
```

---

## Typical Usage

1. Upload a CSV/Excel file (or load sample data).
2. Switch analysis target and mode in the top-left controls.
3. Configure `X`, `Y`, `Group`, and chart type.
4. Review charts, metrics, and insights.
5. Export outputs for reporting or downstream processing.

---

## Project Structure

```text
src/
  app/
    components/       # Shared UI/business components
    context/          # DataContext / LanguageContext
    domain/           # Business rules + metric computation
    pages/
      Workbench.tsx   # Unified workspace entry
      workbench/
        panels/       # Four major analysis views
        hooks/        # Panel-level derived logic
```

---

## Tech Stack

- React 18
- TypeScript
- Vite
- Recharts
- shadcn/ui + Tailwind CSS
- PapaParse + xlsx

---

## FAQ

### PowerShell blocks npm commands on Windows

Run this in the current shell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```

### Why is my chart not rendering?

Most common reasons:

- Missing valid `X`/`Y` field mapping
- `Y` field is not numeric
- Dataset becomes empty after cleaning/filtering
- Selected fields are incompatible with current chart type

The app provides explicit state messages for these cases.

---

## Roadmap (Suggested)

- More advanced narrative summary engine by chart type
- Multi-dataset join-key based comparison
- Plugin-style metric definitions for easier extension

---

## Contributing

Issues and pull requests are welcome.  
Please keep changes incremental and include verification steps in your PR description.

---

## License

Add your license here 

  


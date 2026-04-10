# TaskFlow — Kanban Dashboard

A lightweight, zero-dependency Kanban board for managing tasks across four stages: **To Do**, **In Progress**, **Done**, and **Blocked**.

---

## 📁 Project Structure

```
my-web-project/
│
├── index.html          # Main HTML structure & layout
├── style.css           # All styles, theming, and responsive layout
├── script.js           # App logic (tasks, search, filter, drag & drop, modals)
│
├── assets/
│   ├── images/         # Illustrations or custom images
│   └── icons/          # Custom SVG/PNG icons
│
├── libraries/          # Third-party libraries (currently none — zero dependencies)
│
└── README.md           # Project documentation
```

---

## 🚀 Getting Started

No build tools or installs required. Just open `index.html` in any modern browser.

```bash
# Clone or download the project, then:
open index.html
```

---

## ✨ Features

- **4-column Kanban board** — To Do, In Progress, Done, Blocked
- **Drag & drop** — Move cards between columns
- **Add / Edit / Delete tasks** — Via modal form
- **Priority levels** — Low, Medium, High with color-coded badges
- **Due date tracking** — Highlights overdue and upcoming tasks
- **Search** — Live filter by title or description (`Ctrl+K` to focus)
- **Priority filter** — Filter all cards by priority level
- **Stats bar** — Summary of total, completed, high-priority, and overdue tasks
- **Persistent storage** — Tasks saved to `localStorage`
- **Responsive** — 4-column → 2-column → 1-column on smaller screens

---

## 🎨 Theming

All colors are defined as CSS custom properties in `style.css` under `:root`. To change the theme, edit the variables at the top of the file:

```css
:root {
  --bg: #0d0d0f;
  --accent: #c8ff57;   /* Primary accent color */
  /* ... */
}
```

---

## 🗂️ Assets

- **`assets/images/`** — Place any illustrations or background images here
- **`assets/icons/`** — Store custom SVG or PNG icons here; inline SVGs are currently used throughout the UI

---

## 📦 Libraries

Currently uses **no third-party libraries**. The only external dependency is Google Fonts (loaded via CDN in `index.html`):

- [Syne](https://fonts.google.com/specimen/Syne) — headings & labels
- [DM Sans](https://fonts.google.com/specimen/DM+Sans) — body text

To add a library, drop the file into the `libraries/` folder and link it in `index.html`.

---

## 🛠️ Customisation

| What | Where |
|---|---|
| Add a new column | `index.html` + add to `COLS` array in `script.js` |
| Change default seed tasks | `seedTasks()` in `script.js` |
| Adjust date warning thresholds | `formatDue()` in `script.js` |
| Modify card layout | `cardHTML()` in `script.js` + `style.css` |

---

## 📄 License

MIT — free to use and modify.

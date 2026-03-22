# The Archive — 3D Portfolio Library

A first-person browser-based 3D library where each book on the shelves represents a GitHub repository from **AlistairBishop06**.

## Running Locally

You need a simple HTTP server (browsers block `fetch` on `file://` URLs).

### Option 1 — Python (built-in)
```bash
cd library-portfolio
python3 -m http.server 8080
# Open http://localhost:8080
```

### Option 2 — Node `serve`
```bash
npx serve .
```

### Option 3 — VS Code Live Server
Right-click `index.html` → **Open with Live Server**

---

## Controls

| Key | Action |
|-----|--------|
| `W / A / S / D` | Move |
| `Mouse` | Look around |
| `Click` | Pick up a book you're looking at |
| `E` | Check out book at the desk (opens repo in new tab) |
| `ESC` | Release pointer lock |

---

## Structure

```
library-portfolio/
├── index.html   — HTML shell, UI overlays, HUD
├── main.js      — All 3D logic (scene, books, player, interaction)
└── README.md
```

## How It Works

1. On load, fetches repos from `https://api.github.com/users/AlistairBishop06/repos`
2. Builds a library room with bookshelves around the walls and a centre island
3. Each repo becomes a book placed deterministically in shelf slots
4. Books are colour-coded by primary language (JavaScript=gold, Python=blue, etc.)
5. Spine texture is generated via HTML Canvas with the repo name
6. First-person WASD + mouse-look movement
7. Raycast detects when you look at a book (within 4 units)
8. Click to pick up — book attaches to camera with gentle bob animation
9. Walk to the CHECKOUT desk and press `E` to open the repo URL
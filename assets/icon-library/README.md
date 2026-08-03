# Full-resolution icon library

This folder preserves the complete source icon collection. These 1024×1024 files are intentionally outside `public/`, so Vite does not copy roughly 140 MB of unused source artwork into every deployment.

The selected interface icons are resized to transparent 128×128 PNGs in `public/assets/icons/ui/`. Their semantic mapping lives in `src/components/common/IconGlyph.tsx`.

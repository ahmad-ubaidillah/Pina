# DESIGN.md — Pina Design Contract

> Kontrak visual & UI/UX untuk semua output frontend Pina.
> Di-lint otomatis oleh `@bacnh85/pi-ux` tiap selesai bikin UI.
> Sumber inspirasi: Leonxlnx/taste-skill, @blackbelt-technology/anti-slop-frontend, nexu-io/open-design, addyosmani/agent-skills.

## 1. Prinsip Anti-Slop (WAJIB)

JANGAN menghasilkan AI slop. Pola BERIKUT DILARANG:
- ❌ Centered card tunggal di tengah layar dengan shadow besar + border-radius 24px.
- ❌ Gradient lembut milky (purple→pink→blue) sebagai background.
- ❌ Emoji dekoratif di mana-mana (🚀✨💡 sebagai pengganti desain).
- ❌ Spacing tidak konsisten (margin acak, tidak pakai scale).
- ❌ Font system default + warna abu-abu datar tanpa hierarki.
- ❌ "Glassmorphism" murahan (blur + transparency tanpa tujuan).
- ❌ Infinite scroll tanpa struktur, atau hero section klise "Build faster with AI".
- ❌ Warna neon/contrast rendah yang sakit mata.

YANG DILAKUKAN:
- ✅ Grid/asimetri yang intentional, bukan centered-card klise.
- ✅ Spacing pakai scale tetap (4/8/12/16/24/32/48px).
- ✅ Hierarki tipografi jelas (size + weight + color, bukan cuma size).
- ✅ Palette terbatas (max 3 warna utama + 1 aksen + neutrals).
- ✅ Setiap elemen punya alasan (fungsi, bukan dekorasi).
- ✅ Micro-interaction subtle, bukan animasi berlebih.

## 2. Palette (default Pina)

Sesuai preferensi brand kamu (Inspyro-style: putih/blue/hitam):
```
--bg:        #ffffff   (white)
--surface:   #f7f8fa   (light gray, bukan abu-abu datar)
--ink:       #0d0d0d   (near-black, bukan pure black)
--primary:   #146ef5   (blue, Inspyro blue)
--accent:    #ff6b35   (pina-orange — satu aksen saja)
--muted:     #6b7280   (neutral text)
--line:      #e5e7eb   (border halus)
```
- Tidak ada gradient sebagai background utama.
- Aksen oranye HANYA untuk 1 elemen interaktif kunci per view.

## 3. Typography
- Font: system-ui stack atau Inter (satu font family, max 2).
- Scale: 12 / 14 / 16 / 20 / 28 / 40px (rasio ~1.25).
- Weight: 400 (body), 500 (label), 600 (subhead), 700 (headline).
- Line-height: 1.5 body, 1.2 headline.

## 4. Spacing Scale (WAJIB pakai ini, jangan acak)
```
--s1: 4px   --s2: 8px   --s3: 12px  --s4: 16px
--s5: 24px  --s6: 32px  --s7: 48px  --s8: 64px
```
- Padding container: --s6 (32px) minimal.
- Gap antar-card: --s4 (16px).
- Section margin: --s7 (48px).

## 5. Components
- **Card**: radius 12px, border 1px `--line`, NO big shadow. Hover: border jadi `--primary`.
- **Button**: radius 8px, padding --s3 --s4, weight 600. Primary = `--primary` bg + white text. Secondary = transparent + `--ink` border.
- **Input**: radius 8px, border 1px `--line`, focus = border `--primary` + ring 2px transparent-blue.
- **Badge/Status**: dot + label, bukan pill berwarna lebar.
- **Kanban column**: header sticky, minimal 3 kolom (TODO / DOING / DONE), lebar min 280px.

## 6. Layout
- Max content width: 1200px, centered dengan margin auto (bukan card centered).
- Grid 12-kolom untuk dashboard, gap --s4.
- Mobile: single column, stack.
- TIDAK ada full-screen modal tanpa escape.

## 7. Motion
- Transition: 150ms ease-out (bukan 500ms bounce).
- Hanya untuk: hover state, panel open/close, status change.
- TIDAK ada autoplay, TIDAK ada parallax.

## 8. Dark mode (opsional)
- bg #0d0d0d, surface #1a1a1a, ink #f7f8fa, primary tetap #146ef5, accent #ff6b35.
- Contrast ratio minimal 4.5:1.

## 9. Check-list pre-DONE (jalankan sebelum mark task selesai)
- [ ] Palette hanya pakai token di atas (tidak ada warna hardcoded aneh).
- [ ] Spacing pakai scale (tidak ada margin acak).
- [ ] Tidak ada centered-card klise / gradient milky / emoji dekoratif.
- [ ] Hierarki tipografi jelas (size+weight+color).
- [ ] Butuh di-lint oleh `@bacnh85/pi-ux` → harus lulus.
- [ ] Responsif (mobile stack, desktop grid).

## 10. Reference repos
- Leonxlnx/taste-skill — good taste, stop generic slop.
- @blackbelt-technology/anti-slop-frontend — mechanical checklist.
- nexu-io/open-design — coding agent as design engine.
- @bacnh85/pi-ux — lintable DESIGN.md + deterministic review.

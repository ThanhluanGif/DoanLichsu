# C-006 browser interaction proof

- Date: 2026-08-07
- Target: production standalone at `http://127.0.0.1:3006`
- Browser: Codex in-app Chromium browser
- Responsive viewports: desktop `1440×1000`; mobile `390×844`

## Screenshots

- `desktop-search.png` — filtered Vietnamese search at 1440×1000. The URL and controls hold `q=dien bien phu`, `type=EVENT`, and `period=chien-tranh-gianh-doc-lap-va-thong-nhat`; the first result is `Chiến dịch Điện Biên Phủ`.
- `mobile-detail.png` — Vietnamese Điện Biên Phủ detail at 390×844, including responsive navigation, heading, copy-link control, locale link, and fact list without horizontal overflow.

## Keyboard-only focus path

The browser focus pass covered skip link → primary navigation → search textbox/type/period/submit → timeline period/apply/detail → detail copy/source/related. Every target is a native `A`, `INPUT`, `SELECT`, or `BUTTON`, participates in sequential navigation with `tabIndex=0`, and showed the same visible `3px solid` accent outline when focused. The observed first home targets were skip link, home, timeline, discovery, sources, search, and locale switch, in that order. No pointer activation was used for this focus pass.

The five runtime pages in `axe-runtime.json` also report `0` Critical/Serious findings. Together these checks confirm the keyboard-only path and visible focus treatment across home, filter, timeline, detail, source, and related content.

## Back/forward URL state

Two search history entries were created through the real form:

1. `?q=dien+bien+phu&type=EVENT&period=chien-tranh-gianh-doc-lap-va-thong-nhat&sort=`
2. `?q=dien+bien+phu&type=EVENT&period=&sort=`

After Back, the URL and live controls restored `q=dien bien phu`, `type=EVENT`, and `period=chien-tranh-gianh-doc-lap-va-thong-nhat`; the first result remained `Chiến dịch Điện Biên Phủ`. After Forward, the URL and controls restored the empty period with the same query/type and first result.

This run exposed and repaired a native-form history mismatch: the URL returned to the period-filtered state while the browser-restored select retained the later value. `SearchForm` now performs client navigation with controlled values, and `SearchResultsPage` remounts the form for each URL state.

## Copy link and locale edge

On `/vi/su-kien/chien-dich-dien-bien-phu`, activating `Sao chép liên kết` changed the button label to `Đã sao chép`; clipboard text exactly equalled the current canonical browser URL:

`http://127.0.0.1:3006/vi/su-kien/chien-dich-dien-bien-phu`

The VI detail exposes `/en/events/battle-of-dien-bien-phu` for the same published record. The MiG-21 fixture at `/vi/hien-vat/may-bay-mig-21-4324` renders `Bản tiếng Anh của nội dung này chưa được xuất bản.` and exposes no English link.

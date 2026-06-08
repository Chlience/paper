# Design

## Overview

Chlience Paper Archive is a static Astro research archive. The visual system is restrained, high-contrast, and index-first: it should support scanning paper metadata, then disappear during long reading.

## Color

- `--bg`: neutral page background with a slight green-blue tint.
- `--surface`: white reading surfaces.
- `--fg`: high-contrast ink for body text.
- `--muted`: secondary text that still clears contrast on light surfaces.
- `--accent`: green signal color for active navigation and provenance actions.
- `--info`: blue support color for systems/research context.
- `--warn`: amber support color for caveats and local interpretation.

Use OKLCH for all authored colors. Avoid warm cream, dark slate monoculture, and decorative gradients.

## Typography

Use a sans stack tuned for mixed Chinese and English reading. Latin text prefers Inter and native system UI faces; Simplified Chinese falls back through Noto Sans SC, Source Han Sans SC, PingFang SC, Microsoft YaHei, and WenQuanYi Micro Hei. Keep mono only for IDs, dates, source labels, and technical metadata. Headings rely on weight and size contrast rather than exotic fonts. Body prose should remain around 65 to 75 characters per line.

Do not load a full Simplified Chinese webfont by default. The archive has long Chinese notes, so CJK webfont payload size matters more than exact font identity. Revisit this only with measured subsetting or route-specific font loading.

## Layout

The homepage leads with archive purpose and reading commitments, then recent notes and theme routes. Paper list rows should be dense but breathable. Article pages use a two-column layout with a sticky table of contents on desktop and a single column on smaller screens.

## Components

- `SiteHeader`: compact sticky navigation with clear active state.
- `PaperRow`: dense row for comparing notes; date, title, summary, authors, source, and a small number of tags.
- `Article page`: title header, metadata row, sticky TOC, and long-form prose.
- `Theme routes`: topic entry points, not decorative cards.

## Motion

Use small, direct transitions for hover and focus states. Do not hide content behind reveal animations. Respect `prefers-reduced-motion`.

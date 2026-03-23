# Regtransfers Keycloak Theme

A custom Keycloak login and email theme for **regtransfers.co.uk**, matching the brand's visual identity:

| Colour | Hex | Usage |
|--------|-----|-------|
| Yellow / Gold | `#F5C100` | Logo, accents, number-plate styling |
| Dark Navy | `#1a3060` | Logo text, borders |
| Charcoal | `#1a1a1a` | Page background (matches site header) |
| Card Dark | `#242424` | Login card background |
| Green | `#2d8653` | Primary CTA buttons (matches site "View" buttons) |
| Blue | `#4899cc` | Section headings |

---

## File Structure

```
themes/
└── regtransfers/
    ├── login/
    │   ├── theme.properties          ← Extends keycloak, loads CSS
    │   ├── template.ftl              ← Page shell with logo + footer
    │   ├── login.ftl                 ← Login form
    │   └── resources/
    │       ├── css/
    │       │   └── regtransfers.css  ← Brand overrides
    │       └── img/
    │           └── logo.svg          ← Regtransfers logo (SVG)
    └── email/
        ├── theme.properties
        └── messages/
            └── messages_en.properties  ← Branded email subjects & HTML bodies
META-INF/
└── keycloak-themes.json              ← Theme manifest for JAR deployment
README.md
```

---

## Development Setup

### Option 1 — Directory deployment (fastest for development)

1. Copy the `themes/regtransfers` folder into the Keycloak `themes/` directory:
   ```
   $KEYCLOAK_HOME/themes/regtransfers/
   ```

2. Start Keycloak with theme caching disabled so you can edit files live:
   ```bash
   bin/kc.sh start-dev \
     --spi-theme--static-max-age=-1 \
     --spi-theme--cache-themes=false \
     --spi-theme--cache-templates=false
   ```

3. In the Admin Console → **Realm Settings** → **Themes**:
   - **Login Theme** → `regtransfers`
   - **Email Theme** → `regtransfers`

4. Open your realm's login page to preview.

> **Remember:** Re-enable caching before going to production — uncached themes have a significant performance cost.

### Option 2 — JAR deployment (recommended for production)

1. Create a JAR archive containing:
   ```
   META-INF/keycloak-themes.json
   theme/regtransfers/...
   ```

   Using Maven or the command line:
   ```bash
   jar cf regtransfers-theme.jar META-INF/ theme/
   ```

2. Drop `regtransfers-theme.jar` into `$KEYCLOAK_HOME/providers/`.

3. Restart Keycloak.

---

## Customising Further

| File | What to change |
|------|---------------|
| `login/resources/img/logo.svg` | Replace with production logo or update SVG colours |
| `login/resources/css/regtransfers.css` | Adjust `:root` CSS variables at the top of the file |
| `template.ftl` | Change footer links, add analytics scripts |
| `login.ftl` | Modify login form structure |
| `email/messages/messages_en.properties` | Update email copy or HTML templates |

### Quick colour change

All colours are defined as CSS custom properties at the top of `regtransfers.css`:

```css
:root {
  --rt-yellow:      #F5C100;
  --rt-navy:        #1a3060;
  --rt-charcoal:    #1a1a1a;
  --rt-card:        #242424;
  --rt-green:       #2d8653;
  --rt-green-hover: #1f6b40;
  --rt-blue:        #4899cc;
}
```

---

## Keycloak Compatibility

Tested structure targets **Keycloak 22+** (PatternFly 4 & PatternFly 5 selectors both covered).

For older versions (< v21) set `parent=keycloak` in `theme.properties` (already set) and also ensure `import=common/keycloak` is present.

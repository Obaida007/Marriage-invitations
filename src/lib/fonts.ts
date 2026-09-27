/**
 * Self-hosted fonts (Fontsource). Each CSS file declares @font-face rules split
 * by unicode-range, so browsers only download the subsets and families a page
 * actually uses. Self-hosting avoids fetching Google Fonts at build/dev time,
 * which breaks Turbopack when Google serves `/l/font?kit=…&…` URLs.
 *
 * The `--f-*` variables that point at these families live in globals.css.
 */
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "@fontsource/aref-ruqaa/400.css";
import "@fontsource/aref-ruqaa/700.css";
import "@fontsource/reem-kufi/400.css";
import "@fontsource/reem-kufi/600.css";
import "@fontsource/el-messiri/400.css";
import "@fontsource/el-messiri/600.css";
import "@fontsource/lateef/400.css";
import "@fontsource/lateef/700.css";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/rakkas/400.css";
import "@fontsource/mirza/400.css";
import "@fontsource/mirza/600.css";
import "@fontsource/scheherazade-new/400.css";
import "@fontsource/scheherazade-new/700.css";
import "@fontsource/noto-kufi-arabic/400.css";
import "@fontsource/noto-kufi-arabic/600.css";
import "@fontsource/almarai/300.css";
import "@fontsource/almarai/400.css";
import "@fontsource/almarai/700.css";
import "@fontsource/changa/400.css";
import "@fontsource/changa/600.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/great-vibes/400.css";

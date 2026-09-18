/**
 * Keeps the visitor's place when they switch language.
 *
 * The EN and RU versions of a page have the same sections but different
 * heights (Russian runs longer), so a raw scrollY would land in the wrong
 * place. Instead we remember *which* section the top of the viewport is in and
 * how far into it (0–1), and the other page scrolls to the same point.
 */

const KEY = "ay:language-scroll";
/** A saved position older than this is ignored (e.g. a stale tab). */
const MAX_AGE_MS = 30_000;

type SavedPosition = {
  path: string;
  index: number;
  ratio: number;
  bottom: boolean;
  t: number;
};

const normalise = (path: string) => path.replace(/\/+$/, "") || "/";

/** Called right before navigating to `targetPath` in the other language. */
export function rememberScrollFor(targetPath: string) {
  try {
    const y = window.scrollY;
    if (y <= 0) return;

    const root = document.documentElement;
    const bottom = y + window.innerHeight >= root.scrollHeight - 2;

    let index = -1;
    let ratio = 0;
    document.querySelectorAll("section").forEach((section, i) => {
      const top = section.getBoundingClientRect().top + y;
      if (top <= y + 1) {
        index = i;
        ratio = (y - top) / Math.max(section.offsetHeight, 1);
      }
    });

    const saved: SavedPosition = {
      path: normalise(targetPath),
      index,
      ratio,
      bottom,
      t: Date.now(),
    };
    sessionStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Private mode / storage disabled: the switch still works, from the top.
  }
}

/**
 * Inline script for the end of <body>. It runs while the static HTML is being
 * parsed — before hydration and before first paint — so the page opens at the
 * right place instead of flashing the hero first. It re-aligns once more when
 * web fonts and images have loaded, unless the visitor has scrolled since.
 */
export const restoreScrollScript = `(function(){try{
var raw=sessionStorage.getItem(${JSON.stringify(KEY)});if(!raw)return;
sessionStorage.removeItem(${JSON.stringify(KEY)});
var s=JSON.parse(raw),norm=function(p){return p.replace(/\\/+$/,"")||"/"};
if(!s||s.path!==norm(location.pathname)||Date.now()-s.t>${MAX_AGE_MS})return;
var root=document.documentElement;
function target(){
if(s.bottom)return root.scrollHeight;
var sec=document.querySelectorAll("section")[s.index];if(!sec)return 0;
return sec.getBoundingClientRect().top+window.scrollY+s.ratio*sec.offsetHeight;}
function go(){var b=root.style.scrollBehavior;root.style.scrollBehavior="auto";
window.scrollTo(0,target());root.style.scrollBehavior=b;return window.scrollY;}
var at=go();
function fix(){if(Math.abs(window.scrollY-at)<2)at=go();}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fix);
window.addEventListener("load",fix,{once:true});
}catch(e){}})();`;

"use client";

import { useEffect, useState } from "react";

// Gate diagnostics in production builds. To enable in prod for debugging,
// set `NEXT_PUBLIC_RUNTIME_DIAGS=true` in your environment.
const IS_PRODUCTION = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_RUNTIME_DIAGS !== 'true';

export default function RuntimeDiagnostics() {
  if (IS_PRODUCTION) return null;
  const [mounted, setMounted] = useState(false);
  const [visibleBadScripts, setVisibleBadScripts] = useState<string[]>([]);
  const [visibleBadLinks, setVisibleBadLinks] = useState<string[]>([]);
  const [visibleSuspicious, setVisibleSuspicious] = useState<string[]>([]);
  const [visiblePreloads, setVisiblePreloads] = useState<{ outer: string; as: string | null; href: string }[]>([]);

  useEffect(() => {
    setMounted(true);

    try {
      const origin = window.location.origin;
      const path = window.location.pathname;
      const currentUrl = origin + path;

      // Diagnostic scans
      try {
        const badScripts = Array.from(document.scripts).filter((s) => s.src && (s.src === currentUrl || s.src === path));
        if (badScripts.length) {
          setVisibleBadScripts(badScripts.map((s) => s.outerHTML));
          badScripts.forEach((s) => s.parentElement?.removeChild(s));
        }

        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
        const badLinks = links.filter((l) => l.href && (l.href === currentUrl || l.href === path));
        if (badLinks.length) {
          setVisibleBadLinks(badLinks.map((l) => l.outerHTML));
          badLinks.forEach((l) => l.parentElement?.removeChild(l));
        }

        const suspicious: string[] = [];
        Array.from(document.scripts).forEach((s) => {
          if (!s.src) return;
          const url = s.src;
          if (url.startsWith(origin) && !url.includes('/_next/') && !/\.(js|mjs|cjs)$/.test(url)) suspicious.push(s.outerHTML);
        });
        Array.from(document.querySelectorAll('link')).forEach((l) => {
          if (!l.href) return;
          const url = (l as HTMLLinkElement).href;
          if (url.startsWith(origin) && !url.includes('/_next/') && !/\.(css)$/.test(url)) suspicious.push(l.outerHTML);
        });
        if (suspicious.length) setVisibleSuspicious(suspicious);

        const preloads = Array.from(document.querySelectorAll('link[rel="preload"]')).map((l) => ({ outer: l.outerHTML, as: l.getAttribute('as'), href: (l as HTMLLinkElement).href }));
        if (preloads.length) setVisiblePreloads(preloads);
      } catch (e) {
        console.error('[RuntimeDiagnostics] DOM scan error', e);
      }

      // DEV MITIGATION: Observe mutations and remove stylesheet links or style @imports
      try {
        const variants = new Set<string>([currentUrl, path, encodeURI(currentUrl), encodeURI(path), decodeURI(currentUrl), decodeURI(path)]);

        function isBadHref(href?: string | null) {
          if (!href) return false;
          try {
            const u = href.startsWith('http') ? href : (origin + (href.startsWith('/') ? href : '/' + href));
            return variants.has(href) || variants.has(u) || variants.has(decodeURI(href));
          } catch { return false; }
        }

        function variantsHasAny(text: string, set: Set<string>) {
          for (const v of set) if (v && text.indexOf(v) !== -1) return true;
          return false;
        }

        function handleNode(n: Node) {
          try {
            if (!(n instanceof Element)) return;
            if (n.tagName === 'LINK') {
              const el = n as HTMLLinkElement;
              if (el.rel === 'stylesheet' && isBadHref(el.href)) {
                console.warn('[RuntimeDiagnostics] Removing stylesheet link that points to current route (mitigation):', el.outerHTML);
                el.parentElement?.removeChild(el);
                return;
              }
              if (el.rel === 'preload' && el.getAttribute('as') === 'style' && isBadHref(el.href)) {
                console.warn('[RuntimeDiagnostics] Removing preload style pointing to route:', el.outerHTML);
                el.parentElement?.removeChild(el);
                return;
              }
            }
            if (n.tagName === 'STYLE') {
              const st = n as HTMLStyleElement;
              const txt = st.textContent || '';
              if (txt.includes('@import') && variantsHasAny(txt, variants)) {
                console.warn('[RuntimeDiagnostics] Removing style element with @import referencing route (mitigation)');
                st.parentElement?.removeChild(st);
                return;
              }
            }
          } catch { /* ignore */ }
        }

        const mo = new MutationObserver((mutations) => {
          for (const m of mutations) {
            for (const n of Array.from(m.addedNodes)) handleNode(n);
          }
        });
        mo.observe(document.head || document.documentElement, { childList: true, subtree: true });

        // scan existing nodes once
        Array.from(document.querySelectorAll('link, style')).forEach((el) => handleNode(el));

        // disconnect after 30s (only for quick mitigation during load)
        const tid = setTimeout(() => { try { mo.disconnect() } catch { } }, 30000);
        return () => { clearTimeout(tid); try { mo.disconnect() } catch { } };
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.error('[RuntimeDiagnostics] error', e);
    }
  }, []);

  // Render nothing until mounted to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <div aria-hidden={false} style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999, fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <details style={{ background: 'rgba(0,0,0,0.75)', color: 'white', padding: 8, borderRadius: 8, maxWidth: 420 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Runtime Diagnostics</summary>
        <div style={{ maxHeight: 360, overflow: 'auto', marginTop: 8 }}>
          {visibleBadScripts.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Scripts apontando para rota:</div>
              {visibleBadScripts.map((s, i) => (
                <pre key={i} style={{ whiteSpace: 'normal', wordBreak: 'break-all', background: 'rgba(255,255,255,0.04)', padding: 6, borderRadius: 4 }}>{s}</pre>
              ))}
            </div>
          )}
          {visibleBadLinks.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Links stylesheet apontando para rota:</div>
              {visibleBadLinks.map((l, i) => (
                <pre key={i} style={{ whiteSpace: 'normal', wordBreak: 'break-all', background: 'rgba(255,255,255,0.04)', padding: 6, borderRadius: 4 }}>{l}</pre>
              ))}
            </div>
          )}
          {visibleSuspicious.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Recursos suspeitos (não _next / sem extensão esperada):</div>
              {visibleSuspicious.map((r, i) => (
                <pre key={i} style={{ whiteSpace: 'normal', wordBreak: 'break-all', background: 'rgba(255,255,255,0.04)', padding: 6, borderRadius: 4 }}>{r}</pre>
              ))}
            </div>
          )}
          {visiblePreloads.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Preloads:</div>
              {visiblePreloads.map((p, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>{p.outer}</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>as: {String(p.as)}</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>href: {p.href}</div>
                </div>
              ))}
            </div>
          )}
          {visibleBadScripts.length === 0 && visibleBadLinks.length === 0 && visibleSuspicious.length === 0 && visiblePreloads.length === 0 && (
            <div style={{ opacity: 0.8 }}>Nenhuma anomalia detectada no DOM.</div>
          )}
        </div>
      </details>
    </div>
  );
}

/**
 * Audit visuel des dialogues d'écriture (lecture seule).
 *
 * - Lance l'app en local si besoin (`npm run dev`, port 8080 par défaut).
 * - Ouvre une fenêtre Chromium VISIBLE et attend que TU te connectes à la main
 *   (détection de l'arrivée sur /dashboard, 5 minutes max).
 * - Mémorise la session dans tools/mobile-audit/.auth/state.json pour les
 *   exécutions suivantes (pas de reconnexion).
 * - Pour chaque dialogue et chaque taille d'écran : capture + 6 mesures.
 * - N'enregistre JAMAIS rien : aucun clic sur Créer / Enregistrer / Confirmer.
 *
 * Usage :
 *   node tools/mobile-audit/dialog-check.mjs                # tous les dialogues
 *   node tools/mobile-audit/dialog-check.mjs reservation    # un seul
 *   APP_URL=http://localhost:8080 node tools/mobile-audit/dialog-check.mjs
 */

import { chromium } from "playwright";
import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const SHOTS = path.join(HERE, "screenshots");
const AUTH = path.join(HERE, ".auth", "state.json");
const BASE = process.env.APP_URL ?? "http://localhost:8080";
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

const VIEWPORTS = [
  { name: "1366x600", width: 1366, height: 600 },
  { name: "1280x720", width: 1280, height: 720 },
  { name: "1024x600", width: 1024, height: 600 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "375x667", width: 375, height: 667 },
  { name: "360x640", width: 360, height: 640 },
];

/**
 * Un dialogue = une page + un bouton d'ouverture + un titre attendu.
 * `mobile: false` quand le bouton n'existe qu'en version bureau.
 */
const DIALOGS = [
  { key: "reservation", route: "/reservations", open: "Nouvelle réservation", title: /réservation/i },
  { key: "paiement", route: "/reservations", open: "Encaisser", title: /Encaisser un paiement/i, optional: true },
  { key: "client", route: "/clients", open: "Nouveau client", title: /client/i, optional: true },
  { key: "biens", route: "/biens", open: "Nouveau bien", title: /bien/i, optional: true },
  { key: "facture", route: "/factures", open: "Nouvelle facture", title: /facture/i, optional: true },
  { key: "depense", route: "/depenses", open: "Nouvelle dépense", title: /dépense/i, optional: true },
  { key: "revenu", route: "/revenus", open: "Ajouter un revenu", title: /revenu/i, optional: true },
  { key: "tache", route: "/taches", open: "Nouvelle tâche", title: /tâche/i, optional: true },
];

const exists = async (p) => {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const isServerUp = async () => {
  try {
    const res = await fetch(BASE, { redirect: "manual" });
    return res.status > 0;
  } catch {
    return false;
  }
};

const startDevServer = async () => {
  if (await isServerUp()) return null;
  console.log(`[audit] démarrage de Vite (${BASE})…`);
  const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], {
    cwd: ROOT,
    stdio: "inherit",
    detached: false,
  });
  for (let i = 0; i < 60; i += 1) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isServerUp()) return child;
  }
  child.kill();
  throw new Error(`Serveur de dev injoignable sur ${BASE}`);
};

/** Mesures demandées : retourne un objet de 6 vérifications. */
const measure = (page) =>
  page.evaluate(() => {
    const dialog = document.querySelector('[data-slot="dialog-content"]');
    if (!dialog) return { error: "dialogue introuvable" };

    const header = dialog.querySelector('[data-slot="dialog-header"]');
    const body = dialog.querySelector('[data-slot="dialog-body"]');
    const footer = dialog.querySelector('[data-slot="dialog-footer"]');

    const rect = dialog.getBoundingClientRect();
    const headerRect = header?.getBoundingClientRect() ?? null;
    const footerRect = footer?.getBoundingClientRect() ?? null;

    const round = (n) => Math.round(n * 10) / 10;
    const scrollables = [dialog, ...dialog.querySelectorAll("*")].filter((el) => {
      const style = getComputedStyle(el);
      const scrollableY = /auto|scroll/.test(style.overflowY);
      return scrollableY && el.scrollHeight - el.clientHeight > 1;
    });

    const primaryButton = footer
      ? [...footer.querySelectorAll("button")].find((b) => !b.disabled) ?? null
      : null;
    const buttonRect = primaryButton?.getBoundingClientRect() ?? null;
    const viewportHeight = window.innerHeight;

    return {
      // 1) le pied touche le bas du dialogue
      footerAtBottom: footerRect ? Math.abs(footerRect.bottom - rect.bottom) <= 1.5 : null,
      // 2) l'en-tête touche le haut du dialogue
      headerAtTop: headerRect ? Math.abs(headerRect.top - rect.top) <= 1.5 : null,
      // 3) le corps défile et lui seul
      bodyScrolls: body ? body.scrollHeight - body.clientHeight > 1 : null,
      scrollableCount: scrollables.length,
      onlyBodyScrolls:
        scrollables.length === 0 ? true : scrollables.every((el) => el === body || el.closest('[data-slot="dialog-body"]')),
      // 4) bouton principal entièrement visible
      primaryVisible: buttonRect
        ? buttonRect.top >= 0 && buttonRect.bottom <= viewportHeight + 0.5
        : null,
      // 5) pas de défilement horizontal
      noHorizontalScroll: document.documentElement.scrollWidth <= window.innerWidth + 1,
      // 6) pas de double barre de défilement (un seul conteneur défilant)
      noDoubleScroll: scrollables.length <= 1,
      dialog: { top: round(rect.top), bottom: round(rect.bottom), height: round(rect.height) },
      viewportHeight,
    };
  });

const run = async () => {
  await mkdir(SHOTS, { recursive: true });
  await mkdir(path.dirname(AUTH), { recursive: true });

  const only = process.argv[2];
  const targets = only ? DIALOGS.filter((d) => d.key === only) : DIALOGS;
  const server = await startDevServer();

  const browser = await chromium.launch({ headless: false });
  const hasState = await exists(AUTH);
  const context = await browser.newContext(
    hasState
      ? { storageState: AUTH, viewport: { width: 1366, height: 600 } }
      : { viewport: { width: 1366, height: 600 } },
  );
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
    if (!page.url().includes("/dashboard")) {
      console.log("──────────────────────────────────────────────────────────────");
      console.log(" CONNEXION REQUISE — la fenêtre Chromium est ouverte.");
      console.log(" Connecte-toi à la main (le script n'écrit aucun identifiant).");
      console.log(` Attente de l'arrivée sur /dashboard : ${LOGIN_TIMEOUT_MS / 60000} minutes max.`);
      console.log("──────────────────────────────────────────────────────────────");
      await page.waitForURL(/\/dashboard/, { timeout: LOGIN_TIMEOUT_MS });
      await context.storageState({ path: AUTH });
      console.log("[audit] session enregistrée dans .auth/state.json");
    }

    const results = [];
    for (const dialog of targets) {
      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${BASE}${dialog.route}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(600);

        const opener = page.getByRole("button", { name: new RegExp(dialog.open, "i") }).first();
        if ((await opener.count()) === 0) {
          results.push({ dialog: dialog.key, viewport: viewport.name, skipped: "bouton d'ouverture absent" });
          continue;
        }
        await opener.click();
        try {
          await page.waitForSelector('[data-slot="dialog-content"]', { timeout: 5000 });
        } catch {
          results.push({ dialog: dialog.key, viewport: viewport.name, skipped: "dialogue non ouvert" });
          continue;
        }
        await page.waitForTimeout(400);

        const metrics = await measure(page);
        const shot = path.join(SHOTS, `${dialog.key}-${viewport.name}.png`);
        await page.screenshot({ path: shot, fullPage: false });
        results.push({ dialog: dialog.key, viewport: viewport.name, screenshot: shot, ...metrics });

        // Fermeture SANS jamais valider : touche Échap (aucune écriture).
        await page.keyboard.press("Escape");
        await page.waitForTimeout(250);
      }
    }

    const reportPath = path.join(HERE, "report.json");
    await writeFile(reportPath, JSON.stringify({ base: BASE, generatedAt: new Date().toISOString(), results }, null, 2));

    const failures = results.filter((r) => !r.skipped && (
      r.footerAtBottom === false ||
      r.headerAtTop === false ||
      r.onlyBodyScrolls === false ||
      r.primaryVisible === false ||
      r.noHorizontalScroll === false ||
      r.noDoubleScroll === false
    ));

    console.log(`\n[audit] ${results.length} combinaisons mesurées, ${failures.length} en échec.`);
    for (const f of failures) {
      console.log(`  ✗ ${f.dialog} @ ${f.viewport} →`, JSON.stringify({
        footerAtBottom: f.footerAtBottom,
        headerAtTop: f.headerAtTop,
        onlyBodyScrolls: f.onlyBodyScrolls,
        primaryVisible: f.primaryVisible,
        noHorizontalScroll: f.noHorizontalScroll,
        noDoubleScroll: f.noDoubleScroll,
      }));
    }
    console.log(`[audit] rapport : ${reportPath}`);
    console.log(`[audit] captures : ${SHOTS}`);
  } finally {
    await browser.close();
    if (server) server.kill();
  }
};

run().catch((error) => {
  console.error("[audit] échec :", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

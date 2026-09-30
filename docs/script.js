// Squad builder: shows who deploys for a given lobby size, with and without the mod.
const SQUAD_SIZE = 5;
// Spawn order used by the game (and the order the mod keeps them in).
const OFFICERS = [
  { name: "Alpha", team: "blue" },
  { name: "Beta", team: "blue" },
  { name: "Charlie", team: "red" },
  { name: "Delta", team: "red" },
];
const ICONS = {
  player: '<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-9 10a9 9 0 0 1 18 0H3Z"/>',
  bot: '<path d="M12 2C6.5 2 3 6 3 11v4l3 2h12l3-2v-4c0-5-3.5-9-9-9ZM6 10h12v3H6v-3Z"/>',
  empty: '<path d="M11 5h2v14h-2zM5 11h14v2H5z"/>',
};

const state = { players: 2, modded: true };
const slotsEl = document.getElementById("slots");
const statusEl = document.getElementById("squad-status");

function slot(kind, title, subtitle) {
  return `<li class="slot ${kind}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[kind === "blue" || kind === "red" ? "bot" : kind]}</svg><b>${title}</b><small>${subtitle}</small></li>`;
}

function render() {
  const bots = state.modded ? Math.min(OFFICERS.length, SQUAD_SIZE - state.players) : 0;
  const empty = SQUAD_SIZE - state.players - bots;
  let html = "";
  for (let i = 1; i <= state.players; i++) html += slot("player", `P${i}`, "Player");
  OFFICERS.slice(0, bots).forEach((o) => { html += slot(o.team, o.name, `${o.team === "blue" ? "Blue" : "Red"} element`); });
  for (let i = 0; i < empty; i++) html += slot("empty", "Empty", "No backup");
  slotsEl.innerHTML = html;
  slotsEl.setAttribute("aria-label", `${state.players} players, ${bots} AI officers, ${empty} empty slots`);
  statusEl.textContent = empty
    ? `${empty} slot${empty > 1 ? "s" : ""} empty`
    : bots ? `${bots} AI officer${bots > 1 ? "s" : ""} deployed` : "Full squad, no bots needed";
}

// Accessible radio group made of buttons (click or arrow keys).
function radioGroup(el, options, isCurrent, pick) {
  el.innerHTML = options.map((o, i) => `<button type="button" role="radio" data-i="${i}">${o.label}</button>`).join("");
  const buttons = [...el.children];
  const sync = () => buttons.forEach((b, i) => {
    const on = isCurrent(options[i]);
    b.setAttribute("aria-checked", on);
    b.tabIndex = on ? 0 : -1;
  });
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) { pick(options[b.dataset.i]); sync(); render(); }
  });
  el.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const i = (buttons.indexOf(document.activeElement) + step + buttons.length) % buttons.length;
    buttons[i].focus();
    buttons[i].click();
  });
  sync();
}

radioGroup(
  document.getElementById("players"),
  [1, 2, 3, 4, 5].map((n) => ({ label: n, value: n })),
  (o) => o.value === state.players,
  (o) => { state.players = o.value; },
);
radioGroup(
  document.getElementById("mode"),
  [{ label: "Vanilla", value: false }, { label: "With mod", value: true }],
  (o) => o.value === state.modded,
  (o) => { state.modded = o.value; },
);
render();

// Copy buttons.
document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = "Copied";
    } catch {
      btn.textContent = "Press Ctrl+C";
      getSelection().selectAllChildren(btn.previousElementSibling);
    }
    setTimeout(() => { btn.textContent = "Copy"; }, 1500);
  });
});

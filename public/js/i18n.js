(function () {
  "use strict";

  const supported = ["pt-BR", "en", "es"];
  let current = "pt-BR";
  let dictionary = {};

  try {
    const saved = localStorage.getItem("bf_lang");
    if (supported.includes(saved)) current = saved;
  } catch (_) {}

  async function setLanguage(lang) {
    current = supported.includes(lang) ? lang : "pt-BR";

    try {
      const response = await fetch("/locales/" + encodeURIComponent(current) + ".json?v=2", {
        cache: "no-store"
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      dictionary = data && typeof data === "object" ? data : {};
    } catch (error) {
      dictionary = {};
      console.error("[Bluffin] Não foi possível carregar o idioma " + current + ".", error);
    }

    document.documentElement.lang = current;
    window.dispatchEvent(new CustomEvent("bluffin:locale-ready", {
      detail: { language: current, loaded: Object.keys(dictionary).length > 0 }
    }));
    return dictionary;
  }

  function apply(root) {
    if (!root || !dictionary || !Object.keys(dictionary).length) return;

    const skip = "script,style,input,textarea,select,option,.pn,.chat-msg-text,.code,.secret,.word,.player-name";
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    const keys = Object.keys(dictionary).filter(Boolean).sort((a, b) => b.length - a.length);
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || parent.closest(skip)) continue;
      let value = node.nodeValue;
      for (const key of keys) {
        if (value.includes(key)) value = value.split(key).join(String(dictionary[key]));
      }
      if (value !== node.nodeValue) node.nodeValue = value;
    }

    root.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(el => {
      const translated = dictionary[el.getAttribute("placeholder")];
      if (translated) el.setAttribute("placeholder", translated);
    });

    root.querySelectorAll("[aria-label]").forEach(el => {
      const oldValue = el.getAttribute("aria-label");
      if (dictionary[oldValue]) el.setAttribute("aria-label", dictionary[oldValue]);
    });
  }

  window.BluffinI18n = {
    setLanguage,
    apply,
    get language() { return current; },
    get loadedKeys() { return Object.keys(dictionary).length; }
  };

  // Carrega a preferência salva no navegador assim que o módulo inicia.
  setLanguage(current);
})();

/* =========================================================
   Content loading, rendering and language switching.
   Every string and image on the page comes from data/*.json.
   Empty values are skipped, and a section with nothing in it
   stays hidden — so filling a blank field in the JSON is all
   it takes to make that part of the page appear.
   ========================================================= */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var STORAGE_KEY = "rs-lang";
  var state = { site: null, projects: [], lang: "en" };

  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return (o === null || o === undefined) ? o : o[k]; }, obj);
  }
  function filled(v) {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim() !== "";
    if (Array.isArray(v)) return v.some(filled);
    return true;
  }
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  /* ---------- SEO ---------- */
  function setMeta(selector, attr, value) {
    var node = $(selector);
    if (node && value) node.setAttribute(attr, value);
  }
  function applySeo(lang) {
    var c = state.site.content[lang];
    var s = state.site.site;
    var base = (s.baseUrl || "").replace(/\/?$/, "/");
    var url = lang === s.defaultLang ? base : base + "?lang=" + lang;
    var title = get(c, "meta.title") || c.name;
    var desc = get(c, "meta.description") || c.heroStatement || "";
    var image = base + (s.ogImage || "");

    document.title = title;
    setMeta('meta[name="description"]', "content", desc);
    setMeta('meta[name="author"]', "content", c.name);
    setMeta('link[rel="canonical"]', "href", url);

    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:image"]', "content", image);
    setMeta('meta[property="og:locale"]', "content", lang === "fa" ? "fa_IR" : "en_US");
    setMeta('meta[property="og:locale:alternate"]', "content", lang === "fa" ? "en_US" : "fa_IR");
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", desc);
    setMeta('meta[name="twitter:image"]', "content", image);

    var sameAs = [state.site.contact.linkedin, state.site.contact.github].filter(filled);
    var ld = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: c.name,
      jobTitle: c.tagline,
      url: base,
      image: image,
      description: desc,
      knowsLanguage: s.languages
    };
    if (filled(state.site.contact.email)) ld.email = "mailto:" + state.site.contact.email;
    if (sameAs.length) ld.sameAs = sameAs;

    var jobs = (c.jobs || []).filter(function (j) { return filled(j.company); });
    if (jobs.length) {
      ld.worksFor = { "@type": "Organization", name: jobs[0].company };
    }
    var edu = (c.education || []).filter(function (e) { return filled(e.institution); });
    if (edu.length) {
      ld.alumniOf = edu.map(function (e) {
        return { "@type": "EducationalOrganization", name: e.institution };
      });
    }
    var skills = (c.skills || []).reduce(function (acc, g) { return acc.concat(g.items || []); }, []);
    if (skills.length) ld.knowsAbout = skills;

    var script = $("#ld-person");
    if (script) script.textContent = JSON.stringify(ld, null, 2);
  }

  /* ---------- sections ---------- */
  function renderAbout(c) {
    var img = $("#about-image");
    var conf = get(state.site, "images.about") || {};
    if (img && filled(conf.src)) {
      img.setAttribute("src", conf.src);
      img.setAttribute("alt", get(conf, "alt." + state.lang) || "");
      img.parentElement.hidden = false;
    } else if (img) {
      img.parentElement.hidden = true;
    }

    var box = $("#about-text");
    clear(box);
    (get(c, "about.paragraphs") || []).filter(filled).forEach(function (p) {
      box.appendChild(el("p", {}, p));
    });

    var cards = $("#highlights");
    clear(cards);
    (c.highlights || []).filter(function (h) { return filled(h.k) || filled(h.v); }).forEach(function (h) {
      var card = el("article", { "class": "frame card" });
      var dots = el("div", { "class": "bar-dots", "aria-hidden": "true" });
      for (var i = 0; i < 4; i++) dots.appendChild(el("i"));
      card.appendChild(dots);
      if (filled(h.k)) card.appendChild(el("span", { "class": "k" }, h.k));
      if (filled(h.v)) card.appendChild(el("span", { "class": "v" }, h.v));
      cards.appendChild(card);
    });
  }

  function renderJobs(c) {
    var host = $("#jobs");
    clear(host);
    (c.jobs || []).filter(function (j) { return filled(j.company) || filled(j.role); }).forEach(function (j) {
      var art = el("article", { "class": "frame job" });
      var top = el("div", { "class": "job-top" });
      if (filled(j.company)) top.appendChild(el("h3", {}, j.company));
      if (filled(j.role)) top.appendChild(el("span", { "class": "role" }, j.role));
      if (filled(j.dates)) top.appendChild(el("span", { "class": "dates" }, j.dates));
      art.appendChild(top);
      if (filled(j.location)) art.appendChild(el("div", { "class": "meta" }, j.location));
      if (filled(j.summary)) art.appendChild(el("p", { "class": "summary" }, j.summary));
      var pts = (j.points || []).filter(filled);
      if (pts.length) {
        var ul = el("ul");
        pts.forEach(function (p) { ul.appendChild(el("li", {}, p)); });
        art.appendChild(ul);
      }
      host.appendChild(art);
    });
    $("#experience").hidden = host.children.length === 0;
  }

  function renderProjects(c) {
    var host = $("#projects-grid");
    var section = $("#projects");
    clear(host);

    var list = state.projects.filter(function (p) {
      var loc = p[state.lang] || {};
      return filled(loc.title);
    });

    list.forEach(function (p) {
      var loc = p[state.lang] || {};
      var art = el("article", { "class": "frame project" });

      if (filled(get(p, "image.src"))) {
        var fig = el("figure", { "class": "shot" });
        var img = el("img", {
          src: p.image.src,
          alt: get(p, "image.alt." + state.lang) || loc.title,
          loading: "lazy",
          decoding: "async",
          width: "960",
          height: "540"
        });
        fig.appendChild(img);
        art.appendChild(fig);
      }

      var body = el("div", { "class": "body" });
      body.appendChild(el("h3", {}, loc.title));
      if (filled(loc.description)) body.appendChild(el("p", {}, loc.description));

      var rows = [
        ["role", loc.role],
        ["genre", p.genre],
        ["platforms", p.platforms],
        ["technologies", p.technologies]
      ].filter(function (r) { return filled(r[1]); });

      if (rows.length) {
        var dl = el("dl");
        rows.forEach(function (r) {
          dl.appendChild(el("dt", {}, get(c, "labels." + r[0]) || r[0]));
          dl.appendChild(el("dd", {}, r[1]));
        });
        body.appendChild(dl);
      }

      if (filled(p.url)) {
        var a = el("a", { "class": "open", href: p.url, target: "_blank", rel: "noopener" },
          get(c, "labels.viewProject") || "Open");
        body.appendChild(a);
      }

      art.appendChild(body);
      host.appendChild(art);
    });

    section.hidden = list.length === 0;
    $$('[data-section-link="projects"]').forEach(function (l) { l.hidden = list.length === 0; });
  }

  function renderSkills(c) {
    var host = $("#skill-groups");
    clear(host);
    (c.skills || []).filter(function (g) { return (g.items || []).filter(filled).length; }).forEach(function (g) {
      var art = el("article", { "class": "frame skill-group" });
      if (filled(g.group)) art.appendChild(el("h3", {}, g.group));
      var tags = el("div", { "class": "tags" });
      g.items.filter(filled).forEach(function (i) { tags.appendChild(el("span", { "class": "tag" }, i)); });
      art.appendChild(tags);
      host.appendChild(art);
    });
    $("#skills").hidden = host.children.length === 0;
  }

  function renderEducation(c) {
    var host = $("#education-list");
    clear(host);
    (c.education || []).filter(function (e) { return filled(e.institution) || filled(e.degree); }).forEach(function (e) {
      var art = el("article", { "class": "frame edu" });
      var top = el("div", { "class": "edu-top" });
      if (filled(e.institution)) top.appendChild(el("h3", {}, e.institution));
      if (filled(e.degree)) top.appendChild(el("span", { "class": "degree" }, e.degree));
      if (filled(e.dates)) top.appendChild(el("span", { "class": "dates" }, e.dates));
      art.appendChild(top);
      if (filled(e.note)) art.appendChild(el("p", { "class": "note" }, e.note));
      host.appendChild(art);
    });
    var any = host.children.length > 0;
    $("#education").hidden = !any;
    $$('[data-section-link="education"]').forEach(function (l) { l.hidden = !any; });
  }

  function renderContact(c) {
    var host = $("#contact-links");
    clear(host);
    var ct = state.site.contact || {};
    var items = [
      { key: "email", href: filled(ct.email) ? "mailto:" + ct.email : "", text: ct.email },
      { key: "linkedin", href: ct.linkedin, text: get(c, "labels.linkedin") },
      { key: "github", href: ct.github, text: get(c, "labels.github") }
    ].filter(function (i) { return filled(i.href); });

    items.forEach(function (i) {
      var a = el("a", { "class": "clink", href: i.href });
      if (i.key !== "email") { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
      a.appendChild(el("span", { "class": "sq", "aria-hidden": "true" }));
      a.appendChild(document.createTextNode(i.text || i.key));
      host.appendChild(a);
    });
    $("#contact").hidden = items.length === 0 && !filled(get(c, "contact.invite"));
  }

  function renderCredit() {
    var credit = state.site.credit || {};
    var link = $("#credit-link");
    if (!link) return;
    if (filled(credit.name)) link.textContent = credit.name;
    if (filled(credit.url)) link.setAttribute("href", credit.url);
    link.parentElement.hidden = !filled(credit.name);
  }

  /* ---------- language ---------- */
  function render(lang) {
    if (!state.site) return;
    if (!state.site.content[lang]) lang = state.site.site.defaultLang || "en";
    state.lang = lang;

    var c = state.site.content[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";

    $$("[data-i18n]").forEach(function (node) {
      var v = get(c, node.dataset.i18n);
      node.textContent = filled(v) ? v : "";
    });

    renderAbout(c);
    renderJobs(c);
    renderProjects(c);
    renderSkills(c);
    renderEducation(c);
    renderContact(c);
    renderCredit();
    applySeo(lang);

    $$(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}

    var url = new URL(window.location.href);
    if (lang === (state.site.site.defaultLang || "en")) url.searchParams.delete("lang");
    else url.searchParams.set("lang", lang);
    try { history.replaceState(null, "", url.toString()); } catch (e) {}
  }

  function pickLang(site) {
    var supported = site.site.languages || ["en"];
    var fromUrl = new URL(window.location.href).searchParams.get("lang");
    if (fromUrl && supported.indexOf(fromUrl) > -1) return fromUrl;
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && supported.indexOf(saved) > -1) return saved;
    } catch (e) {}
    var nav = (navigator.language || "").toLowerCase();
    if (nav.indexOf("fa") === 0 && supported.indexOf("fa") > -1) return "fa";
    return site.site.defaultLang || "en";
  }

  /* ---------- mobile menu ---------- */
  function initMenu() {
    var toggle = $(".menu-toggle");
    var nav = $("[data-nav]");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- boot ---------- */
  function showError() {
    var box = $("#load-error");
    if (!box) return;
    box.textContent = "Content didn't load. Refresh the page, or check that data/site.json is being served.";
    box.hidden = false;
  }

  function boot() {
    initMenu();
    Promise.all([
      fetch("data/site.json", { cache: "no-cache" }).then(function (r) { return r.json(); }),
      fetch("data/projects.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).catch(function () { return { projects: [] }; })
    ]).then(function (res) {
      state.site = res[0];
      state.projects = res[1].projects || [];
      $$(".lang button").forEach(function (b) {
        b.addEventListener("click", function () { render(b.dataset.lang); });
      });
      render(pickLang(state.site));
      document.body.dataset.ready = "true";
    }).catch(function (err) {
      console.error(err);
      showError();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

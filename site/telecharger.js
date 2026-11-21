// Fills the download section from telechargements/version.json, which the
// Pages workflow writes next to the files of the latest release. Without it
// the page keeps saying that there is nothing to download yet.
(function () {
  "use strict";

  var platforms = [
    { suffix: "-windows-x86_64.zip", label: "Windows", detail: "Windows 10 et 11, 64 bits", tried: true },
    { suffix: "-macos-arm64.tar.gz", label: "macOS", detail: "Mac avec puce Apple" },
    { suffix: "-linux-x86_64.tar.gz", label: "Linux", detail: "64 bits, glibc 2.35 ou plus récent" },
    { suffix: "-web.zip", label: "Client Web seul", detail: "Pour une passerelle déjà installée" },
    { suffix: "-source.tar.gz", label: "Code source", detail: "Celui de cette version" }
  ];

  function size(bytes) {
    return (bytes / 1048576).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " Mo";
  }

  function date(iso) {
    var d = new Date(iso + "T12:00:00Z");
    return isNaN(d) ? iso : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }

  function guess() {
    var ua = navigator.userAgent;
    if (/Windows/.test(ua)) return "Windows";
    if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) return "macOS";
    if (/Linux/.test(ua) && !/Android/.test(ua)) return "Linux";
    return null;
  }

  function show(release) {
    var list = document.querySelector("[data-release-list]");
    var mine = guess();
    var shown = 0;
    platforms.forEach(function (p) {
      var file = (release.files || []).filter(function (f) {
        return f.name.slice(-p.suffix.length) === p.suffix;
      })[0];
      if (!file) return;
      var a = document.createElement("a");
      a.className = "dl" + (p.label === mine ? " mine" : "");
      a.href = "telechargements/" + encodeURIComponent(file.name);
      a.setAttribute("download", "");
      var title = document.createElement("strong");
      title.textContent = p.label;
      var detail = document.createElement("span");
      detail.textContent = p.detail + " · " + size(file.size);
      a.appendChild(title);
      a.appendChild(detail);
      if (p.label === mine) {
        var tag = document.createElement("em");
        tag.textContent = "Votre système";
        a.appendChild(tag);
      }
      list.appendChild(a);
      shown += 1;
    });
    if (!shown) return;
    list.hidden = false;
    document.querySelector("[data-release-notes]").hidden = false;
    document.querySelector("[data-release-intro]").textContent =
      "Leto " + release.version + ", publié le " + date(release.date) +
      ". C'est une version de développement : voyez plus haut ce qui a été essayé.";
    document.querySelector("[data-release-pill]").textContent =
      "En développement · version " + release.version;
  }

  fetch("telechargements/version.json", { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (release) { if (release) show(release); })
    .catch(function () {});
})();

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("unrot3").then(c =>
      c.addAll(["./", "./index.html", "./style.css", "./app.js"])
    )
  );
});

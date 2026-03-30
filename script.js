// ─────────────────────────────────────────
// GRAB ELEMENTS FROM THE HTML
// ─────────────────────────────────────────

var searchBtn    = document.getElementById("sb");
var searchInput  = document.getElementById("si");
var heroBg       = document.getElementById("hbg");
var heroCont     = document.querySelector(".hcont");

// Grids
var gridNew       = document.getElementById("gn");
var gridTrending  = document.getElementById("gt");
var gridEditors   = document.getElementById("ge");
var gridSearch    = document.getElementById("gs");
var gridSearchSec = document.getElementById("gsec");
var gridSearchTit = document.getElementById("gtit");

// Modal elements
var modal       = document.getElementById("mov");
var modalPoster = document.getElementById("mp");
var modalClose  = document.getElementById("mx");
var modalTitle  = document.getElementById("mt");
var modalMeta   = document.getElementById("mm");
var modalPlot   = document.getElementById("mpl");
var modalTags   = document.getElementById("mtg");
var modalImdb   = document.getElementById("mimdb");


// ─────────────────────────────────────────
// API KEYS
// ─────────────────────────────────────────
var OMDB_KEY = "8c669185";
var BASE_URL  = "https://www.omdbapi.com/";


// ─────────────────────────────────────────
// STEP 1 — FETCH ONE MOVIE BY EXACT TITLE
// ─────────────────────────────────────────
async function fetchMovieByTitle(title) {
  try {
    var url = BASE_URL + "?t=" + encodeURIComponent(title) + "&plot=full&apikey=" + OMDB_KEY;
    var response = await fetch(url);
    var data = await response.json();
    return data.Response === "True" ? data : null;
  } catch (err) {
    console.error("fetchMovieByTitle error:", err);
    return null;
  }
}


// ─────────────────────────────────────────
// STEP 2 — SEARCH MOVIES BY KEYWORD
// ─────────────────────────────────────────
async function searchMovies(keyword) {
  try {
    var url = BASE_URL + "?s=" + encodeURIComponent(keyword) + "&type=movie&apikey=" + OMDB_KEY;
    var response = await fetch(url);
    var data = await response.json();
    return data.Response === "True" ? data.Search : [];
  } catch (err) {
    console.error("searchMovies error:", err);
    return [];
  }
}


// ─────────────────────────────────────────
// STEP 3 — FETCH FULL DETAILS BY IMDB ID
// ─────────────────────────────────────────
async function fetchMovieById(imdbId) {
  try {
    var url = BASE_URL + "?i=" + imdbId + "&plot=full&apikey=" + OMDB_KEY;
    var response = await fetch(url);
    var data = await response.json();
    return data.Response === "True" ? data : null;
  } catch (err) {
    console.error("fetchMovieById error:", err);
    return null;
  }
}


// ─────────────────────────────────────────
// STEP 4 — BUILD GENRE TAG CHIPS
// ─────────────────────────────────────────
function buildGenreTags(genreString) {
  if (!genreString || genreString === "N/A") return "";
  return genreString.split(",").map(function(g) {
    return '<span class="tag">' + g.trim() + '</span>';
  }).join("");
}

// ─────────────────────────────────────────
// STEP 5 — DISPLAY MOVIE IN THE HERO SECTION
// ─────────────────────────────────────────
function displayHero(movie) {

  // 1. Set the blurred background behind the hero
  if (movie.Poster && movie.Poster !== "N/A") {
    heroBg.style.backgroundImage   = "url(" + movie.Poster + ")";
    heroBg.style.backgroundSize    = "cover";
    heroBg.style.backgroundPosition = "center";
    heroBg.style.filter            = "brightness(0.35) blur(4px)";
  }
  document.querySelector(".hero").scrollIntoView({ behavior: "smooth" });

  // 2. Fill the hero content with poster + info side by side
  heroCont.innerHTML = `

    <!-- LEFT: poster image — this is what makes it visible -->
    <div class="hposter">
      <img
        src="${movie.Poster !== "N/A" ? movie.Poster : "https://placehold.co/220x330/16181d/555870?text=No+Poster"}"
        alt="${movie.Title}"
      />
    </div>

    <!-- RIGHT: movie info -->
    <div class="hmeta">
      <h1 class="htitle">${movie.Title}</h1>

      <div class="htags">${buildGenreTags(movie.Genre)}</div>

      <div class="hmrow">
        <span class="hrating">&#9733; ${movie.imdbRating || "N/A"}</span>
        <span class="hdot"></span>
        <span>${movie.Year || ""}</span>
        <span class="hdot"></span>
        <span>${movie.Runtime || ""}</span>
        <span class="hdot"></span>
        <span>${movie.Rated || ""}</span>
      </div>

      <p class="hdesc">${movie.Plot !== "N/A" ? movie.Plot : ""}</p>

      <div class="hact">
        <button class="bwatch" id="hwb">&#9654;&nbsp;WATCH TRAILER</button>
        <button class="binfo"  id="hib">&#8505; More Info</button>
      </div>

      <!-- Trailer loads here inline, below the buttons -->
      <div id="htrailer"></div>
    </div>
  `;

  // 3. Re-attach button events after innerHTML replaced them
  document.getElementById("hwb").addEventListener("click", function() {
    watchTrailer(movie.Title, "htrailer");
  });

  document.getElementById("hib").addEventListener("click", function() {
    openModal(movie);
  });
}


// ─────────────────────────────────────────
// STEP 6 — WATCH TRAILER
// ─────────────────────────────────────────
async function watchTrailer(movieTitle, containerId) {

  var container = document.getElementById(containerId);

  // Show a loading message while we fetch
  container.innerHTML = "<p style='color:#aaa;margin-top:12px'>Loading trailer…</p>";

  // ── Path A: YouTube Data API key is available ──
  if (YT_KEY) {

    try {
      var query    = encodeURIComponent(movieTitle + " official trailer");
      var ytUrl    = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + query + "&type=video&maxResults=1&key=" + YT_KEY;
      var response = await fetch(ytUrl);
      var ytData   = await response.json();

      // If we got a video result, embed it
      if (ytData.items && ytData.items.length > 0) {
        var videoId = ytData.items[0].id.videoId;
        container.innerHTML = `
          <iframe
            style="margin-top:16px; border-radius:10px;"
            width="100%"
            height="280"
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0"
            frameborder="0"
            allow="autoplay; encrypted-media"
            allowfullscreen>
          </iframe>
        `;
        return;
      }

    } catch (err) {
      console.error("YouTube API error:", err);
      // Fall through to the fallback below
    }
  }

  // ── Path B: No YT key — open YouTube search in new tab ──
  container.innerHTML = `
    <p style="color:#aaa; margin-top:12px; font-size:14px;">
      &#9432; Opening trailer search in a new tab…
    </p>
  `;
  var searchQuery = encodeURIComponent(movieTitle + " official trailer");
  window.open("https://www.youtube.com/results?search_query=" + searchQuery, "_blank");

  // Clear the message after 2 seconds
  setTimeout(function() { container.innerHTML = ""; }, 2000);
}


// ─────────────────────────────────────────
// STEP 7 — CREATE A MOVIE POSTER CARD
// ─────────────────────────────────────────
function createCard(movie) {

  var poster = (movie.Poster && movie.Poster !== "N/A")
    ? movie.Poster
    : "https://placehold.co/200x300/16181d/555870?text=No+Poster";

  var card = document.createElement("div");
  card.className = "movie-card";

  card.innerHTML = `
    <div class="cimg-wrap">
      <img src="${poster}" alt="${movie.Title}" loading="lazy" />

      <!-- Play icon overlay — appears on hover via CSS -->
      <div class="cplay">&#9654;</div>

      <!-- Trailer preview container — filled on hover -->
      <div class="cpreview" id="prev-${movie.imdbID}"></div>
    </div>
    <div class="cinfo">
      <div class="ctitle">${movie.Title}</div>
      <div class="cyear">${movie.Year || ""}</div>
    </div>
  `;

  // Click → open full detail modal
  card.addEventListener("click", async function() {
    var full = await fetchMovieById(movie.imdbID);
    if (full) openModal(full);
  });

  // ── Hover → show trailer preview inside the card
  card.addEventListener("mouseenter", function() {
    showCardPreview(movie.Title, movie.imdbID);
  });

  // mouseleave removes the preview iframe to stop the video
  card.addEventListener("mouseleave", function() {
    var prev = document.getElementById("prev-" + movie.imdbID);
    if (prev) prev.innerHTML = "";
  });

  return card;
}


// ─────────────────────────────────────────
// STEP 8 — SHOW TRAILER PREVIEW ON CARD HOVER
// ─────────────────────────────────────────
async function showCardPreview(movieTitle, imdbId) {

  var container = document.getElementById("prev-" + imdbId);
  if (!container) return;

  // Only proceed if we have a YouTube key — small iframe
  // previews don't work without being able to get a real video ID
  if (!YT_KEY) return;

  try {
    var query    = encodeURIComponent(movieTitle + " official trailer");
    var ytUrl    = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + query + "&type=video&maxResults=1&key=" + YT_KEY;
    var response = await fetch(ytUrl);
    var ytData   = await response.json();

    if (ytData.items && ytData.items.length > 0) {
      var videoId = ytData.items[0].id.videoId;
      container.innerHTML = `
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0"
          frameborder="0"
          allow="autoplay; encrypted-media">
        </iframe>
      `;
    }

  } catch (err) {
    // Silent fail — preview is a nice-to-have
  }
}


// ─────────────────────────────────────────
// STEP 9 — FILL A GRID WITH CARDS
// ─────────────────────────────────────────
function fillGrid(containerId, movies) {
  var container = document.getElementById(containerId);
  container.innerHTML = "";

  if (!movies || movies.length === 0) {
    container.innerHTML = '<p class="empty">No movies found.</p>';
    return;
  }

  for (var i = 0; i < movies.length; i++) {
    container.appendChild(createCard(movies[i]));
  }
}


// ─────────────────────────────────────────
// STEP 10 — OPEN THE DETAIL MODAL
// ─────────────────────────────────────────
function openModal(movie) {

  modalPoster.src = (movie.Poster && movie.Poster !== "N/A")
    ? movie.Poster
    : "https://placehold.co/400x220/16181d/555870?text=No+Image";

  modalTitle.textContent = movie.Title;

  modalMeta.innerHTML = `
    <span>&#11088; ${movie.imdbRating || "N/A"}</span>
    <span>&#128197; ${movie.Year || "N/A"}</span>
    <span>&#9201; ${movie.Runtime || "N/A"}</span>
    <span>&#127916; ${movie.Director || "N/A"}</span>
  `;

  modalPlot.textContent = (movie.Plot && movie.Plot !== "N/A")
    ? movie.Plot : "No plot available.";

  modalTags.innerHTML = buildGenreTags(movie.Genre);

  // "Watch Now" button inside modal — plays trailer in modal
  var modalWatchBtn = modal.querySelector(".bwatch");
  if (modalWatchBtn) {
    modalWatchBtn.onclick = function() {
      watchTrailer(movie.Title, "mtrailer");
    };
  }

  modalImdb.onclick = function() {
    window.open("https://www.imdb.com/title/" + movie.imdbID, "_blank");
  };

  // Make sure there's a trailer container inside the modal body
  var mtrailer = document.getElementById("mtrailer");
  if (!mtrailer) {
    var mac = modal.querySelector(".mac");
    var div = document.createElement("div");
    div.id = "mtrailer";
    div.style.marginTop = "16px";
    mac.after(div);
  } else {
    mtrailer.innerHTML = "";  // clear previous trailer
  }

  modal.style.display = "flex";
}


// Close modal on X button
modalClose.addEventListener("click", function() {
  modal.style.display = "none";
  // Stop any playing trailer when modal closes
  var mtrailer = document.getElementById("mtrailer");
  if (mtrailer) mtrailer.innerHTML = "";
});

// Close modal when clicking the dark backdrop
modal.addEventListener("click", function(e) {
  if (e.target === modal) {
    modal.style.display = "none";
    var mtrailer = document.getElementById("mtrailer");
    if (mtrailer) mtrailer.innerHTML = "";
  }
});


// ─────────────────────────────────────────
// STEP 11 — SEARCH FUNCTION
// ─────────────────────────────────────────
async function doSearch(query) {

  // ── Show searched movie in the hero ──
  var heroResult = await fetchMovieByTitle(query);

  if (heroResult) {
    displayHero(heroResult);
    // Scroll up so the user sees the hero preview
    document.querySelector(".hero").scrollIntoView({ behavior: "smooth" });
    
  } else {
    // If no exact match, just show a message in the hero
    heroCont.innerHTML = `
      <div class="hmeta">
        <h1 class="htitle" style="color:#ff6b6b">No exact match for "${query}"</h1>
        <p class="hdesc">Check the spelling or try a different title.</p>
      </div>
    `;
  }

  // ── Show results grid ──
  gridSearchSec.style.display = "block";
  gridSearchTit.textContent   = 'Results for "' + query + '"';
  gridSearch.innerHTML        = "<p>Loading…</p>";

  var results = await searchMovies(query);
  fillGrid("gs", results);
}


// Search button click
searchBtn.addEventListener("click", function() {
  var query = searchInput.value.trim();
  if (query === "") { alert("Please enter a movie name"); return; }
  doSearch(query);
});

// Enter key in search input
searchInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    var query = searchInput.value.trim();
    if (query !== "") doSearch(query);
  }
});


// ─────────────────────────────────────────
// STEP 12 — TAB SWITCHING
// ─────────────────────────────────────────
var allTabs = document.querySelectorAll(".tab");

for (var i = 0; i < allTabs.length; i++) {
  allTabs[i].addEventListener("click", async function() {
    for (var j = 0; j < allTabs.length; j++) allTabs[j].classList.remove("active");
    this.classList.add("active");
    var keyword = this.getAttribute("data-kw");
    gridNew.innerHTML = "<p>Loading…</p>";
    fillGrid("gn", await searchMovies(keyword));
     document.querySelector(".hero").scrollIntoView({ behavior: "smooth" });
  });
}


// ─────────────────────────────────────────
// STEP 13 — SIDEBAR NAV HIGHLIGHT
// ─────────────────────────────────────────
var allNavs = document.querySelectorAll(".nav");
for (var i = 0; i < allNavs.length; i++) {
  allNavs[i].addEventListener("click", function() {
    for (var j = 0; j < allNavs.length; j++) allNavs[j].classList.remove("active");
    this.classList.add("active");
  });
  
}

var stylefix = document.createElement("style");
stylefix.textContent = `

  /* ── Hero layout: poster left, info right ── */
  .hcont {
    display: flex !important;
    align-items: flex-start !important;
    gap: 36px !important;
    padding: 40px 48px !important;
    position: relative;
    z-index: 3;
  }

  /* ── Poster in hero ── */
  .hposter {
    flex-shrink: 0;
  }
  .hposter img {
    width: 220px !important;
    height: 330px !important;
    object-fit: cover !important;   /* fills the box, no squashing */
    border-radius: 12px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.7) !important;
    display: block !important;
  }

  /* ── Hero meta (right side) ── */
  .hmeta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 8px;
  }
  .htitle {
    font-size: 38px;
    font-weight: 800;
    line-height: 1.1;
    margin: 0;
  }
  .htags { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 4px;
    background: rgba(255,255,255,0.1);
    color: #aaa;
  }
  .hmrow {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #888;
    flex-wrap: wrap;
  }
  .hrating { color: #ffd060; font-weight: 700; }
  .hdot {
    width: 3px; height: 3px;
    border-radius: 50%;
    background: #555;
  }
  .hdesc {
    font-size: 14px;
    line-height: 1.7;
    color: rgba(255,255,255,0.65);
    max-width: 520px;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .hact { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
  #htrailer, #mtrailer { width: 100%; margin-top: 8px; }

  /* ── Card image fix ── */
  .movie-card {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
  }
  .cimg-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 2 / 3;     /* portrait shape */
    overflow: hidden;
    background: #1c1c27;
  }
  .cimg-wrap img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;  /* fills the box cleanly */
    display: block !important;
    transition: transform 0.3s ease;
  }
  .movie-card:hover .cimg-wrap img {
    transform: scale(1.06);       /* subtle zoom on hover */
  }

  /* Play icon overlay */
  .cplay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    color: white;
    background: rgba(0,0,0,0.4);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .movie-card:hover .cplay { opacity: 1; }

  /* Hover trailer preview container */
  .cpreview {
    position: absolute;
    inset: 0;
    z-index: 5;
    background: #000;
  }
  .cpreview:empty { display: none; }

  /* Card info below poster */
  .cinfo { padding: 10px 12px 12px; }
  .ctitle {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cyear { font-size: 12px; color: #666; margin-top: 2px; }
`;
document.head.appendChild(stylefix);


// ─────────────────────────────────────────
// STEP 15 — BOOT THE APP
// ─────────────────────────────────────────
async function bootApp() {
  var heroData = await fetchMovieByTitle("Interstellar");
  if (heroData) displayHero(heroData);

  fillGrid("gn", await searchMovies("adventure"));
  fillGrid("gt", await searchMovies("thriller"));
  fillGrid("ge", await searchMovies("classic"));
}

bootApp();

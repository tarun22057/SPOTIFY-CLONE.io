const clientId = "94593996f06140038693984df35d34a6"; // "8facece69f694f1597ac5242d3e2b5d6";
const clientSecret = "97e64b3063884f98b128659c632c5df9"; // "89851d686eff40b6a9a6ba407033c1ad";
const redirectUri = "http://127.0.0.1:5500/index.html";
// 8facece69f694f1597ac5242d3e2b5d6:36b49b5ce75642e2ba8901454852a3cf
// did a ghetto style oauth for now will implement proper authentication later
//https://accounts.spotify.com/authorize?client_id=8facece69f694f1597ac5242d3e2b5d6&response_type=code&redirect_uri=http://127.0.0.1:5500/index.html&scope=user-read-private%20user-read-email%20user-library-read%20user-library-modify%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20user-top-read%20user-read-recently-played%20user-follow-read%20user-follow-modify%20user-read-playback-state%20user-read-currently-playing%20user-modify-playback-state%20user-read-playback-position%20user-read-private%20user-read-email%20playlist-read-private

// Store the access token in a variable
let accessToken = "";
// let refreshToken = "";

const getAccessToken = async (clientId, clientSecret, redirectUri, scope) => {
  const authString = `${clientId}:${clientSecret}`;
  const base64AuthString = btoa(authString); // we need a base64 string btoa() turns it into base64

  const config = {
    headers: {
      Authorization: `Basic ${base64AuthString}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get("code");

  const data = new URLSearchParams();
  data.append("grant_type", "authorization_code");
  data.append("code", code);
  data.append("redirect_uri", redirectUri);
  data.append("scope", scope);

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      data,
      config
    );

    accessToken = response.data.access_token; // Store the access token in the variable
    //refreshToken = response.data.refresh_token; //store the response token in the variable

    displayPlaylistNames(accessToken);

    displayTopArtists(accessToken);

    displayRecentlyPlayedTracks(accessToken);

    displayTopTracks(accessToken);

    displaySavedAlbums(accessToken);

    displayRecommendedTracks(accessToken);

    displaySavedEpisodes(accessToken);

    getDeviceId(accessToken);

    playTrack(accessToken);
  } catch (error) {
    console.log(error.message + " ---THE MAIN ACCESS TOKEN CALL");

    //agar iss wale area mein code ja raha hai to firse login page pr redirect krdo http://127.0.0.1:5500/login.html
    window.location.href = "http://127.0.0.1:5500/login.html";
  }
};

getAccessToken(
  clientId,
  clientSecret,
  redirectUri,
  "user-read-private user-read-email playlist-read-private playlist-read-collaborative user-top-read user-library-read user-read-recently-played user-read-playback-state user-modify-playback-state streaming"
);

const search = async (selectedOption, query, accessToken) => {
  // const playlists = await getPlaylists(accessToken);
  // console.log("PLAYLIST : " + playlists);

  const configSearches = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      q: query,
      type: `${selectedOption}`,
      market: "US",
      limit: 20,
      offset: 0,
    },
  };

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/search",
      configSearches
    );
    console.log(response);
    // return response.data[selectedOption + "s"].items; // this "s" appended because the api returns json obejct as tracks : .... and we are passing selectedOption = track,album etc so we need to append s
    return response.data.tracks.items;
  } catch (err) {
    console.log("couldn't find what you were looking for");
  }
};

const select = document.querySelector("#select-options");
const searchBar = document.querySelector(".search-bar");

searchBar.addEventListener("input", async function () {
  // const selectedOption = this.value; if you want to search for albums etc use the select option in the html
  const selectedOption = "track";
  const query = this.value; //gets the value from the serach bar
  // console.log(query);
  // console.log(selectedOption);

  try {
    const searchResults = await search(selectedOption, query, accessToken);
    console.log(searchResults);

    const resultsContainer = document.querySelector(".results-container");

    // Clear the search results container
    resultsContainer.innerHTML = "";

    for (let i = 0; i < 20; i++) {
      const result = document.createElement("div");
      result.classList.add("result-div"); //  dynamically adding class names to div

      //create a div tag and give numbering
      const resultNumber = document.createElement("div");
      resultNumber.textContent = i + 1;
      result.appendChild(resultNumber);
      resultNumber.classList.add("result-number"); //  dynamically adding class names to span tags

      // create an image element for the search result
      const resultImg = document.createElement("img");
      resultImg.src = searchResults[i].album.images[0].url;
      result.appendChild(resultImg);
      resultImg.classList.add("searched-img"); //  dynamically adding class names to img

      // create a div element for the search result name
      const resultName = document.createElement("div");
      resultName.textContent = searchResults[i].name;
      result.appendChild(resultName);

      //create a div element for the search result artist
      const resultArtist = document.createElement("a");
      resultArtist.textContent = searchResults[i].artists[0].name;
      resultName.appendChild(resultArtist);
      resultArtist.classList.add("searched-song-artist");
      resultArtist.href = searchResults[i].artists[0].external_urls.spotify;

      resultName.classList.add("searched-song-name"); //  dynamically adding class names to p tags

      //get the album to which this song belongs
      const resultAlbum = document.createElement("a");
      resultAlbum.textContent = searchResults[i].album.name;
      result.appendChild(resultAlbum);
      resultAlbum.classList.add("searched-song-album"); //  dynamically adding class names to p tags
      resultAlbum.href = searchResults[i].album.external_urls.spotify;
      //create a div tag for song timing
      const songTime = document.createElement("div");

      const time_ms = searchResults[i].duration_ms; // gets time in milliseconds
      const time_sec = millisToMinutesAndSeconds(time_ms);
      songTime.textContent = time_sec;

      result.appendChild(songTime);
      songTime.classList.add("searched-song-time"); //  dynamically adding class names to span tags

      // append the search result to the results container
      resultsContainer.appendChild(result);
    }
  } catch (err) {
    console.log("COUDNT FIND WHAT YOU WERE LOOKING FOR");
  }
});

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}
const searchBarFa = document.querySelector(".search-bar-fa");
let crossButton, headings;

searchBar.addEventListener("input", function () {
  // Check if search bar is not empty
  if (searchBar.value.trim().length > 0) {
    // Create the cross button and add it to the search bar
    if (!crossButton) {
      crossButton = document.createElement("button");
      crossButton.innerText = "X";
      crossButton.classList.add("cross-button");
      searchBarFa.appendChild(crossButton);
    }

    // Create the headings row and add it to the search bar container
    if (!headings) {
      headings = document.createElement("div");
      headings.classList.add("headings");

      const sNo = document.createElement("div");
      sNo.innerText = "#";
      headings.appendChild(sNo);

      const sTitle = document.createElement("div");
      sTitle.innerText = "Title";
      headings.appendChild(sTitle);

      const sEmpty = document.createElement("div");
      sEmpty.innerText = "";
      headings.appendChild(sEmpty);

      const sAlbum = document.createElement("div");
      sAlbum.innerText = "Album";
      headings.appendChild(sAlbum);

      const sDuration = document.createElement("div");
      sDuration.innerText = "Duration";
      headings.appendChild(sDuration);

      const searchBarContainer = document.querySelector(
        ".search-bar-container"
      );
      searchBarContainer.appendChild(headings);
    }
  } else {
    // Remove the cross button from the search bar
    if (crossButton) {
      searchBarFa.removeChild(crossButton);
      crossButton = null;
    }

    // Remove the headings row from the search bar container
    if (headings) {
      const searchBarContainer = document.querySelector(
        ".search-bar-container"
      );
      searchBarContainer.removeChild(headings);
      headings = null;
    }
  }
});

searchBar.addEventListener("blur", function () {
  // Remove the cross button and headings when search bar loses focus
  if (crossButton) {
    searchBarFa.removeChild(crossButton);
    crossButton = null;
  }

  if (headings) {
    const searchBarContainer = document.querySelector(".search-bar-container");
    searchBarContainer.removeChild(headings);
    headings = null;
  }
});

searchBarFa.addEventListener("click", function (e) {
  searchBarFa.classList.add("active"); //changes border color to greens showing that search bar is selected
  // Remove the cross button and headings when cross button is clicked
  if (e.target.classList.contains("cross-button")) {
    searchBar.value = "";
    searchBar.focus();

    if (crossButton) {
      searchBarFa.removeChild(crossButton);
      crossButton = null;
    }

    if (headings) {
      const searchBarContainer = document.querySelector(
        ".search-bar-container"
      );
      searchBarContainer.removeChild(headings);
      headings = null;
    }
  }
});

// focus on search-bar-fa when search is clicked on left-side container
const searchLink = document.querySelector(".search-link");

// Add click event listener to the search link
searchLink.addEventListener("click", (e) => {
  e.preventDefault(); // Prevent the link from navigating to the href value

  searchBar.focus(); // Focus the search bar element

  searchBarFa.classList.add("active"); // Add active class to the search link
});

// Add blur event listener to the search bar element
searchBar.addEventListener("blur", () => {
  searchBarFa.classList.remove("active"); // Remove active class from the search link
});

// get the playlists
//what you need to do is as soon as the window opens you have to display the name of the playlist which is basically an anchor tag
//then if you click that anchor tag you get the tracks of that playlist
const getPlaylists = async (accessToken) => {
  try {
    const configSearches = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit: 6,
        offset: 0,
      },
    };
    const response = await axios.get(
      "https://api.spotify.com/v1/me/playlists",
      configSearches
    );
    return response.data;
  } catch (err) {
    console.log(err);
  }
};

const playList = document.querySelector(".playlist");
const rightSideHomeStuff = document.querySelector(".right-side-home-stuff");
const rightSideMain = document.querySelector(".right-side-main");
const goodEvening = document.querySelector(".good-evening");

const displayPlaylistNames = async (accessToken) => {
  const playListNames = await getPlaylists(accessToken);
  for (let i = 0; i < playListNames.items.length; i++) {
    //for displaying the playlist on the left side
    const playlistLink = document.createElement("a");
    playlistLink.href = playListNames.items[i].external_urls.spotify;
    playlistLink.textContent = playListNames.items[i].name;
    playlistLink.classList.add("left-side-playlist");
    playList.appendChild(playlistLink);

    // for displaying the playlist on the right side homepage

    const playListDiv = document.createElement("div");
    playListDiv.classList.add("right-playlist-container");

    const playListAnchor = document.createElement("a");
    const playListImg = document.createElement("img");
    playListImg.src = playListNames.items[i].images[0].url;
    playListImg.classList.add("right-side-playlist-img");
    playListDiv.appendChild(playListImg);

    playListAnchor.href = playListNames.items[i].external_urls.spotify;
    playListAnchor.textContent = playListNames.items[i].name;
    playListAnchor.classList.add("play-List-Anchor");
    goodEvening.appendChild(playListDiv);
    playListDiv.appendChild(playListAnchor);
  }
};

searchBar.addEventListener("input", () => {
  if (searchBar.value !== "") {
    rightSideMain.removeChild(rightSideHomeStuff);
  } else {
    rightSideMain.appendChild(rightSideHomeStuff);
  }
});

const topArtists = async (accessToken) => {
  try {
    const configSearches = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        ids: "5cj0lLjcoR7YOSnhnX0Po5,1Xyo4u8uXC1ZmMpatF05PJ,66CXWjxzNUsdJxJ2JdwvnR,3TVXtAsR1Inumwj472S9r4,2YZyLoL8N0Wb9xBt1NhZWg,1RyvyyTE3xzB2ZywiAwp0i,2jku7tDXc6XoB6MO2hFuqg,7qG3b048QCHVRO5Pv1T5lw,3MZsBdqDrRTJihTHQrO6Dq,7bXgB6jMjp9ATFy66eO08Z",
      },
    };
    const response = await axios.get(
      "https://api.spotify.com/v1/artists",
      configSearches
    );
    return response.data.artists;
  } catch (err) {
    console.log(err);
  }
};

const topArtistsDiv = document.querySelector(".top-artists");
const displayTopArtists = async (accessToken) => {
  const response = await topArtists(accessToken);

  for (let i = 0; i < 10; i++) {
    const topArtistDisplay = document.createElement("div");
    topArtistDisplay.classList.add("top-artist-container");

    const topArtistImg = document.createElement("img");
    topArtistImg.src = response[i].images[0].url;
    topArtistImg.classList.add("top-artist-img");
    topArtistDisplay.appendChild(topArtistImg);

    const topArtistLink = document.createElement("a");
    topArtistLink.href = response[i].external_urls.spotify;
    topArtistLink.textContent = response[i].name;
    topArtistLink.classList.add("top-artist-link");
    topArtistDisplay.appendChild(topArtistLink);

    // const topArtistFolllowers = document.createElement("p");
    // topArtistFolllowers.textContent =
    //     "FOLLOWERS : " + response[i].followers.total;
    // topArtistFolllowers.classList.add("top-artist-followers");
    // topArtistDisplay.appendChild(topArtistFolllowers);

    //when you click you should go to artits profile

    topArtistsDiv.appendChild(topArtistDisplay);
  }
};

//write a function recently played tracks
const recentlyPlayedTracks = async (accessToken) => {
  try {
    const configSearches = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit: 10,
        // after: 1484811043508,
        offset: 0,
      },
    };
    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/recently-played",
      configSearches
    );
    return response.data;
  } catch (err) {
    console.log(err);
  }
};
//write a function to display the recently played tracks
const recentlyPlayedDiv = document.querySelector(".recently-played");
const displayRecentlyPlayedTracks = async (accessToken) => {
  const response = await recentlyPlayedTracks(accessToken);
  for (let i = 0; i < 10; i++) {
    const recentlyPlayedTrackDisplay = document.createElement("div");
    recentlyPlayedTrackDisplay.classList.add("recently-played-track-container");

    const recentlyPlayedTrackImg = document.createElement("img");
    recentlyPlayedTrackImg.src = response.items[i].track.album.images[0].url;
    recentlyPlayedTrackImg.classList.add("recently-played-track-img");
    recentlyPlayedTrackDisplay.appendChild(recentlyPlayedTrackImg);

    const recentlyPlayedTrackLink = document.createElement("a");
    recentlyPlayedTrackLink.href =
      response.items[i].track.external_urls.spotify;
    recentlyPlayedTrackLink.textContent = response.items[i].track.name;
    recentlyPlayedTrackLink.classList.add("recently-played-track-link");
    recentlyPlayedTrackDisplay.appendChild(recentlyPlayedTrackLink);

    recentlyPlayedDiv.appendChild(recentlyPlayedTrackDisplay);
  }
};

const topTracks = async (accessToken) => {
  try {
    const configSearches = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit: 10,
        offset: 0,
      },
    };
    const response = await axios.get(
      "https://api.spotify.com/v1/me/top/tracks",
      configSearches
    );
    return response.data;
  } catch (err) {
    console.log(err);
  }
};

const yourTopTracks = document.querySelector(".top-tracks");
const displayTopTracks = async (accessToken) => {
  const response = await topTracks(accessToken);
  for (let i = 0; i < 10; i++) {
    const topTracksDisplay = document.createElement("div");
    topTracksDisplay.classList.add("top-tracks-container");

    const topTracksImg = document.createElement("img");
    topTracksImg.src = response.items[i].album.images[0].url;
    topTracksImg.classList.add("top-tracks-img");
    topTracksDisplay.appendChild(topTracksImg);

    const topTracksLink = document.createElement("a");
    topTracksLink.href = response.items[i].album.external_urls.spotify;
    topTracksLink.textContent = response.items[i].name;
    topTracksLink.classList.add("top-tracks-link");
    topTracksDisplay.appendChild(topTracksLink);

    yourTopTracks.appendChild(topTracksDisplay);
  }
};

const mySavedAlbums = async (accessToken) => {
  try {
    const configSearches = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit: 10,
        offset: 0,
        market: "ES",
      },
    };
    const response = await axios.get(
      "https://api.spotify.com/v1/me/albums",
      configSearches
    );
    return response.data;
  } catch (err) {
    console.log(err);
  }
};

const savedAlbums = document.querySelector(".saved-albums");
const displaySavedAlbums = async (accessToken) => {
  const response = await mySavedAlbums(accessToken);
  for (let i = 0; i < response.items.length; i++) {
    const savedAlbumsDiv = document.createElement("div");
    savedAlbumsDiv.classList.add("saved-albums-container");

    const savedAlbumsImg = document.createElement("img");
    savedAlbumsImg.src = response.items[i].album.images[0].url;
    savedAlbumsImg.classList.add("saved-albums-img");
    savedAlbumsDiv.appendChild(savedAlbumsImg);

    const savedAlbumsLink = document.createElement("a");
    savedAlbumsLink.href = response.items[i].album.external_urls.spotify;
    savedAlbumsLink.textContent = response.items[i].album.name; // fix
    savedAlbumsLink.classList.add("saved-albums-link");
    savedAlbumsDiv.appendChild(savedAlbumsLink); // fix

    savedAlbums.appendChild(savedAlbumsDiv); // fix
  }
};

const getRecommendations = async (accessToken, artistIds) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        seed_artists: artistIds.join(","),
        limit: 10,
        market: "IN",
      },
    };
    const response = await axios.get(
      "https://api.spotify.com/v1/recommendations",
      config
    );
    return response.data.tracks;
  } catch (err) {
    console.log(err);
  }
};

const recommendations = document.querySelector(".recomended-tracks");
const displayRecommendedTracks = async (accessToken) => {
  const artistIds = [
    "1Xyo4u8uXC1ZmMpatF05PJ",
    "3TVXtAsR1Inumwj472S9r4",
    "2YZyLoL8N0Wb9xBt1NhZWg",
    "0uq5PttqEjj3IH1bzwcrXF",
    "66CXWjxzNUsdJxJ2JdwvnR",
  ];

  const tracks = await getRecommendations(accessToken, artistIds);

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const recommendationDiv = document.createElement("div");
    recommendationDiv.classList.add("recommendation-container");

    const recommendationImg = document.createElement("img");
    recommendationImg.src = track.album.images[0].url;
    recommendationImg.classList.add("recommendation-img");
    recommendationDiv.appendChild(recommendationImg);

    const recommendationLink = document.createElement("a");
    recommendationLink.href = track.external_urls.spotify;
    recommendationLink.textContent = track.name;
    recommendationLink.classList.add("recommendation-link");
    recommendationDiv.appendChild(recommendationLink);

    recommendations.appendChild(recommendationDiv);
  }
};

const mySavedEpisodes = async (accessToken) => {
  try {
    const configSearches = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit: 10,
        offset: 0,
      },
    };
    const response = await axios.get(
      "https://api.spotify.com/v1/me/episodes",
      configSearches
    );

    return response.data;
  } catch (err) {
    console.log(err);
  }
};

const savedEpisodes = document.querySelector(".saved-episodes");
const displaySavedEpisodes = async (accessToken) => {
  const response = await mySavedEpisodes(accessToken);
  for (let i = 0; i < response.items.length; i++) {
    const savedEpisodesDiv = document.createElement("div");
    savedEpisodesDiv.classList.add("saved-episodes-container");

    const savedEpisodesImg = document.createElement("img");
    savedEpisodesImg.src = response.items[i].episode.images[0].url;
    savedEpisodesImg.classList.add("saved-episodes-img");
    savedEpisodesDiv.appendChild(savedEpisodesImg);

    const savedEpisodesLink = document.createElement("a");
    savedEpisodesLink.href = response.items[i].episode.external_urls.spotify;
    savedEpisodesLink.textContent = response.items[i].episode.name;
    savedEpisodesLink.classList.add("saved-episodes-link");
    savedEpisodesDiv.appendChild(savedEpisodesLink);

    savedEpisodes.appendChild(savedEpisodesDiv);
  }
};

const savedEp = document.querySelector(".your-saved-episodes");
// const savedEpDiv = document.querySelector(".saved-episodes-container");
savedEp.addEventListener("click", (event) => {
  event.preventDefault(); // prevent the default link behavior

  savedEpisodes.scrollIntoView({
    behavior: "smooth",
    block: "start",
    inline: "nearest",
  }); // scroll to the saved episodes section

  // add a CSS class to highlight the saved episodes section
  savedEpisodes.classList.add("highlight");
  setTimeout(() => {
    savedEpisodes.classList.remove("highlight");
  }, 10000);
});

window.onSpotifyWebPlaybackSDKReady = () => {
  const player = new Spotify.Player({
    name: "My Web Playback SDK Player",
    getOAuthToken: (callback) => {
      // Call the callback function with your access token
      callback(accessToken);
    },
    volume: 0.5,
  });

  // Add event listeners to the player
  player.addListener("ready", ({ device_id }) => {
    console.log("Device ID:", device_id);
    playTrack(accessToken, device_id); // Start playing the track
  });

  // Connect to the player
  player.connect();
};

const getDeviceId = async (accessToken) => {
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/devices",
      config
    );
    const devices = response.data.devices;
    if (devices.length > 0) {
      return devices[0].id;
    } else {
      console.log("No devices found");
    }
  } catch (err) {
    console.log("Error retrieving devices");
  }
};

const playTrack = async (accessToken, deviceId) => {
  const trackUri = "spotify:track:1AhDOtG9vPSOmsWgNW0BEY";

  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };

  const data = {
    uris: [trackUri],
  };

  try {
    await axios.put(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      data,
      config
    );
    // console.log("Track played successfully");
    player.play(); // Start playing the track on the Web Playback SDK player
  } catch (err) {
    console.log("Error playing track: ", err.message);
  }
};

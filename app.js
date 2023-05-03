const clientId = "94593996f06140038693984df35d34a6"; //"8facece69f694f1597ac5242d3e2b5d6";
const redirectUri = "http://127.0.0.1:5500/index.html";

// Store the access token in a variable
let accessToken = "";

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

        displayPlaylistNames(accessToken);

        displayTopArtists(accessToken);

        displayRecentlyPlayedTracks(accessToken);

        displayTopTracks(accessToken);

        displaySavedAlbums(accessToken);

        displayRecommendedTracks(accessToken);

        displaySavedEpisodes(accessToken);

        // displayCurrentlyPlaying(accessToken);
    } catch (error) {
        console.log(error.message + " ---THE MAIN ACCESS TOKEN CALL");

        //agar iss wale area mein code ja raha hai to firse login page pr redirect krdo http://127.0.0.1:5500/login.html
        window.location.href = "http://127.0.0.1:5500/login.html";
    }
};

getAccessToken(
    clientId,
    redirectUri,
    "user-read-private user-read-email playlist-read-private playlist-read-collaborative user-top-read user-library-read user-read-recently-played user-read-playback-state user-modify-playback-state streaming user-read-currently-playing user-library-modify"
);

const search = async(selectedOption, query, accessToken) => {
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
        // console.log(response);
        return response.data.tracks.items;
    } catch (err) {
        console.log("couldn't find what you were looking for");
    }
};

const select = document.querySelector("#select-options");
const searchBar = document.querySelector(".search-bar");
const likeButton = document.querySelector(".like-button");

searchBar.addEventListener("input", async function() {
    const selectedOption = "track";
    const query = this.value;

    try {
        const searchResults = await search(selectedOption, query, accessToken);
        // console.log(searchResults);

        const resultsContainer = document.querySelector(".results-container");

        resultsContainer.innerHTML = "";

        let selectedTrackUri = "";

        let previousSelectedTrack = null;

        for (let i = 0; i < 20; i++) {
            const result = document.createElement("div");
            result.classList.add("result-div");

            const resultNumber = document.createElement("div");
            resultNumber.textContent = i + 1;
            result.appendChild(resultNumber);
            resultNumber.classList.add("result-number");

            const resultImg = document.createElement("img");
            resultImg.src = searchResults[i].album.images[0].url;
            result.appendChild(resultImg);
            resultImg.classList.add("searched-img");

            const resultName = document.createElement("div");
            resultName.textContent = searchResults[i].name;
            result.appendChild(resultName);

            const resultArtist = document.createElement("a");
            resultArtist.textContent = searchResults[i].artists[0].name;
            resultName.appendChild(resultArtist);
            resultArtist.classList.add("searched-song-artist");
            resultArtist.href = searchResults[i].artists[0].external_urls.spotify;

            resultName.classList.add("searched-song-name");

            const resultAlbum = document.createElement("a");
            resultAlbum.textContent = searchResults[i].album.name;
            result.appendChild(resultAlbum);
            resultAlbum.classList.add("searched-song-album");
            resultAlbum.href = searchResults[i].album.external_urls.spotify;

            const songTime = document.createElement("div");

            const time_ms = searchResults[i].duration_ms;
            const time_sec = millisToMinutesAndSeconds(time_ms);
            songTime.textContent = time_sec;

            result.appendChild(songTime);
            songTime.classList.add("searched-song-time");

            // Add an event listener to set the selected track URI when the track is clicked

            result.addEventListener("click", async() => {
                if (previousSelectedTrack) {
                    previousSelectedTrack.classList.remove("track-on-select");
                }

                selectedTrackUri = searchResults[i].uri;

                result.classList.add("track-on-select");

                previousSelectedTrack = result;

                await onSpotifyWebPlaybackSDKReady(selectedTrackUri);
            });

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
const getDeviceId = async(accessToken) => {
    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    };

    try {
        const response = await axios.get(
            "https://api.spotify.com/v1/me/player",
            config
        );

        // console.log("DEVICE ID FROM FUNCTION  : " + response.data.device.id);
        return response.data.device.id;
    } catch (err) {
        console.log("Error getting active device ID: ", err.message);
        return null;
    }
};

const timingBar = document.getElementById("timing-bar");
const startTime = document.getElementById("start-time");
const endTime = document.getElementById("end-time");
const onSpotifyWebPlaybackSDKReady = async(trackUri) => {
    const player = new Spotify.Player({
        name: "My Web Playback SDK Player",
        getOAuthToken: (callback) => {
            // Call the callback function with your access token
            callback(accessToken);
        },
        volume: 0.5,
    });

    let currentTrackUri = trackUri; // Store the current track URI

    player.addListener("player_state_changed", (state) => {
        if (state) {
            displayCurrentlyPlaying(accessToken);
            currentTrackUri = state.track_window.current_track.uri;
            updatePlayPauseButton(player, playPauseButton);
            updateTimingBar(player, timingBar);
            updateStartTime(state, startTime);
            updateEndTime(state, endTime);
        }
    });

    const playPauseButton = document.getElementById("play-pause-button");

    const onPlayPauseButtonClick = () => {
        player.getCurrentState().then((state) => {
            if (!state) {
                console.error("Player state not available");
                return;
            }

            if (state.paused) {
                player.resume();
            } else {
                player.pause();
            }
        });
    };

    // Add click event listener to the play/pause button
    playPauseButton.addEventListener("click", onPlayPauseButtonClick);

    // Add event listeners to the player
    player.addListener("ready", ({ device_id }) => {
        // console.log("Device ID:", device_id);
        // Start playing the track
        playTrack(trackUri, accessToken, device_id);
        toggleTrackInLibrary(accessToken, trackUri);
    });

    // Connect to the player
    player.connect();

    // Function to update the play/pause button
    const updatePlayPauseButton = (player, playPauseButton) => {
        player.getCurrentState().then((state) => {
            if (!state) {
                console.error("Player state not available");
                return;
            }

            if (state.paused) {
                playPauseButton.classList.remove("pause");
                playPauseButton.classList.add("play");
            } else {
                playPauseButton.classList.remove("play");
                playPauseButton.classList.add("pause");
            }
        });
    };
};
const updateTimingBar = (player, timingBar) => {
    player.getCurrentState().then((state) => {
        if (!state) {
            console.error("Player state not available");
            return;
        }

        const duration = state.duration / 1000; // convert milliseconds to seconds
        const position = state.position / 1000; // convert milliseconds to seconds

        timingBar.max = duration;
        timingBar.value = position;

        // Calculate the percentage of the track completed
        const percentComplete = (position / duration) * 100;

        // Set the background color of the progress bar
        timingBar.style.background = `linear-gradient(to right, #1db954 ${percentComplete}%, #999 ${percentComplete}%)`;

        setTimeout(() => {
            updateTimingBar(player, timingBar);
            updateStartTime(state, startTime);
        }, 1000); // update the timing bar every second
    });
};
const updateStartTime = (state, startTime) => {
    const startTimeString = formatTime(state.position);
    startTime.innerText = startTimeString;
};

const updateEndTime = (state, endTime) => {
    const endTimeString = formatTime(state.duration);
    endTime.innerText = endTimeString;
};

const formatTime = (milliseconds) => {
    const totalSeconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const playTrack = async(trackUri, accessToken, deviceId) => {
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
        console.log("Track played successfully");
    } catch (err) {
        console.log("Error playing track: ", err.message);
    }
};

const pauseTrack = async(accessToken) => {
    const device_id = await getDeviceId(accessToken);
    // console.log("DEVICE ID FROM FUNCTION  : " + device_id + " " + accessToken);
    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    };

    try {
        await axios.put(
            `https://api.spotify.com/v1/me/player/pause?device_id=${device_id}`,
            null,
            config
        );
        player.pause();
    } catch (err) {
        console.log("Error pausing track: ", err.message);
    }
};

const searchBarFa = document.querySelector(".search-bar-fa");
let crossButton, headings;
searchBar.addEventListener("input", function() {
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

searchBar.addEventListener("blur", function() {
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

searchBarFa.addEventListener("click", function(e) {
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
const getPlaylists = async(accessToken) => {
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

const displayPlaylistNames = async(accessToken) => {
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

const topArtists = async(accessToken) => {
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
const displayTopArtists = async(accessToken) => {
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

        topArtistsDiv.appendChild(topArtistDisplay);
    }
};

//write a function recently played tracks
const recentlyPlayedTracks = async(accessToken) => {
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
const displayRecentlyPlayedTracks = async(accessToken) => {
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

const topTracks = async(accessToken) => {
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
const displayTopTracks = async(accessToken) => {
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

const mySavedAlbums = async(accessToken) => {
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
const displaySavedAlbums = async(accessToken) => {
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

const getRecommendations = async(accessToken, artistIds) => {
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
const displayRecommendedTracks = async(accessToken) => {
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

const mySavedEpisodes = async(accessToken) => {
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
const displaySavedEpisodes = async(accessToken) => {
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

const getCurrentlyPlaying = async(accessToken) => {
    const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
    };

    try {
        const response = await axios.get(
            "https://api.spotify.com/v1/me/player/currently-playing",
            config
        );
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error(error);
    }
};

const playbarCurrentSong = document.querySelector(".current-song");
window.addEventListener("load", async() => {
    // to see if any track is playing on loading the window
    try {
        await displayCurrentlyPlaying(accessToken);
    } catch (error) {
        console.error(error);
        playbarCurrentSong.innerHTML = "Unable to display currently playing song";
    }
});

const displayCurrentlyPlaying = async(accessToken) => {
    const currentTrack = await getCurrentlyPlaying(accessToken);
    // console.log(currenTrackId);

    if (!currentTrack) {
        // No track is currently playing
        playbarCurrentSong.innerHTML = "No track currently playing";
        playbarCurrentSong.classList.add("current-song-info");
        return;
    }
    const songName = currentTrack.item.name;
    const artistNames = currentTrack.item.artists.map((artist) => artist.name);
    const albumArtwork = currentTrack.item.album.images[0].url;

    // Create elements
    const currentSongInfo = document.createElement("div");
    currentSongInfo.classList.add("current-song-info");

    const albumArtworkImg = document.createElement("img");
    albumArtworkImg.src = albumArtwork;
    albumArtworkImg.alt = "Album Artwork";

    const songDetailsDiv = document.createElement("div");
    songDetailsDiv.classList.add("song-details");

    const songNameHeading = document.createElement("h3");
    songNameHeading.textContent = songName;

    const artistNamesParagraph = document.createElement("p");
    artistNamesParagraph.textContent = artistNames.join(", ");

    // Append elements
    songDetailsDiv.appendChild(songNameHeading);
    songDetailsDiv.appendChild(artistNamesParagraph);

    currentSongInfo.appendChild(albumArtworkImg);
    currentSongInfo.appendChild(songDetailsDiv);

    playbarCurrentSong.innerHTML = "";
    playbarCurrentSong.appendChild(currentSongInfo);
};

const ifTrackAlreadyLiked = async(accessToken, trackId) => {
    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    };

    // Check if the track is already in the user's library
    const checkResponse = await axios.get(
        `https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`,
        config
    );
    console.log(checkResponse.data[0]);
    return checkResponse.data[0];
};

const toggleTrackInLibrary = async(accessToken, trackUri) => {
    const trackId = trackUri.split(":")[2];
    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    };
    const isTrackInLibrary = await ifTrackAlreadyLiked(accessToken, trackId);
    // const likeButton = document.getElementById("like-button");

    const removeTrackFromLibrary = async() => {
        try {
            await axios.delete(
                `https://api.spotify.com/v1/me/tracks?ids=${trackId}`,
                config
            );
            likeButton.classList.remove("clicked");
            likeButton.addEventListener("click", addTrackToLibrary);
            likeButton.removeEventListener("click", removeTrackFromLibrary);
        } catch (err) {
            console.log("CANT UNLIKE : " + err.message);
        }
    };

    const addTrackToLibrary = async() => {
        const data = {
            ids: [trackId],
        };
        try {
            await axios.put("https://api.spotify.com/v1/me/tracks", data, config);
            likeButton.classList.add("clicked");
            likeButton.addEventListener("click", removeTrackFromLibrary);
            likeButton.removeEventListener("click", addTrackToLibrary);
        } catch (err) {
            console.log("CANT LIKE : " + err.message);
        }
    };

    // add initial click event listener based on whether the track is already in the library
    if (isTrackInLibrary) {
        likeButton.classList.add("clicked");
        likeButton.addEventListener("click", removeTrackFromLibrary);
    } else {
        likeButton.classList.remove("clicked");
        likeButton.addEventListener("click", addTrackToLibrary);
    }
};
// GET THE ACCESS TOKEN: The access token is a string which contains the credentials and permissions that can be used to access a given resource(e.g artists, albums or tracks) or user 's data (e.g your profile or your playlists).

const clientId = "1e7f5060110348619d19e187105ce4ce";

    const base64AuthString = btoa(authString); // we need a base64 string btoa() turns it into base64

    const config = {
        headers: {
            Authorization: `Basic ${base64AuthString}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    };

    const data = new URLSearchParams();
    data.append("grant_type", "client_credentials");

    try {
        const response = await axios.post(
            "https://accounts.spotify.com/api/token",
            data,
            config
        );
        //console.log(response); //logs the full return from the api call
        return response.data.access_token;
        //     return "BQCDNwKwBmdzOcehxf0m96395cQnije5hot80zZEOeormaZLW2rxb4ltRik15QN3YKSYMHrayk38dQxtWZB6XRImzBUKYWALFNv6LoFXsyPsmCRyHWwtQ0GdlmIEUoqNKYFUAFk1SJ92pM1IWIaGJ6rRsp6fiaToPlgXNInPqgfzEYPqFKQ0xNhqCY1tmnZcCVinMCIlc0_BROxJJICqxZMlGgf6cnLNNFkAK9GU2kf3-ksy6PZZI_Jw2C9A-HOkZzbyc2BvEEZlP6cYHVEXhfcXetldrwieDkDraBauWhYe4d8BSNNHDstAmgS_uRZ-hzZm8rs4VpqMTbsVkfZ8gBbzWUIS49GBKvY7cIG84aw";
    } catch (error) {
        console.error(error);
        throw new Error("Failed to get access token");
    }
};

//Now lets get the Artists info
//for that we need the artist id
// get artist endpoint : https://api.spotify.com/v1/artists/{id}
// our API call must include access_token we acquired above using the authorization header

// const getArtist = async () => {
//   const id = "0TnOYISbd1XYRBk9myaseg";

//   const configArtist = {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//   };
//   try {
//     const responseArtist = await axios.get(
//       `https://api.spotify.com/v1/artists/${id}`,
//       configArtist
//     );
//     console.log(responseArtist);
//     return responseArtist;
//   } catch (error) {
//     //   console.error(error);
//     throw new Error("Failed to get access artist");
//   }
// };

// const btn = document.querySelector("button");
// btn.addEventListener("click", async() => {
//     const artist = await getArtist();
//     console.log(artist.data.name);
// });

// we need a method to get the id of the artist so that we can directly pass it to the methods paramters

// searching for artists albums tracks etc
// ENDPOINT : https://api.spotify.com/v1/search

const search = async(selectedOption, query) => {
    const configSearches = {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        params: {
            q: query,
            type: `${selectedOption}`,
            market: "US",
            limit: 10,
            offseet: 0,
        },
    };

    try {
        const response = await axios.get(
            "https://api.spotify.com/v1/search",
            configSearches
        );
        // console.log(response);
        return response.data[selectedOption + "s"].items; // this "s" appended because the api returns json obejct as tracks : .... and we are passing selectedOption = track,album etc so we need to append s
    } catch (err) {
        console.log("couldn't find what you were looking for");
    }
};

const select = document.querySelector("#select-options");
const searchBar = document.querySelector(".search");

select.addEventListener("change", async function() {
    const selectedOption = this.value;
    const query = searchBar.value; //gets the value from the serach bar
    // console.log(query);
    // console.log(selectedOption);
    try {
        const searchResults = await search(selectedOption, query);
        console.log(searchResults);

        const resultsContainer = document.querySelector(".results-container");
        // Clear the search results container

        for (let i = 0; i < 10; i++) {
            const result = document.createElement("div");
            result.classList.add("result"); //  dynamically adding class names to div

            // create an image element for the search result
            const resultImg = document.createElement("img");
            resultImg.src = searchResults[i].album.images[0].url;
            result.appendChild(resultImg);
            resultImg.classList.add("searchedImg"); //  dynamically adding class names to img

            // create a paragraph element for the search result name
            const resultName = document.createElement("p");
            resultName.textContent = searchResults[i].name;
            result.appendChild(resultName);
            resultName.classList.add("searchedSongName"); //  dynamically adding class names to p tags

            // append the search result to the results container
            resultsContainer.appendChild(result);
        }
    } catch (err) {
        console.log("COUDNT FIND WHAT YOU WERE LOOKING FOR");
    }
});

// task for tomorrow
// -- > see how to actually play the song on clicking
// -- > see how the dynamic carosel and other shit is implemented

window.onSpotifyPlayerAPIReady = () => {
    const player = new Spotify.Player({
        name: "Web Playback SDK Template",
        getOAuthToken: (cb) => {
            cb(token);
        },
    });

    // Error handling
    player.on("initialization_error", (e) => console.error(e));
    player.on("authentication_error", (e) => console.error(e));
    player.on("account_error", (e) => console.error(e));
    player.on("playback_error", (e) => console.error(e));

    // Playback status updates
    player.on("player_state_changed", (state) => {
        console.log(state);
        $("#current-track").attr(
            "src",
            state.track_window.current_track.album.images[0].url
        );
        $("#current-track-name").text(state.track_window.current_track.name);
    });

    // Ready
    player.on("ready", (data) => {
        console.log("Ready with Device ID", data.device_id);

        // Play a track using our new device ID
        play(data.device_id);
    });

    // Connect to the player!
    player.connect();
};

// Play a specified track on the Web Playback SDK's device ID
function play(device_id) {
    $.ajax({
        url: "https://api.spotify.com/v1/me/player/play?device_id=" + device_id,
        type: "PUT",
        data: '{"uris": ["spotify:track:5ya2gsaIhTkAuWYEMB0nw5"]}',
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + token);
        },
        success: function(data) {
            console.log(data);
        },
    });
}

// checks whether you acocunt is premium or not

const prem = async() => {

    const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
            Authorization: "Bearer " + accessToken,
        },
    });

    const data = await response.json();
    console.log(data);
    if (data.product === "premium") {
        console.log("User has a premium subscription!");
    } else {
        console.log("User does not have a premium subscription.");
    }
};
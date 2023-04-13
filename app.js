// GET THE ACCESS TOKEN: The access token is a string which contains the credentials and permissions that can be used to access a given resource(e.g artists, albums or tracks) or user 's data (e.g your profile or your playlists).

// const getAllScopes = () => {
//     const scopes = [
//         "user-read-private",
//         "user-read-email",
//         "user-read-playback-state",
//         "user-read-currently-playing",
//         "user-read-recently-played",
//         "user-modify-playback-state",
//         "user-library-read",
//         "user-library-modify",
//         "playlist-read-private",
//         "playlist-read-collaborative",
//         "playlist-modify-public",
//         "playlist-modify-private",
//         "user-read-playback-position",
//         "user-read-voice-state",
//         "user-read-private",
//     ];
//     return scopes.join(" ");
// };

const clientId = "3cf39821e56e4a2ead03561abe73f305"; //"8facece69f694f1597ac5242d3e2b5d6";
const clientSecret = "b608caec94634121a7be8fba10db22c3"; //"eb80ba97247e4935837444127db78e3a";

const getAccessToken = async(clientId, clientSecret) => {
    const authString = `${clientId}:${clientSecret}`;
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
        console.log(response); //logs the full return from the api call
        return response.data.access_token;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to get access token");
    }
};
getAccessToken(clientId, clientSecret);
const search = async(selectedOption, query) => {
    const accessToken = await getAccessToken(clientId, clientSecret);
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
        // return response.data[selectedOption + "s"].items; // this "s" appended because the api returns json obejct as tracks : .... and we are passing selectedOption = track,album etc so we need to append s
        return response.data.tracks.items;
    } catch (err) {
        console.log("couldn't find what you were looking for");
    }
};

// const select = document.querySelector("#select-options");
const searchBar = document.querySelector(".search-bar");
let creatingXinSearch = 0; //this is to create that X in search bar when the user types a single word it appears in the search bar

searchBar.addEventListener("input", async function() {
    // const selectedOption = this.value; if you want to search for albums etc use the select option in the html
    const selectedOption = "track";
    const query = this.value; //gets the value from the serach bar
    // console.log(query);
    // console.log(selectedOption);

    creatingXinSearch++;
    console.log(creatingXinSearch);
    //only once the button should be appned to the
    const crossButton = document.createElement("button");
    crossButton.innerText = "X";
    crossButton.classList.add("cross-button");
    const searchBarFa = document.querySelector(".search-bar-fa");
    if (creatingXinSearch === 1) {
        searchBarFa.appendChild(crossButton);
        creatingXinSearch = 999;
        console.log(creatingXinSearch);
    }

    const cross = document.querySelector(".cross-button");
    cross.addEventListener("click", function() {
        searchBar.value = "";
        // crossButton.innerText = "";
    });

    try {
        const searchResults = await search(selectedOption, query);
        console.log(searchResults);

        const resultsContainer = document.querySelector(".results-container");

        // Clear the search results container
        resultsContainer.innerHTML = "";
        for (let i = 0; i < 10; i++) {
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
            const resultArtist = document.createElement("div");
            resultArtist.textContent = searchResults[i].artists[0].name;
            resultName.appendChild(resultArtist);
            resultName.classList.add("searched-song-name"); //  dynamically adding class names to p tags

            //get the album to which this song belongs
            const resultAlbum = document.createElement("div");
            resultAlbum.textContent = searchResults[i].album.name;
            result.appendChild(resultAlbum);
            resultAlbum.classList.add("searched-song-album"); //  dynamically adding class names to p tags

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
//unauthorized to get the email and user detail

// const checkPremium = async() => {
//     const accessToken = await getAccessToken(clientId, clientSecret);

//     const config = {
//         headers: {
//             Authorization: `Bearer ${accessToken}`,
//         },
//     };

//     try {
//         const response = await axios.get("https://api.spotify.com/v1/me", config);

//         if (response.data.product === "premium") {
//             console.log("User has a premium subscription!");
//         } else {
//             console.log("User does not have a premium subscription.");
//         }
//     } catch (error) {
//         console.error(error);
//     }
// };

// --> improve the search bar that is if you change a word the list changes and add a cancel button to close the list
// --> start buildind the UI (recently played , playlist liked songs etc ...)
// -->
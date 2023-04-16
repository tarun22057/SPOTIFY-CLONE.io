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
            limit: 20,
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

searchBar.addEventListener("input", async function() {
    // const selectedOption = this.value; if you want to search for albums etc use the select option in the html
    const selectedOption = "track";
    const query = this.value; //gets the value from the serach bar
    // console.log(query);
    // console.log(selectedOption);
    try {
        const searchResults = await search(selectedOption, query);
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
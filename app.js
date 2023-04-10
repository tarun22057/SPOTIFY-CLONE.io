// GET THE ACCESS TOKEN: The access token is a string which contains the credentials and permissions that can be used to access a given resource(e.g artists, albums or tracks) or user 's data (e.g your profile or your playlists).

const clientId = "8facece69f694f1597ac5242d3e2b5d6";

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

//Now lets get the Artists info
//for that we need the artist id
// get artist endpoint : https://api.spotify.com/v1/artists/{id}
// our API call must include access_token we acquired above using the authorization header

const getArtist = async() => {
    const id = "0TnOYISbd1XYRBk9myaseg";

    const configArtist = {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    };
    try {
        const responseArtist = await axios.get(
            `https://api.spotify.com/v1/artists/${id}`,
            configArtist
        );
        console.log(responseArtist);
        return responseArtist;
    } catch (error) {
        //   console.error(error);
        throw new Error("Failed to get access artist");
    }
};

// const btn = document.querySelector("button");
// btn.addEventListener("click", async() => {
//     const artist = await getArtist();
//     console.log(artist.data.name);
// });

// we need a method to get the id of the artist so that we can directly pass it to the methods paramters
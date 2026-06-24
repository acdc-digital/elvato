Quick Start Tutorial
This tutorial walks you through building a very simple Node.js application from start to finish. By the end, you will have a working application with a valid OAuth 2.0 access token to make requests to any scoped endpoint.

Initial setup#
To get setup, follow these general steps:

To begin, you’ll need a development environment with Node.js installed. If you’re unfamiliar with this setup, follow these official instructions.
In your environment, create a directory called etsyapp and a new file in that directory called hello.js:
mkdir etsyapp
cd etsyapp
touch hello.js
Write a one line JavaScript program to print a string literal to the console:
console.log('Hello, world!');
Save hello.js
Open a terminal window, navigate to the etsyapp directory and type the following command:
node hello.js
If your node and development environment is set up correctly, the terminal responds with the message "Hello, world!"

Get your API key#
To complete any request to the Etsy Open API v3, you require an Etsy API key. Etsy issues API keys upon request to develop an application for your Etsy account.

Register a new application#
If you already have an existing Etsy application, you can skip to the next section. If you don’t, you’ll need to create one. Open a web browser and navigate to https://www.etsy.com/developers/register and fill out the required information.

Find the keystring and shared secret for your application#
Navigate to Manage your apps on Etsy’s developer page.
Click on the visibility icon next to the shared secret for the application you want to use in this tutorial. Copy down your Etsy App API Key keystring and shared secret. Be sure not to publish the shared secret.
Important
Your API key is not active until it has been approved. Once approved, the status will be updated in the "Manage Your Apps" section. Approval is a prerequisite before continuing with this tutorial.

Start with a simple Express server application#
The OAuth2 Authorization Code flow requires a callback URL to which to send the authorization code, which in this case maps to your application. For a server-side app built with Node, this means Node must be running as a server and the callback URL must map to a specific resource on that server. To keep this example simple, we use the Express package for Node and build a basic web service to handle the OAuth2 Authorization Code response.

To build a simple web server in Node, perform the following steps:

We will be using several npm packages for this tutorial. Start by creating a new file in your etsyapp directory called package.json. Paste the following code in the file and save it.
{
  "name": "etsyapp",
  "version": "0.0.1",
  "description": "A simple Node app that makes requests to Etsy’s Open API.",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "4.x",
    "hbs": "^4.1.2",
    "node-fetch": "^2.6.1"
  },
  "license": "MIT"
}
From your terminal, run npm install.

Create a new file called server.js in your etsyapp directory. For example, you can type the following command in the terminal window and press enter:

    touch server.js
Open server.js for editing and write code to start a simple web server on port 3003. For example, if your host URL is localhost:

// Import the express library
const express = require('express')

// Create a new express application
const app = express();

// Send a "Hello World!" response to a default get request
app.get('/', (req, res) => {
    res.send('Hello, world!')
})

// Start the server on port 3003
const port = 3003
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
Save server.js

Open a terminal window and type the following command:

node server.js
If you successfully started the web server, your console log should read:

Example app listening at http://localhost:3003
And if you open http://localhost:3003 in a web browser on the same machine or any connected machine, you should see the message "Hello, world!" on the web page.

✓ Checkpoint: Express server running#
At this point you should have:

A running Express server on port 3003
A browser showing "Hello, world!" at http://localhost:3003
Files: package.json, server.js
Test your API key#
There are a limited set of Open API v3 endpoints that do not require an OAuth token, so you can test your API key before requesting an access token. Test your API key using the following procedure:

Open server.js again.
Write code to make a GET request to the ping endpoint — which does not require authentication scopes — and print the response to the console. For example, if your API keystring were 1aa2bb33c44d55eeeeee6fff and your shared secret were a1b2c3d4e5, then your updated code might look like the following:
// Import the express and fetch libraries
const express = require('express');
const fetch = require("node-fetch");

// Create a new express application
const app = express();

// Send a JSON response to a default get request
app.get('/ping', async (req, res) => {
    const requestOptions = {
        'method': 'GET',
        'headers': {
            'x-api-key': '1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5',
        },
    };

    const response = await fetch(
        'https://api.etsy.com/v3/application/openapi-ping',
        requestOptions
    );

    if (response.ok) {
        const data = await response.json();
        res.send(data);
    } else {
        res.send("oops");
    }
});

// Start the server on port 3003
const port = 3003;
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
Save server.js
Open a terminal window and type the following command:
node server.js
Open http://localhost:3003/ping in a web browser on the same machine or any connected machine. If your API keystring and shared secret are working properly, you should see a JSON array that includes the application ID for the application associated with this keystring. The response should look like this:

{
    "application_id": 1234
}
✓ Checkpoint: API key verified#
At this point you should have:

A successful response from the /ping endpoint showing your application ID
Confirmed that your API keystring and shared secret are valid
An updated server.js with the /ping route
Create the client landing page#
We create an entry point to our application by creating a "views" directory — which Express exposes with middleware — and adding a client landing page that makes an OAuth2 request. To create the client landing page, perform the following procedure:

Before you begin, you will need the following authentication parameters:

a redirect URI on your web server, such as http://localhost:3003/oauth/redirect, which you will setup as the '/oauth/redirect' route in the next section
a state string, which can be any non-empty, non-whitespace string, but which you must use in all requests in the same Authorization code flow, for example "superstring"
a PKCE code challenge generated from the code verifier, which Etsy requires later in the authorization code flow
In your etsyapp directory, create a new directory named "views".

Navigate to the /views directory and create a new file called "index.hbs".

Open index.hbs for editing and code a simple HTML page with an OAuth request. For example, to request an authorization code for an Etsy app requiring an email_r scope with an App API Key keystring of 1aa2bb33c44d55eeeeee6fff, you can create a page with one link like the following:

<!DOCTYPE html>
<html>

<body>
<a href="https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3003/oauth/redirect&scope=email_r&client_id=1aa2bb33c44d55eeeeee6fff&state=superstring&code_challenge=DSWlW2Abh-cf8CeLL8-g3hQ2WQyYdKyiu83u_s7nRhI&code_challenge_method=S256">
    Authenticate with Etsy
</a>
</body>

</html>
This link in this template has every element required for an OAuth connect request to Etsy, as detailed in the Authentication topic on this site. If you need help generating the state and code challenge values, follow the instructions below.

Generate the PKCE code challenge#
There are a variety ways to generate the state, code challenge, and code verifier values, but we thought it would be helpful to share an example.

To start, create a new file called code-generator.js.
Paste in the following code.
const crypto = require("crypto");

// The next two functions help us generate the code challenge
// required by Etsy’s OAuth implementation.
const base64URLEncode = (str) =>
  str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest();

// We’ll use the verifier to generate the challenge.
// The verifier needs to be saved for a future step in the OAuth flow.
const codeVerifier = base64URLEncode(crypto.randomBytes(32));

// With these functions, we can generate
// the values needed for our OAuth authorization grant.
const codeChallenge = base64URLEncode(sha256(codeVerifier));
const state = Math.random().toString(36).substring(7);

console.log(`State: ${state}`);
console.log(`Code challenge: ${codeChallenge}`);
console.log(`Code verifier: ${codeVerifier}`);
console.log(`Full URL: https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3003/oauth/redirect&scope=email_r&client_id=1aa2bb33c44d55eeeeee6fff&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`)
Save the file and run node code-generator.js from a terminal prompt. Here’s an example of a successful response in the terminal.
State: jqymnj
Code challenge: EFJQPpJgc83fWhV5DC2amk-KGi2SYE4xZt5izK-m4a0
Code verifier: U4rzPy5bL6wOPuKFIjvRsCue-9njsek7hTaOymure4o
Full URL: https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3003/oauth/redirect&scope=email_r&client_id=1aa2bb33c44d55eeeeee6fff&state=jqymnj&code_challenge=EFJQPpJgc83fWhV5DC2amk-KGi2SYE4xZt5izK-m4a0&code_challenge_method=S256
✓ Checkpoint: OAuth parameters generated#
At this point you should have:

A code-generator.js file that generates PKCE values
Your state, code challenge, and code verifier values (save the code verifier for later!)
A views/ directory with an index.hbs file containing your OAuth link
The full OAuth URL with your API key and generated values
Implement the redirect_uri route#
The URI string for the client landing page above contains a redirect_uri "http://localhost:3003/oauth/redirect", which is a local address to which the OAuth server delivers the authorization code. In Node, this redirect_uri must be a route to a resource to receive the authentication code and use it to request an OAuth token. Use the following procedure to create the redirect route:

Navigate to your /etsyapp directory and open server.js in your editor.
Add code for the "oauth/redirect" route to make a POST request to https://api.etsy.com/v3/public/oauth/token with the authentication code gathered from the request , as shown below:
// Import the express and fetch libraries
const express = require('express');
const fetch = require("node-fetch");
const hbs = require("hbs");

// Create a new express application
const app = express();
app.set("view engine", "hbs");
app.set("views", `${process.cwd()}/views`);

// Send a JSON response to a default get request
app.get('/ping', async (req, res) => {
    const requestOptions = {
        'method': 'GET',
        'headers': {
            'x-api-key': '1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5',
        },
    };

    const response = await fetch(
        'https://api.etsy.com/v3/application/openapi-ping',
        requestOptions
    );

    if (response.ok) {
        const data = await response.json();
        res.send(data);
    } else {
        res.send("oops");
    }
});

// This renders our `index.hbs` file.
app.get('/', async (req, res) => {
    res.render("index");
});

/**
These variables contain your API Key, the state sent
in the initial authorization request, and the client verifier compliment
to the code_challenge sent with the initial authorization request
*/
const clientID = '<your API Key>';
const clientVerifier = '<same as the verifier used to create the code_challenge>';
const redirectUri = 'http://localhost:3003/oauth/redirect';

app.get("/oauth/redirect", async (req, res) => {
    // The req.query object has the query params that Etsy authentication sends
    // to this route. The authorization code is in the `code` param
    const authCode = req.query.code;
    const tokenUrl = 'https://api.etsy.com/v3/public/oauth/token';
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: clientID,
            redirect_uri: redirectUri,
            code: authCode,
            code_verifier: clientVerifier,
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const response = await fetch(tokenUrl, requestOptions);

    // Extract the access token from the response access_token data field
    if (response.ok) {
        const tokenData = await response.json();
        res.send(tokenData);
    } else {
        res.send("oops");
    }
});

// Start the server on port 3003
const port = 3003;
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
Go back to your terminal prompt and run node server.js. Then visit http://localhost:3003. You should see the full JSON payload returned from a successful OAuth flow.
tip
If you see an error after clicking the “Authenticate with Etsy” button, you might need to add your redirect URI.

✓ Checkpoint: OAuth flow working#
At this point you should have:

A working /oauth/redirect route in your server.js
Successfully clicked “Authenticate with Etsy” and authorized the app
Received a JSON response containing an access_token after authorization
Your clientID and clientVerifier values properly set in server.js
Display a response from a scoped endpoint#
To finish the tutorial, we will use the generated access token to make an authenticated request to a scoped endpoint. Follow the steps below to create one last route in your Express application.

Create a "views/welcome.hbs" file. This template will be used to offer a welcome message to the authenticated user. Copy the following code into the file.
<!DOCTYPE html>
<html lang="en">
    <body>
        <h1>Welcome, {{first_name}}!</h1>

        <p>You can now use this example application. 🎉</p>
    </body>
</html>
Write code in our new route handler to request user information from the Open API v3 getUser endpoint. This requires an access token with email_r scope, which was established in the initial authorization code request. For example, this will welcome the authenticated user by their first name:
// Import the express and fetch libraries
const express = require('express');
const fetch = require("node-fetch");
const hbs = require("hbs");

// Create a new express application
const app = express();
app.set("view engine", "hbs");
app.set("views", `${process.cwd()}/views`);

// Send a JSON response to a default get request
app.get('/ping', async (req, res) => {
    const requestOptions = {
        'method': 'GET',
        'headers': {
            'x-api-key': '1aa2bb33c44d55eeeeee6fff:a1b2c3d4e5',
        },
    };

    const response = await fetch(
        'https://api.etsy.com/v3/application/openapi-ping',
        requestOptions
    );

    if (response.ok) {
        const data = await response.json();
        res.send(data);
    } else {
        res.send("oops");
    }
});

// This renders our `index.hbs` file.
app.get('/', async (req, res) => {
    res.render("index");
});

/**
These variables contain your API Key, the state sent
in the initial authorization request, and the client verifier compliment
to the code_challenge sent with the initial authorization request
*/
const clientID = '<your App API Key>';
const sharedSecret = '<your shared secret>';
const clientVerifier = '<same as the verifier used to create the code_challenge>';
const redirectUri = 'http://localhost:3003/oauth/redirect';

app.get("/oauth/redirect", async (req, res) => {
    // The req.query object has the query params that Etsy authentication sends
    // to this route. The authorization code is in the `code` param
    const authCode = req.query.code;
    const tokenUrl = 'https://api.etsy.com/v3/public/oauth/token';
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: clientID,
            redirect_uri: redirectUri,
            code: authCode,
            code_verifier: clientVerifier,
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const response = await fetch(tokenUrl, requestOptions);

    // Extract the access token from the response access_token data field
    if (response.ok) {
        const tokenData = await response.json();
        res.redirect(`/welcome?access_token=${tokenData.access_token}`);
    } else {
        res.send("oops");
    }
});

app.get("/welcome", async (req, res) => {
    // We passed the access token in via the querystring
    const { access_token } = req.query;

    // An Etsy access token includes your shop/user ID
    // as a token prefix, so we can extract that too
    const user_id = access_token.split('.')[0];

    const requestOptions = {
        headers: {
            'x-api-key': `${clientID}:${sharedSecret}`,
            // Scoped endpoints require a bearer token
            Authorization: `Bearer ${access_token}`,
        }
    };

    const response = await fetch(
        `https://api.etsy.com/v3/application/users/${user_id}`,
        requestOptions
    );

    if (response.ok) {
        const userData = await response.json();
        // Load the template with the first name as a template variable.
        res.render("welcome", {
            first_name: userData.first_name
        });
    } else {
        res.send("oops");
    }
});

// Start the server on port 3003
const port = 3003;
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
Go back to your terminal prompt and run node server.js. Then visit http://localhost:3003. If the code_challenge value in your index.hbs file is still valid, you should be able to go through the authentication flow and find yourself at the /welcome page with the following message:
Welcome, <YourName>!
You can now use this example application. 🎉
✓ Checkpoint: Complete application#
Congratulations! At this point you should have:

A complete OAuth 2.0 flow from start to finish
A /welcome page that displays the authenticated user's first name
A views/welcome.hbs template file
Successfully made an authenticated API request to the getUser endpoint
All files from the project structure in place and working
Handling errors#
While thorough error handling is out of scope for this tutorial, here is a simple way to see more of the error response with fetch. When response.ok returns false, you can access the error response with the following code:

if (response.ok) {
    const data = await response.json();
    res.send(data);
} else {
    // Log http status to the console
    console.log(response.status, response.statusText);

    // For non-500 errors, the endpoints return a JSON object as an error response
    const errorData = await response.json();
    console.log(errorData);
    res.send("oops");
}
If you followed every step of this tutorial, you likely ran into an error when implementing the welcome page as your code value had been used before. If you implement the error handling above, errorData would log the following value:

{
  error: 'invalid_grant',
  error_description: 'code has been used previously'
}
Wrap up#
That’s where we will wrap up our quickstart guide. Here are a few places you could turn next:

Requesting a Refresh OAuth Token
API Reference
Explore one of our other tutorials

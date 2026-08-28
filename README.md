SnapDroid

SnapDroid is a simple photo booth web app made for the Android Club at VIT Chennai.

The idea is pretty straightforward:

Take a photo at the booth

Choose a frame/style

Preview the final photo

Download the photo

Keep the photos stored locally

What it uses

React + Vite for the frontend

Node.js + Express for the backend

Nodemailer for the email feature

Local storage for the captured photos and event posters

Project structure

SnapDroid/
├── public/
├── server/
│   ├── photo-queue/
│   │   ├── images/
│   │   └── posters/
│   └── index.cjs
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── ...
├── package.json
└── README.md

Run it locally

Install the dependencies:

npm install

Start the frontend:

npm run dev

Start the backend in another terminal:

node server/index.cjs

Then open the local address shown by Vite in your browser.

Notes

The backend handles the photo queue and other server-side operations.

If you use the email-sending part, keep your email credentials in .env and don't push that file to GitHub.

Example:

EMAIL_USER=your-email@example.com
EMAIL_PASS=your-app-password

Deployment

The frontend can be deployed as a static site, including through GitHub Pages.

The Express backend is different: GitHub Pages cannot run a Node.js server. If the live version needs the backend, deploy the backend separately on a service that supports Node.js and update the frontend API URL accordingly.

Made for

Android Club
VIT Chennai

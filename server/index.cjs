require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "20mb"
  })
);

app.use(
  "/photo-queue",
  express.static(
    path.join(__dirname, "photo-queue")
  )
);

// =====================================================
// GMAIL
// =====================================================

const transporter =
  nodemailer.createTransport({
    service: "gmail",

    auth: {
      user:
        process.env.EMAIL_USER,

      pass:
        process.env.EMAIL_PASS
    }
  });

// =====================================================
// EMAIL CONFIG
// =====================================================

let emailConfig = {
  emailjs: {
    serviceId: "",
    templateId: "",
    publicKey: ""
  },

  resend: {
    apiKey: "",
    fromEmail: ""
  },

  brevo: {
    apiKey: "",
    fromEmail: ""
  }
};

app.get(
  "/api/email-config",
  (req, res) => {
    res.json({
      emailjs: {
        serviceId:
          emailConfig.emailjs.serviceId,

        templateId:
          emailConfig.emailjs.templateId
      },

      resend: {
        configured:
          Boolean(
            emailConfig.resend.apiKey
          ),

        fromEmail:
          emailConfig.resend.fromEmail
      },

      brevo: {
        configured:
          Boolean(
            emailConfig.brevo.apiKey
          ),

        fromEmail:
          emailConfig.brevo.fromEmail
      }
    });
  }
);

app.post(
  "/api/email-config",
  (req, res) => {
    const {
      emailjs,
      resend,
      brevo
    } = req.body;

    emailConfig = {
      emailjs:
        emailjs ||
        emailConfig.emailjs,

      resend:
        resend ||
        emailConfig.resend,

      brevo:
        brevo ||
        emailConfig.brevo
    };

    res.json({
      success: true,

      message:
        "Email configuration saved."
    });
  }
);

// =====================================================
// SNAPDROID PHOTO QUEUE
// =====================================================

const photoQueueDir =
  path.join(
    __dirname,
    "photo-queue"
  );

const imageDir =
  path.join(
    photoQueueDir,
    "images"
  );

const posterDir =
  path.join(
    photoQueueDir,
    "posters"
  );

const queueFile =
  path.join(
    photoQueueDir,
    "queue.json"
  );

// =====================================================
// CREATE FOLDERS
// =====================================================

if (
  !fs.existsSync(
    photoQueueDir
  )
) {
  fs.mkdirSync(
    photoQueueDir,
    {
      recursive: true
    }
  );
}

if (
  !fs.existsSync(
    imageDir
  )
) {
  fs.mkdirSync(
    imageDir,
    {
      recursive: true
    }
  );
}

if (
  !fs.existsSync(
    posterDir
  )
) {
  fs.mkdirSync(
    posterDir,
    {
      recursive: true
    }
  );
}

// =====================================================
// LOAD QUEUE
// =====================================================

let photoQueue = [];

if (
  fs.existsSync(
    queueFile
  )
) {
  try {
    photoQueue =
      JSON.parse(
        fs.readFileSync(
          queueFile,
          "utf8"
        )
      );

  } catch (error) {
    console.error(
      "Could not read queue.json:",
      error
    );

    photoQueue = [];
  }
}

// =====================================================
// SAVE QUEUE
// =====================================================

function saveQueue() {
  fs.writeFileSync(
    queueFile,

    JSON.stringify(
      photoQueue,
      null,
      2
    ),

    "utf8"
  );
}

// =====================================================
// GET LOCAL PHOTO QUEUE
// =====================================================

app.get(
  "/api/photo-queue",
  (req, res) => {
    try {
      res.json({
        success: true,
        queue: photoQueue
      });

    } catch (error) {
      console.error(
        "❌ Could not load photo queue:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Could not load photo queue."
      });
    }
  }
);

// =====================================================
// SAVE FINAL PHOTO
//
// IMPORTANT:
// PHOTO IS ONLY SAVED LOCALLY.
// NO EMAIL IS SENT HERE.
// =====================================================

app.post(
  "/api/photo-queue",
  async (req, res) => {
    try {
      const {
        finalImage,
        layout,
        emails
      } = req.body;

      console.log(
        "📦 PHOTO QUEUE BODY:"
      );

      console.log({
        hasFinalImage:
          !!finalImage,

        finalImageLength:
          finalImage?.length,

        layout,

        emails
      });

      // -----------------------------------
      // VALIDATE IMAGE
      // -----------------------------------

      if (!finalImage) {
        return res.status(400).json({
          success: false,

          message:
            "Final image is missing."
        });
      }

      // -----------------------------------
      // VALIDATE EMAILS
      // -----------------------------------

      if (
        !Array.isArray(emails) ||
        emails.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "No email addresses provided."
        });
      }

      const validEmails =
        emails
          .map(
            email =>
              String(email).trim()
          )
          .filter(Boolean);

      if (
        validEmails.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "No valid email addresses provided."
        });
      }

      // -----------------------------------
      // CREATE ID
      // -----------------------------------

      const id =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

      // -----------------------------------
      // BASE64 → JPEG
      // -----------------------------------

      const base64Data =
        finalImage.replace(
          /^data:image\/jpeg;base64,/,
          ""
        );

      const filename =
        `${id}.jpg`;

      const imagePath =
        path.join(
          imageDir,
          filename
        );

      // -----------------------------------
      // SAVE IMAGE
      // -----------------------------------

      fs.writeFileSync(
        imagePath,

        Buffer.from(
          base64Data,
          "base64"
        )
      );

      console.log(
        `📸 Photo saved: ${filename}`
      );

      // -----------------------------------
      // QUEUE ITEM
      // -----------------------------------

      const queueItem = {
        id,

        filename,

        imagePath:
          `images/${filename}`,

        emails:
          validEmails,

        layout:
          layout || "unknown",

        status:
          "pending",

        createdAt:
          new Date().toISOString()
      };

      photoQueue.push(
        queueItem
      );

      saveQueue();

      console.log(
        `📦 Photo queued locally: ${filename}`
      );

      // -----------------------------------
      // RESPONSE
      // -----------------------------------

      return res.json({
        success: true,

        message:
          "Photo saved to local queue.",

        queueId:
          id,

        filename
      });

    } catch (error) {
      console.error(
        "❌ Photo queue error:",
        error
      );

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,

          message:
            error.message ||
            "Could not save photo."
        });
      }
    }
  }
);

// =====================================================
// ADMIN — SEND SELECTED PHOTOS
// =====================================================

app.post(
  "/api/photo-queue/send",
  async (req, res) => {
    try {
      const {
        queueIds
      } = req.body;

      // -----------------------------------
      // VALIDATE SELECTION
      // -----------------------------------

      if (
        !Array.isArray(queueIds) ||
        queueIds.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "No photos selected."
        });
      }

      // -----------------------------------
      // FIND SELECTED PHOTOS
      // -----------------------------------

      const selectedPhotos =
        photoQueue.filter(
          item =>
            queueIds.includes(
              item.id
            )
        );

      if (
        selectedPhotos.length === 0
      ) {
        return res.status(404).json({
          success: false,

          message:
            "Selected photos were not found."
        });
      }

      // =================================================
      // EMAIL ASSETS
      // =================================================

      const logoPath =
        path.join(
          posterDir,
          "android_club_logo.jpeg"
        );

      const agentArenaPath =
        path.join(
          posterDir,
          "agent-arena.jpg"
        );

      const zeroToFirstCommitPath =
        path.join(
          posterDir,
          "zero-to-first-commit.jpg"
        );

      // =================================================
      // CHECK EMAIL ASSETS
      // =================================================

      if (
        !fs.existsSync(
          logoPath
        )
      ) {
        return res.status(500).json({
          success: false,

          message:
            "Android Club logo is missing. Put android-club-logo.jpg inside server/photo-queue/posters/"
        });
      }

      if (
        !fs.existsSync(
          agentArenaPath
        )
      ) {
        return res.status(500).json({
          success: false,

          message:
            "agent-arena.jpg is missing from server/photo-queue/posters/"
        });
      }

      if (
        !fs.existsSync(
          zeroToFirstCommitPath
        )
      ) {
        return res.status(500).json({
          success: false,

          message:
            "zero-to-first-commit.jpg is missing from server/photo-queue/posters/"
        });
      }

      // =================================================
      // PLAIN TEXT FALLBACK
      // =================================================

      const emailText = `We hope you had an amazing time at the Club Expo!

As promised, we’re sharing the photos captured during the event. 📸

You can find your memories from the Expo attached to this mail.

But hey, the fun doesn’t have to end here! 👀

If you enjoyed interacting with us at the Expo, this is your chance to be a part of Android Club and get involved in everything we have planned ahead.

🚀 Join the Android Club Recruitment Drive

Registration Link:

https://recruitments.androidclub.in/

We’ve also got some exciting events coming up, so make sure you check out the posters attached below and keep an eye out for the registrations!

We’d love to see you at our upcoming events and hopefully, as a part of the Android Club family soon.💚

Regards,
Team Android Club
VIT Chennai`;

      // =================================================
      // BEAUTIFUL HTML EMAIL
      // =================================================

      const emailHtml = `<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width,
               initial-scale=1.0">

<title>
Your Memories with Android Club
</title>

</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f3f7f4;
    font-family:Arial,
                 Helvetica,
                 sans-serif;
    color:#202124;
  "
>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    background:#f3f7f4;
    padding:30px 12px;
  "
>

<tr>

<td align="center">

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    max-width:640px;
    background:#ffffff;
    border-radius:22px;
    overflow:hidden;
    box-shadow:
      0 8px 30px
      rgba(0,0,0,0.08);
  "
>

<!-- ========================================= -->
<!-- HEADER -->
<!-- ========================================= -->

<tr>

<td
  align="center"
  style="
    background:#42e087;
    padding:38px 25px 34px;
  "
>

<img
  src="cid:androidclublogo"
  width="105"
  alt="Android Club VIT Chennai"
  style="
    display:block;
    width:105px;
    height:105px;
    border-radius:50%;
    background:#ffffff;
    border:6px solid #ffffff;
    object-fit:cover;
    margin-bottom:18px;
  "
>

<div
  style="
    color:#ffffff;
    font-size:30px;
    font-weight:800;
    letter-spacing:-0.5px;
  "
>
Android Club
</div>

<div
  style="
    color:#ffffff;
    font-size:15px;
    margin-top:6px;
    opacity:0.95;
  "
>
VIT Chennai
</div>

</td>

</tr>

<!-- ========================================= -->
<!-- CONTENT -->
<!-- ========================================= -->

<tr>

<td
  style="
    padding:38px 38px 30px;
  "
>

<div
  style="
    display:inline-block;
    padding:7px 13px;
    border-radius:30px;
    background:#e8f9ee;
    color:#20a954;
    font-size:12px;
    font-weight:700;
    letter-spacing:0.5px;
    margin-bottom:18px;
  "
>
CLUB EXPO
</div>

<h1
  style="
    margin:0 0 20px;
    font-size:28px;
    line-height:1.25;
    color:#17231b;
  "
>
Your Memories Are Here! 💚
</h1>

<p
  style="
    margin:0 0 18px;
    font-size:16px;
    line-height:1.7;
    color:#3d4641;
  "
>
We hope you had an amazing time at the Club Expo!
</p>

<p
  style="
    margin:0 0 18px;
    font-size:16px;
    line-height:1.7;
    color:#3d4641;
  "
>
As promised, we’re sharing the photos captured during the event. 📸
</p>

<p
  style="
    margin:0 0 24px;
    font-size:16px;
    line-height:1.7;
    color:#3d4641;
  "
>
You can find your memories from the Expo attached to this mail.
</p>

<!-- FUN CARD -->

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    background:#f5fbf7;
    border:1px solid #dff2e5;
    border-radius:16px;
    margin:0 0 26px;
  "
>

<tr>

<td
  style="
    padding:22px;
  "
>

<div
  style="
    font-size:18px;
    font-weight:700;
    color:#17231b;
    margin-bottom:10px;
  "
>
But hey, the fun doesn’t have to end here! 👀
</div>

<div
  style="
    font-size:15px;
    line-height:1.7;
    color:#4b554f;
  "
>
If you enjoyed interacting with us at the Expo,
this is your chance to be a part of Android Club
and get involved in everything we have planned ahead.
</div>

</td>

</tr>

</table>

<!-- RECRUITMENT -->

<div
  style="
    font-size:20px;
    font-weight:800;
    color:#17231b;
    margin-bottom:12px;
  "
>
🚀 Join the Android Club Recruitment Drive
</div>

<div
  style="
    font-size:15px;
    color:#555e58;
    margin-bottom:10px;
  "
>
Registration Link:
</div>

<a
  href="https://recruitments.androidclub.in/"
  style="
    display:block;
    background:#35d879;
    color:#ffffff;
    text-decoration:none;
    text-align:center;
    padding:15px 20px;
    border-radius:12px;
    font-size:15px;
    font-weight:800;
    margin-bottom:30px;
  "
>
JOIN THE RECRUITMENT DRIVE →
</a>

<!-- EVENTS -->

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    background:#17231b;
    border-radius:18px;
    margin-bottom:25px;
  "
>

<tr>

<td
  style="
    padding:25px;
  "
>

<div
  style="
    color:#6cff9c;
    font-size:12px;
    font-weight:800;
    letter-spacing:1px;
    margin-bottom:9px;
  "
>
WHAT'S COMING UP
</div>

<div
  style="
    color:#ffffff;
    font-size:21px;
    font-weight:800;
    margin-bottom:12px;
  "
>
Upcoming Events 👀
</div>

<div
  style="
    color:#d8e5dd;
    font-size:15px;
    line-height:1.7;
  "
>
We’ve also got some exciting events coming up,
so make sure you check out the posters attached below
and keep an eye out for the registrations!
</div>

</td>

</tr>

</table>

<p
  style="
    margin:0 0 25px;
    font-size:15px;
    line-height:1.7;
    color:#4b554f;
  "
>
We’d love to see you at our upcoming events
and hopefully, as a part of the Android Club family soon.💚
</p>

<!-- SIGNATURE -->

<div
  style="
    border-top:1px solid #e5ebe7;
    padding-top:22px;
    font-size:15px;
    line-height:1.7;
    color:#3d4641;
  "
>

<strong
  style="
    color:#17231b;
  "
>
Regards,
</strong>

<br>

Team Android Club
<br>

<strong
  style="
    color:#20a954;
  "
>
VIT Chennai
</strong>

</div>

</td>

</tr>

<!-- ========================================= -->
<!-- FOOTER -->
<!-- ========================================= -->

<tr>

<td
  align="center"
  style="
    background:#f5f8f6;
    padding:22px;
    color:#8a938d;
    font-size:12px;
  "
>
Android Club · VIT Chennai
<br>
Code. Create. Contribute. 💚
</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>`;

      // =================================================
      // RESULTS
      // =================================================

      const results = [];

      // =================================================
      // SEND EACH SELECTED PHOTO
      // =================================================

      for (
        const item of selectedPhotos
      ) {

        // ---------------------------------
        // ALREADY SENT
        // ---------------------------------

        if (
          item.status === "sent"
        ) {

          results.push({
            queueId:
              item.id,

            success:
              false,

            message:
              "Already sent."
          });

          continue;
        }

        // ---------------------------------
        // PHOTO FILE
        // ---------------------------------

        const imageFile =
          path.join(
            imageDir,
            item.filename
          );

        // ---------------------------------
        // CHECK PHOTO
        // ---------------------------------

        if (
          !fs.existsSync(
            imageFile
          )
        ) {

          results.push({
            queueId:
              item.id,

            success:
              false,

            message:
              "Image file is missing."
          });

          continue;
        }

        try {

          // --------------------------------
          // SEND TO EACH EMAIL
          // --------------------------------

          for (
            const email of item.emails
          ) {

            console.log(
              `📧 Sending ${item.filename} → ${email}`
            );

            await transporter.sendMail({

              from:
                process.env.EMAIL_USER,

              to:
                email,

              subject:
                "Your Memories with Android Club Are Here! 💚",

              text:
                emailText,

              html:
                emailHtml,

              attachments: [

                // =================================
                // USER'S SNAPDROID PHOTO
                // =================================

                {
                  filename:
                    "Your-Android-Club-Memory.jpg",

                  path:
                    imageFile,

                  contentType:
                    "image/jpeg"
                },

                // =================================
                // ANDROID CLUB LOGO
                // =================================

                {
                  filename:
                    "android_club_logo.jpeg",

                  path:
                    logoPath,

                  cid:
                    "androidclublogo",

                  contentType:
                    "image/jpeg",

                  contentDisposition:
                    "inline"
                },

                // =================================
                // AGENT ARENA POSTER
                // =================================

                {
                  filename:
                    "Agent-Arena.jpg",

                  path:
                    agentArenaPath,

                  contentType:
                    "image/jpeg"
                },

                // =================================
                // ZERO TO FIRST COMMIT POSTER
                // =================================

                {
                  filename:
                    "Zero-To-First-Commit.jpg",

                  path:
                    zeroToFirstCommitPath,

                  contentType:
                    "image/jpeg"
                }

              ]

            });

            console.log(
              `✅ Email sent → ${email}`
            );
          }

          // =================================
          // ONLY CHANGE STATUS
          // =================================

          item.status =
            "sent";

          item.sentAt =
            new Date().toISOString();

          // =================================
          // IMPORTANT
          //
          // DO NOT DELETE IMAGE
          // DO NOT REMOVE QUEUE ITEM
          //
          // ONLY STATUS CHANGES
          // =================================

          results.push({

            queueId:
              item.id,

            success:
              true,

            email:
              item.emails,

            status:
              "sent"
          });

          console.log(
            `✅ ${item.filename} marked as SENT`
          );

        } catch (
          emailError
        ) {

          console.error(
            `❌ Failed ${item.filename}:`,
            emailError
          );

          // =================================
          // KEEP PHOTO PENDING
          // =================================

          item.status =
            "pending";

          results.push({

            queueId:
              item.id,

            success:
              false,

            message:
              emailError.message,

            status:
              "pending"
          });
        }
      }

      // =================================================
      // SAVE ONLY STATUS CHANGES
      // =================================================

      saveQueue();

      // =================================================
      // IMPORTANT
      //
      // NOTHING IS DELETED.
      //
      // PHOTO REMAINS HERE:
      //
      // server/photo-queue/images/
      //
      // QUEUE ITEM REMAINS IN:
      //
      // server/photo-queue/queue.json
      //
      // ONLY:
      //
      // pending → sent
      //
      // =================================================

      return res.json({

        success:
          true,

        message:
          "Selected photos processed successfully.",

        results
      });

    } catch (error) {

      console.error(
        "❌ Email sending error:",
        error
      );

      if (
        !res.headersSent
      ) {

        return res.status(500).json({

          success:
            false,

          message:
            error.message ||
            "Failed to send emails."
        });
      }
    }
  }
);

// =====================================================
// SERVER
// =====================================================

const PORT = 5001;

app.listen(
  PORT,
  () => {

    console.log(
      `SnapDroid server running on http://localhost:${PORT}`
    );

  }
);
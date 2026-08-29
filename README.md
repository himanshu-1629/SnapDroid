# 📸 SnapDroid

SnapDroid is a fun, interactive photo booth web app created for the **Android Club at VIT Chennai**.

It lets users capture photos, apply different visual filters, choose a photo layout, preview their final memory, and download it.

## ✨ What SnapDroid Does

The experience is simple:

1. 📷 **Capture a photo**
2. 🎨 **Choose a filter/style**
3. 🖼️ **Choose a memory layout**
   - Polaroid
   - Photo Strip
4. 👀 **Preview the final memory**
5. ⬇️ **Download the finished photo**

The application processes the photos directly in the browser, making it lightweight and easy to run as a static web application.

---

## 🛠️ Tech Stack

### Frontend

- **React** – UI and application logic
- **Vite** – Development server and production build tool
- **JavaScript / JSX** – Application functionality
- **CSS** – Styling and animations
- **HTML Canvas** – Photo processing and final image generation

### Storage

Captured photos and application state are handled on the client side using browser storage where required.

---

## 📁 Project Structure

```text
SnapDroid/
├── public/
│   ├── polaroid-frame.png
│   ├── photo-strip-frame.png
│   ├── favicon.svg
│   └── ...
│
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── ...
│
├── index.html
├── package.json
├── vite.config.js
└── README.md

import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("home");
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);

  const selectLayout = (layout) => {
    setSelectedLayout(layout);
  };

  const continueToCamera = () => {
    if (!selectedLayout) {
      alert("Please choose a layout.");
      return;
    }

    setCapturedPhotos([]);
    setScreen("camera");
  };

  const downloadFinalImage = async () => {
    try {
      const finalImage = await createFinalImage(
        capturedPhotos,
        selectedLayout
      );

      const link = document.createElement("a");
      link.href = finalImage;
      link.download = "SnapDroid-Memory.jpg";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setScreen("thankyou");
    } catch (error) {
      console.error("Download error:", error);
      alert("Could not create your photo. Please try again.");
    }
  };

  if (screen === "home") {
    return (
      <main className="welcome">
        <div className="logo">🤖</div>

        <h1>
          SNAP<span>DROID</span>
        </h1>

        <p className="tagline">
          Capture your moment.
        </p>

        <section className="email-card">
          <h2>
            Ready to make a memory? 📸
          </h2>

          <p className="description">
            Take a photo, choose your style, and download your SnapDroid memory.
          </p>

          <button
            className="continue-btn"
            onClick={() => setScreen("layout")}
          >
            LET'S CLICK →
          </button>
        </section>
      </main>
    );
  }

  if (screen === "layout") {
    return (
      <main className="layout-screen">
        <div className="layout-header">
          <div className="small-logo">
            🤖
          </div>

          <p className="step-label">
            STEP 1 OF 3
          </p>

          <h1>
            Choose your <span>vibe.</span>
          </h1>

          <p>
            How do you want your SnapDroid memory to look?
          </p>
        </div>

        <div className="layout-grid">
          <LayoutCard
            name="Polaroid"
            description="Classic single-shot memory"
            icon="📸"
            className="polaroid-preview"
            selected={selectedLayout === "polaroid"}
            onClick={() => selectLayout("polaroid")}
          />

          <LayoutCard
            name="Photo Strip"
            description="Classic photo booth style"
            icon="🎞️"
            className="strip-preview"
            selected={selectedLayout === "strip"}
            onClick={() => selectLayout("strip")}
          />
        </div>

        <button
          className="continue-btn layout-continue"
          onClick={continueToCamera}
        >
          CONTINUE TO CAMERA →
        </button>

        <button
          className="admin-back-button"
          onClick={() => setScreen("home")}
        >
          ← Back
        </button>
      </main>
    );
  }

  if (screen === "camera") {
    return (
      <CameraScreen
        layout={selectedLayout}
        onBack={() => setScreen("layout")}
        onUsePhoto={(photos) => {
          setCapturedPhotos(photos);
          setScreen("preview");
        }}
      />
    );
  }

  if (screen === "preview") {
    return (
      <LayoutPreview
        photos={capturedPhotos}
        layout={selectedLayout}
        onBack={() => setScreen("camera")}
        onContinue={downloadFinalImage}
      />
    );
  }

  if (screen === "thankyou") {
    return (
      <main className="thankyou-screen">
        <div className="thankyou-card">
          <div className="small-logo">
            🤖
          </div>

          <p className="step-label">
            SNAPDROID
          </p>

          <h1>
            Your memory is <span>ready! 🔥</span>
          </h1>

          <p>
            Your photo has been downloaded.
          </p>

          <div className="thankyou-buttons">
            <button
              onClick={() => {
                setCapturedPhotos([]);
                setSelectedLayout(null);
                setScreen("layout");
              }}
              className="continue-button"
            >
              TAKE ANOTHER SNAP →
            </button>

            <button
              onClick={() => {
                setCapturedPhotos([]);
                setSelectedLayout(null);
                setScreen("home");
              }}
              className="home-button"
            >
              ← BACK TO HOME
            </button>
          </div>
        </div>
      </main>
    );
  }

  return null;
}

function CameraScreen({
  layout,
  onBack,
  onUsePhoto
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("original");
  const [countdown, setCountdown] = useState(null);
  const [flash, setFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [photos, setPhotos] = useState([]);

  const photoCount = {
    polaroid: 1,
    strip: 4
  }[layout] || 1;

  const currentPhotoNumber = photos.length + 1;

  const startCamera = async () => {
    try {
      setCameraError(false);

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user"
          },
          audio: false
        });

      streamRef.current = stream;

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current
            .play()
            .catch(() => {});
        }
      }, 50);
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError(true);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }
    };
  }, []);

  const getCanvasFilter = () => {
    const filters = {
      original: "none",
      droid:
        "saturate(1.7) contrast(1.15) brightness(1.08)",
      cyber:
        "saturate(1.8) contrast(1.3) hue-rotate(25deg) brightness(0.95)",
      hacker:
        "grayscale(0.8) contrast(1.5) brightness(0.8) sepia(0.2)",
      retro:
        "sepia(0.55) saturate(1.4) contrast(1.05) brightness(1.05)",
      pixel:
        "saturate(1.8) contrast(1.4) brightness(1.05)"
    };

    return filters[selectedFilter] || "none";
  };

  const capturePhoto = () => {
    if (!videoRef.current || countdown !== null) return;

    setCountdown(3);

    setTimeout(() => {
      setCountdown(2);
    }, 700);

    setTimeout(() => {
      setCountdown(1);
    }, 1400);

    setTimeout(() => {
      setCountdown(null);
      takeSnapshot();
    }, 2100);
  };

  const takeSnapshot = () => {
    if (photos.length >= photoCount) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    ctx.save();

    ctx.filter = getCanvasFilter();

    ctx.translate(width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(
      video,
      0,
      0,
      width,
      height
    );

    ctx.restore();

    const image = canvas.toDataURL(
      "image/jpeg",
      0.92
    );

    const updatedPhotos = [
      ...photos,
      image
    ];

    setPhotos(updatedPhotos);

    if (updatedPhotos.length === photoCount) {
      setCapturedImage(image);

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    }

    setFlash(true);

    setTimeout(() => {
      setFlash(false);
    }, 250);
  };

  const retakePhoto = async () => {
    if (photos.length === 0) {
      setCapturedImage(null);
      startCamera();
      return;
    }

    setPhotos((prevPhotos) =>
      prevPhotos.slice(0, -1)
    );

    setCapturedImage(null);

    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const usePhoto = () => {
    if (photos.length === 0) return;

    onUsePhoto(photos);
  };

  if (capturedImage) {
    return (
      <main className="captured-screen">

        {flash && (
          <div className="camera-flash-overlay">
            <div className="flash-white" />
          </div>
        )}

        <div className="captured-header">

          <div className="camera-logo">
            🤖
          </div>

          <h1>
            SNAP<span>DROID</span>
          </h1>

          <p>
            Looking good. 😎
          </p>

        </div>

        <div className="captured-photo-container">

          <img
            src={capturedImage}
            alt="Captured SnapDroid"
            className="captured-photo"
          />

          <div className="captured-filter">
            {getFilterName(selectedFilter)}
          </div>

        </div>

        <div className="captured-actions">

          <button
            className="retake-btn"
            onClick={retakePhoto}
          >
            🔄 RETAKE
          </button>

          <button
            className="use-photo-btn"
            onClick={usePhoto}
          >
            PREVIEW PHOTO →
          </button>

        </div>

      </main>
    );
  }

  return (
    <main className="camera-screen">

      <canvas
        ref={canvasRef}
        style={{
          display: "none"
        }}
      />

      <div className="camera-top">

        <button
          className="camera-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="camera-brand">

          <div className="camera-logo">
            🤖
          </div>

          <h1>
            SNAP<span>DROID</span>
          </h1>

        </div>

        <div className="camera-layout">
          {layout}
        </div>

      </div>

      <div className="camera-container">

        {cameraError ? (
          <div className="camera-error">

            <div className="camera-error-icon">
              📷
            </div>

            <h2>
              Camera access needed
            </h2>

            <p>
              Please allow camera access
              in your browser to continue.
            </p>

            <button
              className="use-photo-btn"
              onClick={startCamera}
              style={{
                marginTop: "20px"
              }}
            >
              TRY CAMERA AGAIN
            </button>

          </div>
        ) : (
          <>

            {countdown !== null && (
              <div className="camera-countdown">
                <div className="countdown-number">
                  {countdown}
                </div>

                <div className="countdown-text">
                  GET READY! 📸
                </div>
              </div>
            )}

            {photoCount > 1 && (
              <div className="photo-progress">

                <span>
                  PHOTO {currentPhotoNumber}
                </span>

                <small>
                  / {photoCount}
                </small>

              </div>
            )}

            <div className="camera-video-wrapper">

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`camera-video filter-${selectedFilter}`}
              />

              {flash && (
                <div className="camera-flash-overlay">
                  <div className="flash-white" />
                </div>
              )}

            </div>

            <div className="camera-frame">

              <div className="frame-corner top-left" />
              <div className="frame-corner top-right" />
              <div className="frame-corner bottom-left" />
              <div className="frame-corner bottom-right" />

            </div>

            {selectedFilter !== "original" && (
              <div className="active-filter-label">
                {getFilterName(selectedFilter)}
              </div>
            )}

          </>
        )}

      </div>

      <div className="camera-controls">

        <div className="filter-placeholder">

          <button
            className={`filter ${
              selectedFilter === "original"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSelectedFilter("original")
            }
          >
            Original
          </button>

          <button
            className={`filter ${
              selectedFilter === "droid"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSelectedFilter("droid")
            }
          >
            🤖 Droid
          </button>

          <button
            className={`filter ${
              selectedFilter === "cyber"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSelectedFilter("cyber")
            }
          >
            🌌 Cyber
          </button>

          <button
            className={`filter ${
              selectedFilter === "hacker"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSelectedFilter("hacker")
            }
          >
            🕶️ Hacker
          </button>

          <button
            className={`filter ${
              selectedFilter === "retro"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSelectedFilter("retro")
            }
          >
            ✨ Retro
          </button>

          <button
            className={`filter ${
              selectedFilter === "pixel"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSelectedFilter("pixel")
            }
          >
            🎮 Pixel
          </button>

        </div>

        <button
          className="capture-btn"
          onClick={capturePhoto}
          disabled={
            countdown !== null ||
            cameraError
          }
        >
          <span>📸</span>
          CAPTURE
        </button>

      </div>

    </main>
  );
}

async function createFinalImage(
  photos,
  layout
) {
  const frameSrc =
    layout === "polaroid"
      ? "/polaroid-frame.png"
      : "/photo-strip-frame.png";

  const frame = new Image();

  await new Promise((resolve, reject) => {
    frame.onload = resolve;
    frame.onerror = reject;
    frame.src = frameSrc;
  });

  const canvas =
    document.createElement("canvas");

  canvas.width = frame.naturalWidth;
  canvas.height = frame.naturalHeight;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const drawCover = (
    img,
    x,
    y,
    width,
    height,
    radius = 25
  ) => {
    const imageRatio =
      img.naturalWidth /
      img.naturalHeight;

    const boxRatio =
      width / height;

    let sourceWidth =
      img.naturalWidth;

    let sourceHeight =
      img.naturalHeight;

    let sourceX = 0;
    let sourceY = 0;

    if (imageRatio > boxRatio) {
      sourceWidth =
        img.naturalHeight *
        boxRatio;

      sourceX =
        (img.naturalWidth -
          sourceWidth) /
        2;
    } else {
      sourceHeight =
        img.naturalWidth /
        boxRatio;

      sourceY =
        (img.naturalHeight -
          sourceHeight) /
        2;
    }

    ctx.save();

    ctx.beginPath();
    ctx.roundRect(
      x,
      y,
      width,
      height,
      radius
    );

    ctx.clip();

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      x,
      y,
      width,
      height
    );

    ctx.restore();
  };

  if (layout === "polaroid") {
    if (!photos?.[0]) {
      throw new Error(
        "Polaroid photo is missing."
      );
    }

    const photo = new Image();

    await new Promise(
      (resolve, reject) => {
        photo.onload = resolve;
        photo.onerror = reject;
        photo.src = photos[0];
      }
    );

    const x =
      canvas.width * 0.14;

    const y =
      canvas.height * 0.15;

    const width =
      canvas.width * 0.72;

    const height =
      canvas.height * 0.64;

    const centerX =
      x + width / 2;

    const centerY =
      y + height / 2;

    ctx.save();

    ctx.translate(
      centerX,
      centerY
    );

    ctx.rotate(
      3 * Math.PI / 180
    );

    drawCover(
      photo,
      -(width * 1.06) / 2,
      -(height * 1.06) / 2,
      width * 1.06,
      height * 1.06,
      30
    );

    ctx.restore();

    ctx.drawImage(
      frame,
      10,
      0,
      canvas.width,
      canvas.height
    );
  }

  if (layout === "strip") {
    const positions = [
      {
        left: 0.30,
        top: 0.07,
        width: 0.40,
        height: 0.185
      },
      {
        left: 0.30,
        top: 0.262,
        width: 0.40,
        height: 0.19
      },
      {
        left: 0.30,
        top: 0.462,
        width: 0.40,
        height: 0.192
      },
      {
        left: 0.30,
        top: 0.66,
        width: 0.40,
        height: 0.185
      }
    ];

    for (
      let i = 0;
      i < 4;
      i++
    ) {
      if (!photos?.[i]) continue;

      const photo = new Image();

      await new Promise(
        (resolve, reject) => {
          photo.onload = resolve;
          photo.onerror = reject;
          photo.src = photos[i];
        }
      );

      const position =
        positions[i];

      drawCover(
        photo,
        canvas.width *
          position.left,
        canvas.height *
          position.top,
        canvas.width *
          position.width,
        canvas.height *
          position.height,
        25
      );
    }

    ctx.drawImage(
      frame,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  return canvas.toDataURL(
    "image/jpeg",
    0.92
  );
}

function LayoutPreview({
  photos,
  layout,
  onBack,
  onContinue
}) {
  if (
    !photos ||
    photos.length === 0
  ) {
    return null;
  }

  if (layout === "polaroid") {
    return (
      <PolaroidScreen
        photos={photos}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  }

  if (layout === "strip") {
    return (
      <StripScreen
        photos={photos}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  }

  return null;
}

function PolaroidScreen({
  photos,
  onBack,
  onContinue
}) {
  return (
    <main className="polaroid-screen">

      <div className="polaroid-header">

        <div className="camera-logo">
          🤖
        </div>

        <p className="step-label">
          YOUR SNAP
        </p>

        <h1>
          Looking <span>good.</span> 😎
        </h1>

        <p>
          Here's your SnapDroid memory.
        </p>

      </div>

      <div className="polaroid-card">

        <div className="polaroid-photo-window">

          {photos?.[0] && (
            <img
              src={photos[0]}
              alt="Snap"
            />
          )}

        </div>

        <img
          src="/polaroid-frame.png"
          alt=""
          className="polaroid-frame"
        />

      </div>

      <div className="polaroid-actions">

        <button
          type="button"
          className="retake-btn"
          onClick={onBack}
        >
          🔄 RETAKE
        </button>

        <button
          type="button"
          className="use-photo-btn"
          onClick={onContinue}
        >
          DOWNLOAD PHOTO ↓
        </button>

      </div>

    </main>
  );
}

function StripScreen({
  photos,
  onBack,
  onContinue
}) {
  return (
    <main className="strip-screen">

      <section className="strip-header">

        <div className="strip-eyebrow">
          📸
        </div>

        <p>
          YOUR MEMORIES
        </p>

        <h1>
          Four moments.{" "}
          <span>One memory.</span>
        </h1>

        <h2>
          Your SnapDroid memory is ready.
        </h2>

      </section>

      <div className="photo-strip-preview">

        <div className="strip-canvas">

          {photos
            .slice(0, 4)
            .map(
              (photo, index) => (
                <div
                  className={`strip-photo strip-photo-${
                    index + 1
                  }`}
                  key={index}
                >
                  <img
                    src={photo}
                    alt={`Snap ${
                      index + 1
                    }`}
                  />
                </div>
              )
            )}

          <img
            src="/photo-strip-frame.png"
            alt=""
            className="strip-frame-overlay"
          />

        </div>

      </div>

      <div className="strip-actions">

        <button
          type="button"
          className="retake-btn"
          onClick={onBack}
        >
          🔄 RETAKE
        </button>

        <button
          type="button"
          className="use-photo-btn"
          onClick={onContinue}
        >
          DOWNLOAD PHOTO ↓
        </button>

      </div>

    </main>
  );
}

function getFilterName(filter) {
  const names = {
    original: "ORIGINAL",
    droid: "🤖 DROID MODE",
    cyber: "🌌 CYBER MODE",
    hacker: "🕶️ HACKER MODE",
    retro: "✨ RETRO MODE",
    pixel: "🎮 PIXEL MODE"
  };

  return names[filter];
}

function LayoutCard({
  name,
  description,
  icon,
  className,
  selected,
  onClick
}) {
  return (
    <button
      type="button"
      className={`layout-card ${
        selected ? "selected" : ""
      }`}
      onClick={onClick}
    >
      <div
        className={`layout-preview ${className}`}
      >

        {className ===
          "polaroid-preview" && (
          <div className="preview-polaroid">

            <img
              className="polaroid-template-preview"
              src="/polaroid-frame.png"
              alt="Polaroid template"
            />

          </div>
        )}

        {className ===
          "strip-preview" && (
          <div className="preview-strip">

            <img
              src="/photo-strip-frame.png"
              alt="Photo strip template"
              className="template-preview-image"
            />

          </div>
        )}

      </div>

      <div className="layout-info">

        <div>
          <h3>{name}</h3>
          <p>{description}</p>
        </div>

        <span className="layout-icon">
          {icon}
        </span>

      </div>

      {selected && (
        <div className="selected-badge">
          ✓ SELECTED
        </div>
      )}

    </button>
  );
}

export default App;
import { useState } from "react";
import PreviewCanvas from "./components/PreviewCanvas";

export default function App() {
  const [imageSrc, setImageSrc] = useState<string>("");

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageSrc(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        padding: 20,
        background: "#1a1a1a",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <h1>AetherSprite PixelCanvas 128x128</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleImport}
        style={{ marginBottom: 20 }}
      />

      <PreviewCanvas imageSrc={imageSrc} />
    </div>
  );
}

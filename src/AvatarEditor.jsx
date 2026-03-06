import { useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";

export default function AvatarEditorModal({ image, onSave, onCancel }) {
  const editorRef = useRef(null);
  const [scale, setScale] = useState(1.2);

  const handleSave = () => {
    if (!editorRef.current) return;

    const canvas = editorRef.current.getImageScaledToCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div>
      <AvatarEditor
        ref={editorRef}
        image={image}
        width={220}
        height={220}
        border={30}
        borderRadius={110}
        scale={scale}
      />

      <div style={{ marginTop: 15 }}>
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

      <div className="modalButtonsRow" style={{ marginTop: 16 }}>
        <button onClick={handleSave}>Сохранить</button>
        <button className="secondary" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}
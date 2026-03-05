import { useState, useRef } from "react";
import AvatarEditor from "react-avatar-editor";

export default function AvatarEditorModal({
  image,
  onSave,
  onCancel,
}) {
  const editorRef = useRef(null);
  const [scale, setScale] = useState(1);

  const handleSave = () => {
    if (!editorRef.current) return;

    const canvas = editorRef.current.getImageScaledToCanvas();
    const dataUrl = canvas.toDataURL();

    onSave(dataUrl);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <AvatarEditor
          ref={editorRef}
          image={image}
          width={200}
          height={200}
          border={50}
          borderRadius={100}
          scale={scale}
        />

        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value))}
        />

        <div>
          <button onClick={handleSave}>Сохранить</button>
          <button onClick={onCancel}>Отмена</button>
        </div>
      </div>
    </div>
  );
}
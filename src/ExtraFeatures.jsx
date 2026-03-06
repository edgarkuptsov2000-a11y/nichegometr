function ExtraFeatures({ time }) {
  return (
    <div>
      <p>Доп. фишки скоро будут здесь ✨</p>
      <p>Текущее время: {Math.floor(time / 1000)} сек</p>
    </div>
  );
}

export default ExtraFeatures;
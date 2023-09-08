export function displayDate() {
  const date = new Date();
  return (
    "[" + date.toLocaleDateString() + " " + date.toLocaleTimeString() + "]"
  );
}

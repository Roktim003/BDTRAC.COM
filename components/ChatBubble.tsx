export default function ChatBubble() {
  return (
    <button className="chat" aria-label="Chat">
      <svg viewBox="0 0 24 24">
        <path d="M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-4 4V4a1 1 0 0 1 1-1zm3 5v2h10V8H7zm0 4v2h7v-2H7z" />
      </svg>
    </button>
  );
}

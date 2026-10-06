// Full-screen overlay that flies a rocket up the page once, then calls onDone.
export default function Rocketship(props: { onDone: () => void }) {
  return (
    <div className="rocketship" aria-hidden="true">
      <span className="rocketship-rocket" onAnimationEnd={props.onDone}>
        🚀
      </span>
    </div>
  );
}

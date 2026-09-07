import "./Skeleton.css";

/*
  Financial-safety note: a skeleton represents "we are waiting for
  real data", never a placeholder for actual figures. Never render
  a Skeleton alongside fabricated numbers/text pretending to be
  real - if data isn't loaded yet, show the skeleton and nothing
  else in that slot.
*/
export const Skeleton = ({
  width,
  height = "1em",
  circle = false,
  className = "",
  ...rest
}) => (
  <span
    className={`ex2-skeleton ${circle ? "ex2-skeleton--circle" : ""} ${className}`.trim()}
    style={{ width, height }}
    aria-hidden="true"
    {...rest}
  />
);

export const SkeletonText = ({ lines = 3, className = "", ...rest }) => (
  <div
    className={`ex2-skeleton-text ${className}`.trim()}
    role="status"
    aria-label="Loading"
    {...rest}
  >
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height="0.9em"
        width={index === lines - 1 ? "60%" : "100%"}
      />
    ))}
  </div>
);

export default Skeleton;

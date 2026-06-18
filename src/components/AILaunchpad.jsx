import "./AILaunchpad.css";

export default function AILaunchpad() {
  const projects = [
    {
      name: "EXALT AI",
      stage: "Upcoming",
      allocation: "25%",
      roi: "+320%",
      status: "Hot",
    },
    {
      name: "MetaChain",
      stage: "Live",
      allocation: "18%",
      roi: "+180%",
      status: "Active",
    },
    {
      name: "QuantumFi",
      stage: "Ended",
      allocation: "12%",
      roi: "+95%",
      status: "Closed",
    },
  ];

  return (
    <div className="launchpad-page">

      <div className="launchpad-header">
        <h1>AI Launchpad</h1>
        <p>
          Discover high-potential AI projects and participate in token launches.
        </p>
      </div>

      <div className="launchpad-stats">

        <div className="launch-card">
          <span>Projects</span>
          <h2>28</h2>
        </div>

        <div className="launch-card">
          <span>AI Score</span>
          <h2>93%</h2>
        </div>

        <div className="launch-card">
          <span>Avg ROI</span>
          <h2>+215%</h2>
        </div>

        <div className="launch-card">
          <span>Success Rate</span>
          <h2>89%</h2>
        </div>

      </div>

      <div className="launch-table">

        <div className="launch-head">
          <span>Project</span>
          <span>Stage</span>
          <span>Allocation</span>
          <span>ROI</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {projects.map((project, index) => (
          <div className="launch-row" key={index}>

            <strong>{project.name}</strong>

            <span>{project.stage}</span>

            <span>{project.allocation}</span>

            <span className="roi-color">{project.roi}</span>

            <span className="status-color">{project.status}</span>

            <button>View Project</button>

          </div>
        ))}
      </div>

      <div className="launch-ai-box">

        <h2>AI Recommendation</h2>

        <p>
          EXALT AI has the highest AI score and strong growth potential.
          Consider participating before allocation closes.
        </p>

      </div>

    </div>
  );
}
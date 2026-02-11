import "../../styles/provider-mode/providerQuickStats.css";

const ProviderQuickStats = () => {
  const stats = {
    completedJobs: 47,
    averageRating: 4.8,
    totalReviews: 32,
  };

  return (
    <div className="quick-stats-widget">
      <h2 className="widget-title">Quick Stats</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon completed-jobs">📊</div>
          <div className="stat-content">
            <p className="stat-label">Completed Jobs</p>
            <p className="stat-value">{stats.completedJobs}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rating">⭐</div>
          <div className="stat-content">
            <p className="stat-label">Average Rating</p>
            <p className="stat-value">{stats.averageRating}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon reviews">💬</div>
          <div className="stat-content">
            <p className="stat-label">Total Reviews</p>
            <p className="stat-value">{stats.totalReviews}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderQuickStats;

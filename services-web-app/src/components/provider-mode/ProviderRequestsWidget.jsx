import { useState } from "react";
import "../../styles/provider-mode/providerRequestsWidget.css";

const ProviderRequestsWidget = () => {
  const [requests, setRequests] = useState([
    {
      id: 1,
      serviceName: "House Cleaning",
      clientName: "Maria Santos",
      dateTime: "Today at 2:00 PM",
      budget: "$60",
    },
    {
      id: 2,
      serviceName: "Plumbing Repair",
      clientName: "James Wilson",
      dateTime: "Tomorrow at 10:00 AM",
      budget: "$80",
    },
    {
      id: 3,
      serviceName: "Furniture Assembly",
      clientName: "Anna Lee",
      dateTime: "Feb 12 at 3:30 PM",
      budget: "$50",
    },
  ]);

  const handleAccept = (id) => {
    setRequests(requests.filter(req => req.id !== id));
  };

  const handleDecline = (id) => {
    setRequests(requests.filter(req => req.id !== id));
  };

  return (
    <div className="requests-widget">
      <div className="widget-header">
        <h2 className="widget-title">Booking Requests</h2>
        <span className="request-badge">{requests.length}</span>
      </div>

      <div className="requests-list">
        {requests.length === 0 ? (
          <p className="empty-state">No pending requests</p>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="request-item">
              <div className="request-info">
                <h3 className="request-service">{request.serviceName}</h3>
                <p className="request-client">From: {request.clientName}</p>
                <p className="request-datetime">{request.dateTime}</p>
                <p className="request-budget">{request.budget}</p>
              </div>

              <div className="request-actions">
                <button 
                  className="btn-accept"
                  onClick={() => handleAccept(request.id)}
                >
                  Accept
                </button>
                <button 
                  className="btn-decline"
                  onClick={() => handleDecline(request.id)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProviderRequestsWidget;

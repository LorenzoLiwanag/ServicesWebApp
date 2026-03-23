import "../../styles/dashboard/dashboardServicesSection.css";
const DashboardServiceSection = () => {
    const demoServices = [
        {
            ServiceName: "Service 1",
            ProviderName: "John A",
            ServiceDesc: "House Cleaning",
            rate: 4.5,
            price: "$50/hr"
        },
        {
            ServiceName: "Service 2",
            ProviderName: "Jane B",
            ServiceDesc: "Plumbing Repair",
            rate: 4.7,
            price: "$70/hr"
        },
        {
            ServiceName: "Service 3",
            ProviderName: "Mike C",
            ServiceDesc: "Lawn Mowing",
            rate: 4.2,
            price: "$50/hr "

        },
        {
            ServiceName: "Service 4",
            ProviderName: "Sara D",
            ServiceDesc: "Deep house and yard cleaning",
            rate: 4.8,
            price: "$60/hr"
        },
        {
            ServiceName: "Service 5",
            ProviderName: "Tom E",
            ServiceDesc: "Electrical Repairs",
            rate: 4.6,
            price: "$80/hr"
        },
        {
            ServiceName: "Service 6",
            ProviderName: "Lucy F",
            ServiceDesc: "Furniture Assembly",
            rate: 4.3,
            price: "$55/hr" 
        }
    ];


    return (
        <div className="services-section">
            {/* <button className="arrow arrow-left">‹</button> */}
            <h2 className="services-heading">Browse Popular</h2>
            <div className="services-grid">
                {demoServices.map((service, index) => (
                    <div className="service-card" key={index}>
                        <h3 className="service-title">{service.ServiceName}</h3>
                        <p className="service-provider">By: {service.ProviderName}</p>
                        <p className="service-desc">{service.ServiceDesc}</p>
                        <p className="service-rate">Rating: {service.rate}/5</p>
                        <p className="service-price">Price: {service.price}</p>
                        <div className="service-buttons">
                            <button className="btn-contact">Contact</button>
                            <button className="btn-book-now">Book Now</button>
                        </div>
                    </div>
                ))}
            </div>
            {/* <button className="arrow arrow-right">›</button> */}
        </div>
    );
}

export default DashboardServiceSection;

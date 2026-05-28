import bcrypt from "bcrypt";
import "../src/config/loadEnv.js";
import database from "../src/config/Database.js";

const SALT_ROUNDS = 10;

const hash = (pw) => bcrypt.hash(pw, SALT_ROUNDS);

const run = async () => {
  try {
    await database.query("SELECT 1");
    console.log("Database connected.\n");

    // ── Users ──────────────────────────────────────────────────────────────
    console.log("Seeding users...");

    const users = [
      {
        firstName: "Alice",
        lastName: "Client",
        email: "alice@example.com",
        phone: "416-555-0101",
        password: "password123",
        role: "client",
      },
      {
        firstName: "Bob",
        lastName: "Nguyen",
        email: "bob@example.com",
        phone: "416-555-0102",
        password: "password123",
        role: "client",
      },
      {
        firstName: "Carol",
        lastName: "Johnson",
        email: "carol@example.com",
        phone: "416-555-0103",
        password: "password123",
        role: "provider",
      },
      {
        firstName: "Dan",
        lastName: "Handy",
        email: "dan@example.com",
        phone: "416-555-0104",
        password: "password123",
        role: "provider",
      },
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        phone: "416-555-0000",
        password: "admin1234",
        role: "admin",
      },
      {
        firstName: "Admin",
        lastName: "Test",
        email: "admin@test.com",
        phone: "416-555-9999",
        password: "Admin123",
        role: "admin",
      },
    ];

    const userIds = {};

    for (const u of users) {
      const [existing] = await database.execute(
        "SELECT id FROM users WHERE email = ?",
        [u.email]
      );

      if (existing.length > 0) {
        userIds[u.email] = existing[0].id;
        console.log(`  skip  users ${u.email} (exists, id=${existing[0].id})`);
        continue;
      }

      const passwordHash = await hash(u.password);
      const [result] = await database.execute(
        `INSERT INTO users (first_name, last_name, email, phone_number, password_hash, role, approval_status)
         VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
        [u.firstName, u.lastName, u.email, u.phone, passwordHash, u.role]
      );

      userIds[u.email] = result.insertId;
      console.log(`  insert users ${u.email} (id=${result.insertId})`);
    }

    // Carol and Dan are providers
    const carolId = userIds["carol@example.com"];
    const danId = userIds["dan@example.com"];
    const aliceId = userIds["alice@example.com"];
    const bobId = userIds["bob@example.com"];

    // ── Provider Profiles ──────────────────────────────────────────────────
    console.log("\nSeeding provider profiles...");

    const providerProfiles = [
      {
        providerId: carolId,
        displayName: "Carol's Cleaning Co.",
        bio: "Professional home and office cleaning services in the Greater Toronto Area. 5 years of experience. Eco-friendly products available.",
      },
      {
        providerId: danId,
        displayName: "Dan the Handyman",
        bio: "Licensed handyman specializing in furniture assembly, minor repairs, and home maintenance. Fast, reliable, and affordable.",
      },
    ];

    for (const p of providerProfiles) {
      const [existing] = await database.execute(
        "SELECT provider_id FROM provider_profile WHERE provider_id = ?",
        [p.providerId]
      );

      if (existing.length > 0) {
        console.log(`  skip  provider_profile id=${p.providerId} (exists)`);
        continue;
      }

      await database.execute(
        `INSERT INTO provider_profile (provider_id, display_name, bio, is_provider_active, verification_status, average_rating, total_reviews)
         VALUES (?, ?, ?, TRUE, 'verified', 4.80, 12)`,
        [p.providerId, p.displayName, p.bio]
      );

      console.log(`  insert provider_profile id=${p.providerId}`);
    }

    // ── Service Categories ─────────────────────────────────────────────────
    console.log("\nSeeding service categories...");

    const categories = [
      { name: "Cleaning", description: "Home, office, and commercial cleaning services", sort_order: 1 },
      { name: "Handyman", description: "General repairs, furniture assembly, and home maintenance", sort_order: 2 },
      { name: "Landscaping", description: "Lawn care, gardening, and outdoor maintenance", sort_order: 3 },
      { name: "Moving Help", description: "Packing, loading, and moving assistance", sort_order: 4 },
      { name: "Plumbing", description: "Pipe repairs, fixture installation, and plumbing services", sort_order: 5 },
      { name: "Electrical", description: "Electrical repairs, installation, and inspections", sort_order: 6 },
      { name: "Personal Services", description: "Personal care, tutoring, and lifestyle services", sort_order: 7 },
    ];

    const categoryIds = {};

    for (const c of categories) {
      const [existing] = await database.execute(
        "SELECT id FROM service_category WHERE name = ?",
        [c.name]
      );

      if (existing.length > 0) {
        categoryIds[c.name] = existing[0].id;
        console.log(`  skip  service_category "${c.name}" (exists, id=${existing[0].id})`);
        continue;
      }

      const [result] = await database.execute(
        `INSERT INTO service_category (name, description, sort_order, is_active)
         VALUES (?, ?, ?, TRUE)`,
        [c.name, c.description, c.sort_order]
      );

      categoryIds[c.name] = result.insertId;
      console.log(`  insert service_category "${c.name}" (id=${result.insertId})`);
    }

    // ── Provider Services ──────────────────────────────────────────────────
    console.log("\nSeeding provider services...");

    const providerServices = [
      {
        providerId: carolId,
        categoryName: "Cleaning",
        title: "House Cleaning",
        description: "Full home cleaning including kitchen, bathrooms, bedrooms, and living areas. Supplies included.",
        pricingType: "fixed",
        priceAmount: 120.00,
        currency: "CAD",
        locationType: "client_home",
      },
      {
        providerId: carolId,
        categoryName: "Cleaning",
        title: "Office Cleaning",
        description: "Professional office cleaning service. After-hours availability. Sanitization and disinfecting included.",
        pricingType: "hourly",
        priceAmount: 45.00,
        currency: "CAD",
        locationType: "client_home",
      },
      {
        providerId: danId,
        categoryName: "Landscaping",
        title: "Lawn Mowing",
        description: "Residential lawn mowing and edging. Includes cleanup of grass clippings. Up to 5,000 sq ft.",
        pricingType: "fixed",
        priceAmount: 60.00,
        currency: "CAD",
        locationType: "client_home",
      },
      {
        providerId: danId,
        categoryName: "Handyman",
        title: "Furniture Assembly",
        description: "IKEA and flat-pack furniture assembly. Bring your own instructions or I'll download them. First item included.",
        pricingType: "fixed",
        priceAmount: 80.00,
        currency: "CAD",
        locationType: "client_home",
      },
      {
        providerId: danId,
        categoryName: "Moving Help",
        title: "Moving Help",
        description: "Loading, unloading, and carrying furniture and boxes. Local moves only. No truck included.",
        pricingType: "hourly",
        priceAmount: 50.00,
        currency: "CAD",
        locationType: "flexible",
      },
      {
        providerId: danId,
        categoryName: "Plumbing",
        title: "Sink Repair",
        description: "Leaky faucets, clogged drains, and sink fixture repairs. Quote provided after assessment.",
        pricingType: "quote",
        priceAmount: null,
        currency: "CAD",
        locationType: "client_home",
      },
    ];

    const serviceIds = {};

    for (const s of providerServices) {
      const [existing] = await database.execute(
        "SELECT id FROM provider_service WHERE provider_id = ? AND title = ?",
        [s.providerId, s.title]
      );

      if (existing.length > 0) {
        serviceIds[s.title] = existing[0].id;
        console.log(`  skip  provider_service "${s.title}" (exists, id=${existing[0].id})`);
        continue;
      }

      const catId = categoryIds[s.categoryName] || null;

      const [result] = await database.execute(
        `INSERT INTO provider_service
           (provider_id, category_id, title, description, pricing_type, price_amount, currency, service_location_type, is_visible, is_deleted, approval_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE, 'approved')`,
        [s.providerId, catId, s.title, s.description, s.pricingType, s.priceAmount, s.currency, s.locationType]
      );

      serviceIds[s.title] = result.insertId;
      console.log(`  insert provider_service "${s.title}" (id=${result.insertId})`);
    }

    // ── Booking Requests ───────────────────────────────────────────────────
    console.log("\nSeeding booking requests...");

    const houseCleaningId = serviceIds["House Cleaning"];
    const furnitureAssemblyId = serviceIds["Furniture Assembly"];
    const lawnMowingId = serviceIds["Lawn Mowing"];
    const sinkRepairId = serviceIds["Sink Repair"];

    const bookings = [
      {
        clientId: aliceId,
        providerId: carolId,
        serviceId: houseCleaningId,
        requestedDate: "2026-06-05",
        requestedTime: "10:00:00",
        scheduledStart: "2026-06-05 10:00:00",
        scheduledEnd: "2026-06-05 13:00:00",
        clientMessage: "Hi, I need a full house clean before I have guests over. 3-bedroom home.",
        providerMessage: null,
        status: "pending",
      },
      {
        clientId: aliceId,
        providerId: danId,
        serviceId: furnitureAssemblyId,
        requestedDate: "2026-06-10",
        requestedTime: "14:00:00",
        scheduledStart: "2026-06-10 14:00:00",
        scheduledEnd: "2026-06-10 16:00:00",
        clientMessage: "I have 2 IKEA KALLAX shelves and a bed frame to assemble.",
        providerMessage: "Confirmed! I will bring my tools. Should take about 2 hours.",
        status: "accepted",
      },
      {
        clientId: bobId,
        providerId: carolId,
        serviceId: houseCleaningId,
        requestedDate: "2026-05-15",
        requestedTime: "09:00:00",
        scheduledStart: "2026-05-15 09:00:00",
        scheduledEnd: "2026-05-15 12:00:00",
        clientMessage: "Monthly house cleaning. 2-bedroom condo.",
        providerMessage: "Thank you for booking! All done, great working with you.",
        status: "completed",
      },
      {
        clientId: bobId,
        providerId: danId,
        serviceId: lawnMowingId,
        requestedDate: "2026-05-20",
        requestedTime: "08:00:00",
        scheduledStart: "2026-05-20 08:00:00",
        scheduledEnd: null,
        clientMessage: "Backyard and front yard. About 3,000 sq ft total.",
        providerMessage: "Sorry, I am fully booked for that week.",
        status: "declined",
      },
    ];

    const bookingIds = [];

    for (const b of bookings) {
      if (!b.serviceId) {
        console.log(`  skip  booking (service not found)`);
        continue;
      }

      const [result] = await database.execute(
        `INSERT INTO booking_request
           (client_id, provider_id, provider_service_id, requested_date, requested_time,
            scheduled_start, scheduled_end, client_message, provider_response_message, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.clientId,
          b.providerId,
          b.serviceId,
          b.requestedDate,
          b.requestedTime,
          b.scheduledStart,
          b.scheduledEnd,
          b.clientMessage,
          b.providerMessage,
          b.status,
        ]
      );

      bookingIds.push({ id: result.insertId, ...b });
      console.log(`  insert booking_request id=${result.insertId} status=${b.status}`);
    }

    // ── Notifications ──────────────────────────────────────────────────────
    console.log("\nSeeding notifications...");

    const pendingBooking = bookingIds.find((b) => b.status === "pending");
    const acceptedBooking = bookingIds.find((b) => b.status === "accepted");
    const completedBooking = bookingIds.find((b) => b.status === "completed");
    const declinedBooking = bookingIds.find((b) => b.status === "declined");

    const notifications = [];

    if (pendingBooking) {
      // Notify provider of new booking
      notifications.push({
        userId: pendingBooking.providerId,
        bookingId: pendingBooking.id,
        type: "booking_created",
        title: "New booking request",
        message: "You have a new booking request waiting for your response.",
      });
      // Notify client their request was sent
      notifications.push({
        userId: pendingBooking.clientId,
        bookingId: pendingBooking.id,
        type: "provider_job_pending",
        title: "Booking request sent",
        message: "Your booking request has been sent. Waiting for the provider to respond.",
      });
    }

    if (acceptedBooking) {
      // Notify client booking accepted
      notifications.push({
        userId: acceptedBooking.clientId,
        bookingId: acceptedBooking.id,
        type: "booking_accepted",
        title: "Booking accepted",
        message: "Your booking request was accepted. Check your upcoming bookings.",
      });
      // Notify provider upcoming job
      notifications.push({
        userId: acceptedBooking.providerId,
        bookingId: acceptedBooking.id,
        type: "provider_job_upcoming",
        title: "Upcoming job confirmed",
        message: "You have an upcoming job scheduled. Review the details.",
      });
    }

    if (completedBooking) {
      // Notify both parties
      notifications.push({
        userId: completedBooking.clientId,
        bookingId: completedBooking.id,
        type: "booking_completed",
        title: "Service completed",
        message: "Your service has been marked as completed. We hope everything went well!",
      });
      notifications.push({
        userId: completedBooking.providerId,
        bookingId: completedBooking.id,
        type: "booking_completed",
        title: "Job marked as completed",
        message: "The job has been marked as completed. Thank you for your great work!",
      });
    }

    if (declinedBooking) {
      // Notify client booking declined
      notifications.push({
        userId: declinedBooking.clientId,
        bookingId: declinedBooking.id,
        type: "booking_declined",
        title: "Booking declined",
        message: "Your booking request was declined by the provider. You can search for another provider.",
      });
    }

    for (const n of notifications) {
      const [result] = await database.execute(
        `INSERT INTO notification (user_id, booking_request_id, type, title, message, is_read)
         VALUES (?, ?, ?, ?, ?, FALSE)`,
        [n.userId, n.bookingId, n.type, n.title, n.message]
      );
      console.log(`  insert notification id=${result.insertId} type=${n.type} user=${n.userId}`);
    }

    // ── Sample contact inquiry ─────────────────────────────────────────────
    console.log("\nSeeding contact inquiries...");

    const [existingContact] = await database.execute(
      "SELECT id FROM contact_inquiry WHERE email = 'visitor@example.com' LIMIT 1"
    );

    if (existingContact.length === 0) {
      await database.execute(
        `INSERT INTO contact_inquiry (name, email, subject, message, status)
         VALUES (?, ?, ?, ?, 'new')`,
        [
          "Jane Visitor",
          "visitor@example.com",
          "Question about becoming a provider",
          "Hi, I am interested in offering cleaning services on your platform. How do I get started and what is the verification process like?",
        ]
      );
      console.log("  insert contact_inquiry");
    } else {
      console.log("  skip  contact_inquiry (exists)");
    }

    console.log("\nSeed complete.");
    console.log("\n  Test accounts:");
    console.log("  alice@example.com   / password123  (client)");
    console.log("  bob@example.com     / password123  (client)");
    console.log("  carol@example.com   / password123  (provider — Carol's Cleaning Co.)");
    console.log("  dan@example.com     / password123  (provider — Dan the Handyman)");
    console.log("  admin@example.com   / admin1234    (admin)");
    console.log("  admin@test.com      / Admin123     (admin — PRD test account)");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await database.end();
  }
};

run();

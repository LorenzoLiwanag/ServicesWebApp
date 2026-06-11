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

    const makeService = (categoryName, title, description, pricingType, priceAmount, locationType, providerId) => ({
      providerId,
      categoryName,
      title,
      description,
      pricingType,
      priceAmount,
      currency: "PHP",
      locationType,
    });

    const providerServices = [
      ...[
        ["House Cleaning", "Full home cleaning including kitchen, bathrooms, bedrooms, and living areas. Supplies included.", "fixed", 120.00, "client_home", carolId],
        ["Office Cleaning", "Professional office cleaning service. After-hours availability. Sanitization and disinfecting included.", "hourly", 45.00, "client_home", carolId],
        ["Deep Cleaning", "Detailed top-to-bottom cleaning for kitchens, bathrooms, floors, trim, and hard-to-reach areas.", "fixed", 180.00, "client_home", carolId],
        ["Move-Out Cleaning", "Empty-home cleaning for move-outs, rentals, and turnover appointments.", "fixed", 220.00, "client_home", carolId],
        ["Condo Cleaning", "Efficient condo and apartment cleaning for smaller spaces and recurring clients.", "fixed", 95.00, "client_home", carolId],
        ["Post-Renovation Cleaning", "Dust removal, surface cleaning, and final polish after renovation work.", "quote", null, "client_home", carolId],
        ["Window Cleaning", "Interior window, sill, and track cleaning for homes and small offices.", "fixed", 85.00, "client_home", carolId],
        ["Carpet Spot Cleaning", "Spot treatment and light carpet refresh for common household stains.", "fixed", 75.00, "client_home", carolId],
        ["Recurring Maid Service", "Weekly or biweekly cleaning with a consistent checklist and schedule.", "hourly", 40.00, "client_home", carolId],
        ["Airbnb Turnover Cleaning", "Fast guest-ready cleaning with linens, restocking, and photo-ready presentation.", "fixed", 140.00, "client_home", carolId],
        ["Garage Sweep Out", "Sweep, dust, and tidy garage spaces, shelves, and entry areas.", "fixed", 90.00, "client_home", carolId],
      ].map(([title, description, pricingType, priceAmount, locationType, providerId]) =>
        makeService("Cleaning", title, description, pricingType, priceAmount, locationType, providerId)
      ),
      ...[
        ["Furniture Assembly", "IKEA and flat-pack furniture assembly. Bring your own instructions or I'll download them. First item included.", "fixed", 80.00, "client_home", danId],
        ["Wall Mounting", "TVs, shelves, mirrors, curtain rods, and small fixtures mounted securely.", "fixed", 95.00, "client_home", danId],
        ["Door Repair", "Minor interior door alignment, hinge repair, and handle replacement.", "fixed", 90.00, "client_home", danId],
        ["Drywall Patching", "Small drywall holes, dents, sanding, and paint-ready patching.", "fixed", 110.00, "client_home", danId],
        ["Caulking Refresh", "Bathroom, kitchen, and window caulking removal and replacement.", "fixed", 100.00, "client_home", danId],
        ["Cabinet Hardware Install", "Install knobs, pulls, hinges, and basic cabinet adjustments.", "fixed", 75.00, "client_home", danId],
        ["Light Fixture Swap", "Replace simple light fixtures where existing wiring is ready.", "fixed", 85.00, "client_home", danId],
        ["General Home Repairs", "Small household repairs bundled into one visit. Quote after review.", "quote", null, "client_home", danId],
        ["Baby Gate Installation", "Install safety gates, anchors, and basic childproofing hardware.", "fixed", 70.00, "client_home", danId],
        ["Deck Board Repair", "Replace loose boards, tighten hardware, and basic deck touch-ups.", "quote", null, "client_home", danId],
        ["Picture Hanging", "Hang frames, artwork, and small wall decor with clean alignment.", "fixed", 65.00, "client_home", danId],
        ["Closet Shelf Repair", "Repair or reinforce closet rods, shelves, and brackets.", "fixed", 85.00, "client_home", danId],
      ].map(([title, description, pricingType, priceAmount, locationType, providerId]) =>
        makeService("Handyman", title, description, pricingType, priceAmount, locationType, providerId)
      ),
      ...[
        ["Lawn Mowing", "Residential lawn mowing and edging. Includes cleanup of grass clippings. Up to 5,000 sq ft.", "fixed", 60.00, "client_home", danId],
        ["Garden Bed Cleanup", "Weeding, trimming, and seasonal cleanup for flower beds and planters.", "fixed", 120.00, "client_home", danId],
        ["Hedge Trimming", "Shape and trim hedges, shrubs, and small bushes around the property.", "fixed", 95.00, "client_home", danId],
        ["Leaf Removal", "Raking, bagging, and curbside prep for fall leaves.", "fixed", 110.00, "client_home", danId],
        ["Mulch Installation", "Mulch delivery support, spreading, edging, and cleanup.", "quote", null, "client_home", danId],
        ["Seasonal Yard Cleanup", "Spring or fall cleanup for lawns, paths, patios, and beds.", "fixed", 160.00, "client_home", danId],
        ["Weed Control Visit", "Manual weeding and basic maintenance for walkways and gardens.", "hourly", 45.00, "client_home", danId],
        ["Planting Help", "Plant flowers, shrubs, and small garden additions with basic soil prep.", "hourly", 50.00, "client_home", danId],
        ["Patio Pressure Wash", "Pressure washing for patios, walkways, and outdoor surfaces.", "fixed", 130.00, "client_home", danId],
        ["Snow Shoveling", "Driveway, walkway, and entry snow clearing during winter months.", "fixed", 55.00, "client_home", danId],
        ["Lawn Fertilizer Visit", "Apply basic lawn fertilizer and provide simple care recommendations.", "fixed", 85.00, "client_home", danId],
      ].map(([title, description, pricingType, priceAmount, locationType, providerId]) =>
        makeService("Landscaping", title, description, pricingType, priceAmount, locationType, providerId)
      ),
      ...[
        ["Moving Help", "Loading, unloading, and carrying furniture and boxes. Local moves only. No truck included.", "hourly", 50.00, "flexible", danId],
        ["Apartment Move Assist", "Help move boxes and furniture for condos and apartments.", "hourly", 55.00, "flexible", danId],
        ["Packing Service", "Careful packing of kitchenware, books, clothes, and household items.", "hourly", 45.00, "client_home", carolId],
        ["Furniture Rearranging", "Move heavy items within your home and reset room layouts.", "fixed", 80.00, "client_home", danId],
        ["Donation Drop-Off Prep", "Sort, box, and carry donation items for pickup or drop-off.", "hourly", 40.00, "client_home", carolId],
        ["Storage Unit Loading", "Organize and load storage units for better space usage.", "hourly", 55.00, "flexible", danId],
        ["Small Item Delivery", "Local delivery for small furniture and household items.", "fixed", 75.00, "flexible", danId],
        ["Move-Out Hauling Help", "Carry items to truck, curb, or building loading area.", "hourly", 55.00, "client_home", danId],
        ["Unpacking Setup", "Unpack boxes and set up kitchen, bedroom, or living spaces.", "hourly", 45.00, "client_home", carolId],
        ["Office Move Support", "Small office packing, lifting, and furniture repositioning.", "quote", null, "flexible", danId],
        ["Box Supply Drop-Off", "Drop off moving boxes, tape, and basic packing materials locally.", "fixed", 65.00, "flexible", danId],
      ].map(([title, description, pricingType, priceAmount, locationType, providerId]) =>
        makeService("Moving Help", title, description, pricingType, priceAmount, locationType, providerId)
      ),
      ...[
        ["Sink Repair", "Leaky faucets, clogged drains, and sink fixture repairs. Quote provided after assessment.", "quote", null, "client_home", danId],
        ["Faucet Replacement", "Install a replacement faucet where existing plumbing is ready.", "fixed", 120.00, "client_home", danId],
        ["Toilet Repair", "Basic toilet repairs including running water, handles, and flappers.", "fixed", 100.00, "client_home", danId],
        ["Drain Clearing", "Clear simple sink, tub, and shower clogs.", "fixed", 95.00, "client_home", danId],
        ["Shower Head Install", "Replace or install standard shower heads and handheld kits.", "fixed", 65.00, "client_home", danId],
        ["Garbage Disposal Check", "Inspect and troubleshoot common garbage disposal issues.", "quote", null, "client_home", danId],
        ["Pipe Leak Assessment", "Locate visible leaks and provide repair recommendations.", "quote", null, "client_home", danId],
        ["Caulk Around Fixtures", "Re-caulk sinks, tubs, and plumbing fixture edges.", "fixed", 85.00, "client_home", danId],
        ["Bidet Attachment Install", "Install non-electric bidet attachments on compatible toilets.", "fixed", 90.00, "client_home", danId],
        ["Water Filter Install", "Install basic under-sink or faucet-mounted water filters.", "fixed", 110.00, "client_home", danId],
        ["Toilet Seat Replacement", "Replace standard toilet seats and tighten existing hardware.", "fixed", 55.00, "client_home", danId],
        ["Sink Stopper Repair", "Repair or replace simple sink stopper assemblies.", "fixed", 70.00, "client_home", danId],
        ["Supply Line Replacement", "Replace basic faucet or toilet supply lines where access is clear.", "fixed", 95.00, "client_home", danId],
      ].map(([title, description, pricingType, priceAmount, locationType, providerId]) =>
        makeService("Plumbing", title, description, pricingType, priceAmount, locationType, providerId)
      ),
      ...[
        ["Outlet Replacement", "Replace worn outlets and covers where existing wiring is safe.", "fixed", 80.00, "client_home", danId],
        ["Ceiling Fan Install", "Install a ceiling fan where an approved ceiling box already exists.", "quote", null, "client_home", danId],
        ["Light Switch Replacement", "Replace standard switches, dimmers, and plates.", "fixed", 75.00, "client_home", danId],
        ["Smoke Detector Install", "Install or replace battery and hardwired smoke detectors.", "fixed", 65.00, "client_home", danId],
        ["Smart Doorbell Install", "Install smart doorbells with existing compatible wiring.", "fixed", 100.00, "client_home", danId],
        ["Under Cabinet Lighting", "Install plug-in or adhesive under-cabinet lighting kits.", "fixed", 120.00, "client_home", danId],
        ["Outdoor Light Replacement", "Replace porch, patio, or garage light fixtures.", "fixed", 95.00, "client_home", danId],
        ["Cable Concealment", "Hide TV and desk cables with raceways or simple cable management.", "fixed", 85.00, "client_home", danId],
        ["GFCI Check", "Inspect and replace basic GFCI outlets where suitable.", "quote", null, "client_home", danId],
        ["Lamp and Fixture Repair", "Troubleshoot simple lamp or small fixture issues.", "quote", null, "flexible", danId],
        ["Bulb Replacement Visit", "Replace hard-to-reach bulbs and basic fixture covers.", "fixed", 60.00, "client_home", danId],
        ["Thermostat Install", "Install compatible smart or standard thermostats with existing wiring.", "fixed", 115.00, "client_home", danId],
        ["Power Bar Setup", "Set up surge protectors and simple home office power organization.", "fixed", 55.00, "client_home", danId],
      ].map(([title, description, pricingType, priceAmount, locationType, providerId]) =>
        makeService("Electrical", title, description, pricingType, priceAmount, locationType, providerId)
      ),
      ...[
        ["Errand Assistance", "Pickup, drop-off, and simple local errands for busy households.", "hourly", 35.00, "flexible", carolId],
        ["Senior Check-In Visit", "Friendly non-medical check-in, light help, and household support.", "hourly", 40.00, "client_home", carolId],
        ["Pet Feeding Visit", "Feed pets, refresh water, and complete quick home check-ins.", "fixed", 35.00, "client_home", carolId],
        ["Tutoring Session", "One-on-one tutoring for basic school subjects and homework support.", "hourly", 45.00, "provider_location", carolId],
        ["Meal Prep Help", "Simple meal prep, chopping, kitchen reset, and weekly organization.", "hourly", 45.00, "client_home", carolId],
        ["Closet Organization", "Sort, fold, and organize closets, drawers, and storage areas.", "fixed", 100.00, "client_home", carolId],
        ["Home Office Setup", "Arrange desk, cables, supplies, and workspace organization.", "fixed", 90.00, "client_home", danId],
        ["Event Setup Help", "Set up tables, decor, seating, and light cleanup for small events.", "hourly", 45.00, "client_home", carolId],
        ["Plant Care Visit", "Watering, pruning, and simple care for indoor plants.", "fixed", 35.00, "client_home", carolId],
        ["Personal Shopping", "Shopping assistance for groceries, supplies, and household items.", "hourly", 38.00, "flexible", carolId],
      ].map(([title, description, pricingType, priceAmount, locationType, providerId]) =>
        makeService("Personal Services", title, description, pricingType, priceAmount, locationType, providerId)
      ),
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

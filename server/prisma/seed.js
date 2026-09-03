import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedDatabase(prismaInstance) {
  const prisma = prismaInstance || new PrismaClient();
  console.log("🌱 Starting TerraMatch Database Seeding...");

  // 1. Seed Initial Admin User
  const adminPassword = await bcrypt.hash("Admin1234", 10);
  const admin = await prisma.user.upsert({
    where: { email: "tobiasatsyor@gmail.com" },
    update: {
      name: "Admin",
      role: "ADMIN",
      emailVerified: true,
      ghanaCardVerified: true,
      passwordHash: adminPassword,
    },
    create: {
      name: "Admin",
      email: "tobiasatsyor@gmail.com",
      role: "ADMIN",
      passwordHash: adminPassword,
      emailVerified: true,
      ghanaCardVerified: true,
      phone: "+233 20 000 0001",
    },
  });
  console.log(`✓ Admin user configured: ${admin.email}`);

  // 2. Seed Land Owner (Kwame Owusu)
  const kwamePassword = await bcrypt.hash("Password123!", 10);
  const landOwner = await prisma.user.upsert({
    where: { email: "kwame.owusu@email.com" },
    update: {
      role: "LAND_OWNER",
      ghanaCardVerified: true,
      emailVerified: true,
    },
    create: {
      name: "Kwame Owusu",
      email: "kwame.owusu@email.com",
      phone: "+233 24 123 4567",
      role: "LAND_OWNER",
      passwordHash: kwamePassword,
      emailVerified: true,
      ghanaCardVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    },
  });
  console.log(`✓ Land Owner seeded: ${landOwner.name}`);

  // Seed Ghana Card Verification for Kwame Owusu
  await prisma.ghanaCardVerification.upsert({
    where: { id: "kwame-verification-id" },
    update: {},
    create: {
      id: "kwame-verification-id",
      userId: landOwner.id,
      cardNumber: "GHA-712398471-2",
      fullNameOnCard: "Kwame Owusu",
      region: "Greater Accra",
      status: "APPROVED",
      aiAnalysisScore: 98.5,
      aiRiskFlags: ["Format Validated", "Name Matched", "Identity Verified"],
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  // 3. Seed Sample Bidders
  const bidder1 = await prisma.user.upsert({
    where: { email: "abena.mensah@gmail.com" },
    update: {},
    create: {
      name: "Abena Mensah",
      email: "abena.mensah@gmail.com",
      phone: "+233 24 987 6543",
      role: "CLIENT",
      passwordHash: kwamePassword,
      emailVerified: true,
      ghanaCardVerified: true,
    },
  });

  const bidder2 = await prisma.user.upsert({
    where: { email: "kofi.addo@gmail.com" },
    update: {},
    create: {
      name: "Kofi Addo",
      email: "kofi.addo@gmail.com",
      phone: "+233 50 112 2334",
      role: "CLIENT",
      passwordHash: kwamePassword,
      emailVerified: true,
      ghanaCardVerified: true,
    },
  });

  // 4. Seed Contractors
  const contractorsData = [
    {
      email: "projects@kwamebuilders.gh",
      name: "Kwame Builders Ltd.",
      phone: "+233 24 555 0182",
      companyName: "Kwame Builders Ltd.",
      category: "Building & Construction",
      specialties: "Residential, Commercial",
      location: "Accra, Ghana",
      yearsExperience: 10,
      licenseType: "D1K1 General Building Contractor",
      avgRating: 4.9,
      reviewCount: 128,
      completedProjects: 32,
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f7?w=400&auto=format&fit=crop&q=80",
      bio: "We deliver residential and commercial construction projects on time and on budget with certified engineering standards.",
    },
    {
      email: "info@buildright.gh",
      name: "BuildRight GH",
      phone: "+233 20 888 1234",
      companyName: "BuildRight GH",
      category: "Renovation",
      specialties: "Residential, Renovation",
      location: "Kumasi, Ghana",
      yearsExperience: 8,
      licenseType: "D2K2 Building Contractor",
      avgRating: 4.8,
      reviewCount: 106,
      completedProjects: 28,
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80",
      bio: "Specializing in high-end residential remodeling, architectural extensions, and modern structural renovation.",
    },
    {
      email: "contact@solidstructures.gh",
      name: "Solid Structures",
      phone: "+233 30 222 4455",
      companyName: "Solid Structures",
      category: "Building & Construction",
      specialties: "Commercial, Industrial",
      location: "Takoradi, Ghana",
      yearsExperience: 7,
      licenseType: "D1K1 Industrial Contractor",
      avgRating: 4.7,
      reviewCount: 78,
      completedProjects: 21,
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f7?w=400&auto=format&fit=crop&q=80",
      bio: "Industrial warehousing, commercial multi-story construction, and heavy foundation engineering.",
    },
    {
      email: "hello@primeconstruction.gh",
      name: "Prime Construction",
      phone: "+233 27 777 9900",
      companyName: "Prime Construction",
      category: "Landscaping",
      specialties: "Residential, Landscaping",
      location: "Tamale, Ghana",
      yearsExperience: 5,
      licenseType: "D3K3 Building & Civil",
      avgRating: 4.6,
      reviewCount: 64,
      completedProjects: 18,
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80",
      bio: "Modern sustainable landscaping, drainage infrastructure, boundary walls, and residential development.",
    },
    {
      email: "support@accraelectricals.gh",
      name: "Accra Electricals",
      phone: "+233 24 333 7788",
      companyName: "Accra Electricals",
      category: "Electrical Services",
      specialties: "Wiring, Solar Installation",
      location: "Accra, Ghana",
      yearsExperience: 12,
      licenseType: "Energy Commission Certified",
      avgRating: 4.7,
      reviewCount: 52,
      completedProjects: 40,
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80",
      bio: "Certified electrical installation, transformer setup, solar hybrid integration, and smart home automation.",
    },
    {
      email: "hello@brightinteriors.gh",
      name: "Bright Interiors",
      phone: "+233 20 444 8899",
      companyName: "Bright Interiors",
      category: "Interior Design",
      specialties: "Interior Fit-Out, Furnishing",
      location: "Kumasi, Ghana",
      yearsExperience: 6,
      licenseType: "Certified Interior Fit-Out",
      avgRating: 4.9,
      reviewCount: 37,
      completedProjects: 15,
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&auto=format&fit=crop&q=80",
      bio: "Transforming residential and executive spaces with bespoke finishes, lighting, cabinetry, and modern interior fit-outs.",
    },
    {
      email: "info@precisionarchitects.gh",
      name: "Precision Architects",
      phone: "+233 24 666 1122",
      companyName: "Precision Architects",
      category: "Architecture & Design",
      specialties: "Architectural Design, Planning Permits",
      location: "Accra, Ghana",
      yearsExperience: 9,
      licenseType: "Ghana Institute of Architects Certified",
      avgRating: 4.8,
      reviewCount: 45,
      completedProjects: 22,
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&auto=format&fit=crop&q=80",
      bio: "Award-winning architectural modeling, structural planning, permit acquisition, and building construction oversight.",
    },
  ];

  for (const c of contractorsData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {
        role: "CONTRACTOR",
        ghanaCardVerified: true,
        emailVerified: true,
      },
      create: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: "CONTRACTOR",
        passwordHash: kwamePassword,
        emailVerified: true,
        ghanaCardVerified: true,
        avatarUrl: c.avatarUrl,
      },
    });

    await prisma.contractorProfile.upsert({
      where: { userId: user.id },
      update: {
        companyName: c.companyName,
        category: c.category,
        specialties: c.specialties,
        location: c.location,
        yearsExperience: c.yearsExperience,
        licenseType: c.licenseType,
        avgRating: c.avgRating,
        reviewCount: c.reviewCount,
        completedProjects: c.completedProjects,
        isVerified: true,
        bio: c.bio,
      },
      create: {
        userId: user.id,
        companyName: c.companyName,
        category: c.category,
        specialties: c.specialties,
        location: c.location,
        yearsExperience: c.yearsExperience,
        licenseType: c.licenseType,
        avgRating: c.avgRating,
        reviewCount: c.reviewCount,
        completedProjects: c.completedProjects,
        isVerified: true,
        bio: c.bio,
      },
    });
  }
  console.log(`✓ Seeded ${contractorsData.length} verified contractor profiles.`);

  // 5. Seed Land Listings
  const landsData = [
    {
      slug: "east-legon-hills",
      title: "East Legon Hills",
      category: "Residential",
      description:
        "Prime residential land in a fast developing area with excellent road access, electricity nearby, and neighborhood growth. Ideal for luxury residential builds or executive rentals.",
      region: "Greater Accra",
      district: "Adentan Municipal",
      address: "East Legon Hills, Accra",
      latitude: 5.651,
      longitude: -0.162,
      landSize: "1.20 Acres",
      plotSize: "120 ft x 100 ft",
      tenure: "Freehold",
      ownershipType: "Titled",
      titleDocRef: "LVD/GAR/2022/4491",
      pricePerSqFt: 120,
      totalPrice: 185000,
      buyNowPrice: 185000,
      amenities: ["Road Access", "Electricity Nearby", "Water Available", "Flat Topography", "Good Drainage"],
      images: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
      ],
      floodRisk: "LOW",
      terrainType: "FLAT",
      drainageQuality: "GOOD",
      elevationMeters: 48.0,
      currentBid: 145000,
      minNextBid: 150000,
      bidIncrement: 5000,
      bidsCount: 12,
    },
    {
      slug: "oyarifa-extension",
      title: "Oyarifa Extension",
      category: "Agricultural",
      description:
        "Fertile agricultural and mixed development land located along the foothills of the Aburi mountain range. Excellent drainage and direct access to arterial roads.",
      region: "Greater Accra",
      district: "La Nkwantanang",
      address: "Oyarifa, Accra",
      latitude: 5.772,
      longitude: -0.183,
      landSize: "2.5 Acres",
      plotSize: "200 ft x 150 ft",
      tenure: "Freehold",
      ownershipType: "Titled",
      titleDocRef: "LVD/GAR/2021/8821",
      pricePerSqFt: 110,
      totalPrice: 165000,
      buyNowPrice: 165000,
      amenities: ["Road Access", "Water Available", "Good Drainage"],
      images: [
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop&q=80",
      ],
      floodRisk: "LOW",
      terrainType: "SLOPED",
      drainageQuality: "GOOD",
      elevationMeters: 62.0,
      currentBid: 130000,
      minNextBid: 135000,
      bidIncrement: 5000,
      bidsCount: 8,
    },
    {
      slug: "adenta-hills",
      title: "Adenta Hills",
      category: "Residential",
      description:
        "Scenic elevated residential plots with panoramic views of the city. Serviced with water mains, electricity grid, and gated security access.",
      region: "Greater Accra",
      district: "Adentan Municipal",
      address: "Adenta Hills, Accra",
      latitude: 5.715,
      longitude: -0.155,
      landSize: "1 Plot",
      plotSize: "100 ft x 80 ft",
      tenure: "Freehold",
      ownershipType: "Titled",
      titleDocRef: "LVD/GAR/2023/1029",
      pricePerSqFt: 135,
      totalPrice: 195000,
      buyNowPrice: 195000,
      amenities: ["Road Access", "Electricity Nearby", "Gated Community", "Flat Topography"],
      images: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80",
      ],
      floodRisk: "LOW",
      terrainType: "ELEVATED",
      drainageQuality: "GOOD",
      elevationMeters: 75.0,
      currentBid: 160000,
      minNextBid: 165000,
      bidIncrement: 5000,
      bidsCount: 15,
    },
    {
      slug: "tema-community-25",
      title: "Tema Community 25",
      category: "Residential",
      description:
        "Prime gated community land in Tema Community 25. Perfectly titled with ready permit approvals and zero dispute history.",
      region: "Greater Accra",
      district: "Tema Metropolitan",
      address: "Community 25, Tema",
      latitude: 5.703,
      longitude: 0.005,
      landSize: "2 Plots",
      plotSize: "140 ft x 100 ft",
      tenure: "Leasehold",
      ownershipType: "Titled",
      titleDocRef: "LVD/TMA/2020/3310",
      pricePerSqFt: 150,
      totalPrice: 220000,
      buyNowPrice: 220000,
      amenities: ["Road Access", "Electricity Nearby", "Water Available", "Gated Community", "Good Drainage"],
      images: [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
      ],
      floodRisk: "LOW",
      terrainType: "FLAT",
      drainageQuality: "GOOD",
      elevationMeters: 28.0,
      currentBid: 180000,
      minNextBid: 185000,
      bidIncrement: 5000,
      bidsCount: 20,
    },
    {
      slug: "amasaman-estate",
      title: "Amasaman Estate",
      category: "Commercial",
      description:
        "High-visibility commercial parcel directly off the Nsawam-Kumasi highway corridor. Ideal for distribution centers, fuel stations, or light industrial warehousing.",
      region: "Greater Accra",
      district: "Ga West",
      address: "Amasaman Highway, Accra",
      latitude: 5.702,
      longitude: -0.301,
      landSize: "3.0 Acres",
      plotSize: "300 ft x 200 ft",
      tenure: "Freehold",
      ownershipType: "Titled",
      titleDocRef: "LVD/GW/2019/7740",
      pricePerSqFt: 95,
      totalPrice: 140000,
      buyNowPrice: 140000,
      amenities: ["Road Access", "Electricity Nearby", "Flat Topography"],
      images: [
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop&q=80",
      ],
      floodRisk: "MODERATE",
      terrainType: "FLAT",
      drainageQuality: "MODERATE",
      elevationMeters: 18.0,
      currentBid: 110000,
      minNextBid: 115000,
      bidIncrement: 5000,
      bidsCount: 6,
    },
  ];

  for (const l of landsData) {
    const land = await prisma.landListing.upsert({
      where: { slug: l.slug },
      update: {
        title: l.title,
        category: l.category,
        description: l.description,
        totalPrice: l.totalPrice,
        buyNowPrice: l.buyNowPrice,
        pricePerSqFt: l.pricePerSqFt,
        currentBid: l.currentBid,
        minNextBid: l.minNextBid,
        bidsCount: l.bidsCount,
        floodRisk: l.floodRisk,
        terrainType: l.terrainType,
        drainageQuality: l.drainageQuality,
        elevationMeters: l.elevationMeters,
      },
      create: {
        slug: l.slug,
        ownerId: landOwner.id,
        title: l.title,
        category: l.category,
        description: l.description,
        region: l.region,
        district: l.district,
        address: l.address,
        latitude: l.latitude,
        longitude: l.longitude,
        landSize: l.landSize,
        plotSize: l.plotSize,
        tenure: l.tenure,
        ownershipType: l.ownershipType,
        titleDocRef: l.titleDocRef,
        pricePerSqFt: l.pricePerSqFt,
        totalPrice: l.totalPrice,
        buyNowPrice: l.buyNowPrice,
        amenities: l.amenities,
        images: l.images,
        floodRisk: l.floodRisk,
        terrainType: l.terrainType,
        drainageQuality: l.drainageQuality,
        elevationMeters: l.elevationMeters,
        status: "ACTIVE",
        auctionEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        currentBid: l.currentBid,
        minNextBid: l.minNextBid,
        bidIncrement: l.bidIncrement,
        bidsCount: l.bidsCount,
      },
    });

    // Seed initial bids for East Legon Hills
    if (l.slug === "east-legon-hills") {
      await prisma.landBid.createMany({
        data: [
          {
            landId: land.id,
            bidderId: bidder1.id,
            amount: 140000,
            status: "OUTBID",
          },
          {
            landId: land.id,
            bidderId: bidder2.id,
            amount: 145000,
            status: "ACTIVE",
          },
        ],
        skipDuplicates: true,
      });
    }
  }
  console.log(`✓ Seeded ${landsData.length} active land listings with bidding histories.`);

  // 6. Seed Sample Construction Project
  const project = await prisma.constructionProject.upsert({
    where: { slug: "four-bedroom-storey-building-east-legon" },
    update: {},
    create: {
      slug: "four-bedroom-storey-building-east-legon",
      clientId: bidder1.id,
      title: "4-Bedroom Storey Building Construction",
      category: "Building & Construction",
      description:
        "Looking for a licensed building contractor for the complete structural and masonry works for a modern 4-bedroom executive home in East Legon Hills.",
      budgetRange: "GHS 150,000 – 300,000",
      budgetMin: 150000,
      budgetMax: 300000,
      timeline: "3 – 6 months",
      location: "East Legon Hills, Accra",
      status: "OPEN",
      bidsCount: 2,
    },
  });
  console.log(`✓ Seeded sample construction project: ${project.title}`);

  console.log("🎉 TerraMatch database seed completed successfully!");
}

if (process.argv[1] && process.argv[1].includes("seed.js")) {
  const prisma = new PrismaClient();
  seedDatabase(prisma)
    .catch((e) => {
      console.error("Seeding failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

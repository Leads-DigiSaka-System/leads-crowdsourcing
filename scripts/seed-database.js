// Use CommonJS for better compatibility when running with Node
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      name: 'Administrator',
      password: hashedPassword,
      role: 'admin',
    },
  })

  console.log('✅ Admin user ready:', { id: adminUser.id, username: adminUser.username })

  // Create regular user
  const regularUser = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      email: 'user@example.com',
      name: 'Regular User',
      password: await bcrypt.hash('user123', 12),
      role: 'user',
    },
  })

  console.log('✅ Regular user ready:', { id: regularUser.id, username: regularUser.username })

  // Create additional test users to be donors
  const testDonors = [
    { username: 'donor1', email: 'donor1@example.com', name: 'Maria Elena Santos', role: 'user' },
    { username: 'donor2', email: 'donor2@example.com', name: 'Juan Carlos Reyes', role: 'user' },
    { username: 'donor3', email: 'donor3@example.com', name: 'Isabella Rodriguez', role: 'user' },
    { username: 'donor4', email: 'donor4@example.com', name: 'Miguel Antonio Cruz', role: 'user' },
    { username: 'donor5', email: 'donor5@example.com', name: 'Sofia Grace Lim', role: 'user' },
    { username: 'donor6', email: 'donor6@example.com', name: 'Rafael de Leon', role: 'user' },
    { username: 'donor7', email: 'donor7@example.com', name: 'Ana Beatriz Torres', role: 'user' },
  ];

  const createdDonors = [];
  for (const donor of testDonors) {
    const createdDonor = await prisma.user.upsert({
      where: { username: donor.username },
      update: {},
      create: {
        username: donor.username,
        email: donor.email,
        name: donor.name,
        password: await bcrypt.hash('donor123', 12),
        role: donor.role,
        image: `https://api.dicebear.com/7.x/personas/svg?seed=${donor.username}`, // Generate avatar
      },
    });
    createdDonors.push(createdDonor);
  }

  console.log(`✅ Created ${createdDonors.length} test donor users`);

  // Seed Categories (idempotent via upsert on slug)
  const categoriesToSeed = [
    { name: 'Agriculture', slug: 'agriculture' },
    { name: 'Energy', slug: 'energy' },
    { name: 'Climate', slug: 'climate' },
    { name: 'Environment', slug: 'environment' },
    { name: 'Health', slug: 'health' },
    { name: 'Education', slug: 'education' },
  ]

  for (const cat of categoriesToSeed) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    })
  }
  console.log(`✅ Categories ready: ${categoriesToSeed.map(c => c.slug).join(', ')}`)

  // Clean existing projects/pledges to avoid duplicates when re-running seed
  await prisma.pledge.deleteMany({})
  await prisma.project.deleteMany({})
  console.log('🧹 Cleared existing projects and pledges')

  // Helper to build common long-form placeholder text
  const lipsum = (topic) => (
    `${topic} — This section provides a concise but informative overview. ` +
    `We outline the motivation, related work, and the intended outcomes for stakeholders. ` +
    `We also describe risks, assumptions, and how success will be measured.`
  )

  // Ten complete project payloads (5 original + 5 new)
  const projects = [
    { // AGRICULTURE
      title: 'AI-Enhanced Crop Yield Prediction for Southeast Asia',
      authors: 'IRRI Research Team',
      image: null,
      imageAlt: 'Rice fields with data overlay',
      pledged: 0,
      goal: 250000,
      daysLeft: 45,
      tags: ['machine-learning', 'agriculture', 'remote-sensing'],
      category: 'agriculture',
      overview: lipsum('Overview: Crop yield prediction using multi-modal data (satellite, weather, soil).'),
      methods: lipsum('Methods: Gradient boosting and transformer models trained on historical yields.'),
      labNotes: lipsum('Lab Notes: Data preprocessing pipelines and validation results.'),
      discussion: lipsum('Discussion: Model interpretability and adoption by local agencies.'),
      contextAnswer: lipsum('Context: Food security under climate variability.'),
      significanceAnswer: lipsum('Significance: Better planning, reduced losses, improved farmer income.'),
      goalsAnswer: lipsum('Goals: Open datasets, reproducible models, deployment playbook.'),
      teamDescription: lipsum('Team: Data scientists and agronomists collaborating across institutions.'),
      budgetDescription: lipsum('Budget: Data acquisition, field validation, and compute resources.'),
      timelineDescription: lipsum('Timeline: 6 months milestones for data, modeling, and deployment.'),
      teamMembers: [
        {
          name: 'Dr. Ana Santos',
          role: 'Principal Investigator',
          bio: 'Agronomist specializing in remote sensing for rice systems.',
          email: 'ana.santos@example.org',
          linkedin: 'https://linkedin.com/in/anasantos',
          twitter: 'https://x.com/anasantos',
          expertise: ['agronomy', 'remote-sensing', 'project-management'],
          image: null,
          imageAlt: null,
        },
        {
          name: 'Miguel Tan',
          role: 'ML Engineer',
          bio: 'Builds scalable geospatial ML pipelines and MLOps workflows.',
          email: 'miguel.tan@example.org',
          linkedin: 'https://linkedin.com/in/migueltan',
          twitter: null,
          expertise: ['machine-learning', 'python', 'mlops'],
          image: null,
          imageAlt: null,
        },
      ],
      budgetItems: [
        { name: 'Satellite Data Access', description: 'High-resolution imagery credits', value: 60000 },
        { name: 'Field Validation', description: 'Ground truth data collection', value: 40000 },
        { name: 'Compute & Storage', description: 'GPU compute and data lake', value: 30000 },
      ],
      timelineEvents: [
        { date: 'SEP 01, 2025', title: 'Data ingestion and cleaning complete' },
        { date: 'OCT 15, 2025', title: 'Baseline models trained and evaluated' },
        { date: 'DEC 01, 2025', title: 'Pilot deployment with partner co-ops' },
      ],
    },
    { // ENVIRONMENT
      title: 'Low-cost Air Quality Sensors for Urban Communities',
      authors: 'OpenAQ Collective',
      image: null,
      imageAlt: 'DIY air quality sensor kit on a desk',
      pledged: 0,
      goal: 120000,
      daysLeft: 30,
      tags: ['sensors', 'iot', 'air-quality'],
      category: 'environment',
      overview: lipsum('Overview: Community-deployable PM2.5 and NO2 monitoring.'),
      methods: lipsum('Methods: Calibration against reference stations and drift correction.'),
      labNotes: lipsum('Lab Notes: Sensor enclosure iterations and power tests.'),
      discussion: lipsum('Discussion: Data ownership and municipal integration.'),
      contextAnswer: lipsum('Context: Unequal exposure to pollution in dense neighborhoods.'),
      significanceAnswer: lipsum('Significance: Actionable hyperlocal data for advocacy and policy.'),
      goalsAnswer: lipsum('Goals: 100 sensors deployed; open dashboard and API.'),
      teamDescription: lipsum('Team: Hardware engineers and citizen scientists.'),
      budgetDescription: lipsum('Budget: Components, manufacturing, and community workshops.'),
      timelineDescription: lipsum('Timeline: 4 months from prototyping to deployment.'),
      teamMembers: [
        {
          name: 'Priya Nair',
          role: 'Hardware Lead',
          bio: 'Designs robust low-power sensing platforms.',
          email: 'priya.nair@example.org',
          linkedin: null,
          twitter: null,
          expertise: ['hardware', 'embedded', 'low-power'],
          image: null,
          imageAlt: null,
        },
        {
          name: 'Jorge Alvarez',
          role: 'Data Lead',
          bio: 'Signal processing and calibration pipelines.',
          email: 'jorge.alvarez@example.org',
          linkedin: 'https://linkedin.com/in/jorgealvarez',
          twitter: null,
          expertise: ['signal-processing', 'python', 'data-viz'],
          image: null,
          imageAlt: null,
        },
      ],
      budgetItems: [
        { name: 'Sensor Components', description: 'PM2.5 and NO2 modules', value: 30000 },
        { name: 'Manufacturing', description: 'PCB and assembly', value: 25000 },
        { name: 'Workshops', description: 'Community training sessions', value: 10000 },
      ],
      timelineEvents: [
        { date: 'AUG 20, 2025', title: 'Prototype v2 finalized' },
        { date: 'SEP 10, 2025', title: 'Calibration campaign begins' },
        { date: 'OCT 05, 2025', title: 'First 30 sensors deployed' },
      ],
    },
    { // ENERGY
      title: 'Solar-Powered Cold Chain for Rural Clinics',
      authors: 'HealthTech Labs',
      image: null,
      imageAlt: 'Solar panels powering medical refrigerators',
      pledged: 0,
      goal: 180000,
      daysLeft: 52,
      tags: ['solar', 'health', 'logistics'],
      category: 'energy',
      overview: lipsum('Overview: Resilient vaccine cold chain using solar DC fridges.'),
      methods: lipsum('Methods: Thermal modeling and real-world pilots.'),
      labNotes: lipsum('Lab Notes: Battery cycling and MPPT efficiency tests.'),
      discussion: lipsum('Discussion: Maintenance training and local supply chains.'),
      contextAnswer: lipsum('Context: Frequent grid outages jeopardize vaccine integrity.'),
      significanceAnswer: lipsum('Significance: Reduced spoilage and improved health outcomes.'),
      goalsAnswer: lipsum('Goals: 10 clinics equipped; open maintenance manual.'),
      teamDescription: lipsum('Team: Electrical engineers and public health officers.'),
      budgetDescription: lipsum('Budget: Solar hardware, logistics, and training.'),
      timelineDescription: lipsum('Timeline: 5 months for design, pilot, and evaluation.'),
      teamMembers: [
        {
          name: 'Engr. Liza Dizon',
          role: 'Systems Engineer',
          bio: 'Designs reliable off-grid systems for health facilities.',
          email: 'liza.dizon@example.org',
          linkedin: 'https://linkedin.com/in/lizadizon',
          twitter: null,
          expertise: ['solar', 'power-electronics', 'systems'],
          image: null,
          imageAlt: null,
        },
        {
          name: 'Dr. Omar Rahman',
          role: 'Public Health Advisor',
          bio: 'Cold-chain operations and training programs.',
          email: 'omar.rahman@example.org',
          linkedin: null,
          twitter: null,
          expertise: ['public-health', 'operations'],
          image: null,
          imageAlt: null,
        },
      ],
      budgetItems: [
        { name: 'Solar Kits', description: 'Panels, controllers, batteries', value: 90000 },
        { name: 'DC Refrigerators', description: 'Medical-grade fridges', value: 50000 },
        { name: 'Training & Manuals', description: 'Local capacity building', value: 15000 },
      ],
      timelineEvents: [
        { date: 'SEP 05, 2025', title: 'Site surveys complete' },
        { date: 'OCT 20, 2025', title: 'Installations in 3 pilot clinics' },
        { date: 'NOV 30, 2025', title: 'Training and handover' },
      ],
    },
    { // CLIMATE
      title: 'Community-led Mangrove Restoration Monitoring',
      authors: 'Coastal Resilience Network',
      image: null,
      imageAlt: 'Community measuring mangrove growth',
      pledged: 0,
      goal: 100000,
      daysLeft: 28,
      tags: ['ecology', 'community-science', 'conservation'],
      category: 'climate',
      overview: lipsum('Overview: Track mangrove health with participatory methods.'),
      methods: lipsum('Methods: Standardized plots, drone mapping, and apps.'),
      labNotes: lipsum('Lab Notes: Protocols and inter-observer reliability.'),
      discussion: lipsum('Discussion: Stewardship incentives and governance.'),
      contextAnswer: lipsum('Context: Mangroves mitigate storm surge and sequester carbon.'),
      significanceAnswer: lipsum('Significance: Scalable restoration with community ownership.'),
      goalsAnswer: lipsum('Goals: Toolkit, training, and open metrics.'),
      teamDescription: lipsum('Team: Ecologists and local leaders.'),
      budgetDescription: lipsum('Budget: Field gear, trainings, and mapping flights.'),
      timelineDescription: lipsum('Timeline: 3 months to stand-up monitoring network.'),
      teamMembers: [
        {
          name: 'Maria Lopez',
          role: 'Field Ecologist',
          bio: 'Leads habitat surveys and data standards.',
          email: 'maria.lopez@example.org',
          linkedin: null,
          twitter: null,
          expertise: ['ecology', 'gis'],
          image: null,
          imageAlt: null,
        },
        {
          name: 'Renato Cruz',
          role: 'Community Coordinator',
          bio: 'Organizes trainings and local partnerships.',
          email: 'renato.cruz@example.org',
          linkedin: null,
          twitter: null,
          expertise: ['community-engagement', 'training'],
          image: null,
          imageAlt: null,
        },
      ],
      budgetItems: [
        { name: 'Field Equipment', description: 'GPS, tape measures, safety gear', value: 12000 },
        { name: 'Drone Flights', description: 'Quarterly mapping', value: 18000 },
        { name: 'Workshops', description: 'Train local monitors', value: 8000 },
      ],
      timelineEvents: [
        { date: 'AUG 25, 2025', title: 'Protocol finalization' },
        { date: 'SEP 12, 2025', title: 'Training of trainers' },
        { date: 'OCT 03, 2025', title: 'Baseline data collection' },
      ],
    },
    { // EDUCATION
      title: 'Open-Source STEM Kits for Remote Schools',
      authors: 'EduMakers Consortium',
      image: null,
      imageAlt: 'Students assembling electronics kits',
      pledged: 0,
      goal: 60000,
      daysLeft: 25,
      tags: ['education', 'open-hardware', 'curriculum'],
      category: 'education',
      overview: lipsum('Overview: Affordable STEM kits aligned with local curricula.'),
      methods: lipsum('Methods: Co-design with teachers; iterative classroom testing.'),
      labNotes: lipsum('Lab Notes: BOM optimization and assembly guides.'),
      discussion: lipsum('Discussion: Distribution models and teacher support.'),
      contextAnswer: lipsum('Context: Limited access to hands-on learning tools.'),
      significanceAnswer: lipsum('Significance: Improved STEM engagement and retention.'),
      goalsAnswer: lipsum('Goals: 500 kits; open designs and tutorials.'),
      teamDescription: lipsum('Team: Educators and hardware designers.'),
      budgetDescription: lipsum('Budget: Components, printing, and training sessions.'),
      timelineDescription: lipsum('Timeline: 3 months for design, pilot, and scale.'),
      teamMembers: [
        {
          name: 'Sofia Reyes',
          role: 'Education Lead',
          bio: 'Designs inquiry-based STEM curricula.',
          email: 'sofia.reyes@example.org',
          linkedin: 'https://linkedin.com/in/sofireyes',
          twitter: null,
          expertise: ['education', 'curriculum-design'],
          image: null,
          imageAlt: null,
        },
        {
          name: 'Kenji Watanabe',
          role: 'Hardware Designer',
          bio: 'Open-source kits and manufacturing readiness.',
          email: 'kenji.watanabe@example.org',
          linkedin: null,
          twitter: null,
          expertise: ['hardware', 'open-source'],
          image: null,
          imageAlt: null,
        },
      ],
      budgetItems: [
        { name: 'Components', description: 'Electronics and mechanical parts', value: 20000 },
        { name: 'Printing', description: 'Guides and packaging', value: 8000 },
        { name: 'Teacher Training', description: 'Workshops and travel', value: 7000 },
      ],
      timelineEvents: [
        { date: 'SEP 08, 2025', title: 'Prototype classroom trial' },
        { date: 'SEP 29, 2025', title: 'Refinements based on feedback' },
        { date: 'OCT 20, 2025', title: 'Initial distribution' },
      ],
    },
    // 5 additional projects, one for each category
    { // AGRICULTURE
      title: 'Regenerative Farming Pilot in Luzon',
      authors: 'GreenGrow Initiative',
      image: null,
      imageAlt: 'Farmers preparing soil',
      pledged: 0,
      goal: 80000,
      daysLeft: 40,
      tags: ['regenerative', 'soil-health', 'agriculture'],
      category: 'agriculture',
      overview: lipsum('Overview: Testing regenerative practices for smallholder farms.'),
      methods: lipsum('Methods: Cover cropping, minimal tillage, and composting.'),
      labNotes: lipsum('Lab Notes: Soil sampling and yield tracking.'),
      discussion: lipsum('Discussion: Farmer incentives and market access.'),
      contextAnswer: lipsum('Context: Soil degradation and climate resilience.'),
      significanceAnswer: lipsum('Significance: Improved yields and ecosystem services.'),
      goalsAnswer: lipsum('Goals: Demonstrate scalable practices and share results.'),
      teamDescription: lipsum('Team: Agronomists and local farmer leaders.'),
      budgetDescription: lipsum('Budget: Seeds, compost, and training.'),
      timelineDescription: lipsum('Timeline: 6 months for pilot and evaluation.'),
      teamMembers: [
        { name: 'Carlos Mendoza', role: 'Lead Agronomist', bio: 'Expert in soil health.', email: 'carlos.mendoza@example.org', linkedin: null, twitter: null, expertise: ['agronomy', 'soil'], image: null, imageAlt: null },
        { name: 'Lara Cruz', role: 'Farmer Coordinator', bio: 'Connects farmers to resources.', email: 'lara.cruz@example.org', linkedin: null, twitter: null, expertise: ['community', 'training'], image: null, imageAlt: null },
      ],
      budgetItems: [
        { name: 'Seeds', description: 'Cover crop seeds', value: 10000 },
        { name: 'Compost', description: 'Organic compost', value: 8000 },
        { name: 'Training', description: 'Workshops for farmers', value: 7000 },
      ],
      timelineEvents: [
        { date: 'SEP 10, 2025', title: 'Field prep and baseline sampling' },
        { date: 'OCT 20, 2025', title: 'Mid-season review' },
        { date: 'DEC 15, 2025', title: 'Final harvest and reporting' },
      ],
    },
    { // ENERGY
      title: 'Microgrid Solar Deployment for Island Schools',
      authors: 'SunPower Foundation',
      image: null,
      imageAlt: 'Solar panels on school roof',
      pledged: 0,
      goal: 95000,
      daysLeft: 35,
      tags: ['solar', 'microgrid', 'energy'],
      category: 'energy',
      overview: lipsum('Overview: Reliable solar microgrids for off-grid schools.'),
      methods: lipsum('Methods: Modular solar arrays and battery storage.'),
      labNotes: lipsum('Lab Notes: Installation and performance monitoring.'),
      discussion: lipsum('Discussion: Maintenance and local technician training.'),
      contextAnswer: lipsum('Context: Energy poverty in remote islands.'),
      significanceAnswer: lipsum('Significance: Improved learning conditions and community benefits.'),
      goalsAnswer: lipsum('Goals: 5 schools powered and documented.'),
      teamDescription: lipsum('Team: Engineers and local educators.'),
      budgetDescription: lipsum('Budget: Hardware, installation, and training.'),
      timelineDescription: lipsum('Timeline: 4 months for deployment and review.'),
      teamMembers: [
        { name: 'Jessa Lim', role: 'Project Engineer', bio: 'Designs microgrid systems.', email: 'jessa.lim@example.org', linkedin: null, twitter: null, expertise: ['solar', 'microgrid'], image: null, imageAlt: null },
        { name: 'Mark Yu', role: 'Education Liaison', bio: 'Coordinates with schools.', email: 'mark.yu@example.org', linkedin: null, twitter: null, expertise: ['education', 'community'], image: null, imageAlt: null },
      ],
      budgetItems: [
        { name: 'Solar Hardware', description: 'Panels and batteries', value: 40000 },
        { name: 'Installation', description: 'Labor and logistics', value: 30000 },
        { name: 'Training', description: 'Local technician workshops', value: 15000 },
      ],
      timelineEvents: [
        { date: 'SEP 15, 2025', title: 'Site selection and prep' },
        { date: 'OCT 10, 2025', title: 'Installations complete' },
        { date: 'NOV 20, 2025', title: 'Performance review' },
      ],
    },
    { // CLIMATE
      title: 'Urban Heat Mapping for Resilient Cities',
      authors: 'ClimateMap PH',
      image: null,
      imageAlt: 'City heat map visualization',
      pledged: 0,
      goal: 70000,
      daysLeft: 32,
      tags: ['climate', 'urban', 'mapping'],
      category: 'climate',
      overview: lipsum('Overview: Mapping urban heat islands for adaptation planning.'),
      methods: lipsum('Methods: Satellite and ground sensor data integration.'),
      labNotes: lipsum('Lab Notes: Data validation and spatial analysis.'),
      discussion: lipsum('Discussion: Policy engagement and public dashboards.'),
      contextAnswer: lipsum('Context: Rising urban temperatures and health risks.'),
      significanceAnswer: lipsum('Significance: Targeted cooling interventions.'),
      goalsAnswer: lipsum('Goals: Publish open heat maps and recommendations.'),
      teamDescription: lipsum('Team: Climate scientists and GIS analysts.'),
      budgetDescription: lipsum('Budget: Sensors, data, and outreach.'),
      timelineDescription: lipsum('Timeline: 3 months for mapping and reporting.'),
      teamMembers: [
        { name: 'Rico Santos', role: 'GIS Analyst', bio: 'Specializes in spatial data.', email: 'rico.santos@example.org', linkedin: null, twitter: null, expertise: ['gis', 'climate'], image: null, imageAlt: null },
        { name: 'Ella Ramos', role: 'Outreach Lead', bio: 'Connects science to policy.', email: 'ella.ramos@example.org', linkedin: null, twitter: null, expertise: ['outreach', 'policy'], image: null, imageAlt: null },
      ],
      budgetItems: [
        { name: 'Sensors', description: 'Temperature sensors', value: 12000 },
        { name: 'Data', description: 'Satellite imagery', value: 9000 },
        { name: 'Outreach', description: 'Public dashboard', value: 6000 },
      ],
      timelineEvents: [
        { date: 'SEP 12, 2025', title: 'Sensor deployment' },
        { date: 'OCT 05, 2025', title: 'Data analysis' },
        { date: 'NOV 01, 2025', title: 'Report published' },
      ],
    },
    { // ENVIRONMENT
      title: 'Plastic Waste Audit in Coastal Barangays',
      authors: 'EcoWatchers PH',
      image: null,
      imageAlt: 'Volunteers collecting plastic waste',
      pledged: 0,
      goal: 50000,
      daysLeft: 22,
      tags: ['environment', 'plastic', 'audit'],
      category: 'environment',
      overview: lipsum('Overview: Quantifying plastic waste in coastal areas.'),
      methods: lipsum('Methods: Transect surveys and waste categorization.'),
      labNotes: lipsum('Lab Notes: Data entry and volunteer training.'),
      discussion: lipsum('Discussion: Local policy and recycling options.'),
      contextAnswer: lipsum('Context: Marine pollution and community health.'),
      significanceAnswer: lipsum('Significance: Data for targeted cleanups.'),
      goalsAnswer: lipsum('Goals: Publish audit results and recommendations.'),
      teamDescription: lipsum('Team: Environmental scientists and volunteers.'),
      budgetDescription: lipsum('Budget: Survey gear, training, and reporting.'),
      timelineDescription: lipsum('Timeline: 2 months for audit and reporting.'),
      teamMembers: [
        { name: 'Mina Torres', role: 'Lead Scientist', bio: 'Studies marine debris.', email: 'mina.torres@example.org', linkedin: null, twitter: null, expertise: ['marine', 'environment'], image: null, imageAlt: null },
        { name: 'Jonas Lee', role: 'Volunteer Coordinator', bio: 'Manages field teams.', email: 'jonas.lee@example.org', linkedin: null, twitter: null, expertise: ['volunteer', 'training'], image: null, imageAlt: null },
      ],
      budgetItems: [
        { name: 'Survey Gear', description: 'Gloves, bags, scales', value: 5000 },
        { name: 'Training', description: 'Volunteer workshops', value: 4000 },
        { name: 'Reporting', description: 'Data analysis and publication', value: 3000 },
      ],
      timelineEvents: [
        { date: 'SEP 05, 2025', title: 'Volunteer training' },
        { date: 'SEP 20, 2025', title: 'Field surveys' },
        { date: 'OCT 10, 2025', title: 'Results published' },
      ],
    },
    { // HEALTH
      title: 'Telemedicine Access for Rural Communities',
      authors: 'HealthLink PH',
      image: null,
      imageAlt: 'Doctor on video call with patient',
      pledged: 0,
      goal: 110000,
      daysLeft: 38,
      tags: ['health', 'telemedicine', 'rural'],
      category: 'health',
      overview: lipsum('Overview: Expanding telemedicine in underserved areas.'),
      methods: lipsum('Methods: Mobile clinics and digital health platforms.'),
      labNotes: lipsum('Lab Notes: Connectivity and device testing.'),
      discussion: lipsum('Discussion: Patient privacy and data security.'),
      contextAnswer: lipsum('Context: Limited healthcare access in rural regions.'),
      significanceAnswer: lipsum('Significance: Improved health outcomes and reduced travel.'),
      goalsAnswer: lipsum('Goals: 1000 consultations and training local staff.'),
      teamDescription: lipsum('Team: Doctors and IT specialists.'),
      budgetDescription: lipsum('Budget: Devices, connectivity, and training.'),
      timelineDescription: lipsum('Timeline: 5 months for rollout and review.'),
      teamMembers: [
        { name: 'Dr. Paolo Reyes', role: 'Medical Lead', bio: 'Telemedicine specialist.', email: 'paolo.reyes@example.org', linkedin: null, twitter: null, expertise: ['medicine', 'telehealth'], image: null, imageAlt: null },
        { name: 'Grace Tan', role: 'IT Specialist', bio: 'Manages digital platforms.', email: 'grace.tan@example.org', linkedin: null, twitter: null, expertise: ['it', 'health'], image: null, imageAlt: null },
      ],
      budgetItems: [
        { name: 'Devices', description: 'Tablets and laptops', value: 20000 },
        { name: 'Connectivity', description: 'Mobile data plans', value: 15000 },
        { name: 'Training', description: 'Staff workshops', value: 10000 },
      ],
      timelineEvents: [
        { date: 'SEP 18, 2025', title: 'Device distribution' },
        { date: 'OCT 10, 2025', title: 'First consultations' },
        { date: 'NOV 30, 2025', title: 'Staff training complete' },
      ],
    },
  ]

  // Create projects with nested relations
  for (const p of projects) {
    await prisma.project.create({
      data: {
        addedBy: adminUser.id,
        title: p.title,
        authors: p.authors,
        image: p.image,
        imageAlt: p.imageAlt,
        pledged: p.pledged,
        goal: p.goal,
        daysLeft: p.daysLeft,
        tags: p.tags,
        category: p.category,
        overview: p.overview,
        methods: p.methods,
        labNotes: p.labNotes,
        discussion: p.discussion,
        contextAnswer: p.contextAnswer,
        significanceAnswer: p.significanceAnswer,
        goalsAnswer: p.goalsAnswer,
        teamDescription: p.teamDescription,
        budgetDescription: p.budgetDescription,
        timelineDescription: p.timelineDescription,
        teamMembers: { create: p.teamMembers },
        budgetItems: { create: p.budgetItems },
        timelineEvents: { create: p.timelineEvents },
      },
    })
  }

  console.log(`✅ Seeded ${projects.length} projects`)




}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

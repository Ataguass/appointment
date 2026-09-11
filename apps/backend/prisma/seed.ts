import { PrismaClient, Role, AppointmentStatus, PaymentStatus, PaymentMethod, DayOfWeek } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HospitalFlow database...');

  // 1. Password hashes
  const adminPass = await argon2.hash('Admin@12345');
  const staffPass = await argon2.hash('Staff@12345');
  const doctorPass = await argon2.hash('Doctor@12345');
  const patientPass = await argon2.hash('Patient@12345');

  // 2. Create Staff Users
  await prisma.user.upsert({
    where: { email: 'admin@hospitalflow.com' },
    update: {},
    create: {
      email: 'admin@hospitalflow.com',
      passwordHash: adminPass,
      phone: '+919800000001',
      role: Role.ADMIN,
      staff: {
        create: {
          name: 'Super Admin',
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'receptionist@hospitalflow.com' },
    update: {},
    create: {
      email: 'receptionist@hospitalflow.com',
      passwordHash: staffPass,
      phone: '+919800000002',
      role: Role.RECEPTIONIST,
      staff: {
        create: {
          name: 'Front Desk Receptionist',
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'billing@hospitalflow.com' },
    update: {},
    create: {
      email: 'billing@hospitalflow.com',
      passwordHash: staffPass,
      phone: '+919800000003',
      role: Role.BILLING,
      staff: {
        create: {
          name: 'Cashier & Billing Desk',
        },
      },
    },
  });

  console.log('✅ Staff users created.');

  // 3. Create Departments
  const departmentsData = [
    { name: 'Cardiology', description: 'Comprehensive heart and cardiovascular care' },
    { name: 'Pediatrics', description: 'Child healthcare and immunizations' },
    { name: 'Orthopedics', description: 'Bone, joint, and musculoskeletal care' },
    { name: 'Dermatology', description: 'Skin, hair, and aesthetic dermatology' },
    { name: 'General Medicine', description: 'Primary care, fever clinic, and health checkups' },
    { name: 'Neurology', description: 'Brain, spine, and neurological disorders' },
  ];

  const departments: Record<string, any> = {};
  for (const d of departmentsData) {
    const dept = await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
    departments[d.name] = dept;
  }
  console.log('✅ Departments created.');

  // 4. Create Doctors
  const doctorsData = [
    {
      email: 'dr.rajesh@hospitalflow.com',
      name: 'Dr. Rajesh Sharma',
      specialization: 'Senior Cardiologist, MD DM',
      consultationFee: 800,
      slotDurationMins: 20,
      deptName: 'Cardiology',
    },
    {
      email: 'dr.priya@hospitalflow.com',
      name: 'Dr. Priya Patel',
      specialization: 'Pediatric Specialist, MD DCH',
      consultationFee: 600,
      slotDurationMins: 15,
      deptName: 'Pediatrics',
    },
    {
      email: 'dr.vikram@hospitalflow.com',
      name: 'Dr. Vikram Rao',
      specialization: 'Consultant Orthopedic Surgeon, MS',
      consultationFee: 700,
      slotDurationMins: 20,
      deptName: 'Orthopedics',
    },
    {
      email: 'dr.ananya@hospitalflow.com',
      name: 'Dr. Ananya Sen',
      specialization: 'Dermatologist & Cosmetologist, MD',
      consultationFee: 500,
      slotDurationMins: 15,
      deptName: 'Dermatology',
    },
  ];

  const days: DayOfWeek[] = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY,
  ];

  const doctors: Record<string, any> = {};
  for (const doc of doctorsData) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email: doc.email,
        passwordHash: doctorPass,
        phone: `+91981111${Math.floor(1000 + Math.random() * 9000)}`,
        role: Role.DOCTOR,
      },
    });

    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: doc.name,
        specialization: doc.specialization,
        consultationFee: doc.consultationFee,
        slotDurationMins: doc.slotDurationMins,
        departments: {
          create: {
            departmentId: departments[doc.deptName].id,
          },
        },
      },
    });
    doctors[doc.email] = doctor;

    // Create 7-day schedule (Mon-Fri 09:00-17:00, Sat 09:00-13:00)
    for (const day of days) {
      const isWeekday = day !== DayOfWeek.SUNDAY;
      const isSaturday = day === DayOfWeek.SATURDAY;
      const endTime = isSaturday ? '13:00' : '17:00';

      await prisma.schedule.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime,
          isActive: isWeekday,
        },
      });

      // Lunch break on weekdays
      if (isWeekday && !isSaturday) {
        await prisma.break.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek: day,
            startTime: '13:00',
            endTime: '14:00',
            label: 'Lunch Break',
          },
        });
      }
    }
  }
  console.log('✅ Doctors & 7-day weekly schedules created.');

  // 5. Create Patients
  const patientsData = [
    { email: 'john@example.com', name: 'John Doe', phone: '+919876543210', dob: new Date('1988-04-12'), gender: 'Male' },
    { email: 'jane@example.com', name: 'Jane Smith', phone: '+919876543211', dob: new Date('1994-08-25'), gender: 'Female' },
    { email: 'rohit@example.com', name: 'Rohit Kumar', phone: '+919876543212', dob: new Date('1975-11-03'), gender: 'Male' },
  ];

  const patients: Record<string, any> = {};
  for (const p of patientsData) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        passwordHash: patientPass,
        phone: p.phone,
        role: Role.PATIENT,
      },
    });

    const patient = await prisma.patient.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: p.name,
        dateOfBirth: p.dob,
        gender: p.gender,
      },
    });
    patients[p.email] = patient;
  }
  console.log('✅ Patients created.');

  // 6. Create Today's Live OPD Appointments & Queue
  const rajeshDoctor = doctors['dr.rajesh@hospitalflow.com'];
  const johnPatient = patients['john@example.com'];
  const janePatient = patients['jane@example.com'];
  const rohitPatient = patients['rohit@example.com'];

  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];

  // Appointment 1: Completed Consultation for John Doe
  const slot1Start = new Date(`${todayDateStr}T09:00:00.000Z`);
  const slot1End = new Date(`${todayDateStr}T09:20:00.000Z`);

  await prisma.appointment.create({
    data: {
      doctorId: rajeshDoctor.id,
      patientId: johnPatient.id,
      scheduledStart: slot1Start,
      scheduledEnd: slot1End,
      status: AppointmentStatus.COMPLETED,
      reason: 'Routine ECG & Blood Pressure Follow-up',
      queueToken: {
        create: {
          doctorId: rajeshDoctor.id,
          date: new Date(`${todayDateStr}T00:00:00.000Z`),
          tokenNumber: 101,
          checkedInAt: slot1Start,
        },
      },
      payment: {
        create: {
          amount: rajeshDoctor.consultationFee,
          status: PaymentStatus.PAID,
          method: PaymentMethod.UPI,
          transactionId: 'UPI_REF_9812401924',
          paidAt: slot1Start,
        },
      },
      consultationNote: {
        create: {
          doctorId: rajeshDoctor.id,
          diagnosis: 'Stage 1 Essential Hypertension (Controlled)',
          notes: 'BP: 130/84 mmHg, Pulse 72 bpm. Maintain low sodium diet, 30 min daily brisk walking. Repeat lipid profile in 3 months.',
          prescription: JSON.stringify([
            { name: 'Telmisartan', dosage: '40mg', frequency: '1-0-0', duration: '30 days', instructions: 'After breakfast' },
            { name: 'Aspirin', dosage: '75mg', frequency: '0-0-1', duration: '30 days', instructions: 'After dinner' },
          ]),
        },
      },
    },
  });

  // Appointment 2: In Consultation for Jane Smith
  const slot2Start = new Date(`${todayDateStr}T09:20:00.000Z`);
  const slot2End = new Date(`${todayDateStr}T09:40:00.000Z`);

  await prisma.appointment.create({
    data: {
      doctorId: rajeshDoctor.id,
      patientId: janePatient.id,
      scheduledStart: slot2Start,
      scheduledEnd: slot2End,
      status: AppointmentStatus.IN_CONSULTATION,
      reason: 'Chest tightness and palpitations during exertion',
      queueToken: {
        create: {
          doctorId: rajeshDoctor.id,
          date: new Date(`${todayDateStr}T00:00:00.000Z`),
          tokenNumber: 102,
          checkedInAt: new Date(),
        },
      },
      payment: {
        create: {
          amount: rajeshDoctor.consultationFee,
          status: PaymentStatus.PAID,
          method: PaymentMethod.CARD,
          transactionId: 'POS_CARD_AUTH_8731',
          paidAt: new Date(),
        },
      },
    },
  });

  // Appointment 3: In Queue for Rohit Kumar
  const slot3Start = new Date(`${todayDateStr}T09:40:00.000Z`);
  const slot3End = new Date(`${todayDateStr}T10:00:00.000Z`);

  await prisma.appointment.create({
    data: {
      doctorId: rajeshDoctor.id,
      patientId: rohitPatient.id,
      scheduledStart: slot3Start,
      scheduledEnd: slot3End,
      status: AppointmentStatus.IN_QUEUE,
      reason: 'Post-CABG 6-month checkup',
      queueToken: {
        create: {
          doctorId: rajeshDoctor.id,
          date: new Date(`${todayDateStr}T00:00:00.000Z`),
          tokenNumber: 103,
          checkedInAt: new Date(),
        },
      },
      payment: {
        create: {
          amount: rajeshDoctor.consultationFee,
          status: PaymentStatus.UNPAID,
        },
      },
    },
  });

  console.log('✅ Live OPD appointments, queue tokens, prescriptions, and receipts seeded.');
  console.log('\n🚀 HospitalFlow Seed Summary:');
  console.log('----------------------------------------------------');
  console.log('Admin:        admin@hospitalflow.com / Admin@12345');
  console.log('Receptionist: receptionist@hospitalflow.com / Staff@12345');
  console.log('Billing:      billing@hospitalflow.com / Staff@12345');
  console.log('Doctor:       dr.rajesh@hospitalflow.com / Doctor@12345');
  console.log('Patient:      john@example.com / Patient@12345');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

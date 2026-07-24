import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Decimal from 'decimal.js';
import {
  INITIAL_COA,
  INITIAL_PACKAGES,
  INITIAL_KLOTERS,
  INITIAL_JAMAAH,
  INITIAL_REGISTRATIONS,
  INITIAL_SCHEDULES,
  INITIAL_PAYMENTS,
  INITIAL_JOURNALS,
  INITIAL_VENDORS,
  INITIAL_VENDOR_BILLS
} from './src/data/initialData';
import {
  ChartOfAccount,
  TravelPackage,
  DepartureKloter,
  Jamaah,
  JamaahRegistration,
  PaymentSchedule,
  JamaahPaymentTransaction,
  JournalEntry,
  JournalLine,
  Vendor,
  VendorBill,
  KloterProfitabilityReport
} from './src/types';

// In-Memory Database Store for ERP State
let coaList: ChartOfAccount[] = [...INITIAL_COA];
let packageList: TravelPackage[] = [...INITIAL_PACKAGES];
let kloterList: DepartureKloter[] = [...INITIAL_KLOTERS];
let jamaahList: Jamaah[] = [...INITIAL_JAMAAH];
let registrationList: JamaahRegistration[] = [...INITIAL_REGISTRATIONS];
let scheduleList: PaymentSchedule[] = [...INITIAL_SCHEDULES];
let paymentList: JamaahPaymentTransaction[] = [...INITIAL_PAYMENTS];
let journalList: JournalEntry[] = [...INITIAL_JOURNALS];
let vendorList: Vendor[] = [...INITIAL_VENDORS];
let vendorBillList: VendorBill[] = [...INITIAL_VENDOR_BILLS];

let journalCounter = journalList.length + 1;
let receiptCounter = paymentList.length + 1;
let regCounter = registrationList.length + 1;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ERP Travel Umrah & Haji Accounting Engine' });
  });

  // --- CHART OF ACCOUNTS (COA) ENDPOINTS ---
  app.get('/api/coa', (req, res) => {
    res.json(coaList);
  });

  app.post('/api/coa', (req, res) => {
    const { code, name, category, currency, description } = req.body;
    if (!code || !name || !category) {
      return res.status(400).json({ error: 'Kode, nama, dan kategori akun wajib diisi.' });
    }
    const exists = coaList.some(a => a.code === code);
    if (exists) {
      return res.status(400).json({ error: `Kode akun ${code} sudah digunakan.` });
    }
    const newCoa: ChartOfAccount = {
      id: `coa-${Date.now()}`,
      code,
      name,
      category,
      currency: currency || 'IDR',
      balance: 0,
      isSystem: false,
      description: description || ''
    };
    coaList.push(newCoa);
    res.status(201).json(newCoa);
  });

  // --- PACKAGES & KLOTERS ENDPOINTS ---
  app.get('/api/packages', (req, res) => {
    res.json(packageList);
  });

  app.post('/api/packages', (req, res) => {
    const { code, name, category, priceQuad, priceTriple, priceDouble, durationDays, hotelMakkah, hotelMadinah, airline, description } = req.body;
    const newPkg: TravelPackage = {
      id: `pkg-${Date.now()}`,
      code: code || `PKG-${Date.now()}`,
      name,
      category: category || 'UMRAH_REGULER_9D',
      priceQuad: Number(priceQuad) || 0,
      priceTriple: Number(priceTriple) || 0,
      priceDouble: Number(priceDouble) || 0,
      currency: 'IDR',
      durationDays: Number(durationDays) || 9,
      hotelMakkah: hotelMakkah || 'TBA',
      hotelMadinah: hotelMadinah || 'TBA',
      airline: airline || 'TBA',
      description: description || '',
      isActive: true
    };
    packageList.push(newPkg);
    res.status(201).json(newPkg);
  });

  app.get('/api/kloters', (req, res) => {
    res.json(kloterList);
  });

  app.post('/api/kloters', (req, res) => {
    const { packageId, code, name, departureDate, returnDate, targetQuota, estimatedCOGS, notes } = req.body;
    if (!name || !packageId) {
      return res.status(400).json({ error: 'Nama Kloter dan Jenis Paket wajib diisi.' });
    }
    const depDate = departureDate || new Date().toISOString().split('T')[0];
    const retDate = returnDate || depDate;
    const newKloter: DepartureKloter = {
      id: `klt-${Date.now()}`,
      packageId,
      code: code || `KLOTER-${new Date().getFullYear()}-UMR-${String(kloterList.length + 1).padStart(2, '0')}`,
      name,
      departureDate: depDate,
      returnDate: retDate,
      targetQuota: Number(targetQuota) || 40,
      filledQuota: 0,
      status: 'OPEN',
      estimatedCOGS: estimatedCOGS || {
        flightTicketPerPax: 12000000,
        hotelPerPax: 8000000,
        visaPerPax: 2000000,
        landArrangementPerPax: 2500000,
        handlingEquipmentPerPax: 1000000,
        otherPerPax: 500000
      },
      isRevenueRecognized: false,
      notes: notes || ''
    };
    kloterList.push(newKloter);
    res.status(201).json(newKloter);
  });

  // REVENUE RECOGNITION ENDPOINT (Core Accounting Event for Keberangkatan Kloter)
  app.post('/api/kloters/:id/recognize-revenue', (req, res) => {
    const kloterId = req.params.id;
    const kloter = kloterList.find(k => k.id === kloterId);
    if (!kloter) {
      return res.status(404).json({ error: 'Kloter tidak ditemukan.' });
    }
    if (kloter.isRevenueRecognized) {
      return res.status(400).json({ error: 'Pendapatan untuk Kloter ini sudah pernah diakui sebelumnya.' });
    }

    // Get all registrations in this kloter
    const regInKloter = registrationList.filter(r => r.kloterId === kloterId && r.status !== 'CANCELLED');
    if (regInKloter.length === 0) {
      return res.status(400).json({ error: 'Kloter ini belum memiliki jamaah terdaftar.' });
    }

    // Calculate total unearned revenue collected for this kloter
    let totalCollected = new Decimal(0);
    regInKloter.forEach(reg => {
      totalCollected = totalCollected.plus(new Decimal(reg.paidAmount));
    });

    if (totalCollected.isZero()) {
      return res.status(400).json({ error: 'Belum ada pembayaran jamaah yang dapat diakui sebagai pendapatan.' });
    }

    const unearnedCoaCode = kloter.code.includes('HAJ') ? '2102' : '2101';
    const revenueCoaCode = kloter.code.includes('HAJ') ? '4102' : '4101';

    const unearnedCoa = coaList.find(a => a.code === unearnedCoaCode);
    const revenueCoa = coaList.find(a => a.code === revenueCoaCode);

    if (!unearnedCoa || !revenueCoa) {
      return res.status(500).json({ error: 'Akun COA Pendapatan Diterima di Muka / Pendapatan Paket tidak ditemukan.' });
    }

    const recognizeAmount = totalCollected.toNumber();

    // 1. Update COA balances
    unearnedCoa.balance = new Decimal(unearnedCoa.balance).minus(recognizeAmount).toNumber();
    revenueCoa.balance = new Decimal(revenueCoa.balance).plus(recognizeAmount).toNumber();

    // 2. Mark Registrations
    regInKloter.forEach(reg => {
      reg.unearnedRevenueRecognized = reg.paidAmount;
      reg.status = 'DEPARTED';
    });

    // 3. Mark Kloter
    kloter.status = 'DEPARTED';
    kloter.isRevenueRecognized = true;
    kloter.revenueRecognitionDate = new Date().toISOString().split('T')[0];

    // 4. Create Automatic Journal Entry
    const jvNum = `JV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(journalCounter++).padStart(3, '0')}`;
    const newJournal: JournalEntry = {
      id: `jv-rev-${Date.now()}`,
      journalNumber: jvNum,
      transactionDate: kloter.revenueRecognitionDate,
      referenceType: 'REVENUE_RECOGNITION',
      referenceId: kloter.id,
      description: `Pengakuan Pendapatan Keberangkatan ${kloter.name} (${kloter.code}) - ${regInKloter.length} Pax`,
      totalDebit: recognizeAmount,
      totalCredit: recognizeAmount,
      lines: [
        {
          id: `jl-rr-1-${Date.now()}`,
          journalId: `jv-rev-${Date.now()}`,
          accountId: unearnedCoa.id,
          accountCode: unearnedCoa.code,
          accountName: unearnedCoa.name,
          debit: recognizeAmount,
          credit: 0,
          memo: `Pengakuan Pendapatan Diterima di Muka Kloter ${kloter.code}`,
          kloterId: kloter.id
        },
        {
          id: `jl-rr-2-${Date.now()}`,
          journalId: `jv-rev-${Date.now()}`,
          accountId: revenueCoa.id,
          accountCode: revenueCoa.code,
          accountName: revenueCoa.name,
          debit: 0,
          credit: recognizeAmount,
          memo: `Pendapatan Paket Umrah/Haji Diakui Berangkat`,
          kloterId: kloter.id
        }
      ],
      createdBy: 'Revenue Recognition Engine',
      createdAt: new Date().toISOString()
    };

    journalList.unshift(newJournal);

    res.json({
      message: 'Pengakuan Pendapatan berhasil di-posting ke Jurnal Umum!',
      totalRecognized: recognizeAmount,
      journalEntry: newJournal,
      kloter
    });
  });

  // --- JAMAAH & REGISTRATION ENDPOINTS ---
  app.get('/api/jamaah', (req, res) => {
    res.json(jamaahList);
  });

  app.post('/api/jamaah', (req, res) => {
    const { nik, fullName, passportNumber, passportExpiry, phone, email, address, gender, birthDate, emergencyContact } = req.body;
    if (!fullName || !nik) {
      return res.status(400).json({ error: 'NIK dan Nama Lengkap wajib diisi.' });
    }
    const newJamaah: Jamaah = {
      id: `jam-${Date.now()}`,
      nik,
      fullName,
      passportNumber: passportNumber || '-',
      passportExpiry: passportExpiry || '',
      phone: phone || '-',
      email: email || '',
      address: address || '',
      gender: gender || 'L',
      birthDate: birthDate || '1990-01-01',
      emergencyContact: emergencyContact || { name: '-', relation: '-', phone: '-' }
    };
    jamaahList.push(newJamaah);
    res.status(201).json(newJamaah);
  });

  app.get('/api/registrations', (req, res) => {
    const fullData = registrationList.map(reg => {
      const jam = jamaahList.find(j => j.id === reg.jamaahId);
      const pkg = packageList.find(p => p.id === reg.packageId);
      const klt = kloterList.find(k => k.id === reg.kloterId);
      const schedules = scheduleList.filter(s => s.registrationId === reg.id);
      const payments = paymentList.filter(p => p.registrationId === reg.id);
      return {
        ...reg,
        jamaah: jam,
        package: pkg,
        kloter: klt,
        schedules,
        payments
      };
    });
    res.json(fullData);
  });

  app.post('/api/registrations', (req, res) => {
    const { jamaahId, packageId, kloterId, roomType, discount, addOnPrice, notes, customSchedules } = req.body;

    const jam = jamaahList.find(j => j.id === jamaahId);
    const pkg = packageList.find(p => p.id === packageId);
    const klt = kloterList.find(k => k.id === kloterId);

    if (!jam || !pkg || !klt) {
      return res.status(400).json({ error: 'Jamaah, Paket, atau Kloter tidak valid.' });
    }

    let basePrice = pkg.priceQuad;
    if (roomType === 'TRIPLE') basePrice = pkg.priceTriple;
    if (roomType === 'DOUBLE') basePrice = pkg.priceDouble;

    const discNum = new Decimal(discount || 0);
    const addOnNum = new Decimal(addOnPrice || 0);
    const totalBillNum = new Decimal(basePrice).minus(discNum).plus(addOnNum);

    const regNum = `REG-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(regCounter++).padStart(3, '0')}`;

    const newReg: JamaahRegistration = {
      id: `reg-${Date.now()}`,
      registrationNumber: regNum,
      jamaahId,
      packageId,
      kloterId,
      registrationDate: new Date().toISOString().split('T')[0],
      roomType: roomType || 'QUAD',
      basePrice,
      discount: discNum.toNumber(),
      addOnPrice: addOnNum.toNumber(),
      totalBill: totalBillNum.toNumber(),
      paidAmount: 0,
      balanceDue: totalBillNum.toNumber(),
      unearnedRevenueRecognized: 0,
      status: 'BOOKED',
      notes: notes || ''
    };

    registrationList.push(newReg);
    klt.filledQuota += 1;

    // Generate Default Payment Schedules (DP 5,000,000 + 3 Installments + Pelunasan)
    const schedulesToCreate: PaymentSchedule[] = [];
    if (customSchedules && Array.isArray(customSchedules) && customSchedules.length > 0) {
      customSchedules.forEach((cs, idx) => {
        schedulesToCreate.push({
          id: `sch-${newReg.id}-${idx + 1}`,
          registrationId: newReg.id,
          installmentNumber: idx + 1,
          title: cs.title || `Cicilan Ke-${idx + 1}`,
          dueDate: cs.dueDate || new Date().toISOString().split('T')[0],
          amount: Number(cs.amount) || 0,
          paidAmount: 0,
          status: 'PENDING'
        });
      });
    } else {
      // Default auto-split schedule
      const dpAmount = 5000000;
      const remaining = totalBillNum.minus(dpAmount);
      const perInstallment = remaining.dividedBy(3).round();

      schedulesToCreate.push({
        id: `sch-${newReg.id}-1`,
        registrationId: newReg.id,
        installmentNumber: 1,
        title: 'DP / Booking Fee',
        dueDate: new Date().toISOString().split('T')[0],
        amount: dpAmount,
        paidAmount: 0,
        status: 'PENDING'
      });

      schedulesToCreate.push({
        id: `sch-${newReg.id}-2`,
        registrationId: newReg.id,
        installmentNumber: 2,
        title: 'Cicilan Ke-1',
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        amount: perInstallment.toNumber(),
        paidAmount: 0,
        status: 'PENDING'
      });

      schedulesToCreate.push({
        id: `sch-${newReg.id}-3`,
        registrationId: newReg.id,
        installmentNumber: 3,
        title: 'Cicilan Ke-2',
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        amount: perInstallment.toNumber(),
        paidAmount: 0,
        status: 'PENDING'
      });

      const finalAmount = totalBillNum.minus(dpAmount).minus(perInstallment.times(2)).toNumber();
      schedulesToCreate.push({
        id: `sch-${newReg.id}-4`,
        registrationId: newReg.id,
        installmentNumber: 4,
        title: 'Pelunasan',
        dueDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
        amount: finalAmount,
        paidAmount: 0,
        status: 'PENDING'
      });
    }

    scheduleList.push(...schedulesToCreate);

    res.status(201).json({
      registration: newReg,
      schedules: schedulesToCreate
    });
  });

  // --- CORE FEATURE: PAYMENT TRANSACTION & AUTOMATIC DOUBLE-ENTRY JOURNAL ENTRY ---
  app.post('/api/payments', (req, res) => {
    const { registrationId, installmentId, amount, paymentMethod, bankAccountId, paymentDate, notes, createdBy } = req.body;

    const reg = registrationList.find(r => r.id === registrationId);
    if (!reg) {
      return res.status(404).json({ error: 'Pendaftaran Tagihan Jamaah tidak ditemukan.' });
    }

    const bankCoa = coaList.find(a => a.id === bankAccountId || a.code === bankAccountId);
    if (!bankCoa) {
      return res.status(400).json({ error: 'Akun Kas/Bank pilihan tidak ditemukan.' });
    }

    const payNum = new Decimal(amount || 0);
    if (payNum.isZero() || payNum.isNegative()) {
      return res.status(400).json({ error: 'Nominal pembayaran harus lebih besar dari 0.' });
    }

    const pkg = packageList.find(p => p.id === reg.packageId);
    const unearnedCoaCode = (pkg && pkg.category === 'HAJI_PLUS') ? '2102' : '2101';
    const unearnedCoa = coaList.find(a => a.code === unearnedCoaCode);

    if (!unearnedCoa) {
      return res.status(500).json({ error: 'Akun COA Pendapatan Diterima di Muka tidak dikonfigurasi.' });
    }

    const jam = jamaahList.find(j => j.id === reg.jamaahId);
    const kwNum = `KW-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(receiptCounter++).padStart(3, '0')}`;
    const jvNum = `JV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(journalCounter++).padStart(3, '0')}`;

    // 1. Update Registration paid balance
    const newPaidAmount = new Decimal(reg.paidAmount).plus(payNum);
    const newBalanceDue = new Decimal(reg.totalBill).minus(newPaidAmount);

    reg.paidAmount = newPaidAmount.toNumber();
    reg.balanceDue = Math.max(0, newBalanceDue.toNumber());
    reg.status = reg.balanceDue === 0 ? 'PAID_OFF' : 'PARTIAL';

    // 2. Update Installment Schedule if specified
    if (installmentId) {
      const sch = scheduleList.find(s => s.id === installmentId);
      if (sch) {
        const schPaid = new Decimal(sch.paidAmount).plus(payNum);
        sch.paidAmount = schPaid.toNumber();
        sch.status = sch.paidAmount >= sch.amount ? 'PAID' : 'PARTIAL';
      }
    }

    // 3. Update COA Balances (Asset & Liability)
    bankCoa.balance = new Decimal(bankCoa.balance).plus(payNum).toNumber();
    unearnedCoa.balance = new Decimal(unearnedCoa.balance).plus(payNum).toNumber();

    // 4. Create Automatic Double-Entry Journal Entry
    const jvId = `jv-pay-${Date.now()}`;
    const newJournal: JournalEntry = {
      id: jvId,
      journalNumber: jvNum,
      transactionDate: paymentDate || new Date().toISOString().split('T')[0],
      referenceType: 'JAMAAH_PAYMENT',
      referenceId: kwNum,
      description: `Penerimaan Pembayaran Jamaah ${jam ? jam.fullName : ''} (${kwNum})`,
      totalDebit: payNum.toNumber(),
      totalCredit: payNum.toNumber(),
      lines: [
        {
          id: `jl-${jvId}-1`,
          journalId: jvId,
          accountId: bankCoa.id,
          accountCode: bankCoa.code,
          accountName: bankCoa.name,
          debit: payNum.toNumber(),
          credit: 0,
          memo: `Setoran Pembayaran ${jam ? jam.fullName : 'Jamaah'} via ${paymentMethod}`
        },
        {
          id: `jl-${jvId}-2`,
          journalId: jvId,
          accountId: unearnedCoa.id,
          accountCode: unearnedCoa.code,
          accountName: unearnedCoa.name,
          debit: 0,
          credit: payNum.toNumber(),
          memo: `Unearned Revenue / Liabilitas Jamaah Belum Berangkat`
        }
      ],
      createdBy: createdBy || 'Kasir Finance',
      createdAt: new Date().toISOString()
    };

    journalList.unshift(newJournal);

    // 5. Create Payment Transaction Record
    const newPayment: JamaahPaymentTransaction = {
      id: `pay-${Date.now()}`,
      receiptNumber: kwNum,
      registrationId,
      installmentId,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      amount: payNum.toNumber(),
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      bankAccountId: bankCoa.id,
      currency: 'IDR',
      exchangeRate: 1,
      notes: notes || 'Pembayaran Jamaah',
      createdBy: createdBy || 'Kasir Finance',
      journalEntryId: jvId
    };

    paymentList.unshift(newPayment);

    res.status(201).json({
      message: 'Pembayaran berhasil dicatat & Jurnal Otomatis berhasil ter-posting!',
      payment: newPayment,
      journalEntry: newJournal,
      registration: reg
    });
  });

  // --- JOURNALS & LEDGER ENDPOINTS ---
  app.get('/api/journals', (req, res) => {
    res.json(journalList);
  });

  // --- VENDORS & BILLS ENDPOINTS ---
  app.get('/api/vendors', (req, res) => {
    res.json({ vendors: vendorList, bills: vendorBillList });
  });

  app.post('/api/vendor-bills', (req, res) => {
    const { vendorId, kloterId, cogsAccountId, billDate, dueDate, totalAmount, description } = req.body;
    const vnd = vendorList.find(v => v.id === vendorId);
    const klt = kloterList.find(k => k.id === kloterId);
    const cogsCoa = coaList.find(c => c.id === cogsAccountId || c.code === cogsAccountId);
    const payableCoa = coaList.find(c => c.code === '2103');

    if (!vnd || !klt || !cogsCoa || !payableCoa) {
      return res.status(400).json({ error: 'Vendor, Kloter, atau Akun HPP/Utang tidak valid.' });
    }

    const amt = Number(totalAmount) || 0;
    const invNum = `INV-${vnd.code}-${Date.now().toString().slice(-4)}`;
    const jvNum = `JV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(journalCounter++).padStart(3, '0')}`;

    // Update COA
    cogsCoa.balance = new Decimal(cogsCoa.balance).plus(amt).toNumber();
    payableCoa.balance = new Decimal(payableCoa.balance).plus(amt).toNumber();

    // Auto Journal Entry [Debit HPP -> Credit Utang Vendor]
    const jvId = `jv-vbill-${Date.now()}`;
    const newJournal: JournalEntry = {
      id: jvId,
      journalNumber: jvNum,
      transactionDate: billDate || new Date().toISOString().split('T')[0],
      referenceType: 'VENDOR_BILL',
      referenceId: invNum,
      description: `Tagihan Vendor ${vnd.name} - Kloter ${klt.name}`,
      totalDebit: amt,
      totalCredit: amt,
      lines: [
        { id: `jl-${jvId}-1`, journalId: jvId, accountId: cogsCoa.id, accountCode: cogsCoa.code, accountName: cogsCoa.name, debit: amt, credit: 0, memo: `HPP Kloter ${klt.code}`, kloterId: klt.id },
        { id: `jl-${jvId}-2`, journalId: jvId, accountId: payableCoa.id, accountCode: payableCoa.code, accountName: payableCoa.name, debit: 0, credit: amt, memo: `Utang Vendor ${vnd.name}` }
      ],
      createdBy: 'Accountant',
      createdAt: new Date().toISOString()
    };

    journalList.unshift(newJournal);

    const newBill: VendorBill = {
      id: `vbill-${Date.now()}`,
      billNumber: invNum,
      vendorId,
      kloterId,
      cogsAccountId: cogsCoa.id,
      billDate: billDate || new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      totalAmount: amt,
      paidAmount: 0,
      status: 'UNPAID',
      description: description || '',
      journalEntryId: jvId
    };

    vendorBillList.unshift(newBill);

    res.status(201).json({ bill: newBill, journalEntry: newJournal });
  });

  // --- SPECIALIZED FINANCIAL REPORT ENDPOINTS ---

  // 1. Profitability per Kloter Report
  app.get('/api/reports/profitability', (req, res) => {
    const reports: KloterProfitabilityReport[] = kloterList.map(klt => {
      const regs = registrationList.filter(r => r.kloterId === klt.id && r.status !== 'CANCELLED');
      const totalJamaah = regs.length;

      let recognizedRev = new Decimal(0);
      let pendingUnearned = new Decimal(0);

      regs.forEach(r => {
        if (klt.isRevenueRecognized) {
          recognizedRev = recognizedRev.plus(r.paidAmount);
        } else {
          pendingUnearned = pendingUnearned.plus(r.paidAmount);
        }
      });

      // Find all Vendor bills linked to this kloter
      const bills = vendorBillList.filter(b => b.kloterId === klt.id);

      let flightTickets = new Decimal(0);
      let hotels = new Decimal(0);
      let visa = new Decimal(0);
      let landArrangement = new Decimal(0);
      let handlingEquipment = new Decimal(0);
      let others = new Decimal(0);

      bills.forEach(b => {
        const coa = coaList.find(c => c.id === b.cogsAccountId);
        const code = coa ? coa.code : '';
        if (code === '5101') flightTickets = flightTickets.plus(b.totalAmount);
        else if (code === '5102') hotels = hotels.plus(b.totalAmount);
        else if (code === '5103') visa = visa.plus(b.totalAmount);
        else if (code === '5104') landArrangement = landArrangement.plus(b.totalAmount);
        else if (code === '5105') handlingEquipment = handlingEquipment.plus(b.totalAmount);
        else others = others.plus(b.totalAmount);
      });

      // If no vendor bills recorded yet, fallback to estimated COGS for totalJamaah
      if (bills.length === 0 && totalJamaah > 0) {
        flightTickets = new Decimal(klt.estimatedCOGS.flightTicketPerPax).times(totalJamaah);
        hotels = new Decimal(klt.estimatedCOGS.hotelPerPax).times(totalJamaah);
        visa = new Decimal(klt.estimatedCOGS.visaPerPax).times(totalJamaah);
        landArrangement = new Decimal(klt.estimatedCOGS.landArrangementPerPax).times(totalJamaah);
        handlingEquipment = new Decimal(klt.estimatedCOGS.handlingEquipmentPerPax).times(totalJamaah);
        others = new Decimal(klt.estimatedCOGS.otherPerPax).times(totalJamaah);
      }

      const totalCOGS = flightTickets.plus(hotels).plus(visa).plus(landArrangement).plus(handlingEquipment).plus(others);
      const grossProfit = recognizedRev.minus(totalCOGS);
      const marginPct = recognizedRev.isZero() ? 0 : grossProfit.dividedBy(recognizedRev).times(100).round().toNumber();

      const pkg = packageList.find(p => p.id === klt.packageId);

      return {
        kloterId: klt.id,
        kloterCode: klt.code,
        kloterName: klt.name,
        packageId: klt.packageId,
        packageCategory: pkg ? pkg.category : undefined,
        packageName: pkg ? pkg.name : '-',
        departureDate: klt.departureDate,
        totalJamaah,
        totalRevenueRecognized: recognizedRev.toNumber(),
        totalUnearnedRevenuePending: pendingUnearned.toNumber(),
        realizedCOGS: {
          flightTickets: flightTickets.toNumber(),
          hotels: hotels.toNumber(),
          visa: visa.toNumber(),
          landArrangement: landArrangement.toNumber(),
          handlingEquipment: handlingEquipment.toNumber(),
          others: others.toNumber(),
          total: totalCOGS.toNumber()
        },
        grossProfit: grossProfit.toNumber(),
        profitMarginPercent: marginPct,
        status: klt.status
      };
    });

    res.json(reports);
  });

  // 2. Receivables Aging Report
  app.get('/api/reports/receivables', (req, res) => {
    const list = registrationList.map(reg => {
      const jam = jamaahList.find(j => j.id === reg.jamaahId);
      const pkg = packageList.find(p => p.id === reg.packageId);
      const klt = kloterList.find(k => k.id === reg.kloterId);
      const schedules = scheduleList.filter(s => s.registrationId === reg.id);

      return {
        registrationId: reg.id,
        registrationNumber: reg.registrationNumber,
        jamaahName: jam ? jam.fullName : 'Jamaah',
        jamaahPhone: jam ? jam.phone : '-',
        packageName: pkg ? pkg.name : '-',
        kloterName: klt ? klt.name : '-',
        departureDate: klt ? klt.departureDate : '-',
        totalBill: reg.totalBill,
        paidAmount: reg.paidAmount,
        balanceDue: reg.balanceDue,
        status: reg.status,
        schedules
      };
    });
    res.json(list);
  });

  // Serve static assets in production or Vite middleware in dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ERP Umrah & Haji running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

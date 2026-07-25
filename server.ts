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
  INITIAL_VENDOR_BILLS,
  INITIAL_VENDOR_PAYMENTS,
  INITIAL_MITRA,
  INITIAL_COMMISSIONS
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
  VendorPayment,
  KloterProfitabilityReport,
  Mitra,
  MitraCommission
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
let vendorPaymentList: VendorPayment[] = [...INITIAL_VENDOR_PAYMENTS];
let mitraList: Mitra[] = [...INITIAL_MITRA];
let commissionList: MitraCommission[] = [...INITIAL_COMMISSIONS];

let journalCounter = journalList.length + 1;
let receiptCounter = paymentList.length + 1;
let regCounter = registrationList.length + 1;
let commissionCounter = commissionList.length + 1;

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
    const { code, name, category, priceQuad, priceTriple, priceDouble, durationDays, hotelMakkah, hotelMadinah, airline, description, isActive } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nama Paket wajib diisi.' });
    }
    const pQuad = Number(priceQuad) || 0;
    const pTriple = Number(priceTriple) || pQuad;
    const pDouble = Number(priceDouble) || pQuad;

    const newPkg: TravelPackage = {
      id: `pkg-${Date.now()}`,
      code: code || `PKG-${Date.now()}`,
      name,
      category: category || 'UMRAH_REGULER_9D',
      priceQuad: pQuad,
      priceTriple: pTriple,
      priceDouble: pDouble,
      currency: 'IDR',
      durationDays: Number(durationDays) || 9,
      hotelMakkah: hotelMakkah || 'TBA',
      hotelMadinah: hotelMadinah || 'TBA',
      airline: airline || 'TBA',
      description: description || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true
    };
    packageList.push(newPkg);
    res.status(201).json(newPkg);
  });

  app.put('/api/packages/:id', (req, res) => {
    const { id } = req.params;
    const pkgIndex = packageList.findIndex(p => p.id === id);
    if (pkgIndex === -1) {
      return res.status(404).json({ error: 'Paket tidak ditemukan.' });
    }

    const { code, name, category, priceQuad, priceTriple, priceDouble, durationDays, hotelMakkah, hotelMadinah, airline, description, isActive } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nama Paket wajib diisi.' });
    }

    const pQuad = Number(priceQuad) || 0;
    const pTriple = Number(priceTriple) || pQuad;
    const pDouble = Number(priceDouble) || pQuad;

    packageList[pkgIndex] = {
      ...packageList[pkgIndex],
      code: code || packageList[pkgIndex].code,
      name,
      category: category || packageList[pkgIndex].category,
      priceQuad: pQuad,
      priceTriple: pTriple,
      priceDouble: pDouble,
      durationDays: durationDays !== undefined ? Number(durationDays) : packageList[pkgIndex].durationDays,
      hotelMakkah: hotelMakkah !== undefined ? hotelMakkah : packageList[pkgIndex].hotelMakkah,
      hotelMadinah: hotelMadinah !== undefined ? hotelMadinah : packageList[pkgIndex].hotelMadinah,
      airline: airline !== undefined ? airline : packageList[pkgIndex].airline,
      description: description !== undefined ? description : packageList[pkgIndex].description,
      isActive: isActive !== undefined ? Boolean(isActive) : packageList[pkgIndex].isActive
    };

    res.json(packageList[pkgIndex]);
  });

  app.patch('/api/packages/:id/toggle', (req, res) => {
    const { id } = req.params;
    const pkg = packageList.find(p => p.id === id);
    if (!pkg) {
      return res.status(404).json({ error: 'Paket tidak ditemukan.' });
    }
    pkg.isActive = !pkg.isActive;
    res.json(pkg);
  });

  app.delete('/api/packages/:id', (req, res) => {
    const { id } = req.params;
    const isUsedInKloter = kloterList.some(k => k.packageId === id);
    const isUsedInReg = registrationList.some(r => r.packageId === id);

    if (isUsedInKloter || isUsedInReg) {
      return res.status(400).json({
        error: 'Paket tidak dapat dihapus karena sudah memiliki Kloter/Pendaftaran Jamaah aktif. Silakan ubah status menjadi Non-Aktif.'
      });
    }

    packageList = packageList.filter(p => p.id !== id);
    res.json({ message: 'Paket berhasil dihapus.' });
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
    const { jamaahId, packageId, kloterId, mitraId, roomType, discount, addOnPrice, notes, customSchedules } = req.body;

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

    const selectedMitra = mitraId ? mitraList.find(m => m.id === mitraId) : undefined;
    const commFee = selectedMitra ? selectedMitra.defaultFeePerPax : 0;

    const newReg: JamaahRegistration = {
      id: `reg-${Date.now()}`,
      registrationNumber: regNum,
      jamaahId,
      packageId,
      kloterId,
      mitraId: selectedMitra ? selectedMitra.id : undefined,
      commissionAmount: commFee,
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

    // Create automatic Pending Mitra Commission if Mitra was selected
    if (selectedMitra) {
      const comNum = `COM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(commissionCounter++).padStart(3, '0')}`;
      const newCommission: MitraCommission = {
        id: `com-${Date.now()}`,
        commissionNumber: comNum,
        mitraId: selectedMitra.id,
        registrationId: newReg.id,
        jamaahName: jam.fullName,
        packageName: pkg.name,
        kloterName: klt.name,
        feeAmount: commFee,
        status: 'PENDING',
        createdDate: new Date().toISOString().split('T')[0]
      };
      commissionList.unshift(newCommission);
    }

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

  // --- MUTASI / PINDAH PAKET & KLOTER JAMAAH ---
  app.post('/api/registrations/:id/mutate', (req, res) => {
    const { id } = req.params;
    const { newPackageId, newKloterId, newRoomType, reason } = req.body;

    const reg = registrationList.find(r => r.id === id);
    if (!reg) {
      return res.status(404).json({ error: 'Data pendaftaran jamaah tidak ditemukan.' });
    }

    const oldPkg = packageList.find(p => p.id === reg.packageId);
    const newPkg = packageList.find(p => p.id === newPackageId);
    const oldKlt = kloterList.find(k => k.id === reg.kloterId);
    const newKlt = kloterList.find(k => k.id === newKloterId);

    if (!newPkg || !newKlt) {
      return res.status(400).json({ error: 'Paket atau Kloter tujuan tidak ditemukan.' });
    }

    // Determine base price based on new room type
    let newBasePrice = newPkg.priceQuad;
    if (newRoomType === 'TRIPLE') newBasePrice = newPkg.priceTriple;
    if (newRoomType === 'DOUBLE') newBasePrice = newPkg.priceDouble;

    const oldTotalBill = new Decimal(reg.totalBill);
    const newTotalBill = new Decimal(newBasePrice).minus(reg.discount || 0).plus(reg.addOnPrice || 0);
    const priceDiff = newTotalBill.minus(oldTotalBill);
    const newPaidAmount = new Decimal(reg.paidAmount);
    const newBalanceDue = newTotalBill.minus(newPaidAmount);

    // Update Kloter filledQuota if Kloter changed
    if (reg.kloterId !== newKloterId) {
      if (oldKlt && oldKlt.filledQuota > 0) {
        oldKlt.filledQuota = Math.max(0, oldKlt.filledQuota - 1);
      }
      newKlt.filledQuota += 1;
    }

    // Format mutation log note
    const todayIndo = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const logText = `[MUTASI ${todayIndo}] Pindah dari Kloter "${oldKlt?.name || '-'}" (${oldPkg?.name || '-'}) ke "${newKlt.name}" (${newPkg.name}) [Tipe Kamar: ${newRoomType}]. Alasan: ${reason || 'Permintaan Mutasi Jamaah'}. Selisih Tagihan: Rp ${priceDiff.toNumber().toLocaleString('id-ID')}.`;

    // Apply updates to registration object
    reg.packageId = newPackageId;
    reg.kloterId = newKloterId;
    reg.roomType = newRoomType;
    reg.basePrice = newBasePrice;
    reg.totalBill = newTotalBill.toNumber();
    reg.balanceDue = newBalanceDue.toNumber();
    
    // Append log to notes
    reg.notes = reg.notes ? `${reg.notes}\n${logText}` : logText;

    // Update Status
    if (newBalanceDue.lte(0)) {
      reg.status = 'PAID_OFF';
    } else if (newPaidAmount.gt(0)) {
      reg.status = 'PARTIAL';
    } else {
      reg.status = 'BOOKED';
    }

    // Adjust unpaid schedules if present
    const regSchedules = scheduleList.filter(s => s.registrationId === reg.id);
    if (regSchedules.length > 0) {
      const unpaidSchedules = regSchedules.filter(s => s.status !== 'PAID');
      if (unpaidSchedules.length > 0) {
        // Adjust the last unpaid schedule with the price difference
        const lastUnpaid = unpaidSchedules[unpaidSchedules.length - 1];
        lastUnpaid.amount = Math.max(0, lastUnpaid.amount + priceDiff.toNumber());
      }
    }

    res.json({
      message: 'Mutasi Paket & Kloter Jamaah berhasil diproses!',
      registration: reg,
      oldTotalBill: oldTotalBill.toNumber(),
      newTotalBill: newTotalBill.toNumber(),
      priceDiff: priceDiff.toNumber(),
      newBalanceDue: newBalanceDue.toNumber()
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
    res.json({ vendors: vendorList, bills: vendorBillList, payments: vendorPaymentList });
  });

  app.post('/api/vendors', (req, res) => {
    const { name, code, type, phone, email, address, bankInfo, isActive } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Nama dan Kode Vendor wajib diisi.' });
    }
    const newVendor: Vendor = {
      id: `vnd-${Date.now()}`,
      name,
      code,
      type: type || 'OTHER',
      phone: phone || '',
      email: email || '',
      address: address || '',
      bankInfo: bankInfo || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    };
    vendorList.push(newVendor);
    res.status(201).json(newVendor);
  });

  app.put('/api/vendors/:id', (req, res) => {
    const { id } = req.params;
    const { name, code, type, phone, email, address, bankInfo, isActive } = req.body;
    
    const vIdx = vendorList.findIndex(v => v.id === id);
    if (vIdx === -1) {
      return res.status(404).json({ error: 'Vendor tidak ditemukan.' });
    }

    if (!name || !code) {
      return res.status(400).json({ error: 'Nama dan Kode Vendor wajib diisi.' });
    }

    vendorList[vIdx] = {
      ...vendorList[vIdx],
      name,
      code,
      type: type || vendorList[vIdx].type,
      phone: phone !== undefined ? phone : vendorList[vIdx].phone,
      email: email !== undefined ? email : vendorList[vIdx].email,
      address: address !== undefined ? address : vendorList[vIdx].address,
      bankInfo: bankInfo !== undefined ? bankInfo : vendorList[vIdx].bankInfo,
      isActive: isActive !== undefined ? Boolean(isActive) : vendorList[vIdx].isActive
    };

    res.json(vendorList[vIdx]);
  });

  app.patch('/api/vendors/:id/toggle', (req, res) => {
    const { id } = req.params;
    const vIdx = vendorList.findIndex(v => v.id === id);
    if (vIdx === -1) {
      return res.status(404).json({ error: 'Vendor tidak ditemukan.' });
    }
    vendorList[vIdx].isActive = !vendorList[vIdx].isActive;
    res.json(vendorList[vIdx]);
  });

  app.delete('/api/vendors/:id', (req, res) => {
    const { id } = req.params;
    const isUsed = vendorBillList.some(b => b.vendorId === id);
    if (isUsed) {
      return res.status(400).json({ error: 'Vendor tidak dapat dihapus karena sudah memiliki tagihan.' });
    }
    vendorList = vendorList.filter(v => v.id !== id);
    res.json({ message: 'Vendor berhasil dihapus.' });
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

  app.post('/api/vendor-payments', (req, res) => {
    const { billId, paymentDate, amount, bankAccountId, referenceNo, notes } = req.body;

    const bill = vendorBillList.find(b => b.id === billId);
    if (!bill) {
      return res.status(404).json({ error: 'Tagihan vendor tidak ditemukan.' });
    }

    const bankCoa = coaList.find(c => c.id === bankAccountId || c.code === bankAccountId);
    const payableCoa = coaList.find(c => c.code === '2103') || coaList.find(c => c.category === 'LIABILITY' && c.name.toLowerCase().includes('utang'));

    if (!bankCoa || !payableCoa) {
      return res.status(400).json({ error: 'Akun Kas/Bank atau Akun Utang Vendor tidak valid.' });
    }

    const payAmt = Number(amount) || 0;
    if (payAmt <= 0) {
      return res.status(400).json({ error: 'Nominal pembayaran harus lebih dari 0.' });
    }

    const currentPaid = bill.paidAmount || 0;
    const remaining = bill.totalAmount - currentPaid;

    if (payAmt > remaining + 0.01) {
      return res.status(400).json({ error: `Nominal pembayaran melebihi sisa tagihan (Rp ${remaining.toLocaleString('id-ID')}).` });
    }

    const vnd = vendorList.find(v => v.id === bill.vendorId);
    const klt = kloterList.find(k => k.id === bill.kloterId);
    const ref = referenceNo || `TRX-VPAY-${Date.now().toString().slice(-4)}`;
    const jvNum = `JV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(journalCounter++).padStart(3, '0')}`;
    const jvId = `jv-vpay-${Date.now()}`;

    // Update COA balances
    payableCoa.balance = new Decimal(payableCoa.balance).minus(payAmt).toNumber();
    bankCoa.balance = new Decimal(bankCoa.balance).minus(payAmt).toNumber();

    // Auto Journal Entry [Debit Utang Vendor -> Credit Kas/Bank]
    const newJournal: JournalEntry = {
      id: jvId,
      journalNumber: jvNum,
      transactionDate: paymentDate || new Date().toISOString().split('T')[0],
      referenceType: 'VENDOR_PAYMENT',
      referenceId: bill.billNumber,
      description: `Pembayaran Utang Vendor ${vnd ? vnd.name : ''} - Inv ${bill.billNumber}`,
      totalDebit: payAmt,
      totalCredit: payAmt,
      lines: [
        { id: `jl-${jvId}-1`, journalId: jvId, accountId: payableCoa.id, accountCode: payableCoa.code, accountName: payableCoa.name, debit: payAmt, credit: 0, memo: `Pelunasan Utang Vendor ${bill.billNumber} (${vnd?.name || ''})` },
        { id: `jl-${jvId}-2`, journalId: jvId, accountId: bankCoa.id, accountCode: bankCoa.code, accountName: bankCoa.name, debit: 0, credit: payAmt, memo: `Pembayaran Utang via ${bankCoa.name}` }
      ],
      createdBy: 'Kasir Finance',
      createdAt: new Date().toISOString()
    };

    journalList.unshift(newJournal);

    // Update Bill
    const newPaidAmount = new Decimal(currentPaid).plus(payAmt).toNumber();
    bill.paidAmount = newPaidAmount;
    if (newPaidAmount >= bill.totalAmount) {
      bill.status = 'PAID';
      bill.paidAmount = bill.totalAmount;
    } else {
      bill.status = 'PARTIAL';
    }

    // Create Vendor Payment Record
    const newPayment: VendorPayment = {
      id: `vpay-${Date.now()}`,
      paymentNumber: `VPAY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
      billId,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      amount: payAmt,
      bankAccountId: bankCoa.id,
      referenceNo: ref,
      notes: notes || '',
      journalEntryId: jvId
    };

    vendorPaymentList.unshift(newPayment);

    res.status(201).json({
      message: 'Pembayaran tagihan vendor berhasil dicatat & Jurnal Otomatis ter-posting!',
      payment: newPayment,
      bill,
      journalEntry: newJournal
    });
  });

  // --- SPECIALIZED FINANCIAL REPORT ENDPOINTS ---

  // 1. Profitability per Kloter Report
  app.get('/api/reports/profitability', (req, res) => {
    try {
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
        const marginPct = recognizedRev.isZero() ? 0 : Math.round(grossProfit.dividedBy(recognizedRev).times(100).toNumber());

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
    } catch (err: any) {
      console.error('Error generating profitability report:', err);
      res.status(500).json({ error: err.message || 'Gagal memuat laporan laba rugi.' });
    }
  });

  // 2. Receivables Aging Report
  app.get('/api/reports/receivables', (req, res) => {
    try {
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
    } catch (err: any) {
      console.error('Error generating receivables report:', err);
      res.status(500).json({ error: err.message || 'Gagal memuat laporan piutang.' });
    }
  });

  // --- MITRA & COMMISSION MANAGEMENT ENDPOINTS ---
  app.get('/api/mitra', (req, res) => {
    const result = mitraList.map(m => {
      const commissions = commissionList.filter(c => c.mitraId === m.id);
      const totalJamaah = commissions.length;
      const totalPaid = commissions
        .filter(c => c.status === 'PAID')
        .reduce((sum, c) => sum + (c.feeAmount || 0), 0);
      const totalPending = commissions
        .filter(c => c.status === 'PENDING' || c.status === 'APPROVED')
        .reduce((sum, c) => sum + (c.feeAmount || 0), 0);

      return {
        ...m,
        totalJamaah,
        totalPaid,
        totalPending
      };
    });
    res.json(result);
  });

  app.post('/api/mitra', (req, res) => {
    const { name, phone, email, bankInfo, defaultFeePerPax, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Nama Mitra dan Nomor WhatsApp/HP wajib diisi.' });
    }
    const code = `MTR-${String(mitraList.length + 1).padStart(3, '0')}`;
    const newMitra: Mitra = {
      id: `mtr-${Date.now()}`,
      code,
      name,
      phone,
      email: email || '',
      bankInfo: bankInfo || '-',
      defaultFeePerPax: Number(defaultFeePerPax) || 1000000,
      isActive: true,
      notes: notes || ''
    };
    mitraList.push(newMitra);
    res.status(201).json(newMitra);
  });

  app.put('/api/mitra/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, email, bankInfo, defaultFeePerPax, isActive, notes } = req.body;

    const m = mitraList.find(x => x.id === id);
    if (!m) {
      return res.status(404).json({ error: 'Data Mitra tidak ditemukan.' });
    }

    if (name !== undefined) m.name = name;
    if (phone !== undefined) m.phone = phone;
    if (email !== undefined) m.email = email;
    if (bankInfo !== undefined) m.bankInfo = bankInfo;
    if (defaultFeePerPax !== undefined) m.defaultFeePerPax = Number(defaultFeePerPax);
    if (isActive !== undefined) m.isActive = Boolean(isActive);
    if (notes !== undefined) m.notes = notes;

    res.json(m);
  });

  app.delete('/api/mitra/:id', (req, res) => {
    const { id } = req.params;
    const index = mitraList.findIndex(m => m.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Data Mitra tidak ditemukan.' });
    }
    mitraList.splice(index, 1);
    res.json({ message: 'Data Mitra berhasil dihapus.' });
  });

  app.get('/api/commissions', (req, res) => {
    const fullCommissions = commissionList.map(c => {
      const m = mitraList.find(x => x.id === c.mitraId);
      return {
        ...c,
        mitraName: m ? m.name : 'Mitra',
        mitraCode: m ? m.code : '-',
        mitraPhone: m ? m.phone : '-',
        mitraBankInfo: m ? m.bankInfo : '-'
      };
    });
    res.json(fullCommissions);
  });

  app.post('/api/commissions/:id/payout', (req, res) => {
    const { id } = req.params;
    const { bankAccountId, paidDate, referenceNo, notes } = req.body;

    const com = commissionList.find(c => c.id === id);
    if (!com) {
      return res.status(404).json({ error: 'Data komisi tidak ditemukan.' });
    }

    if (com.status === 'PAID') {
      return res.status(400).json({ error: 'Komisi ini sudah pernah dicairkan.' });
    }

    const bankCoa = coaList.find(a => a.id === bankAccountId || a.code === bankAccountId);
    if (!bankCoa) {
      return res.status(400).json({ error: 'Akun Kas/Bank sumber pencairan tidak valid.' });
    }

    let expenseCoa = coaList.find(a => a.code === '6104') || coaList.find(a => a.code === '6103');
    if (!expenseCoa) {
      expenseCoa = coaList.find(a => a.category === 'EXPENSE');
    }

    if (!expenseCoa) {
      return res.status(500).json({ error: 'Akun Beban Komisi tidak ditemukan di COA.' });
    }

    const feeAmount = com.feeAmount || 0;
    const feeDecimal = new Decimal(feeAmount);

    // Update balances
    expenseCoa.balance = new Decimal(expenseCoa.balance).plus(feeDecimal).toNumber();
    bankCoa.balance = new Decimal(bankCoa.balance).minus(feeDecimal).toNumber();

    // Create Journal Entry
    const jvNum = `JV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(journalCounter++).padStart(3, '0')}`;
    const txDate = paidDate || new Date().toISOString().split('T')[0];

    const m = mitraList.find(x => x.id === com.mitraId);
    const mitraName = m ? m.name : 'Mitra';

    const newJournal: JournalEntry = {
      id: `jv-com-${Date.now()}`,
      journalNumber: jvNum,
      transactionDate: txDate,
      referenceType: 'MITRA_COMMISSION',
      referenceId: com.id,
      description: `Pencairan Komisi Mitra (${mitraName}) - Jamaah: ${com.jamaahName}`,
      totalDebit: feeAmount,
      totalCredit: feeAmount,
      lines: [
        {
          id: `jl-com-1-${Date.now()}`,
          journalId: `jv-com-${Date.now()}`,
          accountId: expenseCoa.id,
          accountCode: expenseCoa.code,
          accountName: expenseCoa.name,
          debit: feeAmount,
          credit: 0,
          memo: `Beban Komisi Referral Mitra: ${com.jamaahName}`
        },
        {
          id: `jl-com-2-${Date.now()}`,
          journalId: `jv-com-${Date.now()}`,
          accountId: bankCoa.id,
          accountCode: bankCoa.code,
          accountName: bankCoa.name,
          debit: 0,
          credit: feeAmount,
          memo: `Pencairan Komisi Mitra via ${bankCoa.name} Ref: ${referenceNo || '-'}`
        }
      ],
      createdBy: 'Finance Payout Engine',
      createdAt: new Date().toISOString()
    };

    journalList.unshift(newJournal);

    // Update Commission State
    com.status = 'PAID';
    com.paidDate = txDate;
    com.bankAccountId = bankCoa.id;
    com.referenceNo = referenceNo || '-';
    com.notes = notes || '';
    com.journalEntryId = newJournal.id;

    res.json({
      message: 'Pencairan komisi berhasil dan otomatis diposting ke Jurnal Umum!',
      commission: com,
      journalEntry: newJournal
    });
  });

  // --- DATABASE BACKUP & RESTORE ENDPOINTS ---
  app.get('/api/backup', (req, res) => {
    const backupData = {
      version: '2.5',
      appName: 'Khadim Alharamain ERP Umrah & Haji',
      exportedAt: new Date().toISOString(),
      coaList,
      packageList,
      kloterList,
      jamaahList,
      registrationList,
      scheduleList,
      paymentList,
      journalList,
      vendorList,
      vendorBillList,
      vendorPaymentList,
      mitraList,
      commissionList
    };
    res.json(backupData);
  });

  app.post('/api/backup/restore', (req, res) => {
    try {
      const {
        coaList: newCoa,
        packageList: newPkg,
        kloterList: newKlt,
        jamaahList: newJam,
        registrationList: newReg,
        paymentList: newPay,
        journalList: newJv,
        vendorList: newVnd,
        vendorBillList: newVBill,
        vendorPaymentList: newVPay,
        mitraList: newMtr,
        commissionList: newCom
      } = req.body;

      if (!Array.isArray(newCoa) || !Array.isArray(newReg) || !Array.isArray(newJv)) {
        return res.status(400).json({ error: 'Format file JSON backup tidak valid atau rusak.' });
      }

      if (newCoa) coaList = newCoa;
      if (newPkg) packageList = newPkg;
      if (newKlt) kloterList = newKlt;
      if (newJam) jamaahList = newJam;
      if (newReg) registrationList = newReg;
      if (newPay) paymentList = newPay;
      if (newJv) journalList = newJv;
      if (newVnd) vendorList = newVnd;
      if (newVBill) vendorBillList = newVBill;
      if (newVPay) vendorPaymentList = newVPay;
      if (newMtr) mitraList = newMtr;
      if (newCom) commissionList = newCom;

      res.json({
        message: 'Database ERP berhasil dipulihkan dari file backup JSON!',
        stats: {
          coa: coaList.length,
          jamaah: jamaahList.length,
          pendaftaran: registrationList.length,
          jurnal: journalList.length,
          vendor: vendorList.length,
          tagihanVendor: vendorBillList.length
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memulihkan database.' });
    }
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

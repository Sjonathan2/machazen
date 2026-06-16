"""
PROGRAM AKUNTANSI UMKM MACHA - SISTEM KEUANGAN LENGKAP
Versi: 3.1 - DIPERBAIKI dengan Error Handling
"""

import json
import os
import sys
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('TkAgg')
import pandas as pd
import numpy as np
from prettytable import PrettyTable
from collections import defaultdict, OrderedDict
import warnings
warnings.filterwarnings('ignore')

# Warna tema matcha
MATCHA_THEME = {
    'primary': '#2E8B57',
    'secondary': '#3CB371',
    'accent': '#66CDAA',
    'light': '#98FB98',
    'danger': '#FF6B6B',
    'warning': '#FFA500',
    'success': '#28A745',
    'info': '#17A2B8'
}

class FinancialRecord:
    """Kelas untuk pencatatan keuangan harian"""
    
    def __init__(self):
        self.records = []
        self.categories = {
            'income': ['Penjualan Matcha', 'Penjualan Dessert', 'Catering', 'Lainnya'],
            'expense': ['Bahan Baku', 'Sewa Tempat', 'Gaji Karyawan', 'Listrik & Air', 
                       'Internet', 'Marketing', 'Transportasi', 'Perawatan', 'Lainnya'],
            'asset': ['Mesin Espresso', 'Blender', 'Furniture', 'Kulkas', 'Peralatan Lainnya'],
            'liability': ['Pinjaman Bank', 'Hutang Supplier', 'Hutang Sewa', 'Lainnya']
        }
    
    def get_categories_for_type(self, type_record):
        """Ambil kategori berdasarkan jenis transaksi"""
        return self.categories.get(type_record, [])
    
    def add_record(self, date, description, category, subcategory, 
                   amount, type_record, payment_method='Tunai', due_date=None):
        """Tambahkan record keuangan"""
        record = {
            'id': len(self.records) + 1,
            'date': date,
            'description': description,
            'category': category,
            'subcategory': subcategory,
            'amount': float(amount),
            'type': type_record,  # 'income', 'expense', 'asset', 'liability'
            'payment_method': payment_method,
            'due_date': due_date,
            'status': 'Paid' if due_date is None else 'Pending',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        self.records.append(record)
        return record
    
    def get_cash_balance(self, date=None):
        """Hitung saldo kas"""
        if date:
            filtered = [r for r in self.records if r['date'] <= date]
        else:
            filtered = self.records
        
        total_income = sum(r['amount'] for r in filtered if r['type'] == 'income')
        total_expense = sum(r['amount'] for r in filtered if r['type'] == 'expense')
        return total_income - total_expense
    
    def get_aging_report(self):
        """Laporan aging utang & piutang"""
        today = datetime.now().date()
        aging_data = {
            'receivables': [],
            'payables': []
        }
        
        for record in self.records:
            if record['status'] == 'Pending' and record['due_date']:
                try:
                    due_date = datetime.strptime(record['due_date'], '%Y-%m-%d').date()
                    days_overdue = (today - due_date).days
                    
                    aging_item = {
                        'id': record['id'],
                        'name': record['description'].split(' - ')[0] if ' - ' in record['description'] else 'Unknown',
                        'amount': record['amount'],
                        'due_date': record['due_date'],
                        'days_overdue': max(0, days_overdue),
                        'aging_category': self._get_aging_category(days_overdue)
                    }
                    
                    if record['type'] in ['income'] and record['amount'] > 0:
                        aging_data['receivables'].append(aging_item)
                    elif record['type'] in ['expense', 'liability'] and record['amount'] > 0:
                        aging_data['payables'].append(aging_item)
                except:
                    continue
        
        return aging_data
    
    def _get_aging_category(self, days):
        """Kategorikan berdasarkan hari keterlambatan"""
        if days <= 0:
            return 'Current'
        elif days <= 30:
            return '1-30 Days'
        elif days <= 60:
            return '31-60 Days'
        elif days <= 90:
            return '61-90 Days'
        else:
            return '90+ Days'

class BudgetPlanner:
    """Kelas untuk perencanaan dan penganggaran"""
    
    def __init__(self):
        self.budgets = {}
        self.forecasts = {}
    
    def create_budget(self, period, income_target, expense_plan):
        """Buat anggaran untuk periode tertentu"""
        budget_id = f"BUDGET_{period.replace('-', '_').replace(' ', '_')}"
        self.budgets[budget_id] = {
            'period': period,
            'created_date': datetime.now().strftime('%Y-%m-%d'),
            'income_target': float(income_target),
            'expense_plan': {k: float(v) for k, v in expense_plan.items()},
            'total_expense_plan': sum(float(v) for v in expense_plan.values()),
            'net_target': float(income_target) - sum(float(v) for v in expense_plan.values())
        }
        return budget_id
    
    def create_cash_flow_forecast(self, start_date, months=3, initial_balance=0):
        """Buat proyeksi arus kas"""
        forecast_id = f"FORECAST_{start_date.replace('-', '_')}"
        forecast = {
            'start_date': start_date,
            'months': months,
            'initial_balance': float(initial_balance),
            'monthly_data': [],
            'created_date': datetime.now().strftime('%Y-%m-%d')
        }
        
        # Generate monthly projections
        current_date = datetime.strptime(start_date, '%Y-%m-%d')
        for month in range(months):
            month_data = {
                'month': current_date.strftime('%Y-%m'),
                'projected_income': 0.0,
                'projected_expenses': 0.0,
                'projected_balance': float(initial_balance),
                'notes': ''
            }
            forecast['monthly_data'].append(month_data)
            current_date += relativedelta(months=1)
        
        self.forecasts[forecast_id] = forecast
        return forecast_id
    
    def update_forecast(self, forecast_id, month_index, income, expenses, notes=''):
        """Update proyeksi arus kas"""
        if forecast_id in self.forecasts:
            forecast = self.forecasts[forecast_id]
            if 0 <= month_index < len(forecast['monthly_data']):
                forecast['monthly_data'][month_index].update({
                    'projected_income': float(income),
                    'projected_expenses': float(expenses),
                    'notes': notes
                })
                
                # Recalculate balances
                balance = forecast['initial_balance']
                for i, month_data in enumerate(forecast['monthly_data']):
                    if i == 0:
                        month_data['projected_balance'] = balance + float(income) - float(expenses)
                    else:
                        prev_balance = forecast['monthly_data'][i-1]['projected_balance']
                        month_data['projected_balance'] = prev_balance + \
                            month_data['projected_income'] - month_data['projected_expenses']
                    balance = month_data['projected_balance']

class MatchaBusinessSystem:
    """Sistem utama usaha matcha"""
    
    def __init__(self, business_name="Macha Lezat"):
        self.business_name = business_name
        self.data_file = "macha_finance_data.json"
        self.financial_record = FinancialRecord()
        self.budget_planner = BudgetPlanner()
        self.load_data()
    
    def load_data(self):
        """Load data dari file JSON"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    self.financial_record.records = data.get('records', [])
                    self.budget_planner.budgets = data.get('budgets', {})
                    self.budget_planner.forecasts = data.get('forecasts', {})
            except:
                # Jika file corrupt, buat baru
                print("⚠️  Data file corrupt, creating new file...")
                self.save_data()
        else:
            self.save_data()
    
    def save_data(self):
        """Simpan data ke file JSON"""
        data = {
            'records': self.financial_record.records,
            'budgets': self.budget_planner.budgets,
            'forecasts': self.budget_planner.forecasts,
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=4, default=str)
    
    # ==================== A. SISTEM PENCATATAN & PELAPORAN ====================
    
    def cash_book_menu(self):
        """Menu Buku Kas"""
        while True:
            print("\n" + "="*60)
            print("💰 BUKU KAS & PENCATATAN HARIAN")
            print("="*60)
            print("1. 📝 Tambah Transaksi Baru")
            print("2. 📋 Lihat Semua Transaksi")
            print("3. 🔍 Cari Transaksi")
            print("4. 📊 Laporan Buku Kas")
            print("5. 🖨️ Cetak Buku Kas")
            print("6. ↩️ Kembali ke Menu Utama")
            
            choice = input("\nPilih menu (1-6): ").strip()
            
            if choice == '1':
                self.add_transaction()
            elif choice == '2':
                self.view_all_transactions()
            elif choice == '3':
                self.search_transactions()
            elif choice == '4':
                self.cash_book_report()
            elif choice == '5':
                self.print_cash_book()
            elif choice == '6':
                break
            else:
                print("❌ Pilihan tidak valid!")
    
    def add_transaction(self):
        """Tambah transaksi baru"""
        print("\n" + "="*50)
        print("➕ TAMBAH TRANSAKSI BARU")
        print("="*50)
        
        try:
            # Input tanggal
            date_input = input("Tanggal (YYYY-MM-DD) [Enter untuk hari ini]: ").strip()
            if not date_input:
                date = datetime.now().strftime('%Y-%m-%d')
            else:
                # Validasi format tanggal
                if len(date_input) == 1 and date_input.isdigit():
                    # Jika user hanya input 1 digit (seperti '1'), anggap itu tanggal
                    today = datetime.now()
                    date = today.replace(day=int(date_input)).strftime('%Y-%m-%d')
                else:
                    try:
                        datetime.strptime(date_input, '%Y-%m-%d')
                        date = date_input
                    except:
                        print("⚠️  Format tanggal salah, menggunakan hari ini")
                        date = datetime.now().strftime('%Y-%m-%d')
            
            # Input deskripsi
            description = input("Keterangan transaksi: ").strip()
            if not description:
                print("❌ Deskripsi tidak boleh kosong!")
                return
            
            # Pilih jenis transaksi
            print("\n📋 Jenis Transaksi:")
            print("1. 💰 Pendapatan (Penjualan)")
            print("2. 💸 Beban (Pengeluaran)")
            print("3. 🏦 Aset (Pembelian barang)")
            print("4. 📝 Liabilitas (Hutang)")
            
            type_choice = input("Pilih jenis (1-4): ").strip()
            type_map = {'1': 'income', '2': 'expense', '3': 'asset', '4': 'liability'}
            
            if type_choice not in type_map:
                print("❌ Pilihan jenis tidak valid!")
                return
            
            trans_type = type_map[type_choice]
            
            # Dapatkan kategori berdasarkan jenis transaksi
            categories = self.financial_record.get_categories_for_type(trans_type)
            if not categories:
                print(f"❌ Tidak ada kategori untuk jenis {trans_type}")
                return
            
            # Tampilkan kategori yang tersedia
            print(f"\n📁 Pilih Kategori untuk {trans_type}:")
            for i, cat in enumerate(categories, 1):
                print(f"{i}. {cat}")
            
            # Input pilihan kategori dengan validasi
            while True:
                cat_choice = input(f"Pilih kategori (1-{len(categories)}): ").strip()
                if not cat_choice:
                    # Default ke kategori pertama
                    category = categories[0]
                    break
                elif cat_choice.isdigit():
                    idx = int(cat_choice) - 1
                    if 0 <= idx < len(categories):
                        category = categories[idx]
                        break
                    else:
                        print(f"❌ Pilihan harus antara 1-{len(categories)}")
                else:
                    # Jika user input nama kategori langsung
                    if cat_choice in categories:
                        category = cat_choice
                        break
                    else:
                        print(f"❌ Kategori '{cat_choice}' tidak ditemukan")
            
            subcategory = input("Subkategori (opsional): ").strip()
            
            # Input jumlah dengan validasi
            while True:
                amount_input = input("Jumlah (Rp): ").strip()
                try:
                    amount = float(amount_input.replace(',', ''))
                    if amount <= 0:
                        print("❌ Jumlah harus lebih dari 0")
                        continue
                    break
                except:
                    print("❌ Jumlah harus angka yang valid")
            
            payment_method = input("Metode pembayaran [Tunai/Transfer/Kredit]: ").strip() or "Tunai"
            
            due_date = None
            if payment_method.lower() == 'kredit':
                while True:
                    due_date_input = input("Tanggal jatuh tempo (YYYY-MM-DD): ").strip()
                    try:
                        datetime.strptime(due_date_input, '%Y-%m-%d')
                        due_date = due_date_input
                        break
                    except:
                        print("❌ Format tanggal salah, gunakan YYYY-MM-DD")
            
            # Tambah record
            record = self.financial_record.add_record(
                date=date,
                description=description,
                category=category,
                subcategory=subcategory,
                amount=amount,
                type_record=trans_type,
                payment_method=payment_method,
                due_date=due_date
            )
            
            self.save_data()
            
            print(f"\n✅ Transaksi berhasil ditambahkan!")
            print(f"   ID: {record['id']} | {record['date']}")
            print(f"   {description} - Rp {amount:,.0f}")
            print(f"   Saldo Kas: Rp {self.financial_record.get_cash_balance():,.0f}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            print("Silakan coba lagi.")
    
    def view_all_transactions(self):
        """Lihat semua transaksi"""
        if not self.financial_record.records:
            print("\n❌ Belum ada transaksi!")
            return
        
        print("\n" + "="*80)
        print("📋 SEMUA TRANSAKSI")
        print("="*80)
        
        # Filter by date range
        start_date = input("Dari tanggal (YYYY-MM-DD) [Enter untuk semua]: ").strip()
        end_date = input("Sampai tanggal (YYYY-MM-DD) [Enter untuk semua]: ").strip()
        
        filtered = self.financial_record.records
        if start_date:
            try:
                filtered = [r for r in filtered if r['date'] >= start_date]
            except:
                print("⚠️  Format tanggal mulai salah")
        if end_date:
            try:
                filtered = [r for r in filtered if r['date'] <= end_date]
            except:
                print("⚠️  Format tanggal akhir salah")
        
        if not filtered:
            print("\n❌ Tidak ada transaksi dalam periode tersebut!")
            return
        
        # Tampilkan dalam tabel
        table = PrettyTable()
        table.field_names = ["ID", "Tanggal", "Keterangan", "Kategori", "Jenis", "Jumlah", "Status"]
        
        for record in filtered:
            amount = record['amount']
            amount_str = f"Rp {amount:,.0f}"
            if record['type'] == 'expense':
                amount_str = f"({amount_str})"
            
            # Truncate description if too long
            desc = record['description']
            if len(desc) > 30:
                desc = desc[:27] + "..."
            
            table.add_row([
                record['id'],
                record['date'],
                desc,
                record['category'],
                record['type'].upper(),
                amount_str,
                record['status']
            ])
        
        print(table)
        
        # Summary
        total_income = sum(r['amount'] for r in filtered if r['type'] == 'income')
        total_expense = sum(r['amount'] for r in filtered if r['type'] == 'expense')
        net_cash = total_income - total_expense
        
        print(f"\n📊 SUMMARY:")
        print(f"   Total Pendapatan: Rp {total_income:,.0f}")
        print(f"   Total Pengeluaran: Rp {total_expense:,.0f}")
        print(f"   Net Arus Kas: Rp {net_cash:,.0f}")
        print(f"   Jumlah Transaksi: {len(filtered)}")
    
    def income_statement(self, period='monthly'):
        """Laporan Laba Rugi"""
        print("\n" + "="*60)
        print("📈 LAPORAN LABA RUGI (INCOME STATEMENT)")
        print("="*60)
        
        # Pilih periode
        print("\n📅 Pilih Periode:")
        print("1. Bulan Ini")
        print("2. Triwulan Terakhir")
        print("3. Tahun Ini")
        print("4. Periode Kustom")
        
        period_choice = input("Pilih (1-4): ").strip()
        
        today = datetime.now()
        try:
            if period_choice == '1':
                start_date = today.replace(day=1).strftime('%Y-%m-%d')
                end_date = today.strftime('%Y-%m-%d')
                period_name = f"Bulan {today.strftime('%B %Y')}"
            elif period_choice == '2':
                start_date = (today - relativedelta(months=3)).replace(day=1).strftime('%Y-%m-%d')
                end_date = today.strftime('%Y-%m-%d')
                period_name = f"Triwulan Terakhir"
            elif period_choice == '3':
                start_date = today.replace(month=1, day=1).strftime('%Y-%m-%d')
                end_date = today.strftime('%Y-%m-%d')
                period_name = f"Tahun {today.year}"
            else:
                start_date = input("Tanggal mulai (YYYY-MM-DD): ").strip()
                end_date = input("Tanggal akhir (YYYY-MM-DD): ").strip()
                # Validasi tanggal
                datetime.strptime(start_date, '%Y-%m-%d')
                datetime.strptime(end_date, '%Y-%m-%d')
                period_name = f"Periode {start_date} s/d {end_date}"
        except:
            print("❌ Format tanggal tidak valid!")
            return
        
        # Filter transaksi
        transactions = [r for r in self.financial_record.records 
                       if start_date <= r['date'] <= end_date]
        
        if not transactions:
            print(f"\n❌ Tidak ada transaksi pada {period_name}!")
            return
        
        # Hitung komponen laporan laba rugi
        revenue = sum(r['amount'] for r in transactions if r['type'] == 'income')
        cogs = sum(r['amount'] for r in transactions if r['category'] == 'Bahan Baku')
        gross_profit = revenue - cogs
        
        operating_expenses = sum(r['amount'] for r in transactions if r['type'] == 'expense' 
                               and r['category'] != 'Bahan Baku')
        net_profit = gross_profit - operating_expenses
        
        # Tampilkan laporan
        print(f"\n{period_name}")
        print("="*60)
        
        table = PrettyTable()
        table.field_names = ["Keterangan", "Jumlah (Rp)"]
        table.align["Keterangan"] = "l"
        table.align["Jumlah (Rp)"] = "r"
        
        table.add_row(["A. PENDAPATAN", ""])
        table.add_row(["  Penjualan Matcha & Dessert", f"{revenue:,.0f}"])
        table.add_row(["  TOTAL PENDAPATAN", f"{revenue:,.0f}"])
        table.add_row(["", ""])
        
        table.add_row(["B. HARGA POKOK PENJUALAN (HPP)", ""])
        table.add_row(["  Bahan Baku Matcha", f"{cogs:,.0f}"])
        table.add_row(["  TOTAL HPP", f"{cogs:,.0f}"])
        table.add_row(["", ""])
        
        table.add_row(["C. LABA KOTOR (A - B)", f"{gross_profit:,.0f}"])
        table.add_row(["", ""])
        
        table.add_row(["D. BEBAN OPERASIONAL", ""])
        # Detail beban
        expense_cats = defaultdict(float)
        for t in transactions:
            if t['type'] == 'expense' and t['category'] != 'Bahan Baku':
                expense_cats[t['category']] += t['amount']
        
        for cat, amount in expense_cats.items():
            table.add_row([f"  {cat}", f"{amount:,.0f}"])
        
        table.add_row(["  TOTAL BEBAN OPERASIONAL", f"{operating_expenses:,.0f}"])
        table.add_row(["", ""])
        
        table.add_row(["E. LABA BERSIH (C - D)", f"{net_profit:,.0f}"])
        
        print(table)
        
        # Analisis
        print("\n📊 ANALISIS PROFITABILITAS:")
        if revenue > 0:
            gross_margin = (gross_profit / revenue) * 100 if revenue > 0 else 0
            net_margin = (net_profit / revenue) * 100 if revenue > 0 else 0
            print(f"   • Gross Margin: {gross_margin:.1f}%")
            print(f"   • Net Margin: {net_margin:.1f}%")
            print(f"   • ROI (Return on Revenue): {net_margin:.1f}%")
        
        if net_profit > 0:
            status = "✅ PROFIT"
        elif net_profit == 0:
            status = "⚖️ BREAK EVEN"
        else:
            status = "❌ LOSS"
        print(f"   • Status: {status}")
        
        # Visualisasi
        if input("\n📈 Tampilkan visualisasi? (y/n): ").lower() == 'y':
            self.visualize_income_statement(revenue, cogs, gross_profit, operating_expenses, net_profit)
    
    def cash_flow_statement(self):
        """Laporan Arus Kas"""
        print("\n" + "="*60)
        print("💰 LAPORAN ARUS KAS (CASH FLOW STATEMENT)")
        print("="*60)
        
        # Pilih periode
        start_date = input("Tanggal mulai (YYYY-MM-DD) [30 hari terakhir]: ").strip()
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        end_date = input("Tanggal akhir (YYYY-MM-DD) [hari ini]: ").strip()
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        # Validasi tanggal
        try:
            datetime.strptime(start_date, '%Y-%m-%d')
            datetime.strptime(end_date, '%Y-%m-%d')
        except:
            print("❌ Format tanggal tidak valid!")
            return
        
        transactions = [r for r in self.financial_record.records 
                       if start_date <= r['date'] <= end_date]
        
        if not transactions:
            print(f"\n❌ Tidak ada transaksi pada periode tersebut!")
            return
        
        # Kategorikan arus kas
        cash_from_operations = 0
        cash_from_investing = 0
        cash_from_financing = 0
        
        operating_details = defaultdict(float)
        investing_details = defaultdict(float)
        financing_details = defaultdict(float)
        
        for t in transactions:
            amount = t['amount'] if t['type'] == 'income' else -t['amount']
            
            # Arus Kas dari Operasi
            if t['type'] in ['income', 'expense'] and t['category'] not in ['Mesin Espresso', 'Blender', 'Furniture', 'Kulkas', 'Peralatan Lainnya']:
                cash_from_operations += amount
                operating_details[t['category']] += amount
            
            # Arus Kas dari Investasi
            elif t['category'] in ['Mesin Espresso', 'Blender', 'Furniture', 'Kulkas', 'Peralatan Lainnya']:
                cash_from_investing += amount
                investing_details[t['category']] += amount
            
            # Arus Kas dari Pendanaan
            elif t['type'] in ['liability']:
                cash_from_financing += amount
                financing_details[t['description']] += amount
        
        net_cash_flow = cash_from_operations + cash_from_investing + cash_from_financing
        
        # Tampilkan laporan
        print(f"\nPeriode: {start_date} s/d {end_date}")
        print("="*60)
        
        table = PrettyTable()
        table.field_names = ["Keterangan", "Jumlah (Rp)"]
        table.align["Keterangan"] = "l"
        table.align["Jumlah (Rp)"] = "r"
        
        table.add_row(["ARUS KAS DARI OPERASI", ""])
        for category, amount in operating_details.items():
            sign = "+" if amount > 0 else ""
            table.add_row([f"  {category}", f"{sign}{amount:,.0f}"])
        table.add_row(["  Total Arus Kas Operasi", f"{cash_from_operations:,.0f}"])
        table.add_row(["", ""])
        
        table.add_row(["ARUS KAS DARI INVESTASI", ""])
        for category, amount in investing_details.items():
            sign = "+" if amount > 0 else ""
            table.add_row([f"  {category}", f"{sign}{amount:,.0f}"])
        table.add_row(["  Total Arus Kas Investasi", f"{cash_from_investing:,.0f}"])
        table.add_row(["", ""])
        
        table.add_row(["ARUS KAS DARI PENDANAAN", ""])
        for description, amount in financing_details.items():
            sign = "+" if amount > 0 else ""
            desc_short = description[:30] + "..." if len(description) > 30 else description
            table.add_row([f"  {desc_short}", f"{sign}{amount:,.0f}"])
        table.add_row(["  Total Arus Kas Pendanaan", f"{cash_from_financing:,.0f}"])
        table.add_row(["", ""])
        
        table.add_row(["KENAIKAN/(PENURUNAN) BERSIH KAS", f"{net_cash_flow:,.0f}"])
        
        # Saldo awal dan akhir
        try:
            start_balance = self.financial_record.get_cash_balance(start_date)
            end_balance = self.financial_record.get_cash_balance(end_date)
            
            table.add_row(["", ""])
            table.add_row(["Saldo Kas Awal Periode", f"{start_balance:,.0f}"])
            table.add_row(["Kenaikan/(Penurunan) Bersih Kas", f"{net_cash_flow:,.0f}"])
            table.add_row(["Saldo Kas Akhir Periode", f"{end_balance:,.0f}"])
        except:
            pass
        
        print(table)
        
        # Analisis
        print("\n📊 ANALISIS ARUS KAS:")
        if cash_from_operations > 0:
            print(f"   • Arus Kas Operasi: ✅ Positif (bisnis sehat)")
        else:
            print(f"   • Arus Kas Operasi: ⚠️ Negatif (perlu perhatian)")
        
        if cash_from_investing < 0:
            print(f"   • Arus Kas Investasi: 📈 Ekspansi (investasi aset)")
        elif cash_from_investing > 0:
            print(f"   • Arus Kas Investasi: 📉 Likuidasi (jual aset)")
        else:
            print(f"   • Arus Kas Investasi: ⚖️ Stabil")
        
        if cash_from_financing > 0:
            print(f"   • Arus Kas Pendanaan: 🏦 Leverage (ambil pinjaman)")
        elif cash_from_financing < 0:
            print(f"   • Arus Kas Pendanaan: 💵 Pelunasan (bayar utang)")
        else:
            print(f"   • Arus Kas Pendanaan: ⚖️ Stabil")
        
        # Warning jika arus kas operasi negatif
        if cash_from_operations < 0:
            print(f"\n🚨 PERINGATAN: Arus kas dari operasi negatif!")
            print(f"   Bisnis tidak menghasilkan cukup kas dari operasi sehari-hari.")
            print(f"   Pertimbangkan untuk: meningkatkan penjualan, mengurangi biaya, atau injeksi modal.")
    
    def aging_report(self):
        """Laporan Aging Utang & Piutang"""
        print("\n" + "="*60)
        print("📋 LAPORAN AGING UTANG & PIUTANG")
        print("="*60)
        
        aging_data = self.financial_record.get_aging_report()
        
        # Piutang
        print("\n📥 PIUTANG (Orang yang berhutang ke Anda):")
        if aging_data['receivables']:
            table_rec = PrettyTable()
            table_rec.field_names = ["Nama", "Jumlah", "Jatuh Tempo", "Keterlambatan", "Kategori"]
            
            total_receivables = 0
            for item in aging_data['receivables']:
                table_rec.add_row([
                    item['name'][:20] + "..." if len(item['name']) > 20 else item['name'],
                    f"Rp {item['amount']:,.0f}",
                    item['due_date'],
                    f"{item['days_overdue']} hari",
                    item['aging_category']
                ])
                total_receivables += item['amount']
            
            print(table_rec)
            print(f"\nTotal Piutang: Rp {total_receivables:,.0f}")
            
            # Summary by aging category
            print("\n📊 Summary Piutang:")
            aging_summary = defaultdict(float)
            for item in aging_data['receivables']:
                aging_summary[item['aging_category']] += item['amount']
            
            for category in ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days']:
                if category in aging_summary:
                    amount = aging_summary[category]
                    print(f"  • {category}: Rp {amount:,.0f}")
        else:
            print("   ✅ Tidak ada piutang yang tertunggak")
        
        # Utang
        print("\n📤 UTANG (Anda yang berhutang):")
        if aging_data['payables']:
            table_pay = PrettyTable()
            table_pay.field_names = ["Nama", "Jumlah", "Jatuh Tempo", "Keterlambatan", "Kategori"]
            
            total_payables = 0
            for item in aging_data['payables']:
                table_pay.add_row([
                    item['name'][:20] + "..." if len(item['name']) > 20 else item['name'],
                    f"Rp {item['amount']:,.0f}",
                    item['due_date'],
                    f"{item['days_overdue']} hari",
                    item['aging_category']
                ])
                total_payables += item['amount']
            
            print(table_pay)
            print(f"\nTotal Utang: Rp {total_payables:,.0f}")
            
            # Warning untuk yang sudah lewat jatuh tempo
            overdue_payables = [i for i in aging_data['payables'] if i['days_overdue'] > 0]
            if overdue_payables:
                print(f"\n🚨 PERINGATAN: Ada {len(overdue_payables)} utang yang sudah lewat jatuh tempo!")
                for item in overdue_payables[:3]:  # Tampilkan 3 teratas
                    print(f"   • {item['name']}: Rp {item['amount']:,.0f} (terlambat {item['days_overdue']} hari)")
        else:
            print("   ✅ Tidak ada utang yang tertunggak")
        
        # Net Position
        total_receivables = sum(i['amount'] for i in aging_data['receivables'])
        total_payables = sum(i['amount'] for i in aging_data['payables'])
        net_position = total_receivables - total_payables
        
        print(f"\n📊 NET POSITION: Rp {net_position:,.0f}")
        if net_position > 0:
            print("   ✅ Posisi net positif (lebih banyak piutang)")
        elif net_position < 0:
            print("   ⚠️  Posisi net negatif (lebih banyak utang)")
        else:
            print("   ⚖️  Posisi net seimbang")
    
    # ==================== B. SISTEM PERENCANAAN & PENGANGGARAN ====================
    
    def budgeting_menu(self):
        """Menu Perencanaan & Penganggaran"""
        while True:
            print("\n" + "="*60)
            print("📅 PERENCANAAN & PENGANGGARAN")
            print("="*60)
            print("1. 📊 Buat Anggaran Baru")
            print("2. 🔄 Update Anggaran")
            print("3. 📈 Buat Proyeksi Arus Kas")
            print("4. 🔮 Update Proyeksi")
            print("5. 📋 Lihat Semua Rencana")
            print("6. 📊 Analisis vs Realisasi")
            print("7. ↩️ Kembali ke Menu Utama")
            
            choice = input("\nPilih menu (1-7): ").strip()
            
            if choice == '1':
                self.create_budget()
            elif choice == '2':
                self.update_budget()
            elif choice == '3':
                self.create_cash_flow_forecast()
            elif choice == '4':
                self.update_forecast()
            elif choice == '5':
                self.view_all_plans()
            elif choice == '6':
                self.budget_vs_actual()
            elif choice == '7':
                break
            else:
                print("❌ Pilihan tidak valid!")
    
    def create_budget(self):
        """Buat anggaran baru"""
        print("\n" + "="*50)
        print("📊 BUAT ANGGARAN BARU")
        print("="*50)
        
        try:
            period = input("Periode anggaran (contoh: Jan-2024, Q1-2024): ").strip()
            if not period:
                print("❌ Periode tidak boleh kosong!")
                return
            
            print("\n💰 TARGET PENDAPATAN:")
            income_input = input("Target pendapatan total (Rp): ").strip()
            if not income_input:
                print("❌ Target pendapatan tidak boleh kosong!")
                return
            
            income_target = float(income_input.replace(',', ''))
            
            print("\n💸 RENCANA PENGELUARAN:")
            expense_plan = {}
            
            categories = [
                "Bahan Baku", "Sewa Tempat", "Gaji Karyawan", 
                "Listrik & Air", "Marketing", "Transportasi",
                "Perawatan", "Lainnya"
            ]
            
            for category in categories:
                amount_input = input(f"  {category} (Rp) [Enter untuk 0]: ").strip()
                if amount_input:
                    try:
                        amount = float(amount_input.replace(',', ''))
                        expense_plan[category] = amount
                    except:
                        print(f"⚠️  Jumlah tidak valid untuk {category}, di-set 0")
                        expense_plan[category] = 0
                else:
                    expense_plan[category] = 0
            
            # Buat anggaran
            budget_id = self.budget_planner.create_budget(
                period=period,
                income_target=income_target,
                expense_plan=expense_plan
            )
            
            self.save_data()
            
            print(f"\n✅ Anggaran berhasil dibuat!")
            print(f"   ID: {budget_id}")
            print(f"   Periode: {period}")
            print(f"   Target Pendapatan: Rp {income_target:,.0f}")
            print(f"   Rencana Pengeluaran: Rp {sum(expense_plan.values()):,.0f}")
            print(f"   Target Laba: Rp {income_target - sum(expense_plan.values()):,.0f}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            print("Silakan coba lagi.")
    
    def create_cash_flow_forecast(self):
        """Buat proyeksi arus kas"""
        print("\n" + "="*50)
        print("🔮 BUAT PROYEKSI ARUS KAS")
        print("="*50)
        
        try:
            start_date = input("Tanggal mulai (YYYY-MM-DD) [Enter untuk bulan depan]: ").strip()
            if not start_date:
                next_month = datetime.now() + relativedelta(months=1)
                start_date = next_month.replace(day=1).strftime('%Y-%m-%d')
            else:
                # Validasi format tanggal
                datetime.strptime(start_date, '%Y-%m-%d')
            
            months_input = input("Jumlah bulan yang diproyeksikan (1-12): ").strip() or "3"
            months = int(months_input)
            months = max(1, min(12, months))
            
            initial_balance_input = input("Saldo kas awal (Rp): ").strip()
            if initial_balance_input:
                initial_balance = float(initial_balance_input.replace(',', ''))
            else:
                initial_balance = self.financial_record.get_cash_balance()
            
            # Buat proyeksi
            forecast_id = self.budget_planner.create_cash_flow_forecast(
                start_date=start_date,
                months=months,
                initial_balance=initial_balance
            )
            
            self.save_data()
            
            print(f"\n✅ Proyeksi arus kas berhasil dibuat!")
            print(f"   ID: {forecast_id}")
            print(f"   Periode: {start_date} untuk {months} bulan")
            print(f"   Saldo Awal: Rp {initial_balance:,.0f}")
            
            # Tanya apakah ingin langsung update proyeksi
            if input("\n🔧 Update proyeksi sekarang? (y/n): ").lower() == 'y':
                self.update_forecast_specific(forecast_id)
                
        except Exception as e:
            print(f"❌ Error: {e}")
            print("Silakan coba lagi.")
    
    def update_forecast_specific(self, forecast_id):
        """Update proyeksi spesifik"""
        if forecast_id not in self.budget_planner.forecasts:
            print(f"\n❌ Forecast ID tidak ditemukan!")
            return
        
        forecast = self.budget_planner.forecasts[forecast_id]
        
        print(f"\n📅 Update Proyeksi untuk {forecast_id}")
        print("="*50)
        
        try:
            for i, month_data in enumerate(forecast['monthly_data']):
                print(f"\nBulan {i+1}: {month_data['month']}")
                
                income_input = input(f"  Proyeksi pendapatan (Rp) [{month_data['projected_income']:,.0f}]: ").strip()
                if income_input:
                    income = float(income_input.replace(',', ''))
                else:
                    income = month_data['projected_income']
                
                expenses_input = input(f"  Proyeksi pengeluaran (Rp) [{month_data['projected_expenses']:,.0f}]: ").strip()
                if expenses_input:
                    expenses = float(expenses_input.replace(',', ''))
                else:
                    expenses = month_data['projected_expenses']
                
                notes = input(f"  Catatan [{month_data['notes']}]: ").strip() or month_data['notes']
                
                self.budget_planner.update_forecast(
                    forecast_id=forecast_id,
                    month_index=i,
                    income=income,
                    expenses=expenses,
                    notes=notes
                )
            
            self.save_data()
            print(f"\n✅ Proyeksi berhasil diupdate!")
            self.view_forecast_details(forecast_id)
            
        except Exception as e:
            print(f"❌ Error: {e}")
            print("Proyeksi tidak berhasil diupdate.")
    
    def budget_vs_actual(self):
        """Analisis budget vs actual"""
        print("\n" + "="*60)
        print("📊 ANALISIS BUDGET vs ACTUAL (VARIANCE ANALYSIS)")
        print("="*60)
        
        if not self.budget_planner.budgets:
            print("\n❌ Belum ada anggaran yang dibuat!")
            return
        
        # Pilih budget
        print("\n📋 Pilih Anggaran:")
        budget_ids = list(self.budget_planner.budgets.keys())
        for i, budget_id in enumerate(budget_ids, 1):
            budget = self.budget_planner.budgets[budget_id]
            print(f"{i}. {budget_id} - {budget['period']}")
        
        try:
            choice_input = input(f"\nPilih anggaran (1-{len(budget_ids)}): ").strip()
            if not choice_input:
                return
            
            choice = int(choice_input) - 1
            
            if choice < 0 or choice >= len(budget_ids):
                print("\n❌ Pilihan tidak valid!")
                return
            
            budget_id = budget_ids[choice]
            budget = self.budget_planner.budgets[budget_id]
            
            # Hitung actual
            # Untuk simplifikasi, kita anggap periode adalah bulan tertentu
            today = datetime.now()
            start_date = today.replace(day=1).strftime('%Y-%m-%d')
            end_date = today.strftime('%Y-%m-%d')
            
            actual_income = sum(r['amount'] for r in self.financial_record.records 
                              if start_date <= r['date'] <= end_date and r['type'] == 'income')
            
            # Hitung actual per kategori
            actual_expenses = defaultdict(float)
            for r in self.financial_record.records:
                if start_date <= r['date'] <= end_date and r['type'] == 'expense':
                    actual_expenses[r['category']] += r['amount']
            
            # Tampilkan comparison
            print(f"\n📅 Periode: {budget['period']}")
            print("="*60)
            
            table = PrettyTable()
            table.field_names = ["Kategori", "Budget (Rp)", "Actual (Rp)", "Variance (Rp)", "Variance %"]
            
            # Income
            variance_income = actual_income - budget['income_target']
            variance_pct_income = (variance_income / budget['income_target'] * 100) if budget['income_target'] != 0 else 0
            
            table.add_row([
                "PENDAPATAN",
                f"{budget['income_target']:,.0f}",
                f"{actual_income:,.0f}",
                f"{variance_income:,.0f}",
                f"{variance_pct_income:.1f}%"
            ])
            
            table.add_row(["", "", "", "", ""])
            
            # Expenses
            total_budget_exp = 0
            total_actual_exp = 0
            
            for category, budget_amount in budget['expense_plan'].items():
                actual_amount = actual_expenses.get(category, 0)
                variance = actual_amount - budget_amount
                variance_pct = (variance / budget_amount * 100) if budget_amount != 0 else 0
                
                # Warna variance
                variance_str = f"{variance:,.0f}"
                if variance > 0 and budget_amount > 0:  # Over budget
                    variance_str = f"🔴 +{variance:,.0f}"
                elif variance < 0 and budget_amount > 0:  # Under budget
                    variance_str = f"🟢 {variance:,.0f}"
                
                table.add_row([
                    category,
                    f"{budget_amount:,.0f}",
                    f"{actual_amount:,.0f}",
                    variance_str,
                    f"{variance_pct:.1f}%"
                ])
                
                total_budget_exp += budget_amount
                total_actual_exp += actual_amount
            
            table.add_row(["", "", "", "", ""])
            
            # Total Expenses
            total_variance_exp = total_actual_exp - total_budget_exp
            total_variance_pct_exp = (total_variance_exp / total_budget_exp * 100) if total_budget_exp != 0 else 0
            
            table.add_row([
                "TOTAL PENGELUARAN",
                f"{total_budget_exp:,.0f}",
                f"{total_actual_exp:,.0f}",
                f"{total_variance_exp:,.0f}",
                f"{total_variance_pct_exp:.1f}%"
            ])
            
            table.add_row(["", "", "", "", ""])
            
            # Net Profit
            budget_net = budget['income_target'] - total_budget_exp
            actual_net = actual_income - total_actual_exp
            net_variance = actual_net - budget_net
            net_variance_pct = (net_variance / budget_net * 100) if budget_net != 0 else 0
            
            table.add_row([
                "LABA BERSIH",
                f"{budget_net:,.0f}",
                f"{actual_net:,.0f}",
                f"{net_variance:,.0f}",
                f"{net_variance_pct:.1f}%"
            ])
            
            print(table)
            
            # Analisis
            print("\n📈 ANALISIS VARIANCE:")
            
            if variance_income > 0:
                print(f"   ✅ Pendapatan melebihi target: Rp {variance_income:,.0f} ({variance_pct_income:.1f}%)")
            elif variance_income < 0:
                print(f"   ⚠️  Pendapatan di bawah target: Rp {abs(variance_income):,.0f} ({abs(variance_pct_income):.1f}%)")
            else:
                print(f"   ⚖️  Pendapatan tepat sesuai target")
            
            if total_variance_exp > 0:
                print(f"   🔴 Pengeluaran melebihi budget: Rp {total_variance_exp:,.0f} ({total_variance_pct_exp:.1f}%)")
                print(f"   💡 Rekomendasi: Tinjau pengeluaran di kategori yang over budget")
            elif total_variance_exp < 0:
                print(f"   🟢 Pengeluaran di bawah budget: Rp {abs(total_variance_exp):,.0f} ({abs(total_variance_pct_exp):.1f}%)")
            else:
                print(f"   ⚖️  Pengeluaran tepat sesuai budget")
            
            if net_variance > 0:
                print(f"   🎉 Laba melebihi target: Rp {net_variance:,.0f} ({net_variance_pct:.1f}%)")
            elif net_variance < 0:
                print(f"   📉 Laba di bawah target: Rp {abs(net_variance):,.0f} ({abs(net_variance_pct):.1f}%)")
            else:
                print(f"   ⚖️  Laba tepat sesuai target")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            print("Analisis tidak dapat dilakukan.")
    
    def view_forecast_details(self, forecast_id):
        """Lihat detail proyeksi"""
        if forecast_id not in self.budget_planner.forecasts:
            print(f"\n❌ Forecast ID tidak ditemukan!")
            return
        
        forecast = self.budget_planner.forecasts[forecast_id]
        
        print(f"\n🔮 DETAIL PROYEKSI ARUS KAS: {forecast_id}")
        print("="*70)
        print(f"Periode: {forecast['start_date']} untuk {forecast['months']} bulan")
        print(f"Saldo Awal: Rp {forecast['initial_balance']:,.0f}")
        print("="*70)
        
        table = PrettyTable()
        table.field_names = ["Bulan", "Pendapatan", "Pengeluaran", "Arus Kas", "Saldo Akhir", "Catatan"]
        
        for month_data in forecast['monthly_data']:
            cash_flow = month_data['projected_income'] - month_data['projected_expenses']
            
            table.add_row([
                month_data['month'],
                f"Rp {month_data['projected_income']:,.0f}",
                f"Rp {month_data['projected_expenses']:,.0f}",
                f"Rp {cash_flow:,.0f}",
                f"Rp {month_data['projected_balance']:,.0f}",
                month_data['notes'][:20] + "..." if len(month_data['notes']) > 20 else month_data['notes']
            ])
        
        print(table)
        
        # Analisis
        print("\n📊 ANALISIS PROYEKSI:")
        
        try:
            # Identifikasi bulan dengan saldo terendah
            min_balance_month = min(forecast['monthly_data'], key=lambda x: x['projected_balance'])
            max_balance_month = max(forecast['monthly_data'], key=lambda x: x['projected_balance'])
            
            print(f"   • Saldo terendah: {min_balance_month['month']} (Rp {min_balance_month['projected_balance']:,.0f})")
            print(f"   • Saldo tertinggi: {max_balance_month['month']} (Rp {max_balance_month['projected_balance']:,.0f})")
            
            # Warning jika ada bulan dengan saldo negatif
            negative_months = [m for m in forecast['monthly_data'] if m['projected_balance'] < 0]
            if negative_months:
                print(f"\n🚨 PERINGATAN: {len(negative_months)} bulan diproyeksi saldo negatif!")
                for month in negative_months[:3]:  # Tampilkan max 3
                    print(f"   • {month['month']}: Rp {month['projected_balance']:,.0f}")
                print(f"   💡 Rekomendasi: Pertimbangkan injeksi modal atau penyesuaian rencana")
            
            # Hitung kebutuhan modal kerja
            avg_monthly_expense = sum(m['projected_expenses'] for m in forecast['monthly_data']) / len(forecast['monthly_data'])
            print(f"   • Rata-rata pengeluaran bulanan: Rp {avg_monthly_expense:,.0f}")
            print(f"   • Modal kerja minimal yang dibutuhkan: Rp {avg_monthly_expense * 2:,.0f} (2 bulan pengeluaran)")
            
        except:
            print("   • Analisis tidak tersedia")
    
    # ==================== HELPER METHODS ====================
    
    def search_transactions(self):
        """Cari transaksi"""
        print("\n" + "="*50)
        print("🔍 CARI TRANSAKSI")
        print("="*50)
        
        keyword = input("Kata kunci (deskripsi/kategori): ").strip()
        min_amount = input("Jumlah minimal (Rp) [Enter untuk semua]: ").strip()
        max_amount = input("Jumlah maksimal (Rp) [Enter untuk semua]: ").strip()
        
        results = []
        for record in self.financial_record.records:
            # Filter by keyword
            keyword_match = True
            if keyword:
                keyword_match = (keyword.lower() in record['description'].lower() or 
                               keyword.lower() in record['category'].lower())
            
            # Filter by amount
            amount_match = True
            if min_amount:
                try:
                    min_val = float(min_amount.replace(',', ''))
                    amount_match = amount_match and record['amount'] >= min_val
                except:
                    pass
            if max_amount:
                try:
                    max_val = float(max_amount.replace(',', ''))
                    amount_match = amount_match and record['amount'] <= max_val
                except:
                    pass
            
            if keyword_match and amount_match:
                results.append(record)
        
        if not results:
            print("\n❌ Tidak ditemukan transaksi yang sesuai!")
            return
        
        print(f"\n✅ Ditemukan {len(results)} transaksi:")
        
        table = PrettyTable()
        table.field_names = ["ID", "Tanggal", "Deskripsi", "Kategori", "Jumlah", "Status"]
        
        for record in results[:20]:  # Tampilkan maksimal 20
            table.add_row([
                record['id'],
                record['date'],
                record['description'][:25] + "..." if len(record['description']) > 25 else record['description'],
                record['category'],
                f"Rp {record['amount']:,.0f}",
                record['status']
            ])
        
        print(table)
        
        if len(results) > 20:
            print(f"\n⚠️  Menampilkan 20 dari {len(results)} transaksi. Gunakan filter untuk hasil lebih spesifik.")
    
    def cash_book_report(self):
        """Laporan Buku Kas"""
        print("\n" + "="*60)
        print("📊 LAPORAN BUKU KAS")
        print("="*60)
        
        month = input("Bulan (YYYY-MM) [Enter untuk bulan ini]: ").strip()
        if not month:
            month = datetime.now().strftime('%Y-%m')
        else:
            # Validasi format bulan
            try:
                datetime.strptime(month + '-01', '%Y-%m-%d')
            except:
                print("❌ Format bulan salah. Gunakan YYYY-MM")
                return
        
        # Filter transaksi bulan tersebut
        month_transactions = [r for r in self.financial_record.records 
                             if r['date'].startswith(month)]
        
        if not month_transactions:
            print(f"\n❌ Tidak ada transaksi pada bulan {month}!")
            return
        
        # Urutkan berdasarkan tanggal
        month_transactions.sort(key=lambda x: x['date'])
        
        print(f"\n📅 Buku Kas Bulan: {month}")
        print("="*70)
        
        table = PrettyTable()
        table.field_names = ["Tanggal", "Keterangan", "Debit (Rp)", "Kredit (Rp)", "Saldo (Rp)"]
        
        # Hitung saldo running
        running_balance = 0
        for record in month_transactions:
            if record['type'] == 'income':
                debit = record['amount']
                credit = 0
            else:
                debit = 0
                credit = record['amount']
            
            running_balance += debit - credit
            
            table.add_row([
                record['date'][8:],  # Hanya tanggal
                record['description'][:20] + "..." if len(record['description']) > 20 else record['description'],
                f"{debit:,.0f}" if debit > 0 else "",
                f"{credit:,.0f}" if credit > 0 else "",
                f"{running_balance:,.0f}"
            ])
        
        print(table)
        
        # Summary
        total_debit = sum(r['amount'] for r in month_transactions if r['type'] == 'income')
        total_credit = sum(r['amount'] for r in month_transactions if r['type'] == 'expense')
        
        print(f"\n📊 SUMMARY BULAN {month}:")
        print(f"   • Total Penerimaan: Rp {total_debit:,.0f}")
        print(f"   • Total Pengeluaran: Rp {total_credit:,.0f}")
        print(f"   • Net Arus Kas: Rp {total_debit - total_credit:,.0f}")
        print(f"   • Saldo Akhir: Rp {running_balance:,.0f}")
        
        # Export option
        if input("\n💾 Export ke CSV? (y/n): ").lower() == 'y':
            self.export_cash_book_to_csv(month, month_transactions, total_debit, total_credit, running_balance)
    
    def export_cash_book_to_csv(self, month, transactions, total_debit, total_credit, final_balance):
        """Export buku kas ke CSV"""
        try:
            import csv
            
            filename = f"buku_kas_{month}.csv"
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                
                # Header
                writer.writerow([f"BUKU KAS - {self.business_name}"])
                writer.writerow([f"Periode: {month}"])
                writer.writerow([])
                
                # Column headers
                writer.writerow(["Tanggal", "Keterangan", "Debit (Rp)", "Kredit (Rp)", "Saldo (Rp)"])
                
                # Data rows
                running_balance = 0
                for record in transactions:
                    if record['type'] == 'income':
                        debit = record['amount']
                        credit = 0
                    else:
                        debit = 0
                        credit = record['amount']
                    
                    running_balance += debit - credit
                    
                    writer.writerow([
                        record['date'],
                        record['description'],
                        debit,
                        credit,
                        running_balance
                    ])
                
                # Summary
                writer.writerow([])
                writer.writerow(["SUMMARY", "", "", "", ""])
                writer.writerow(["Total Penerimaan", "", total_debit, "", ""])
                writer.writerow(["Total Pengeluaran", "", "", total_credit, ""])
                writer.writerow(["Net Arus Kas", "", "", "", total_debit - total_credit])
                writer.writerow(["Saldo Akhir", "", "", "", final_balance])
                
                writer.writerow([])
                writer.writerow([f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
            
            print(f"✅ Buku kas berhasil diexport ke: {filename}")
            
        except Exception as e:
            print(f"❌ Error export CSV: {e}")
    
    def print_cash_book(self):
        """Cetak buku kas"""
        print("\n" + "="*50)
        print("🖨️ CETAK BUKU KAS")
        print("="*50)
        
        print("\nPilih format cetak:")
        print("1. Format Sederhana (untuk arsip)")
        print("2. Format Lengkap (dengan analisis)")
        print("3. Format untuk Laporan Keuangan")
        
        format_choice = input("\nPilih format (1-3): ").strip() or "1"
        
        month = input("Bulan (YYYY-MM) [Enter untuk bulan ini]: ").strip()
        if not month:
            month = datetime.now().strftime('%Y-%m')
        
        # Filter transaksi
        transactions = [r for r in self.financial_record.records 
                       if r['date'].startswith(month)]
        
        if not transactions:
            print(f"\n❌ Tidak ada transaksi pada bulan {month}!")
            return
        
        # Generate output
        output_lines = []
        
        if format_choice == '1':
            output_lines.append(f"BUKU KAS - {self.business_name}")
            output_lines.append(f"Periode: {month}")
            output_lines.append("="*50)
            
            for record in transactions:
                type_symbol = "+" if record['type'] == 'income' else "-"
                output_lines.append(f"{record['date']} | {type_symbol} Rp {record['amount']:,.0f} | {record['description']}")
        
        elif format_choice == '2':
            output_lines.append(f"LAPORAN BUKU KAS LENGKAP")
            output_lines.append(f"Usaha: {self.business_name}")
            output_lines.append(f"Periode: {month}")
            output_lines.append("="*60)
            
            # Group by category
            by_category = defaultdict(list)
            for record in transactions:
                by_category[record['category']].append(record)
            
            for category, items in by_category.items():
                output_lines.append(f"\n{category.upper()}:")
                total = sum(r['amount'] for r in items)
                for record in items:
                    type_symbol = "→" if record['type'] == 'income' else "←"
                    output_lines.append(f"  {type_symbol} {record['date'][8:]} | Rp {record['amount']:,.0f} | {record['description']}")
                output_lines.append(f"  Total: Rp {total:,.0f}")
        
        else:  # Format 3
            output_lines.append(f"LAPORAN KEUANGAN RESMI")
            output_lines.append(f"{self.business_name}")
            output_lines.append(f"Periode: {month}")
            output_lines.append("="*60)
            output_lines.append("\nTRANSAKSI KAS:")
            
            running_balance = 0
            for record in transactions:
                if record['type'] == 'income':
                    running_balance += record['amount']
                    output_lines.append(f"{record['date']} | PENERIMAAN | {record['description']:30} | Rp {record['amount']:>12,.0f} | Rp {running_balance:>12,.0f}")
                else:
                    running_balance -= record['amount']
                    output_lines.append(f"{record['date']} | PENGELUARAN | {record['description']:30} | Rp {record['amount']:>12,.0f} | Rp {running_balance:>12,.0f}")
            
            output_lines.append("\n" + "="*60)
            
            total_income = sum(r['amount'] for r in transactions if r['type'] == 'income')
            total_expense = sum(r['amount'] for r in transactions if r['type'] == 'expense')
            
            output_lines.append(f"TOTAL PENERIMAAN: Rp {total_income:>12,.0f}")
            output_lines.append(f"TOTAL PENGELUARAN: Rp {total_expense:>12,.0f}")
            output_lines.append(f"SALDO AKHIR: Rp {running_balance:>12,.0f}")
            output_lines.append("\n" + f"Disiapkan oleh: {self.business_name}")
            output_lines.append(f"Tanggal: {datetime.now().strftime('%d %B %Y')}")
        
        # Tampilkan atau save ke file
        print("\n" + "="*50)
        for line in output_lines:
            print(line)
        
        if input("\n💾 Simpan ke file teks? (y/n): ").lower() == 'y':
            filename = f"buku_kas_{month}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write('\n'.join(output_lines))
            print(f"✅ Berhasil disimpan ke: {filename}")
    
    def visualize_income_statement(self, revenue, cogs, gross_profit, operating_expenses, net_profit):
        """Visualisasi laporan laba rugi"""
        try:
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
            
            # Pie chart: Komposisi
            labels1 = ['HPP', 'Laba Kotor']
            sizes1 = [cogs, gross_profit]
            colors1 = ['#FF6B6B', '#66CDAA']
            
            ax1.pie(sizes1, labels=labels1, autopct='%1.1f%%', colors=colors1, startangle=90)
            ax1.set_title('KOMPOSISI PENDAPATAN')
            
            # Bar chart: Profit breakdown
            categories = ['Pendapatan', 'HPP', 'Laba Kotor', 'Beban Operasi', 'Laba Bersih']
            values = [revenue, -cogs, gross_profit, -operating_expenses, net_profit]
            colors2 = ['#2E8B57', '#FF6B6B', '#66CDAA', '#FFA500', '#28A745']
            
            bars = ax2.bar(categories, values, color=colors2)
            ax2.set_title('BREAKDOWN LABA RUGI')
            ax2.set_ylabel('Jumlah (Rp)')
            ax2.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
            
            # Tambahkan nilai di atas bar
            for bar, val in zip(bars, values):
                height = bar.get_height()
                ax2.text(bar.get_x() + bar.get_width()/2., height,
                        f'Rp {abs(val):,.0f}', ha='center', va='bottom' if val >= 0 else 'top')
            
            plt.tight_layout()
            plt.show()
            
        except Exception as e:
            print(f"❌ Error visualisasi: {e}")
    
    def view_all_plans(self):
        """Lihat semua rencana dan proyeksi"""
        print("\n" + "="*60)
        print("📋 SEMUA RENCANA & PROYEKSI")
        print("="*60)
        
        # Budgets
        if self.budget_planner.budgets:
            print("\n📊 ANGGARAN:")
            table_budgets = PrettyTable()
            table_budgets.field_names = ["ID", "Periode", "Target Pendapatan", "Rencana Pengeluaran", "Target Laba"]
            
            for budget_id, budget in self.budget_planner.budgets.items():
                table_budgets.add_row([
                    budget_id,
                    budget['period'],
                    f"Rp {budget['income_target']:,.0f}",
                    f"Rp {budget['total_expense_plan']:,.0f}",
                    f"Rp {budget['net_target']:,.0f}"
                ])
            
            print(table_budgets)
        else:
            print("\n📊 ANGGARAN: Belum ada anggaran yang dibuat")
        
        # Forecasts
        if self.budget_planner.forecasts:
            print("\n🔮 PROYEKSI ARUS KAS:")
            table_forecasts = PrettyTable()
            table_forecasts.field_names = ["ID", "Periode", "Bulan", "Saldo Awal", "Saldo Terendah", "Saldo Tertinggi"]
            
            for forecast_id, forecast in self.budget_planner.forecasts.items():
                if forecast['monthly_data']:
                    try:
                        min_balance = min(m['projected_balance'] for m in forecast['monthly_data'])
                        max_balance = max(m['projected_balance'] for m in forecast['monthly_data'])
                    except:
                        min_balance = 0
                        max_balance = 0
                    
                    table_forecasts.add_row([
                        forecast_id,
                        forecast['start_date'],
                        len(forecast['monthly_data']),
                        f"Rp {forecast['initial_balance']:,.0f}",
                        f"Rp {min_balance:,.0f}",
                        f"Rp {max_balance:,.0f}"
                    ])
            
            print(table_forecasts)
        else:
            print("\n🔮 PROYEKSI ARUS KAS: Belum ada proyeksi yang dibuat")
    
    # ==================== MAIN MENU ====================
    
    def main_menu(self):
        """Menu utama"""
        while True:
            print("\n" + "="*60)
            print(f"🏪 SISTEM KEUANGAN LENGKAP - {self.business_name}")
            print("="*60)
            print("A. 📝 SISTEM PENCATATAN & PELAPORAN")
            print("   1. 💰 Buku Kas (Cash Book)")
            print("   2. 📈 Laporan Laba Rugi")
            print("   3. 💸 Laporan Arus Kas")
            print("   4. 📋 Laporan Aging (Utang & Piutang)")
            print("")
            print("B. 📅 SISTEM PERENCANAAN & PENGANGGARAN")
            print("   5. 📊 Anggaran & Budgeting")
            print("   6. 🔮 Proyeksi Arus Kas")
            print("   7. 📉 Analisis Budget vs Actual")
            print("")
            print("C. 🛠️  TOOLS & UTILITIES")
            print("   8. 🔍 Cari & Filter Transaksi")
            print("   9. 📤 Export Data")
            print("  10. 💾 Backup & Restore")
            print("")
            print("  0. 🚪 Keluar")
            print("="*60)
            
            choice = input("\nPilih menu (0-10): ").strip()
            
            if choice == '1':
                self.cash_book_menu()
            elif choice == '2':
                self.income_statement()
            elif choice == '3':
                self.cash_flow_statement()
            elif choice == '4':
                self.aging_report()
            elif choice == '5':
                self.budgeting_menu()
            elif choice == '6':
                forecast_id = self.create_cash_flow_forecast()
                if forecast_id:
                    self.view_forecast_details(forecast_id)
            elif choice == '7':
                self.budget_vs_actual()
            elif choice == '8':
                self.search_transactions()
            elif choice == '9':
                self.export_data_menu()
            elif choice == '10':
                self.backup_restore_menu()
            elif choice == '0':
                print(f"\n💾 Data disimpan. Terima kasih telah menggunakan sistem {self.business_name}!")
                break
            else:
                print("\n❌ Pilihan tidak valid!")
    
    def export_data_menu(self):
        """Menu export data"""
        print("\n" + "="*50)
        print("📤 MENU EXPORT DATA")
        print("="*50)
        
        print("1. 📄 Export Buku Kas ke CSV")
        print("2. 📊 Export Laporan Laba Rugi")
        print("3. 💰 Export Laporan Arus Kas")
        print("4. 📋 Export Aging Report")
        print("5. 📅 Export Semua Data ke Excel")
        print("6. ↩️ Kembali")
        
        choice = input("\nPilih (1-6): ").strip()
        
        if choice == '1':
            month = input("Bulan (YYYY-MM): ").strip()
            transactions = [r for r in self.financial_record.records 
                          if r['date'].startswith(month)]
            if transactions:
                total_debit = sum(r['amount'] for r in transactions if r['type'] == 'income')
                total_credit = sum(r['amount'] for r in transactions if r['type'] == 'expense')
                final_balance = self.financial_record.get_cash_balance(month + "-31")
                self.export_cash_book_to_csv(month, transactions, total_debit, total_credit, final_balance)
            else:
                print(f"\n❌ Tidak ada data untuk bulan {month}")
        
        elif choice == '5':
            self.export_all_to_excel()
        elif choice == '6':
            return
        else:
            print("❌ Fitur export ini belum tersedia")
    
    def export_all_to_excel(self):
        """Export semua data ke Excel"""
        try:
            filename = f'financial_report_{datetime.now().strftime("%Y%m%d")}.xlsx'
            with pd.ExcelWriter(filename, engine='openpyxl') as writer:
                # Transactions
                if self.financial_record.records:
                    df_transactions = pd.DataFrame(self.financial_record.records)
                    df_transactions.to_excel(writer, sheet_name='Transactions', index=False)
                
                # Budgets
                if self.budget_planner.budgets:
                    budgets_list = []
                    for budget_id, budget in self.budget_planner.budgets.items():
                        budget_data = {
                            'Budget_ID': budget_id,
                            'Period': budget['period'],
                            'Income_Target': budget['income_target'],
                            'Total_Expense_Plan': budget['total_expense_plan'],
                            'Net_Target': budget['net_target']
                        }
                        budgets_list.append(budget_data)
                    
                    df_budgets = pd.DataFrame(budgets_list)
                    df_budgets.to_excel(writer, sheet_name='Budgets', index=False)
                
                # Forecasts
                if self.budget_planner.forecasts:
                    forecasts_list = []
                    for forecast_id, forecast in self.budget_planner.forecasts.items():
                        for month_data in forecast['monthly_data']:
                            forecast_data = {
                                'Forecast_ID': forecast_id,
                                'Month': month_data['month'],
                                'Projected_Income': month_data['projected_income'],
                                'Projected_Expenses': month_data['projected_expenses'],
                                'Projected_Balance': month_data['projected_balance'],
                                'Notes': month_data['notes']
                            }
                            forecasts_list.append(forecast_data)
                    
                    df_forecasts = pd.DataFrame(forecasts_list)
                    df_forecasts.to_excel(writer, sheet_name='Forecasts', index=False)
                
                # Summary sheet
                summary_data = {
                    'Business_Name': [self.business_name],
                    'Total_Transactions': [len(self.financial_record.records)],
                    'Current_Cash_Balance': [self.financial_record.get_cash_balance()],
                    'Total_Budgets': [len(self.budget_planner.budgets)],
                    'Total_Forecasts': [len(self.budget_planner.forecasts)],
                    'Report_Date': [datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
                }
                
                df_summary = pd.DataFrame(summary_data)
                df_summary.to_excel(writer, sheet_name='Summary', index=False)
            
            print(f"✅ Semua data berhasil diexport ke: {filename}")
            
        except Exception as e:
            print(f"❌ Error export Excel: {e}")
    
    def backup_restore_menu(self):
        """Menu backup & restore"""
        print("\n" + "="*50)
        print("💾 BACKUP & RESTORE DATA")
        print("="*50)
        
        print("1. 💿 Buat Backup")
        print("2. 🔄 Restore dari Backup")
        print("3. 📋 Lihat Info Data")
        print("4. ↩️ Kembali")
        
        choice = input("\nPilih (1-4): ").strip()
        
        if choice == '1':
            backup_file = f"backup_macha_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            try:
                with open(backup_file, 'w') as f:
                    data = {
                        'business_name': self.business_name,
                        'records': self.financial_record.records,
                        'budgets': self.budget_planner.budgets,
                        'forecasts': self.budget_planner.forecasts,
                        'backup_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    }
                    json.dump(data, f, indent=4, default=str)
                
                print(f"✅ Backup berhasil dibuat: {backup_file}")
                
            except Exception as e:
                print(f"❌ Error membuat backup: {e}")
            
        elif choice == '2':
            backup_file = input("Nama file backup: ").strip()
            if os.path.exists(backup_file):
                try:
                    with open(backup_file, 'r') as f:
                        data = json.load(f)
                    
                    confirm = input(f"Restore akan mengganti data saat ini. Yakin? (y/n): ").strip().lower()
                    if confirm == 'y':
                        self.financial_record.records = data.get('records', [])
                        self.budget_planner.budgets = data.get('budgets', {})
                        self.budget_planner.forecasts = data.get('forecasts', {})
                        self.save_data()
                        print(f"✅ Data berhasil di-restore dari {backup_file}")
                except Exception as e:
                    print(f"❌ Error restore data: {e}")
            else:
                print(f"❌ File {backup_file} tidak ditemukan!")
        
        elif choice == '3':
            print(f"\n📊 INFO DATA SISTEM:")
            print(f"   • Nama Usaha: {self.business_name}")
            print(f"   • Jumlah Transaksi: {len(self.financial_record.records)}")
            print(f"   • Jumlah Anggaran: {len(self.budget_planner.budgets)}")
            print(f"   • Jumlah Proyeksi: {len(self.budget_planner.forecasts)}")
            print(f"   • Saldo Kas Saat Ini: Rp {self.financial_record.get_cash_balance():,.0f}")
            if os.path.exists(self.data_file):
                print(f"   • Data File: {self.data_file}")
                print(f"   • Ukuran File: {os.path.getsize(self.data_file)} bytes")
            else:
                print(f"   • Data File: Belum ada file data")
        
        elif choice == '4':
            return
        else:
            print("❌ Pilihan tidak valid!")

# ==================== PROGRAM UTAMA ====================

def check_and_install_packages():
    """Cek dan install package yang diperlukan"""
    required_packages = ['matplotlib', 'pandas', 'prettytable', 'python-dateutil']
    
    print("\n" + "="*60)
    print("🔍 MEMERIKSA PACKAGE YANG DIPERLUKAN")
    print("="*60)
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package} sudah terinstall")
        except ImportError:
            print(f"❌ {package} belum terinstall. Menginstall...")
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✅ {package} berhasil diinstall")
    
    print("\n" + "="*60)
    print("🎉 SEMUA PACKAGE SIAP!")
    print("="*60)

def main():
    """Fungsi utama"""
    # Cek dan install package
    check_and_install_packages()
    
    print("\n" + "="*60)
    print("🏪 SISTEM KEUANGAN LENGKAP UMKM MACHA")
    print("="*60)
    
    business_name = input("Masukkan nama usaha matcha Anda: ").strip()
    if not business_name:
        business_name = "Macha Lezat"
    
    # Inisialisasi sistem
    system = MatchaBusinessSystem(business_name)
    
    # Jalankan menu utama
    system.main_menu()

if __name__ == "__main__":
    main()
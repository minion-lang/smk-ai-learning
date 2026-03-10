#!/usr/bin/env python3
"""Rebuild index.html with proper encoding. Run: python rebuild.py"""
import re, os

src = os.path.join(os.path.dirname(__file__), 'index.html')

# Read current file
with open(src, 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()

# Map of broken patterns to HTML entities
# These cover ALL emoji used in the app
fixes = {
    # Common replacement-char patterns near known text
    # We'll use regex to fix around known anchor text
}

# Strategy: find all known text anchors and replace broken emoji neighbors
# with correct HTML entities

# Title
text = re.sub(r'<title>[^<]*</title>', '<title>SMK AI &#9889; Teknik Instalasi Tenaga Listrik</title>', text)

# Header logo
text = re.sub(r'<div class="logo">[^<]*</div>', '<div class="logo">&#9889;</div>', text)

# Teacher label in header
text = re.sub(r'<span class="teacher-label">[^<]*</span>', 
              '<span class="teacher-label">&#128104;&#8205;&#127979; Guru Aktif:</span>', text)

# Header buttons
text = re.sub(r'onclick="openProgress\(\)"[^>]*>[^<]*Progress</button>',
              'onclick="openProgress()">&#128202; Progress</button>', text)
text = re.sub(r'onclick="openHandover\(\)"[^>]*>[^<]*Selesai Mengajar</button>',
              'onclick="openHandover()">&#128221; Selesai Mengajar</button>', text)
text = re.sub(r'onclick="openTeachers\(\)"[^>]*>[^<]*Guru</button>',
              'onclick="openTeachers()">&#128104;&#8205;&#127979; Guru</button>', text)
text = re.sub(r'onclick="openSettings\(\)"[^>]*>[^<]*Multi-API</button>',
              'onclick="openSettings()">&#9881;&#65039; Multi-API</button>', text)

# Fase labels already use ASCII+entities so should be OK, but fix if broken
text = re.sub(r'>Fase E [^<]*<span', '>Fase E &#8212; Kelas 1 <span', text)
text = re.sub(r'>Fase F [^<]*<span', '>Fase F &#8212; Kelas 2 &amp; 3 <span', text)

# Quick action buttons (sidebar)
text = re.sub(r"qa\('Mulai dari mana[^)]*'\)\">.[^<]*Mulai dari",
              "qa('Mulai dari mana mengajar untuk kelas baru?')\">&#128640; Mulai dari", text)
text = re.sub(r"'Berdasarkan progress yang ada, topik apa[^)]*'\)\">.[^<]*Topik",
              "'Berdasarkan progress yang ada, topik apa yang harus diajarkan berikutnya?')\">&#10145;&#65039; Topik", text)
text = re.sub(r"'Topik mana yang menjadi prasyarat[^)]*'\)\">.[^<]*Materi",
              "'Topik mana yang menjadi prasyarat untuk materi instalasi?')\">&#128295; Materi", text)
text = re.sub(r"'Buatkan ringkasan progress[^)]*'\)\">.[^<]*Ringkasan",
              "'Buatkan ringkasan progress belajar saat ini dan rekomendasi selanjutnya')\">&#128203; Ringkasan", text)
text = re.sub(r"'Berapa total jam pelajaran[^)]*'\)\">.[^<]*Jam tersisa",
              "'Berapa total jam pelajaran yang sudah selesai dan yang tersisa?')\">&#9201;&#65039; Jam tersisa", text)

# Welcome section
text = re.sub(r'<div style="font-size:44px[^"]*">[^<]*</div>', 
              '<div style="font-size:44px;margin-bottom:10px">&#9889;</div>', text)

# Welcome chips
text = re.sub(r"qa\('Mulai dari mana[^)]*'\)\">.[^<]*Mulai dari mana",
              "qa('Mulai dari mana mengajar untuk kelas baru?')\">&#128240; Mulai dari mana", text)
text = re.sub(r"'Berdasarkan progress yang ada, apa[^)]*'\)\">.[^<]*Lanjut",
              "'Berdasarkan progress yang ada, apa yang harus diajarkan berikutnya?')\">&#10145;&#65039; Lanjut", text)
text = re.sub(r"'Buatkan jadwal pembagian[^)]*'\)\">.[^<]*Bagi topik",
              "'Buatkan jadwal pembagian topik untuk 3 guru')\">&#128101; Bagi topik", text)
text = re.sub(r"'Jelaskan materi K3LH[^)]*'\)\">.[^<]*Materi K3LH",
              "'Jelaskan materi K3LH dan hubungannya dengan topik lain')\">&#128214; Materi K3LH", text)

# Warning text in welcome
text = re.sub(r'margin-top:14px[^"]*">[^<]*Atur API Key di menu[^<]*<strong>[^<]*</strong>[^<]*</p>',
              'margin-top:14px;font-size:11px;color:var(--a1)">&#9888;&#65039; Atur API Key di menu <strong>&#9881;&#65039; API</strong> untuk mulai</p>', text)

# Modal titles
text = re.sub(r'<h2>[^<]*Multi-API Load Balancing</h2>', '<h2>&#9881;&#65039; Multi-API Load Balancing</h2>', text)
text = re.sub(r'<h2>[^<]*Pengaturan Guru</h2>', '<h2>&#128104;&#8205;&#127979; Pengaturan Guru</h2>', text)
text = re.sub(r'<h2>[^<]*Progress Pembelajaran</h2>', '<h2>&#128202; Progress Pembelajaran</h2>', text)
text = re.sub(r'<h2>[^<]*Selesai Mengajar</h2>', '<h2>&#128221; Selesai Mengajar</h2>', text)

# Section labels
text = re.sub(r'>.[^<]*Tambah API Baru</div>', '>&#10133; Tambah API Baru</div>', text)
text = re.sub(r'>.[^<]*Log Handover[^<]*</div>', '>&#128221; Log Handover (Catatan Antar Guru)</div>', text)

# Buttons with emoji
text = re.sub(r'>[^<]*Tambahkan ke Load\s*Balancer</button>', '>&#10133; Tambahkan ke Load Balancer</button>', text)
text = re.sub(r'>.[^<]*Tambah Guru</button>', '>&#10133; Tambah Guru</button>', text)
text = re.sub(r'>.[^<]*Simpan</button>', '>&#9989; Simpan</button>', text, count=1)
text = re.sub(r'>.[^<]*Simpan Catatan</button>', '>&#9989; Simpan Catatan</button>', text)
text = re.sub(r'>.[^<]*Export Data</button>', '>&#11015;&#65039; Export Data</button>', text)

# Handover status options
text = re.sub(r'>[^<]*Masih berlanjut \(belum selesai\)</option>', '>&#128993; Masih berlanjut (belum selesai)</option>', text)
text = re.sub(r'>.[^<]*Selesai</option>', '>&#9989; Selesai</option>', text)

# Fix Tanya Cepat label
text = re.sub(r'"margin-bottom:7px">.[^<]*Tanya Cepat', '"margin-bottom:7px">Tanya Cepat', text)

# Fix status dot text
text = re.sub(r'id="stext">[^<]*</span>', 'id="stext">Belum terhubung</span>', text)

# Fix progress banner
text = re.sub(r'Selesai[^<]*Kuning[^<]*Sedang Berjalan[^<]*Abu[^<]*Belum',
              'Selesai &#183; Kuning = Sedang Berjalan &#183; Abu = Belum', text)

# Fix empty log text
text = re.sub(r'id="emptyLog">[^<]*catatan handover',
              'id="emptyLog">Belum ada catatan handover', text)

# Fix em-dashes and middle dots in JS strings
# Replace loose replacement chars
text = text.replace(chr(0xFFFD), '')

# Fix JS string emoji references - use unicode escapes instead
# sysPrompt function
text = re.sub(r"GURU AKTIF SEKARANG: Guru", "GURU AKTIF SEKARANG: Guru", text)

# Fix JS addAI calls - skip (handled by FFFD removal above)

# Clean up any remaining stray replacement chars or broken sequences
text = re.sub(chr(0xFFFD) + '+', '', text)

# Write back
with open(src, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print("Done! File rebuilt with HTML entities.")
print(f"File size: {os.path.getsize(src)} bytes")
